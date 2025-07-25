# backend/app/routers/calculators.py
from fastapi import APIRouter
from pydantic import BaseModel, Field
import math


# ── Router setup ───────────────────────────────────────────
router = APIRouter(tags=["calculators"])


# ── Loan calculator models ───────────────────────────────
class LoanParams(BaseModel):
    principal: float = Field(..., gt=0)
    annual_rate: float = Field(..., gt=0, lt=100, description="Percent")
    term_months: int = Field(..., gt=0)


class LoanResult(BaseModel):
    monthly_payment: float
    total_payment: float
    total_interest: float


# ── Calculate loan payments ──────────────────────────────
@router.post("/loan", response_model=LoanResult)
def calculate_loan(p: LoanParams):
    r = p.annual_rate / 100 / 12
    n = p.term_months
    payment = r * p.principal / (1 - (1 + r) ** -n)
    total = payment * n
    return LoanResult(
        monthly_payment=round(payment, 2),
        total_payment=round(total, 2),
        total_interest=round(total - p.principal, 2),
    )


# ── Savings calculator models ────────────────────────────
class SavingsParams(BaseModel):
    initial: float = Field(..., ge=0)
    monthly_deposit: float = Field(..., ge=0)
    annual_rate: float = Field(..., ge=0, lt=100)
    term_months: int = Field(..., gt=0)


class SavingsResult(BaseModel):
    balance: float
    contributions: float
    interest_earned: float


# ── Calculate savings growth ─────────────────────────────
@router.post("/savings", response_model=SavingsResult)
def calculate_savings(p: SavingsParams):
    r = p.annual_rate / 100 / 12
    balance = p.initial
    total_contrib = 0.0
    for _ in range(p.term_months):
        balance = balance * (1 + r) + p.monthly_deposit
        total_contrib += p.monthly_deposit
    interest = balance - p.initial - total_contrib
    return SavingsResult(
        balance=round(balance, 2),
        contributions=round(total_contrib, 2),
        interest_earned=round(interest, 2),
    )


# ── Investment calculator models ─────────────────────────
class InvestmentParams(BaseModel):
    principal: float = Field(..., gt=0)
    annual_rate: float = Field(..., gt=0, lt=100)
    years: float = Field(..., gt=0)


class InvestmentResult(BaseModel):
    future_value: float
    total_interest: float


# ── Calculate investment return ──────────────────────────
@router.post("/investment", response_model=InvestmentResult)
def calculate_investment(p: InvestmentParams):
    r = p.annual_rate / 100
    fv = p.principal * (1 + r) ** p.years
    return InvestmentResult(
        future_value=round(fv, 2),
        total_interest=round(fv - p.principal, 2),
    )
