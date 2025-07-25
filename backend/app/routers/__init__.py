# backend/app/routers/__init__.py
from .auth import router as auth
from .users import router as users
from .accounts import router as accounts
from .transactions import router as transactions

__all__ = ["auth", "users", "accounts", "transactions"]
