#!/usr/bin/env python3
"""Add role column to users table (one-time migration)"""
import sqlite3
import os

DB_PATH = os.environ.get("OAUTH_DB_PATH", "/vault/api/oauth/oauth.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Add role column if not exists
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member'")
        print(f"Added 'role' column to users table")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("Column 'role' already exists")
        else:
            raise

    # Update admin user
    cursor.execute("UPDATE users SET role = 'admin' WHERE email = 'admin@sosilab.com'")
    conn.commit()

    # Verify
    cursor.execute("SELECT id, email, role FROM users")
    print("\nUsers after migration:")
    for row in cursor.fetchall():
        print(f"  ID: {row[0]}, Email: {row[1]}, Role: {row[2]}")

    conn.close()
    print("\nMigration complete!")

if __name__ == "__main__":
    migrate()
