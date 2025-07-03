// frontend/src/types/index.d.ts

export interface AccountCreate {
  name: string
  type?: string
  balance?: number
  currency?: string
  is_active?: boolean
}

export interface AccountRead extends AccountCreate {
  account_id: number
  user_id: number
  created_at: string  // or Date if you parse
  updated_at: string
}

export interface AccountUpdate {
  name?: string
  type?: string
  balance?: number
  currency?: string
  is_active?: boolean
}

export interface CategoryCreate {
  name: string
  type?: string
  parent_category_id?: number
  is_active?: boolean
}

export interface CategoryRead extends CategoryCreate {
  category_id: number
  user_id: number
  created_at: string
  updated_at: string
  children?: CategoryRead[]
}

export interface CategoryUpdate {
  name?: string
  type?: string
  parent_category_id?: number
  is_active?: boolean
}
