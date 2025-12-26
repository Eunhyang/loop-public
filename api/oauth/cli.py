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

from .models import create_tables, get_db_session, User, OAuthClient, Session, AuthCode
from .security import hash_password, cleanup_expired, validate_redirect_uri


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

        print("OAuth Statistics:")
        print(f"  Users: {user_count}")
        print(f"  Clients: {client_count}")
        print(f"  Total Sessions: {session_count}")
        print(f"  Active Sessions: {active_sessions}")
        print(f"  Pending Auth Codes: {pending_codes}")

    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="OAuth CLI - User and Client Management",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python -m api.oauth.cli create-user --email admin@sosilab.com
    python -m api.oauth.cli list-users
    python -m api.oauth.cli create-client --name "ChatGPT" --redirect-uri "https://chatgpt.com/..."
    python -m api.oauth.cli list-clients
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


if __name__ == "__main__":
    main()
