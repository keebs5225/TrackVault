//frontend/src/services/goals.ts
import API from './api'
import type { GoalRead, GoalCreate, GoalUpdate, GoalDepositRead } from '../types.ts'

// Fetch all goals
export function fetchGoals(): Promise<GoalRead[]> {
  return API.get<GoalRead[]>('/goals').then(r => r.data)
}

// Create a new goal
export function createGoal(data: GoalCreate): Promise<GoalRead> {
  return API.post<GoalRead>('/goals', data).then(r => r.data)
}

// Update any field(s) on a goal (including current_amount for deposits)
export function updateGoal(
  id: number,
  data: GoalUpdate
): Promise<GoalRead> {
  return API.patch<GoalRead>(`/goals/${id}`, data).then(r => r.data)
}

// Delete a goal
export function deleteGoal(id: number): Promise<void> {
  return API.delete<void>(`/goals/${id}`).then(r => r.data)
}

export function addDeposit(
  id: number,
  amount: number
): Promise<GoalDepositRead> {
  return API
    .post<GoalDepositRead>(`/goals/${id}/deposits`, { amount })
    .then(r => r.data);
}