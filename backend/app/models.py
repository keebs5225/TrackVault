# backend/app/models.py
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, String, Enum
import enum

#–––– Enums –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
class BudgetPeriod(str, enum.Enum):
    weekly  = "weekly"
    monthly = "monthly"
    yearly  = "yearly"

class Frequency(str, enum.Enum):
    daily   = "daily"
    weekly  = "weekly"
    monthly = "monthly"
    yearly  = "yearly"

#–––– User ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
class User(SQLModel, table=True):
    user_id:       int        = Field(default=None, primary_key=True)
    name:          str
    email:         str        = Field(index=True, sa_column_kwargs={"unique": True})
    password_hash: str
    created_at:    datetime   = Field(default_factory=datetime.utcnow)
    updated_at:    datetime   = Field(default_factory=datetime.utcnow)

    # backrefs
    accounts:      List["Account"]            = Relationship(back_populates="owner")
    categories:    List["Category"]           = Relationship(back_populates="owner")
    transactions:  List["Transaction"]        = Relationship(back_populates="user")
    budgets:       List["Budget"]             = Relationship(back_populates="owner")
    recurrings:    List["RecurringTransaction"]= Relationship(back_populates="owner")
    goals:         List["Goal"]               = Relationship(back_populates="owner")


#–––– Account –––––––––––––––––––––––––––––––––––––––––––––––––––––––––
class Account(SQLModel, table=True):
    __tablename__ = "account"

    account_id:   int      = Field(default=None, primary_key=True)
    user_id:      int      = Field(foreign_key="user.user_id", index=True)
    name:         str
    account_type: str      = Field(
        default="checking",
        sa_column=Column("account_type", String, server_default="checking")
    )
    balance:      float    = Field(default=0.0)
    created_at:   datetime = Field(default_factory=datetime.utcnow)
    updated_at:   datetime = Field(default_factory=datetime.utcnow)

    owner:        "User"            = Relationship(back_populates="accounts")
    transactions: List["Transaction"] = Relationship(back_populates="account")
    recurrings:   List["RecurringTransaction"] = Relationship(back_populates="account")


#–––– Category ––––––––––––––––––––––––––––––––––––––––––––––––––––––––
class Category(SQLModel, table=True):
    __tablename__ = "category"

    category_id:        int               = Field(default=None, primary_key=True)
    user_id:            int               = Field(foreign_key="user.user_id", index=True)
    name:               str
    type:               str               = Field(
        default="expense",
        sa_column=Column("type", String, server_default="expense")
    )
    parent_category_id: Optional[int]     = Field(
                             default=None,
                             foreign_key="category.category_id",
                             index=True
                         )
    created_at:         datetime          = Field(default_factory=datetime.utcnow)
    updated_at:         datetime          = Field(default_factory=datetime.utcnow)

    owner:        "User"               = Relationship(back_populates="categories")
    parent:       Optional["Category"] = Relationship(
                      back_populates="children",
                      sa_relationship_kwargs={"remote_side":"Category.category_id"}
                  )
    children:     List["Category"]     = Relationship(back_populates="parent")
    transactions: List["Transaction"]  = Relationship(back_populates="category")
    budgets:      List["Budget"]       = Relationship(back_populates="category")
    recurrings:   List["RecurringTransaction"] = Relationship(back_populates="category")


#–––– Transaction ––––––––––––––––––––––––––––––––––––––––––––––––––––––
class Transaction(SQLModel, table=True):
    transaction_id: int        = Field(default=None, primary_key=True)
    user_id:        int        = Field(foreign_key="user.user_id", index=True)
    amount:         float
    date:           datetime   = Field(default_factory=datetime.utcnow)
    description:    str
    account_id:     int        = Field(foreign_key="account.account_id", index=True)
    category_id:    int        = Field(foreign_key="category.category_id", index=True)
    type:           str        = Field(sa_column_kwargs={"server_default":"expense"})
    notes:          Optional[str] = None
    created_at:     datetime   = Field(default_factory=datetime.utcnow)
    updated_at:     datetime   = Field(default_factory=datetime.utcnow)

    user:       "User"       = Relationship(back_populates="transactions")
    account:    Account      = Relationship(back_populates="transactions")
    category:   Category     = Relationship(back_populates="transactions")


#–––– Budget ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
class Budget(SQLModel, table=True):
    __tablename__ = "budget"

    budget_id:    int          = Field(default=None, primary_key=True)
    user_id:      int          = Field(foreign_key="user.user_id", index=True)
    category_id:  int          = Field(foreign_key="category.category_id")
    amount_limit: float
    period:       BudgetPeriod = Field(sa_column=Column(Enum(BudgetPeriod)))
    start_date:   datetime
    end_date:     Optional[datetime] = None
    created_at:   datetime      = Field(default_factory=datetime.utcnow)
    updated_at:   datetime      = Field(default_factory=datetime.utcnow)

    owner:    "User"    = Relationship(back_populates="budgets")
    category: Category  = Relationship(back_populates="budgets")


#–––– RecurringTransaction –––––––––––––––––––––––––––––––––––––––––––––
class RecurringTransaction(SQLModel, table=True):
    __tablename__ = "recurring_transaction"

    recurring_id:  int        = Field(default=None, primary_key=True)
    user_id:       int        = Field(foreign_key="user.user_id", index=True)
    account_id:    int        = Field(foreign_key="account.account_id")
    amount:        float
    category_id:   int        = Field(foreign_key="category.category_id")
    frequency:     Frequency  = Field(sa_column=Column(Enum(Frequency)))
    start_date:    datetime
    end_date:      Optional[datetime] = None
    next_run_date: datetime
    created_at:    datetime   = Field(default_factory=datetime.utcnow)
    updated_at:    datetime   = Field(default_factory=datetime.utcnow)

    owner:    "User"              = Relationship(back_populates="recurrings")
    account:  Account             = Relationship(back_populates="recurrings")
    category: Category            = Relationship(back_populates="recurrings")


#–––– Goals & Deposits ––––––––––––––––––––––––––––––––––––––––––––––––
class Goal(SQLModel, table=True):
    __tablename__ = "goal"

    goal_id:       int        = Field(default=None, primary_key=True)
    user_id:       int        = Field(foreign_key="user.user_id", index=True)
    title:         str
    description:   Optional[str] = None
    target_amount: float
    target_date:   datetime
    created_at:    datetime   = Field(default_factory=datetime.utcnow)
    updated_at:    datetime   = Field(default_factory=datetime.utcnow)

    owner:    "User"       = Relationship(back_populates="goals")
    deposits: List["GoalDeposit"] = Relationship(back_populates="goal")


class GoalDeposit(SQLModel, table=True):
    __tablename__ = "goal_deposit"

    deposit_id: int        = Field(default=None, primary_key=True)
    goal_id:    int        = Field(foreign_key="goal.goal_id", index=True)
    amount:     float
    date:       datetime   = Field(default_factory=datetime.utcnow)
    note:       Optional[str] = None

    goal:       Goal       = Relationship(back_populates="deposits")
