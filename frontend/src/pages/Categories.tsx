// frontend/src/pages/Categories.tsx
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCategoryTree, createCategory, deleteCategory} from '../services/categories'
import type { CategoryRead, CategoryCreate } from '../types.ts'
import Spinner from '../components/Spinner'

export default function CategoriesPage() {
  const qc = useQueryClient()
    // Fetch the category tree
  const { data: tree = [], isLoading } = useQuery<CategoryRead[], Error>({
    queryKey: ['categories', 'tree'],
    queryFn: fetchCategoryTree,
  })

  const createMut = useMutation<CategoryRead, Error, CategoryCreate>({
    mutationFn: createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories','tree'] }),
  })
  const deleteMut = useMutation<void, Error, number>({
    mutationFn: deleteCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories','tree'] }),
  })

  const [newName, setNewName] = useState('')
  const [parentId, setParentId] = useState<number|undefined>(undefined)

  if (isLoading) return <Spinner />

  function renderNode(cat: CategoryRead, depth = 0): JSX.Element {
    return (
      <div key={cat.category_id} style={{ marginLeft: depth * 20 }}>
        • {cat.name}{' '}
        <button
          onClick={() => deleteMut.mutate(cat.category_id)}
          disabled={deleteMut.status === 'pending'}
        >
          ❌
        </button>
        {cat.children.map(c => renderNode(c, depth + 1))}
      </div>
    )
  }

  return (
    <section>
      <h2>All Categories</h2>
      {tree.map(root => renderNode(root))}

      <h3>Add Category</h3>
      <form
        onSubmit={e => {
          e.preventDefault()
          createMut.mutate({
            name: newName,
            parent_category_id: parentId ?? null,
          })
        }}
      >
        <input
          placeholder="Name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          required
        />
        <select
          value={parentId ?? ''}
          onChange={e => {
            const v = e.target.value
            setParentId(v ? +v : undefined)
          }}
        >
          <option value="">-- root --</option>
          {/** flatten tree for options */}
          {tree.flatMap(cat => {
            const opt: JSX.Element[] = []
            opt.push(
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            )
            cat.children.forEach(child =>
              opt.push(
                <option key={child.category_id} value={child.category_id}>
                  — {child.name}
                </option>
              )
            )
            return opt
          })}
        </select>
        <button type="submit" disabled={createMut.status === 'pending'}>
          {createMut.status === 'pending' ? <Spinner /> : 'Create'}
        </button>
      </form>
    </section>
  )
}
