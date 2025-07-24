// frontend/src/types.ts

// ─── Account ───────────────────────────────────────
export interface AccountRead {
  account_id: number
  user_id: number
  name: string
  account_type: string
  balance: number
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AccountCreate {
  name: string
  account_type?: string
  balance?: number
  currency?: string
  is_active?: boolean
}

export interface AccountUpdate {
  name?: string
  account_type?: string
  balance?: number
  currency?: string
  is_active?: boolean
}

// ─── Transactions ────────────────────────────────────
export interface TransactionRead {
  transaction_id: number
  user_id: number
  title: string
  description?: string
  account_id: number
  direction: 'withdrawal' | 'deposit'
  amount: number
  date: string
  created_at: string
  updated_at: string
}

export interface TransactionCreate {
  title: string
  description?: string
  account_id: number
  direction: 'withdrawal' | 'deposit'
  amount: number
  date?: string
}

export interface TransactionUpdate {
  title?: string
  description?: string
  account_id?: number
  direction?: 'withdrawal' | 'deposit'
  amount?: number
  date?: string
}

export interface Paged<T> {
  total: number
  page: number
  page_size: number
  items: T[]
}

// ─── Recurring ───────────────────────────────────────
export interface RecurringRead {
  recurring_id: number
  user_id: number
  account_id: number
  amount: number
  direction: 'withdrawal' | 'deposit'
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date?: string
  next_run_date: string
  created_at: string
  updated_at: string
  title?: string
  description?: string
}

export interface RecurringCreate {
  account_id: number
  amount: number
  direction: 'withdrawal' | 'deposit'
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date?: string
  next_run_date: string
  title?: string
  description?: string
}

export interface RecurringUpdate {
  amount?: number
  direction?: 'withdrawal' | 'deposit'
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date?: string
  end_date?: string
  next_run_date?: string
  title?: string
  description?: string
}

// ─── Budgets ────────────────────────────────────────
export interface BudgetRead {
  budget_id: number
  user_id: number
  section: 'income' | 'fixed' | 'variable'
  label: string
  amount: number
  created_at: string
  updated_at: string
}

export interface BudgetCreate {
  section: 'income' | 'fixed' | 'variable'
  label: string
  amount: number
}

export interface BudgetUpdate {
  section?: 'income' | 'fixed' | 'variable'
  label?: string
  amount?: number
}

// ─── Goals ──────────────────────────────────────────
export type Priority = 'low' | 'med' | 'high'

export interface GoalBase {
  title: string
  description?: string
  target_amount: number
  target_date: string  // YYYY-MM-DD
  priority: Priority
}

export interface GoalRead extends GoalBase {
  goal_id: number
  user_id: number
  current_amount: number
  created_at: string
  updated_at: string
}

export interface GoalCreate extends GoalBase {}
export interface GoalUpdate extends Partial<GoalBase> {
  current_amount?: number
}

export interface GoalDepositRead {
  deposit_id: number
  goal_id: number
  amount: number
  date: string
  note?: string
}
