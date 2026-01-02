#!/usr/bin/env python3
"""
OAuth CLI - User and Client Management

Usage:
    # Create initial user
    python -m api.oauth.cli create-user --email admin@sosilab.com --password 'secure123'

    # List users
    python -m api.oauth.cli list-users

    # Create OAuth client
    python -m api.oauth.cli create-client --name "ChatGPT MCP" --redirect-uri "https://chatgpt.com/aip/..."

    # List clients
    python -m api.oauth.cli list-clients

    # Cleanup expired sessions/codes
    python -m api.oauth.cli cleanup
"""

import argparse
import sys
import getpass
from datetime import datetime

from .models import create_tables, get_db_session, User, OAuthClient, Session, AuthCode, ServiceAccount
from .security import hash_password, cleanup_expired, validate_redirect_uri
from .jwks import create_jwt


VALID_ROLES = ("member", "exec", "admin")


def create_user(email: str, password: str, role: str = "member") -> None:
    """Create a new user"""
    if role not in VALID_ROLES:
        print(f"Error: Invalid role '{role}'. Valid roles: {VALID_ROLES}")
        sys.exit(1)

    create_tables()
    db = get_db_session()

    try:
        # Check if user exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"Error: User '{email}' already exists")
            sys.exit(1)

        # Create user
        user = User(
            email=email,
            password_hash=hash_password(password),
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        print(f"User created successfully:")
        print(f"  ID: {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Role: {user.role}")
        print(f"  Created: {user.created_at}")

    finally:
        db.close()


def list_users() -> None:
    """List all users"""
    create_tables()
    db = get_db_session()

    try:
        users = db.query(User).all()

        if not users:
            print("No users found")
            return

        print(f"{'ID':<5} {'Email':<30} {'Role':<10} {'Created':<20}")
        print("-" * 65)
        for user in users:
            created = user.created_at.strftime("%Y-%m-%d %H:%M") if user.created_at else "N/A"
            role = getattr(user, 'role', 'member') or 'member'
            print(f"{user.id:<5} {user.email:<30} {role:<10} {created:<20}")

        print(f"\nTotal: {len(users)} user(s)")

    finally:
        db.close()


def set_role(email: str, role: str) -> None:
    """Change user role"""
    if role not in VALID_ROLES:
        print(f"Error: Invalid role '{role}'. Valid roles: {VALID_ROLES}")
        sys.exit(1)

    create_tables()
    db = get_db_session()

    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Error: User '{email}' not found")
            sys.exit(1)

        old_role = getattr(user, 'role', 'member') or 'member'
        user.role = role
        db.commit()

        print(f"Role updated:")
        print(f"  Email: {email}")
        print(f"  Old role: {old_role}")
        print(f"  New role: {role}")

    finally:
        db.close()


def create_client(name: str, redirect_uris: list) -> None:
    """Create a new OAuth client"""
    import json
    import secrets

    create_tables()
    db = get_db_session()

    try:
        # Validate redirect URIs
        valid_uris = []
        for uri in redirect_uris:
            if validate_redirect_uri(uri):
                valid_uris.append(uri)
            else:
                print(f"Warning: Skipping invalid redirect_uri: {uri}")

        if not valid_uris and redirect_uris:
            print("Error: No valid redirect URIs provided")
            sys.exit(1)

        # Generate credentials
        client_id = secrets.token_urlsafe(16)
        client_secret = secrets.token_urlsafe(32)

        # Create client
        client = OAuthClient(
            client_id=client_id,
            client_secret=client_secret,
            client_name=name,
            redirect_uris=json.dumps(valid_uris),
            grant_types="authorization_code",
            response_types="code",
            token_endpoint_auth_method="none"
        )
        db.add(client)
        db.commit()

        print(f"OAuth client created successfully:")
        print(f"  Client ID: {client_id}")
        print(f"  Client Secret: {client_secret}")
        print(f"  Name: {name}")
        print(f"  Redirect URIs: {valid_uris}")
        print(f"\nSave these credentials securely - client_secret cannot be recovered!")

    finally:
        db.close()


def list_clients() -> None:
    """List all OAuth clients"""
    import json

    create_tables()
    db = get_db_session()

    try:
        clients = db.query(OAuthClient).all()

        if not clients:
            print("No OAuth clients found")
            return

        for client in clients:
            uris = json.loads(client.redirect_uris) if client.redirect_uris else []
            created = client.created_at.strftime("%Y-%m-%d %H:%M") if client.created_at else "N/A"

            print(f"Client: {client.client_name}")
            print(f"  ID: {client.client_id}")
            print(f"  Created: {created}")
            print(f"  Redirect URIs: {uris}")
            print()

        print(f"Total: {len(clients)} client(s)")

    finally:
        db.close()


def run_cleanup() -> None:
    """Clean up expired sessions and auth codes"""
    create_tables()
    db = get_db_session()

    try:
        result = cleanup_expired(db)
        print(f"Cleanup completed:")
        print(f"  Sessions deleted: {result['sessions_deleted']}")
        print(f"  Auth codes deleted: {result['codes_deleted']}")

    finally:
        db.close()


def show_stats() -> None:
    """Show OAuth statistics"""
    create_tables()
    db = get_db_session()

    try:
        now = datetime.utcnow()

        user_count = db.query(User).count()
        client_count = db.query(OAuthClient).count()
        session_count = db.query(Session).count()
        active_sessions = db.query(Session).filter(Session.expires_at > now).count()
        pending_codes = db.query(AuthCode).filter(AuthCode.expires_at > now).count()
        svc_account_count = db.query(ServiceAccount).count()
        active_svc_accounts = db.query(ServiceAccount).filter(ServiceAccount.revoked == 0).count()

        print("OAuth Statistics:")
        print(f"  Users: {user_count}")
        print(f"  Clients: {client_count}")
        print(f"  Total Sessions: {session_count}")
        print(f"  Active Sessions: {active_sessions}")
        print(f"  Pending Auth Codes: {pending_codes}")
        print(f"  Service Accounts: {svc_account_count} (active: {active_svc_accounts})")

    finally:
        db.close()


# ============================================
# Service Account Management
# ============================================

# Role to scope mapping
ROLE_SCOPES = {
    "member": "api:read api:write",
    "exec": "api:read api:write mcp:exec",
    "admin": "api:read api:write mcp:exec mcp:admin admin:read admin:write",
}


def create_service_account(name: str, role: str = "member", description: str = None, expires_days: int = None) -> None:
    """Create a new service account with long-lived token

    Args:
        name: Unique service account name (e.g., svc_public, svc_admin)
        role: Role (member, exec, admin)
        description: Human-readable description
        expires_days: Token expiration in days (None = never expires)
    """
    import secrets
    from datetime import timedelta

    if role not in VALID_ROLES:
        print(f"Error: Invalid role '{role}'. Valid roles: {VALID_ROLES}")
        sys.exit(1)

    create_tables()
    db = get_db_session()

    try:
        # Check if service account exists
        existing = db.query(ServiceAccount).filter(ServiceAccount.name == name).first()
        if existing:
            print(f"Error: Service account '{name}' already exists")
            print("Use 'revoke-service-account' to revoke it first, or choose a different name.")
            sys.exit(1)

        # Generate unique JTI (JWT ID)
        jti = secrets.token_urlsafe(24)

        # Determine scope based on role
        scope = ROLE_SCOPES.get(role, ROLE_SCOPES["member"])

        # Calculate expiration
        expires_at = None
        if expires_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_days)

        # Create service account record
        svc = ServiceAccount(
            name=name,
            jti=jti,
            role=role,
            scope=scope,
            description=description,
            expires_at=expires_at,
        )
        db.add(svc)
        db.commit()
        db.refresh(svc)

        # Generate JWT token
        additional_claims = {
            "role": role,
            "svc": name,  # Mark as service account
        }

        # For service accounts, we override expiration in JWT
        # by passing long-lived token (or never-expire pattern)
        token = create_jwt(
            sub=f"svc:{name}",
            scope=scope,
            jti=jti,
            additional_claims=additional_claims
        )

        print(f"Service account created successfully:")
        print(f"  Name: {name}")
        print(f"  Role: {role}")
        print(f"  Scope: {scope}")
        print(f"  JTI: {jti}")
        print(f"  Expires: {expires_at.isoformat() if expires_at else 'Never'}")
        print()
        print("=" * 60)
        print("TOKEN (save securely - cannot be recovered):")
        print("=" * 60)
        print(token)
        print("=" * 60)
        print()
        print("Usage in n8n:")
        print(f'  Authorization: Bearer {token[:20]}...')
        print()
        print("IMPORTANT: This token is valid until revoked. Store it securely!")

    finally:
        db.close()


def list_service_accounts() -> None:
    """List all service accounts"""
    create_tables()
    db = get_db_session()

    try:
        accounts = db.query(ServiceAccount).all()

        if not accounts:
            print("No service accounts found")
            print("Create one with: python -m api.oauth.cli create-service-account --name svc_public --role member")
            return

        print(f"{'Name':<20} {'Role':<10} {'Status':<10} {'Created':<20} {'Last Used':<20}")
        print("-" * 80)
        for svc in accounts:
            created = svc.created_at.strftime("%Y-%m-%d %H:%M") if svc.created_at else "N/A"
            last_used = svc.last_used_at.strftime("%Y-%m-%d %H:%M") if svc.last_used_at else "Never"
            status = "REVOKED" if svc.revoked else "Active"
            print(f"{svc.name:<20} {svc.role:<10} {status:<10} {created:<20} {last_used:<20}")

        print(f"\nTotal: {len(accounts)} service account(s)")

    finally:
        db.close()


def revoke_service_account(name: str) -> None:
    """Revoke a service account (token becomes invalid immediately)"""
    create_tables()
    db = get_db_session()

    try:
        svc = db.query(ServiceAccount).filter(ServiceAccount.name == name).first()
        if not svc:
            print(f"Error: Service account '{name}' not found")
            sys.exit(1)

        if svc.revoked:
            print(f"Service account '{name}' is already revoked")
            return

        svc.revoked = 1
        db.commit()

        print(f"Service account revoked:")
        print(f"  Name: {name}")
        print(f"  JTI: {svc.jti}")
        print()
        print("The token is now invalid. Any requests using it will be rejected.")

    finally:
        db.close()


def delete_service_account(name: str, force: bool = False) -> None:
    """Delete a service account permanently

    SECURITY NOTE: Deleting a service account record would cause fail-closed
    behavior in the revocation check (is_service_account_revoked returns True
    when record not found). So deletion is safe from a security perspective.
    However, we recommend keeping records for audit purposes.
    """
    create_tables()
    db = get_db_session()

    try:
        svc = db.query(ServiceAccount).filter(ServiceAccount.name == name).first()
        if not svc:
            print(f"Error: Service account '{name}' not found")
            sys.exit(1)

        if not svc.revoked and not force:
            print(f"Error: Service account '{name}' is still active")
            print(f"Revoke it first with: python -m api.oauth.cli revoke-service-account --name {name}")
            print("Or use --force to delete anyway")
            sys.exit(1)

        jti = svc.jti
        db.delete(svc)
        db.commit()

        print(f"Service account deleted: {name}")
        print(f"  JTI: {jti}")
        print()
        print("Note: The token is permanently invalid (fail-closed security).")
        print("If you need to recreate this account, use create-service-account with the same name.")

    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="OAuth CLI - User, Client, and Service Account Management",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # User management
    python -m api.oauth.cli create-user --email admin@sosilab.com
    python -m api.oauth.cli list-users
    python -m api.oauth.cli set-role --email admin@sosilab.com --role admin

    # OAuth client management
    python -m api.oauth.cli create-client --name "ChatGPT" --redirect-uri "https://chatgpt.com/..."
    python -m api.oauth.cli list-clients

    # Service account management (for n8n, scripts)
    python -m api.oauth.cli create-service-account --name svc_public --role member
    python -m api.oauth.cli create-service-account --name svc_admin --role admin --description "n8n admin workflows"
    python -m api.oauth.cli list-service-accounts
    python -m api.oauth.cli revoke-service-account --name svc_public
    python -m api.oauth.cli delete-service-account --name svc_public

    # Maintenance
    python -m api.oauth.cli cleanup
    python -m api.oauth.cli stats
        """
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # create-user
    user_parser = subparsers.add_parser("create-user", help="Create a new user")
    user_parser.add_argument("--email", "-e", required=True, help="User email")
    user_parser.add_argument("--password", "-p", help="User password (will prompt if not provided)")
    user_parser.add_argument("--role", "-r", default="member", choices=VALID_ROLES,
                            help="User role: member (default), exec, admin")

    # list-users
    subparsers.add_parser("list-users", help="List all users")

    # set-role
    role_parser = subparsers.add_parser("set-role", help="Change user role")
    role_parser.add_argument("--email", "-e", required=True, help="User email")
    role_parser.add_argument("--role", "-r", required=True, choices=VALID_ROLES,
                            help="New role: member, exec, admin")

    # create-client
    client_parser = subparsers.add_parser("create-client", help="Create OAuth client")
    client_parser.add_argument("--name", "-n", default="ChatGPT MCP Client", help="Client name")
    client_parser.add_argument("--redirect-uri", "-r", action="append", default=[], help="Redirect URI (can specify multiple)")

    # list-clients
    subparsers.add_parser("list-clients", help="List all OAuth clients")

    # cleanup
    subparsers.add_parser("cleanup", help="Clean up expired sessions and codes")

    # stats
    subparsers.add_parser("stats", help="Show OAuth statistics")

    # create-service-account
    svc_parser = subparsers.add_parser("create-service-account", help="Create service account with long-lived token")
    svc_parser.add_argument("--name", "-n", required=True, help="Service account name (e.g., svc_public)")
    svc_parser.add_argument("--role", "-r", default="member", choices=VALID_ROLES,
                           help="Role: member (default), exec, admin")
    svc_parser.add_argument("--description", "-d", help="Human-readable description")
    svc_parser.add_argument("--expires-days", type=int, help="Token expiration in days (default: never)")

    # list-service-accounts
    subparsers.add_parser("list-service-accounts", help="List all service accounts")

    # revoke-service-account
    revoke_svc_parser = subparsers.add_parser("revoke-service-account", help="Revoke service account token")
    revoke_svc_parser.add_argument("--name", "-n", required=True, help="Service account name")

    # delete-service-account
    delete_svc_parser = subparsers.add_parser("delete-service-account", help="Delete service account permanently")
    delete_svc_parser.add_argument("--name", "-n", required=True, help="Service account name")
    delete_svc_parser.add_argument("--force", "-f", action="store_true", help="Force delete even if not revoked")

    args = parser.parse_args()

    if args.command == "create-user":
        password = args.password
        if not password:
            password = getpass.getpass("Enter password: ")
            confirm = getpass.getpass("Confirm password: ")
            if password != confirm:
                print("Error: Passwords do not match")
                sys.exit(1)
        create_user(args.email, password, args.role)

    elif args.command == "list-users":
        list_users()

    elif args.command == "set-role":
        set_role(args.email, args.role)

    elif args.command == "create-client":
        create_client(args.name, args.redirect_uri)

    elif args.command == "list-clients":
        list_clients()

    elif args.command == "cleanup":
        run_cleanup()

    elif args.command == "stats":
        show_stats()

    elif args.command == "create-service-account":
        create_service_account(
            args.name,
            args.role,
            args.description,
            args.expires_days
        )

    elif args.command == "list-service-accounts":
        list_service_accounts()

    elif args.command == "revoke-service-account":
        revoke_service_account(args.name)

    elif args.command == "delete-service-account":
        delete_service_account(args.name, args.force)


if __name__ == "__main__":
    main()
