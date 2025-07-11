//frontend/src/services/recurring.ts
import API from './api'
import type { RecurringRead, RecurringCreate, RecurringUpdate} from '../types.ts'

export const fetchRecurring = (): Promise<RecurringRead[]> =>
  API.get<RecurringRead[]>('/recurring').then(r => r.data)

export const createRecurring = (
  r: RecurringCreate
): Promise<RecurringRead> =>
  API.post<RecurringRead>('/recurring', r).then(rsp => rsp.data)

export const updateRecurring = (
  id: number,
  r: RecurringUpdate
): Promise<RecurringRead> =>
  API.patch<RecurringRead>(`/recurring/${id}`, r).then(rsp => rsp.data)

export const deleteRecurring = (id: number): Promise<void> =>
  API.delete<void>(`/recurring/${id}`).then(r => r.data)
