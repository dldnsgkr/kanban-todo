import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import { css } from 'styled-system/css'
import Column from './components/Column'
import { CardOverlay } from './components/Card'
import AddTaskModal from './components/AddTaskModal'
import useLocalStorage from './hooks/useLocalStorage'
import type { BoardState, ColumnId, Priority, Task } from './types'

const COLUMN_ORDER: ColumnId[] = ['todo', 'in-progress', 'done']

const INITIAL_STATE: BoardState = {
  tasks: {},
  columns: {
    'todo':        { id: 'todo',        taskIds: [] },
    'in-progress': { id: 'in-progress', taskIds: [] },
    'done':        { id: 'done',        taskIds: [] },
  },
}

const isColumnId = (id: string): id is ColumnId =>
  (COLUMN_ORDER as string[]).includes(id)

const collisionStrategy: CollisionDetection = args => {
  const inner = pointerWithin(args)
  return inner.length > 0 ? inner : closestCenter(args)
}

// ─── App-level 스타일 ──────────────────────────────────────
const appStyle = css({
  minH: '100vh',
  display: 'flex',
  flexDirection: 'column',
})

const headerStyle = css({
  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  padding: '16px 32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxShadow: '0 2px 12px rgba(79,70,229,0.35)',
  position: 'sticky',
  top: '0',
  zIndex: '50',
  mdDown: { padding: '14px 16px' },
})

const headerLeftStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
})

const logoStyle = css({
  width: '36px',
  height: '36px',
  background: 'rgba(255,255,255,0.2)',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  flexShrink: '0',
})

const titleStyle = css({
  color: 'white',
  fontSize: '20px',
  fontWeight: '800',
  letterSpacing: '-0.03em',
  lineHeight: '1.2',
  mdDown: { fontSize: '17px' },
})

const subtitleStyle = css({
  color: 'rgba(255,255,255,0.65)',
  fontSize: '12px',
  marginTop: '2px',
})

const addBtnStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: 'rgba(255,255,255,0.15)',
  color: 'white',
  border: '1.5px solid rgba(255,255,255,0.3)',
  borderRadius: '8px',
  padding: '8px 18px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s',
  _hover: {
    background: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.5)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  _active: { transform: 'translateY(0)' },
})

const boardStyle = css({
  flex: '1',
  display: 'grid',
  gridTemplateColumns: { base: '1fr', lg: 'repeat(3, 1fr)' },
  gap: { base: '16px', lg: '20px' },
  padding: { base: '16px', lg: '24px 32px 32px' },
  alignItems: 'start',
})

export default function App() {
  const [board, setBoard] = useLocalStorage<BoardState>('kanban-board', INITIAL_STATE)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const addTask = useCallback((title: string, priority: Priority) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setBoard(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [id]: { id, title, priority, createdAt: new Date().toISOString() },
      },
      columns: {
        ...prev.columns,
        todo: { ...prev.columns.todo, taskIds: [...prev.columns.todo.taskIds, id] },
      },
    }))
  }, [setBoard])

  const deleteTask = useCallback((taskId: string) => {
    setBoard(prev => {
      const tasks = { ...prev.tasks }
      delete tasks[taskId]
      const columns = { ...prev.columns }
      for (const colId of COLUMN_ORDER) {
        columns[colId] = {
          ...prev.columns[colId],
          taskIds: prev.columns[colId].taskIds.filter(id => id !== taskId),
        }
      }
      return { ...prev, tasks, columns }
    })
  }, [setBoard])

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveTask(board.tasks[String(active.id)] ?? null)
  }, [board.tasks])

  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    if (!over) return

    const taskId = String(active.id)
    const targetColId = String(over.id)
    if (!isColumnId(targetColId)) return

    const sourceColId = COLUMN_ORDER.find(
      colId => board.columns[colId].taskIds.includes(taskId),
    )
    if (!sourceColId || sourceColId === targetColId) return

    setBoard(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [sourceColId]: {
          ...prev.columns[sourceColId],
          taskIds: prev.columns[sourceColId].taskIds.filter(id => id !== taskId),
        },
        [targetColId]: {
          ...prev.columns[targetColId],
          taskIds: [...prev.columns[targetColId].taskIds, taskId],
        },
      },
    }))
  }, [board, setBoard])

  const totalTasks = Object.keys(board.tasks).length

  return (
    <div className={appStyle}>
      <header className={headerStyle}>
        <div className={headerLeftStyle}>
          <div className={logoStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div>
            <h1 className={titleStyle}>Kanban Board</h1>
            <p className={subtitleStyle}>{totalTasks}개의 할 일</p>
          </div>
        </div>
        <button className={addBtnStyle} onClick={() => setIsModalOpen(true)}>
          <span style={{ fontSize: '18px', fontWeight: '400', lineHeight: 1 }}>+</span>
          할 일 추가
        </button>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionStrategy}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <main className={boardStyle}>
          {COLUMN_ORDER.map(colId => {
            const col = board.columns[colId]
            const tasks = col.taskIds.map(id => board.tasks[id]).filter(Boolean) as Task[]
            return <Column key={colId} column={col} tasks={tasks} onDelete={deleteTask} />
          })}
        </main>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
          {activeTask ? <CardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {isModalOpen && (
        <AddTaskModal onAdd={addTask} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  )
}
