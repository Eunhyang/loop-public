"""
RS256 + JWKS for OAuth 2.0

- RSA 2048-bit key pair generation
- JWKS endpoint format
- JWT signing and verification
"""

import os
import base64
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

try:
    from jose import jwt, JWTError
except ImportError:
    # Fallback: python-jose with cryptography
    from jose import jwt
    JWTError = Exception

# Key storage directory (use VAULT_DIR for persistence across container restarts)
_default_keys_dir = Path(__file__).parent / "keys"
KEYS_DIR = Path(os.environ.get("OAUTH_KEYS_DIR", str(_default_keys_dir)))
PRIVATE_KEY_PATH = KEYS_DIR / "private.pem"
PUBLIC_KEY_PATH = KEYS_DIR / "public.pem"

# JWT settings
OAUTH_ISSUER = os.environ.get("OAUTH_ISSUER", "https://mcp.sosilab.synology.me")
JWT_ALGORITHM = "RS256"
JWT_KID = "loop-mcp-key-1"  # Key ID for rotation support
JWT_LEEWAY = 30  # Clock skew tolerance in seconds
JWT_EXPIRE_HOURS = int(os.environ.get("TOKEN_EXPIRE_HOURS", "1"))

# Cached keys (loaded once)
_private_key = None
_public_key = None
_jwks_cache = None


def _generate_rsa_keypair():
    """Generate RSA 2048-bit key pair"""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    return private_key


def _save_key_atomically(path: Path, content: bytes, mode: int = 0o600):
    """Save key file atomically with proper permissions"""
    path.parent.mkdir(parents=True, exist_ok=True)

    # Write to temp file first, then rename (atomic on POSIX)
    fd, temp_path = tempfile.mkstemp(dir=path.parent)
    try:
        os.write(fd, content)
        os.fchmod(fd, mode)
        os.close(fd)
        os.rename(temp_path, path)
    except Exception:
        os.close(fd)
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise


def _ensure_keys_exist():
    """Generate and save keys if they don't exist"""
    global _private_key, _public_key

    if PRIVATE_KEY_PATH.exists() and PUBLIC_KEY_PATH.exists():
        # Load existing keys
        with open(PRIVATE_KEY_PATH, "rb") as f:
            _private_key = serialization.load_pem_private_key(
                f.read(), password=None, backend=default_backend()
            )
        with open(PUBLIC_KEY_PATH, "rb") as f:
            _public_key = serialization.load_pem_public_key(
                f.read(), backend=default_backend()
            )
        print(f"RSA keys loaded from {KEYS_DIR}")
        return

    # Generate new keys
    print("Generating new RSA key pair...")
    _private_key = _generate_rsa_keypair()
    _public_key = _private_key.public_key()

    # Serialize keys
    private_pem = _private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    public_pem = _public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    # Save atomically with proper permissions
    _save_key_atomically(PRIVATE_KEY_PATH, private_pem, mode=0o600)
    _save_key_atomically(PUBLIC_KEY_PATH, public_pem, mode=0o644)

    print(f"RSA keys generated and saved to {KEYS_DIR}")


def _get_private_key():
    """Get private key (lazy loading)"""
    global _private_key
    if _private_key is None:
        _ensure_keys_exist()
    return _private_key


def _get_public_key():
    """Get public key (lazy loading)"""
    global _public_key
    if _public_key is None:
        _ensure_keys_exist()
    return _public_key


def _int_to_base64url(n: int) -> str:
    """Convert integer to base64url-encoded string (for JWKS)"""
    # Calculate byte length
    byte_length = (n.bit_length() + 7) // 8
    n_bytes = n.to_bytes(byte_length, byteorder='big')
    return base64.urlsafe_b64encode(n_bytes).rstrip(b'=').decode('ascii')


def get_jwks() -> Dict[str, Any]:
    """Get JWKS (JSON Web Key Set) with public key"""
    global _jwks_cache

    if _jwks_cache is not None:
        return _jwks_cache

    public_key = _get_public_key()
    public_numbers = public_key.public_numbers()

    _jwks_cache = {
        "keys": [{
            "kty": "RSA",
            "use": "sig",
            "alg": JWT_ALGORITHM,
            "kid": JWT_KID,
            "n": _int_to_base64url(public_numbers.n),
            "e": _int_to_base64url(public_numbers.e)
        }]
    }

    return _jwks_cache


# Service account tokens use longer expiration (10 years default)
SVC_TOKEN_EXPIRE_YEARS = int(os.environ.get("SVC_TOKEN_EXPIRE_YEARS", "10"))


def create_jwt(
    sub: str,
    scope: str = "mcp:read",
    jti: Optional[str] = None,
    additional_claims: Optional[Dict[str, Any]] = None,
    expire_hours: Optional[int] = None
) -> str:
    """Create JWT token signed with RS256

    Args:
        sub: Subject (user email or ID)
        scope: OAuth scopes (space-separated)
        jti: JWT ID (unique identifier, auto-generated if None)
        additional_claims: Extra claims to include
        expire_hours: Custom expiration in hours (None = use default based on token type)

    Returns:
        Signed JWT string
    """
    import secrets

    now = datetime.utcnow()

    # Determine expiration
    if expire_hours is not None:
        exp_delta = timedelta(hours=expire_hours)
    elif additional_claims and additional_claims.get("svc"):
        # Service account tokens: long-lived (10 years default)
        exp_delta = timedelta(days=365 * SVC_TOKEN_EXPIRE_YEARS)
    else:
        # Regular user tokens: short-lived
        exp_delta = timedelta(hours=JWT_EXPIRE_HOURS)

    payload = {
        "iss": OAUTH_ISSUER,
        "aud": OAUTH_ISSUER,  # Self-issued token
        "sub": sub,
        "scope": scope,
        "iat": now,
        "exp": now + exp_delta,
        "jti": jti or secrets.token_urlsafe(16)
    }

    if additional_claims:
        payload.update(additional_claims)

    private_key = _get_private_key()

    # Serialize private key to PEM for jose
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    token = jwt.encode(
        payload,
        private_pem,
        algorithm=JWT_ALGORITHM,
        headers={"kid": JWT_KID}
    )

    return token


def verify_jwt(token: str, check_revocation: bool = True) -> Optional[Dict[str, Any]]:
    """Verify JWT token

    Args:
        token: JWT string
        check_revocation: Whether to check service account revocation (default: True)

    Returns:
        Decoded payload if valid, None otherwise
    """
    try:
        public_key = _get_public_key()

        # Serialize public key to PEM for jose
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        payload = jwt.decode(
            token,
            public_pem,
            algorithms=[JWT_ALGORITHM],
            audience=OAUTH_ISSUER,
            issuer=OAUTH_ISSUER,
            options={
                "verify_aud": True,
                "verify_iss": True,
                "verify_exp": True,
                "leeway": JWT_LEEWAY
            }
        )

        # Check service account revocation
        if check_revocation and payload.get("svc"):
            jti = payload.get("jti")
            if jti and is_service_account_revoked(jti):
                print(f"Service account token revoked: jti={jti}")
                return None

        return payload

    except JWTError as e:
        print(f"JWT verification failed: {e}")
        return None
    except Exception as e:
        print(f"JWT verification error: {e}")
        return None


def is_service_account_revoked(jti: str) -> bool:
    """Check if service account token is revoked

    Security: Fail-closed design - if record not found or error, token is invalid.
    This prevents deleted service accounts from bypassing revocation.

    Args:
        jti: JWT ID from token

    Returns:
        True if revoked/invalid, False if active
    """
    try:
        from .models import get_db_session, ServiceAccount

        db = get_db_session()
        try:
            svc = db.query(ServiceAccount).filter(
                ServiceAccount.jti == jti
            ).first()

            if not svc:
                # SECURITY: JTI not found = revoked/deleted (fail-closed)
                # This prevents deleted service accounts from bypassing revocation
                print(f"Service account not found for jti={jti[:8]}... (treated as revoked)")
                return True

            # Check if explicitly revoked
            if svc.revoked == 1:
                return True

            # Check DB-level expiration (separate from JWT exp)
            if svc.expires_at and datetime.utcnow() > svc.expires_at:
                print(f"Service account expired: {svc.name}")
                return True

            # NOTE: last_used_at update moved to async/background to avoid
            # write contention on every request. For now, skip the update.
            # Consider implementing a queue-based update if usage tracking is needed.

            return False
        finally:
            db.close()
    except Exception as e:
        print(f"Service account revocation check error: {e}")
        # SECURITY: Fail-closed on error
        return True


def init_keys():
    """Initialize keys on startup"""
    _ensure_keys_exist()
    print(f"JWKS ready with kid={JWT_KID}")
