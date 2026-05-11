import { useDraggable } from '@dnd-kit/core'
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

// cva: 우선순위 variant + overlay 상태를 원자적 클래스로 정의
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

// 모듈 레벨에서 한 번만 계산되는 스타일
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

const deleteBtnStyle = css({
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  fontSize: '18px',
  lineHeight: '1',
  cursor: 'pointer',
  padding: '0 2px',
  borderRadius: '4px',
  transition: 'color 0.15s, background 0.15s',
  _hover: { color: '#ef4444', background: '#fee2e2' },
})

const titleStyle = css({
  fontSize: '14px',
  fontWeight: '500',
  color: '#1e293b',
  lineHeight: '1.4',
  wordBreak: 'break-word',
})

const dateStyle = css({
  display: 'block',
  marginTop: '6px',
  fontSize: '11px',
  color: '#94a3b8',
})

// ─── 순수 표시 컴포넌트 ───────────────────────────────────
interface CardBodyProps {
  task: Task
  onDelete?: (id: string) => void
  isOverlay?: boolean
}

function CardBody({ task, onDelete, isOverlay = false }: CardBodyProps) {
  const p = PRIORITY_CONFIG[task.priority]
  const date = new Date(task.createdAt).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className={cardVariants({ priority: task.priority, isOverlay: isOverlay || undefined })}>
      <div className={topRowStyle}>
        <span className={badgeStyle} style={{ background: p.badgeBg, color: p.badgeColor }}>
          {p.label}
        </span>
        {!isOverlay && onDelete && (
          <button
            className={deleteBtnStyle}
            aria-label="삭제"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(task.id) }}
          >
            ×
          </button>
        )}
      </div>
      <p className={titleStyle}>{task.title}</p>
      <span className={dateStyle}>{date}</span>
    </div>
  )
}

// ─── 드래그 오버레이 전용 ─────────────────────────────────
export function CardOverlay({ task }: { task: Task }) {
  return <CardBody task={task} isOverlay />
}

// ─── 실제 드래그 가능한 카드 ──────────────────────────────
interface CardProps {
  task: Task
  onDelete: (id: string) => void
}

export default function Card({ task, onDelete }: CardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.35 : 1, cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <CardBody task={task} onDelete={onDelete} />
    </div>
  )
}
