# backend/app/models.py
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ENUM as PGEnum
import enum

# ── Enums ─────────────────────────────────────────────────
class BudgetPeriod(str, enum.Enum):
    weekly  = "weekly"
    monthly = "monthly"
    yearly  = "yearly"

class Frequency(str, enum.Enum):
    daily   = "daily"
    weekly  = "weekly"
    monthly = "monthly"
    yearly  = "yearly"

class AccountType(str, enum.Enum):
    checking = "checking"
    savings  = "savings"
    credit   = "credit"
    cash     = "cash"

class TransactionDirection(str, enum.Enum):
    deposit    = "deposit"
    withdrawal = "withdrawal"

class Priority(str, enum.Enum):
    low  = "low"
    med  = "med"
    high = "high"


# ── User model ─────────────────────────────────────────────
class User(SQLModel, table=True):
    user_id:       int        = Field(default=None, primary_key=True)
    name:          str
    email:         str        = Field(index=True, sa_column_kwargs={"unique": True})
    password_hash: str
    created_at:    datetime   = Field(default_factory=datetime.utcnow)
    updated_at:    datetime   = Field(default_factory=datetime.utcnow)

    accounts:      List["Account"]              = Relationship(back_populates="owner")
    transactions:  List["Transaction"]          = Relationship(back_populates="user")
    budgets:       List["Budget"]               = Relationship(back_populates="owner")
    recurrings:    List["RecurringTransaction"] = Relationship(back_populates="owner")
    goals:         List["Goal"]                 = Relationship(back_populates="owner")


# ── Account model ──────────────────────────────────────────
class Account(SQLModel, table=True):
    __tablename__ = "account"

    account_id:   int         = Field(default=None, primary_key=True)
    user_id:      int         = Field(foreign_key="user.user_id", index=True)
    name:         str
    account_type: AccountType = Field(
        default=AccountType.checking,
        sa_column=Column(
            "account_type",
            PGEnum(AccountType, name="account_type", create_type=False),
            nullable=False,
            server_default="checking"
        )
    )
    balance:      float       = Field(default=0.0)
    created_at:   datetime    = Field(default_factory=datetime.utcnow)
    updated_at:   datetime    = Field(default_factory=datetime.utcnow)

    owner:        "User"                       = Relationship(back_populates="accounts")
    transactions: List["Transaction"]          = Relationship(back_populates="account")
    recurrings:   List["RecurringTransaction"] = Relationship(back_populates="account")


# ── Transaction model ──────────────────────────────────────
class Transaction(SQLModel, table=True):
    __tablename__ = "transaction"

    transaction_id: int                  = Field(default=None, primary_key=True)
    user_id:        int                  = Field(foreign_key="user.user_id", index=True)
    title:          str                  = Field(..., description="Short title for this transaction")
    description:    str                  = Field(..., description="Detailed description")
    amount:         float                = Field(..., description="Positive amount")
    date:           datetime             = Field(default_factory=datetime.utcnow)
    account_id:     int                  = Field(foreign_key="account.account_id", index=True)
    direction:      TransactionDirection = Field(
        sa_column=Column(
            "direction",
            PGEnum(TransactionDirection, name="transaction_direction", create_type=False),
            nullable=False,
            server_default="withdrawal"
        )
    )
    created_at:     datetime             = Field(default_factory=datetime.utcnow)
    updated_at:     datetime             = Field(default_factory=datetime.utcnow)

    user:    "User"   = Relationship(back_populates="transactions")
    account: Account  = Relationship(back_populates="transactions")


# ── Budget model ───────────────────────────────────────────
class Section(str, enum.Enum):
    income           = "income"
    fixed            = "fixed"
    variable         = "variable"
    savings_and_debt = "savings_and_debt"

class Budget(SQLModel, table=True):
    __tablename__ = "budget"

    budget_id:   int      = Field(default=None, primary_key=True)
    user_id:     int      = Field(foreign_key="user.user_id", index=True)
    section:     Section  = Field(sa_column=Column(PGEnum(Section), nullable=False))
    label:       str
    amount:      float
    created_at:  datetime = Field(default_factory=datetime.utcnow)
    updated_at:  datetime = Field(default_factory=datetime.utcnow)

    owner:    "User"     = Relationship(back_populates="budgets")


# ── RecurringTransaction model ────────────────────────────
class RecurringTransaction(SQLModel, table=True):
    __tablename__ = "recurring_transaction"

    recurring_id:  int        = Field(default=None, primary_key=True)
    user_id:       int        = Field(foreign_key="user.user_id", index=True)
    account_id:    int        = Field(foreign_key="account.account_id")

    title:         Optional[str] = None
    description:   Optional[str] = None
    direction:     TransactionDirection = Field(
        sa_column=Column(
            PGEnum(TransactionDirection, name="transaction_direction", create_type=False),
            nullable=False,
            server_default="withdrawal"
        )
    )

    amount:        float
    frequency:     Frequency  = Field(sa_column=Column(PGEnum(Frequency, name="frequency", create_type=False), nullable=False))
    start_date:    datetime
    end_date:      Optional[datetime] = None
    next_run_date: datetime
    created_at:    datetime   = Field(default_factory=datetime.utcnow)
    updated_at:    datetime   = Field(default_factory=datetime.utcnow)

    owner:   "User"   = Relationship(back_populates="recurrings")
    account: Account  = Relationship(back_populates="recurrings")


# ── Goal models ──────────────────────────────────
class Goal(SQLModel, table=True):
    __tablename__ = "goal"

    goal_id:       int        = Field(default=None, primary_key=True)
    user_id:       int        = Field(foreign_key="user.user_id", index=True)
    title:         str
    description:   Optional[str] = None
    target_amount: float
    target_date:   datetime
    priority:      Priority   = Field(
        sa_column=Column(
            PGEnum(Priority, name="priority_enum", create_type=False),
            nullable=False,
            server_default="med"
        )
    )
    created_at:    datetime   = Field(default_factory=datetime.utcnow)
    updated_at:    datetime   = Field(default_factory=datetime.utcnow)

    owner:    "User"              = Relationship(back_populates="goals")
    deposits: List["GoalDeposit"] = Relationship(back_populates="goal")

# ── Deposit models ──────────────────────────────────
class GoalDeposit(SQLModel, table=True):
    __tablename__ = "goal_deposit"

    deposit_id: int        = Field(default=None, primary_key=True)
    goal_id:    int        = Field(foreign_key="goal.goal_id", index=True)
    amount:     float
    date:       datetime   = Field(default_factory=datetime.utcnow)
    note:       Optional[str] = None

    goal:       Goal       = Relationship(back_populates="deposits")