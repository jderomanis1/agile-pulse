import { useState, useEffect } from 'react'
import COLORS from '../design-system'

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)   return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function truncate(str, max = 60) {
  return str.length <= max ? str : str.slice(0, max - 1) + '…'
}

export default function HistoryPanel({ history, onRerun }) {
  const [open, setOpen] = useState(window.innerWidth >= 768)
  const [hoveredIdx, setHoveredIdx] = useState(null)

  // Sync default open state if window resizes across breakpoint
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setOpen(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Last 3 unique questions, most recent first
  const recent = [...history].reverse().slice(0, 3)

  if (recent.length === 0) return null

  return (
    <div style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '20px',
    }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderBottom: open ? `1px solid ${COLORS.border}` : 'none',
        }}
      >
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          fontWeight: 600,
          color: COLORS.textMuted,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>Recent Questions</span>
        <svg
          width="14" height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={COLORS.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Rows */}
      {open && (
        <div>
          {recent.map((item, i) => (
            <button
              key={i}
              onClick={() => onRerun(item.q)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '11px 18px',
                background: hoveredIdx === i ? `${COLORS.primary}0D` : 'transparent',
                border: 'none',
                borderBottom: i < recent.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
            >
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: hoveredIdx === i ? COLORS.text : COLORS.textMuted,
                transition: 'color 0.15s',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
              }}>
                {truncate(item.q)}
              </span>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px',
                color: COLORS.border,
                flexShrink: 0,
                transition: 'color 0.15s',
              }}>
                {timeAgo(item.ts)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
