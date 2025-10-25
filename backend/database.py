# file: backend/database.py

import sqlite3
import hashlib

def setup_database():
    """Create a 'users.db' file with 'users' and 'test_results' tables."""
    conn = sqlite3.connect("users.db")
    c = conn.cursor()
    
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash TEXT
        )
    """)
    
    c.execute("""
        CREATE TABLE IF NOT EXISTS test_results (
            result_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            subject TEXT,
            topic TEXT,
            score INTEGER,
            weak_concepts TEXT,
            FOREIGN KEY (username) REFERENCES users (username)
        )
    """)
    
    conn.commit()
    conn.close()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def check_password(hashed_password, user_password):
    return hashed_password == hashlib.sha256(user_password.encode()).hexdigest()