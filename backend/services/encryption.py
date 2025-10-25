"""
Token encryption service for securing GitHub access tokens
"""
from cryptography.fernet import Fernet
import os
import base64
import hashlib

# Generate encryption key from secret
def _get_encryption_key():
    secret = os.getenv('ENCRYPTION_SECRET', 'dev-secret-change-in-production')
    # Derive a proper 32-byte key from the secret
    key = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(key)

_cipher = Fernet(_get_encryption_key())

def encrypt_token(token: str) -> str:
    """Encrypt a token for storage"""
    if not token:
        return None
    return _cipher.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Decrypt a token from storage"""
    if not encrypted_token:
        return None
    try:
        return _cipher.decrypt(encrypted_token.encode()).decode()
    except Exception:
        return None
