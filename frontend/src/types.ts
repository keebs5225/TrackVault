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

// add TransactionRead/Create/Update here later
