# backend/app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
from app.db import engine, get_session
from app.models import RecurringTransaction, Transaction

# ── Routers ─────────────────────────────────────────────
from app.routers import auth, users, accounts, transactions
from app.routers.budgets import router as budgets_router
from app.routers.recurring import router as recurring_router
from app.routers.goals import router as goals_router
from app.routers.calculators import router as calculators_router

# ── App setup ─────────────────────────────────────────────
app = FastAPI(title="TrackVault API")

# ── CORS middleware ───────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Startup: create tables & schedule recurring ──────
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    sched = AsyncIOScheduler()
    sched.add_job(run_recurring, trigger="cron", hour=0, minute=0)
    sched.start()


# ── Routers ───────────────────────────────────────
app.include_router(auth, prefix="/auth", tags=["auth"])
app.include_router(users, prefix="/users", tags=["users"])
app.include_router(accounts, prefix="/accounts", tags=["accounts"])
app.include_router(transactions, prefix="/transactions", tags=["transactions"])
app.include_router(budgets_router, prefix="/budgets", tags=["budgets"])
app.include_router(recurring_router, prefix="/recurring", tags=["recurring"])
app.include_router(goals_router, prefix="/goals", tags=["goals"])
app.include_router(calculators_router, prefix="/calculators", tags=["calculators"])


# ── Health checkpoint ─────────────────────────────────
@app.get("/health")
async def health(session: AsyncSession = Depends(get_session)):
    ok = await session.scalar(select(1))
    return {"status": "ok", "db": ok}


# ── Process due recurring transactions ────────────────
async def run_recurring():
    async with get_session() as session:
        now = datetime.utcnow()
        recs = (
            await session.exec(
                select(RecurringTransaction).where(
                    RecurringTransaction.next_run_date <= now
                )
            )
        ).all()

        for rec in recs:
            tx = Transaction(
                user_id=rec.user_id,
                account_id=rec.account_id,
                amount=rec.amount,
                date=rec.next_run_date,
                description=f"Recurring ({rec.frequency})",
                type="expense",
            )
            session.add(tx)

            # ── Bump next_run_date ──────────────────────────
            if rec.frequency == "daily":
                rec.next_run_date += timedelta(days=1)
            elif rec.frequency == "weekly":
                rec.next_run_date += timedelta(weeks=1)
            elif rec.frequency == "monthly":
                m = rec.next_run_date.month % 12 + 1
                y = rec.next_run_date.year + (1 if m == 1 else 0)
                rec.next_run_date = rec.next_run_date.replace(year=y, month=m)
            else:
                rec.next_run_date = rec.next_run_date.replace(
                    year=rec.next_run_date.year + 1
                )
            rec.updated_at = now

        await session.commit()
