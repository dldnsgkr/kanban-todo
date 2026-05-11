import { useState, useEffect, useRef } from 'react'
import { css } from 'styled-system/css'
import { PRIORITY_CONFIG } from './Card'
import type { Priority } from '../types'

const overlayStyle = css({
  position: 'fixed',
  inset: '0',
  background: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: '100',
  padding: '16px',
  backdropFilter: 'blur(2px)',
  animation: 'fadeIn 0.15s ease',
})

const modalStyle = css({
  background: 'white',
  borderRadius: '16px',
  padding: '24px',
  width: '100%',
  maxW: '440px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  animation: 'slideUp 0.2s ease',
})

const modalHeaderStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
})

const modalTitleStyle = css({
  fontSize: '17px',
  fontWeight: '700',
  color: '#1e293b',
})

const closeBtnStyle = css({
  background: 'none',
  border: 'none',
  fontSize: '22px',
  color: '#94a3b8',
  cursor: 'pointer',
  lineHeight: '1',
  padding: '2px 6px',
  borderRadius: '6px',
  transition: 'color 0.15s, background 0.15s',
  _hover: { color: '#1e293b', background: '#f1f5f9' },
})

const formStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
})

const fieldStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
})

const labelStyle = css({
  fontSize: '11px',
  fontWeight: '700',
  color: '#475569',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
})

const inputStyle = css({
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#1e293b',
  background: '#f8fafc',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  outline: 'none',
  _focus: {
    borderColor: '#6366f1',
    background: 'white',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.15)',
  },
})

const priorityGroupStyle = css({
  display: 'flex',
  gap: '8px',
})

const actionsStyle = css({
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end',
  paddingTop: '4px',
})

const cancelBtnStyle = css({
  padding: '9px 18px',
  border: '1.5px solid #e2e8f0',
  borderRadius: '8px',
  background: 'transparent',
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.15s',
  _hover: { background: '#f1f5f9', borderColor: '#cbd5e1' },
})

const submitBtnStyle = css({
  padding: '9px 20px',
  border: 'none',
  borderRadius: '8px',
  background: '#6366f1',
  color: 'white',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.15s',
  _hover: {
    background: '#4f46e5',
    boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
    transform: 'translateY(-1px)',
  },
  _disabled: { opacity: '0.45', cursor: 'not-allowed' },
})

// 애니메이션은 CSS keyframes로 전역 정의
const keyframes = `
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
`

interface AddTaskModalProps {
  onAdd: (title: string, priority: Priority) => void
  onClose: () => void
}

export default function AddTaskModal({ onAdd, onClose }: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed, priority)
    onClose()
  }

  return (
    <>
      <style>{keyframes}</style>
      <div className={overlayStyle} onClick={onClose}>
        <div className={modalStyle} onClick={e => e.stopPropagation()}>
          <div className={modalHeaderStyle}>
            <h2 className={modalTitleStyle}>새 할 일 추가</h2>
            <button className={closeBtnStyle} onClick={onClose} aria-label="닫기">×</button>
          </div>

          <form onSubmit={handleSubmit} className={formStyle}>
            <div className={fieldStyle}>
              <label className={labelStyle} htmlFor="task-title">제목</label>
              <input
                ref={inputRef}
                id="task-title"
                className={inputStyle}
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="할 일을 입력하세요..."
                maxLength={120}
              />
            </div>

            <div className={fieldStyle}>
              <label className={labelStyle}>우선순위</label>
              <div className={priorityGroupStyle}>
                {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(
                  ([key, cfg]) => {
                    const isSelected = priority === key
                    return (
                      <label
                        key={key}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          border: `1.5px solid ${isSelected ? cfg.borderColor : '#e2e8f0'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: isSelected ? cfg.badgeColor : '#64748b',
                          background: isSelected ? cfg.badgeBg : '#f8fafc',
                          boxShadow: isSelected
                            ? `0 0 0 2px ${cfg.borderColor}33`
                            : 'none',
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={key}
                          checked={isSelected}
                          onChange={() => setPriority(key)}
                          style={{ display: 'none' }}
                        />
                        <span
                          style={{
                            width: 7, height: 7,
                            borderRadius: '50%',
                            background: cfg.borderColor,
                            display: 'inline-block',
                          }}
                        />
                        {cfg.label}
                      </label>
                    )
                  }
                )}
              </div>
            </div>

            <div className={actionsStyle}>
              <button type="button" className={cancelBtnStyle} onClick={onClose}>
                취소
              </button>
              <button
                type="submit"
                className={submitBtnStyle}
                disabled={!title.trim()}
              >
                추가하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
