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

