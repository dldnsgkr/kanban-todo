import { useDroppable } from '@dnd-kit/core'
import { css, cva } from 'styled-system/css'
import Card from './Card'
import type { ColumnData, ColumnId, Task } from '../types'

export const COLUMN_META: Record<ColumnId, { label: string; color: string }> = {
  'todo':        { label: '할 일',   color: '#6366f1' },
  'in-progress': { label: '진행 중', color: '#f59e0b' },
  'done':        { label: '완료',    color: '#10b981' },
}

// cva: 컬럼 타입 variant + isOver compound variant
const columnVariants = cva({
  base: {
    bg: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    borderTop: '3px solid',
    transition: 'box-shadow 0.2s, background 0.2s',
    minH: '300px',
  },
  variants: {
    colId: {
      'todo':        { borderTopColor: '#6366f1' },
      'in-progress': { borderTopColor: '#f59e0b' },
      'done':        { borderTopColor: '#10b981' },
    },
    isOver: {
      true: {},
    },
  },
  compoundVariants: [
    {
      colId: 'todo', isOver: true,
      css: { boxShadow: '0 0 0 2px #6366f1, 0 6px 20px rgba(0,0,0,0.12)', background: '#f5f3ff' },
    },
    {
      colId: 'in-progress', isOver: true,
      css: { boxShadow: '0 0 0 2px #f59e0b, 0 6px 20px rgba(0,0,0,0.12)', background: '#fffbeb' },
    },
    {
      colId: 'done', isOver: true,
      css: { boxShadow: '0 0 0 2px #10b981, 0 6px 20px rgba(0,0,0,0.12)', background: '#f0fdf4' },
    },
  ],
})

const headerStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 16px',
  borderBottom: '1px solid #f1f5f9',
})

const headerLeftStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
})

const colTitleStyle = css({
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#475569',
})

const listStyle = css({
  padding: '12px',
  flex: '1',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
})

const emptyStyle = css({
  flex: '1',
  minH: '120px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px dashed #e2e8f0',
  borderRadius: '8px',
  fontSize: '13px',
  transition: 'border-color 0.2s, color 0.2s',
  color: '#cbd5e1',
})

interface ColumnProps {
  column: ColumnData
  tasks: Task[]
  onDelete: (id: string) => void
}

export default function Column({ column, tasks, onDelete }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const meta = COLUMN_META[column.id]

  return (
    <div
      ref={setNodeRef}
      className={columnVariants({ colId: column.id, isOver: isOver || undefined })}
    >
      <div className={headerStyle}>
        <div className={headerLeftStyle}>
          <span
            style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: meta.color,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <h2 className={colTitleStyle}>{meta.label}</h2>
        </div>
        <span
          style={{
            background: meta.color,
            color: '#fff',
            fontSize: '11px',
            fontWeight: '700',
            padding: '2px 8px',
            borderRadius: '20px',
            minWidth: '24px',
            textAlign: 'center',
          }}
        >
          {tasks.length}
        </span>
      </div>

      <div className={listStyle}>
        {tasks.map(task => (
          <Card key={task.id} task={task} onDelete={onDelete} />
        ))}
        {tasks.length === 0 && (
          <div
            className={emptyStyle}
            style={isOver ? { borderColor: meta.color, color: meta.color } : undefined}
          >
            여기에 드롭하세요
          </div>
        )}
      </div>
    </div>
  )
}
