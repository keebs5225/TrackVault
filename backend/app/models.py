# backend/app/models.py
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

#––– User model –––
class User(SQLModel, table=True):
    user_id:       int       = Field(default=None, primary_key=True)
    name:          str
    email:         str       = Field(index=True, sa_column_kwargs={"unique": True})
    password_hash: str
    created_at:    datetime  = Field(default_factory=datetime.utcnow)
    updated_at:    datetime  = Field(default_factory=datetime.utcnow)

    # backrefs
    accounts:      List["Account"]     = Relationship(back_populates="owner")
    categories:    List["Category"]    = Relationship(back_populates="owner")
    transactions:  List["Transaction"] = Relationship(back_populates="user")


#–––– Account ––––
class Account(SQLModel, table=True):
    account_id:    int       = Field(default=None, primary_key=True)
    user_id:       int       = Field(foreign_key="user.user_id", index=True)
    name:          str
    type:          str       = Field(sa_column_kwargs={"server_default": "checking"})
    balance:       float     = Field(default=0.0)
    currency:      str       = Field(default="USD")
    is_active:     bool      = Field(default=True)
    created_at:    datetime  = Field(default_factory=datetime.utcnow)
    updated_at:    datetime  = Field(default_factory=datetime.utcnow)

    owner:         User      = Relationship(back_populates="accounts")
    transactions:  List["Transaction"] = Relationship(back_populates="account")


#––– Category –––
class Category(SQLModel, table=True):
    category_id:         int               = Field(default=None, primary_key=True)
    user_id:             int               = Field(foreign_key="user.user_id", index=True)
    name:                str
    type:                str               = Field(sa_column_kwargs={"server_default": "expense"})
    parent_category_id:  Optional[int]     = Field(
                             default=None,
                             foreign_key="category.category_id",
                             index=True
                         )
    is_active:           bool              = Field(default=True)
    created_at:          datetime          = Field(default_factory=datetime.utcnow)
    updated_at:          datetime          = Field(default_factory=datetime.utcnow)

    owner:               User              = Relationship(back_populates="categories")
    parent:              Optional["Category"] = Relationship(
                             back_populates="children",
                             sa_relationship_kwargs={"remote_side":"Category.category_id"}
                         )
    children:            List["Category"]     = Relationship(back_populates="parent")
    transactions:        List["Transaction"]  = Relationship(back_populates="category")


#––– Transaction –––
class Transaction(SQLModel, table=True):
    transaction_id: int        = Field(default=None, primary_key=True)
    user_id:        int        = Field(foreign_key="user.user_id", index=True)
    amount:         float
    date:           datetime   = Field(default_factory=datetime.utcnow)
    description:    str
    account_id:     int        = Field(foreign_key="account.account_id", index=True)
    category_id:    int        = Field(foreign_key="category.category_id", index=True)
    type:           str        = Field(sa_column_kwargs={"server_default": "expense"})
    notes:          Optional[str] = None
    created_at:     datetime   = Field(default_factory=datetime.utcnow)
    updated_at:     datetime   = Field(default_factory=datetime.utcnow)

    user:           User       = Relationship(back_populates="transactions")
    account:        Account    = Relationship(back_populates="transactions")
    category:       Category   = Relationship(back_populates="transactions")
