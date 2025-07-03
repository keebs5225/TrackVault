import API from './api'
import type { CategoryRead, CategoryCreate, CategoryUpdate } from '../types.ts'

// fully‐nested tree
export const fetchCategoryTree = () =>
  API.get<CategoryRead[]>('/categories/tree').then(r => r.data)

export const createCategory = (data: CategoryCreate) =>
  API.post<CategoryRead>('/categories', data).then(r => r.data)

export const updateCategory = (id: number, data: CategoryUpdate) =>
  API.patch<CategoryRead>(`/categories/${id}`, data).then(r => r.data)

export const deleteCategory = (id: number) =>
  API.delete<void>(`/categories/${id}`).then(r => r.data)
