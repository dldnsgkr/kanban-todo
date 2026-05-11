export type Priority = 'high' | 'medium' | 'low'

export type ColumnId = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  priority: Priority
  createdAt: string
}

export interface ColumnData {
  id: ColumnId
  taskIds: string[]
}

export interface BoardState {
  tasks: Record<string, Task>
  columns: Record<ColumnId, ColumnData>
}
