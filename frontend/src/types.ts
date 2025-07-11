// frontend/src/types.ts

export interface CategoryRead {
  category_id: number;
  user_id: number;
  name: string;
  type: string;
  parent_category_id?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children: CategoryRead[];
}

export interface CategoryCreate {
  name: string;
  type?: string;
  parent_category_id?: number | null;
  is_active?: boolean;
}

export interface CategoryUpdate {
  name?: string;
  type?: string;
  parent_category_id?: number | null;
  is_active?: boolean;
}

export interface AccountRead {
  account_id: number;
  user_id: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountCreate {
  name: string;
  type?: string;
  balance?: number;
  currency?: string;
  is_active?: boolean;
}

export interface AccountUpdate {
  name?: string;
  type?: string;
  balance?: number;
  currency?: string;
  is_active?: boolean;
}

export interface TransactionRead {
  transaction_id: number;
  user_id: number;
  amount: number;
  date: string;
  description: string;
  account_id: number;
  category_id: number;
  type: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  amount: number;
  date?: string;
  description: string;
  account_id: number;
  category_id: number;
  type?: string;
  notes?: string;
}

export interface TransactionUpdate {
  amount?: number;
  date?: string;
  description?: string;
  account_id?: number;
  category_id?: number;
  type?: string;
  notes?: string;
}

export interface Paged<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

export interface BudgetRead {
  budget_id:    number;
  user_id:      number;
  category_id:  number;
  amount_limit: number;
  period:       'weekly' | 'monthly' | 'yearly';
  start_date:   string;
  end_date?:    string;
  created_at:   string;
  updated_at:   string;
}

export interface BudgetCreate {
  category_id:  number;
  amount_limit: number;
  period:       'weekly' | 'monthly' | 'yearly';
  start_date:   string;
  end_date?:    string;
}

export interface BudgetUpdate {
  amount_limit?: number;
  period?:       'weekly' | 'monthly' | 'yearly';
  start_date?:   string;
  end_date?:     string;
}

export interface RecurringRead {
  recurring_id:   number;
  user_id:        number;
  account_id:     number;
  amount:         number;
  category_id:    number;
  frequency:      'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date:     string;
  end_date?:      string;
  next_run_date:  string;
  created_at:     string;
  updated_at:     string;
}

export interface RecurringCreate {
  account_id:     number;
  amount:         number;
  category_id:    number;
  frequency:      'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date:     string;
  end_date?:      string;
  next_run_date:  string;
}

export interface RecurringUpdate {
  amount?:        number;
  category_id?:   number;
  frequency?:     'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date?:    string;
  end_date?:      string;
  next_run_date?: string;
}

// ─── Goals ───────────────────────────────────────
export interface GoalBase {
  title:         string
  description?:  string
  target_amount: number
  target_date:   string    // YYYY-MM-DD
}

export interface GoalRead extends GoalBase {
  goal_id:        number
  user_id:        number
  current_amount: number
  created_at:     string    // ISO timestamp
  updated_at:     string
}

export interface GoalCreate extends GoalBase {}
export interface GoalUpdate extends Partial<GoalBase> {
  current_amount?: number
}