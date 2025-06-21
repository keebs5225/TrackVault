# backend/app/core/security.py
# This module handles password hashing and JWT token creation for user authentication.

from typing import Any, Dict
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt

# 1) Password hashing
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


# 2) JWT settings
SECRET_KEY = "CHANGE_THIS_TO_A_RANDOM_SECRET"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT token containing the passed data dict plus an expiration.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
