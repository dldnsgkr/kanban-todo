import { useState, useCallback, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  type DragStartEvent,
  type DragOverEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { css } from 'styled-system/css'
import Column from './components/Column'
import { CardOverlay } from './components/Card'
import AddTaskModal from './components/AddTaskModal'
import useLocalStorage from './hooks/useLocalStorage'
import type { BoardState, ColumnId, Priority, Task } from './types'
import { PRIORITY_CONFIG } from './components/Card'

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

const appStyle = css({
  minH: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#f8fafc',
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

const filterBarStyle = css({
  padding: '12px 32px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  borderBottom: '1px solid #e2e8f0',
  background: 'white',
  flexWrap: 'wrap',
  mdDown: { padding: '10px 16px' },
})

const searchInputStyle = css({
  flex: '1',
  minW: '140px',
  maxW: '260px',
  padding: '7px 12px 7px 34px',
  border: '1.5px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '13px',
  color: '#334155',
  background: '#f8fafc',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  _focus: {
    borderColor: '#6366f1',
    background: 'white',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.12)',
  },
  _placeholder: { color: '#94a3b8' },
})

const searchWrapStyle = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
})

const searchIconStyle = css({
  position: 'absolute',
  left: '10px',
  color: '#94a3b8',
  pointerEvents: 'none',
})

const filterGroupStyle = css({
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
})

const boardStyle = css({
  flex: '1',
  display: 'grid',
  gridTemplateColumns: { base: '1fr', lg: 'repeat(3, 1fr)' },
  gap: { base: '16px', lg: '20px' },
  padding: { base: '16px', lg: '24px 32px 32px' },
  alignItems: 'start',
})

type PriorityFilter = Priority | 'all'

const PRIORITY_FILTERS: { key: PriorityFilter; label: string }[] = [
  { key: 'all',    label: '전체' },
  { key: 'high',   label: '높음' },
  { key: 'medium', label: '중간' },
  { key: 'low',    label: '낮음' },
]

export default function App() {
  const [board, setBoard] = useLocalStorage<BoardState>('kanban-board', INITIAL_STATE)
  const boardRef = useRef(board)
  boardRef.current = board

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filterPriority, setFilterPriority] = useState<PriorityFilter>('all')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const addTask = useCallback((title: string, priority: Priority, dueDate?: string) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setBoard(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [id]: { id, title, priority, createdAt: new Date().toISOString(), dueDate },
      },
      columns: {
        ...prev.columns,
        todo: { ...prev.columns.todo, taskIds: [...prev.columns.todo.taskIds, id] },
      },
    }))
  }, [setBoard])

  const editTask = useCallback((id: string, title: string, priority: Priority, dueDate?: string) => {
    setBoard(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [id]: { ...prev.tasks[id], title, priority, dueDate },
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
    setActiveTask(boardRef.current.tasks[String(active.id)] ?? null)
  }, [])

  const handleDragOver = useCallback(({ active, over }: DragOverEvent) => {
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    const currentBoard = boardRef.current
    const activeColId = COLUMN_ORDER.find(id => currentBoard.columns[id].taskIds.includes(activeId))
    if (!activeColId) return

    const overColId = isColumnId(overId)
      ? overId
      : COLUMN_ORDER.find(id => currentBoard.columns[id].taskIds.includes(overId))
    if (!overColId) return

    if (activeColId === overColId) {
      const taskIds = currentBoard.columns[activeColId].taskIds
      const oldIndex = taskIds.indexOf(activeId)
      const newIndex = isColumnId(overId) ? taskIds.length - 1 : taskIds.indexOf(overId)
      if (oldIndex !== newIndex && newIndex >= 0) {
        setBoard(prev => ({
          ...prev,
          columns: {
            ...prev.columns,
            [activeColId]: {
              ...prev.columns[activeColId],
              taskIds: arrayMove(prev.columns[activeColId].taskIds, oldIndex, newIndex),
            },
          },
        }))
      }
    } else {
      setBoard(prev => {
        const sourceTaskIds = prev.columns[activeColId].taskIds.filter(id => id !== activeId)
        const destTaskIds = [...prev.columns[overColId].taskIds]
        const overIndex = isColumnId(overId) ? destTaskIds.length : destTaskIds.indexOf(overId)
        destTaskIds.splice(overIndex < 0 ? destTaskIds.length : overIndex, 0, activeId)
        return {
          ...prev,
          columns: {
            ...prev.columns,
            [activeColId]: { ...prev.columns[activeColId], taskIds: sourceTaskIds },
            [overColId]:   { ...prev.columns[overColId],   taskIds: destTaskIds   },
          },
        }
      })
    }
  }, [setBoard])

  const handleDragEnd = useCallback(() => {
    setActiveTask(null)
  }, [])

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
        <button className={addBtnStyle} onClick={() => setIsAddModalOpen(true)}>
          <span style={{ fontSize: '18px', fontWeight: '400', lineHeight: 1 }}>+</span>
          할 일 추가
        </button>
      </header>

      <div className={filterBarStyle}>
        <div className={searchWrapStyle}>
          <span className={searchIconStyle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            className={searchInputStyle}
            type="text"
            placeholder="검색..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>

        <div className={filterGroupStyle}>
          {PRIORITY_FILTERS.map(({ key, label }) => {
            const isSelected = filterPriority === key
            const cfg = key !== 'all' ? PRIORITY_CONFIG[key] : null
            return (
              <button
                key={key}
                onClick={() => setFilterPriority(key)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: `1.5px solid ${isSelected ? (cfg?.borderColor ?? '#6366f1') : '#e2e8f0'}`,
                  background: isSelected ? (cfg?.badgeBg ?? '#ede9fe') : '#f8fafc',
                  color: isSelected ? (cfg?.badgeColor ?? '#4f46e5') : '#64748b',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <main className={boardStyle}>
          {COLUMN_ORDER.map(colId => {
            const col = board.columns[colId]
            const tasks = col.taskIds
              .map(id => board.tasks[id])
              .filter((t): t is Task => !!t)
              .filter(t =>
                (filterPriority === 'all' || t.priority === filterPriority) &&
                (!searchText || t.title.toLowerCase().includes(searchText.toLowerCase()))
              )
            return (
              <Column
                key={colId}
                column={col}
                tasks={tasks}
                onDelete={deleteTask}
                onEdit={setEditingTask}
              />
            )
          })}
        </main>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
          {activeTask ? <CardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      {isAddModalOpen && (
        <AddTaskModal
          onSave={(title, priority, dueDate) => addTask(title, priority, dueDate)}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {editingTask && (
        <AddTaskModal
          initialTask={editingTask}
          onSave={(title, priority, dueDate) => {
            editTask(editingTask.id, title, priority, dueDate)
            setEditingTask(null)
          }}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  )
}
