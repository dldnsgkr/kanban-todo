import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { css, cva } from 'styled-system/css'
import type { Task, Priority } from '../types'

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; borderColor: string; badgeBg: string; badgeColor: string }
> = {
  high:   { label: '높음', borderColor: '#ef4444', badgeBg: '#fee2e2', badgeColor: '#dc2626' },
  medium: { label: '중간', borderColor: '#f59e0b', badgeBg: '#fef3c7', badgeColor: '#d97706' },
  low:    { label: '낮음', borderColor: '#22c55e', badgeBg: '#dcfce7', badgeColor: '#16a34a' },
}

const cardVariants = cva({
  base: {
    bg: 'white',
    borderRadius: '8px',
    borderLeft: '4px solid',
    padding: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    transition: 'box-shadow 0.15s, transform 0.15s',
    userSelect: 'none',
    _hover: {
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      transform: 'translateY(-1px)',
    },
  },
  variants: {
    priority: {
      high:   { borderLeftColor: '#ef4444' },
      medium: { borderLeftColor: '#f59e0b' },
      low:    { borderLeftColor: '#22c55e' },
    },
    isOverlay: {
      true: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        transform: 'rotate(2deg) scale(1.02)',
        _hover: { transform: 'rotate(2deg) scale(1.02)' },
      },
    },
  },
})

const topRowStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '8px',
})

const badgeStyle = css({
  fontSize: '11px',
  fontWeight: '700',
  padding: '2px 8px',
  borderRadius: '20px',
  letterSpacing: '0.03em',
})

const actionsBtnGroupStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
})

const iconBtnStyle = css({
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '1',
  cursor: 'pointer',
  padding: '3px 5px',
  borderRadius: '4px',
  transition: 'color 0.15s, background 0.15s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

const titleStyle = css({
  fontSize: '14px',
  fontWeight: '500',
  color: '#1e293b',
  lineHeight: '1.4',
  wordBreak: 'break-word',
})

const metaRowStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '8px',
  flexWrap: 'wrap',
})

const dateStyle = css({
  fontSize: '11px',
  color: '#94a3b8',
})

function getDueDateInfo(dueDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const formatted = due.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })

  if (diffDays < 0) return { label: `${formatted} 마감`, color: '#ef4444', bg: '#fee2e2' }
  if (diffDays === 0) return { label: '오늘 마감', color: '#ef4444', bg: '#fee2e2' }
  if (diffDays <= 2) return { label: `${formatted} 마감`, color: '#d97706', bg: '#fef3c7' }
  return { label: `${formatted} 마감`, color: '#64748b', bg: '#f1f5f9' }
}

interface CardBodyProps {
  task: Task
  onDelete?: (id: string) => void
  onEdit?: (task: Task) => void
  isOverlay?: boolean
}

function CardBody({ task, onDelete, onEdit, isOverlay = false }: CardBodyProps) {
  const p = PRIORITY_CONFIG[task.priority]
  const createdDate = new Date(task.createdAt).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
  const dueInfo = task.dueDate ? getDueDateInfo(task.dueDate) : null

  return (
    <div className={cardVariants({ priority: task.priority, isOverlay: isOverlay || undefined })}>
      <div className={topRowStyle}>
        <span className={badgeStyle} style={{ background: p.badgeBg, color: p.badgeColor }}>
          {p.label}
        </span>
        {!isOverlay && (
          <div className={actionsBtnGroupStyle}>
            {onEdit && (
              <button
                className={iconBtnStyle}
                aria-label="수정"
                style={{ color: '#94a3b8' }}
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onEdit(task) }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#6366f1'
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#ede9fe'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                className={iconBtnStyle}
                aria-label="삭제"
                style={{ fontSize: '18px', color: '#94a3b8' }}
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onDelete(task.id) }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#ef4444'
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
                }}
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      <p className={titleStyle}>{task.title}</p>

      <div className={metaRowStyle}>
        <span className={dateStyle}>{createdDate} 생성</span>
        {dueInfo && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '1px 7px',
              borderRadius: '20px',
              background: dueInfo.bg,
              color: dueInfo.color,
            }}
          >
            {dueInfo.label}
          </span>
        )}
      </div>
    </div>
  )
}

export function CardOverlay({ task }: { task: Task }) {
  return <CardBody task={task} isOverlay />
}

interface CardProps {
  task: Task
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}

export default function Card({ task, onDelete, onEdit }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <CardBody task={task} onDelete={onDelete} onEdit={onEdit} />
    </div>
  )
}
