import { useEffect, useRef } from 'react'
import COLORS from '../design-system'

// ── Inline parser: **bold**, *italic*, DFTP-\d+ ──────────────────────────────
function parseInline(text) {
  const segments = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|DFTP-\d+)/g
  let last = 0
  let m
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: 'text', val: text.slice(last, m.index) })
    const raw = m[0]
    if (raw.startsWith('**'))      segments.push({ type: 'bold',   val: raw.slice(2, -2) })
    else if (raw.startsWith('*')) segments.push({ type: 'italic', val: raw.slice(1, -1) })
    else                           segments.push({ type: 'jira',   val: raw })
    last = m.index + raw.length
  }
  if (last < text.length) segments.push({ type: 'text', val: text.slice(last) })
  return segments
}

function InlineContent({ text }) {
  return (
    <>
      {parseInline(text).map((seg, i) => {
        if (seg.type === 'bold') {
          return <strong key={i} style={{ color: COLORS.text, fontWeight: 700 }}>{seg.val}</strong>
        }
        if (seg.type === 'italic') {
          return <em key={i} style={{ color: COLORS.textMuted }}>{seg.val}</em>
        }
        if (seg.type === 'jira') {
          return (
            <span key={i} style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '12px',
              color: COLORS.primary,
              background: `${COLORS.primary}18`,
              border: `1px solid ${COLORS.primary}50`,
              borderRadius: '4px',
              padding: '1px 6px',
              whiteSpace: 'nowrap',
              marginInline: '2px',
            }}>{seg.val}</span>
          )
        }
        return <span key={i}>{seg.val}</span>
      })}
    </>
  )
}

// ── RAG config ────────────────────────────────────────────────────────────────
const RAG = {
  '🟢': { color: COLORS.statusGreen,  bg: `${COLORS.statusGreen}18`,  border: `${COLORS.statusGreen}45`  },
  '🟡': { color: COLORS.statusYellow, bg: `${COLORS.statusYellow}18`, border: `${COLORS.statusYellow}45` },
  '🔴': { color: COLORS.statusRed,    bg: `${COLORS.statusRed}18`,    border: `${COLORS.statusRed}45`    },
}

// ── Block parser ──────────────────────────────────────────────────────────────
function parseBlocks(answer) {
  const blocks = []
  const lines = answer.split('\n')
  for (const line of lines) {
    const t = line.trim()
    if (!t) { blocks.push({ type: 'spacer' }); continue }

    const ragMatch = t.match(/^(🟢|🟡|🔴)\s*(.*)/)
    if (ragMatch) { blocks.push({ type: 'rag', emoji: ragMatch[1], text: ragMatch[2] }); continue }

    if (/^[•\-\*] /.test(t)) { blocks.push({ type: 'bullet', text: t.slice(2) }); continue }

    // Numbered list
    if (/^\d+\.\s/.test(t)) { blocks.push({ type: 'bullet', text: t.replace(/^\d+\.\s/, '') }); continue }

    blocks.push({ type: 'paragraph', text: t })
  }
  return blocks
}

// ── Block renderer ─────────────────────────────────────────────────────────────
function AnswerBlock({ block }) {
  if (block.type === 'spacer') return <div style={{ height: '8px' }} />

  if (block.type === 'rag') {
    const cfg = RAG[block.emoji] ?? RAG['🟡']
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '22px', lineHeight: 1 }}>{block.emoji}</span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          fontWeight: 600,
          color: cfg.color,
          lineHeight: 1.4,
        }}>
          <InlineContent text={block.text} />
        </span>
      </div>
    )
  }

  if (block.type === 'bullet') {
    return (
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '6px',
        paddingLeft: '4px',
      }}>
        <span style={{
          color: COLORS.primary,
          fontWeight: 700,
          fontSize: '16px',
          lineHeight: '1.55',
          flexShrink: 0,
        }}>·</span>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          color: COLORS.text,
          margin: 0,
          lineHeight: 1.6,
        }}>
          <InlineContent text={block.text} />
        </p>
      </div>
    )
  }

  // paragraph
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '15px',
      color: COLORS.text,
      margin: '0 0 8px',
      lineHeight: 1.65,
    }}>
      <InlineContent text={block.text} />
    </p>
  )
}

// ── Loading shimmer ────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          color: COLORS.klc,
          background: `${COLORS.klc}1A`,
          border: `1px solid ${COLORS.klc}40`,
          borderRadius: '4px',
          padding: '2px 8px',
          flexShrink: 0,
        }}>PULSE</span>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '13px',
          color: COLORS.textMuted,
          animation: 'blink 1.2s step-start infinite',
        }}>Querying Jira…</span>
      </div>
      {[80, 55, 70].map((w, i) => (
        <div key={i} style={{
          height: '12px',
          width: `${w}%`,
          borderRadius: '6px',
          background: `${COLORS.border}`,
          animation: `shimmer 1.6s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      gap: '12px',
      opacity: 0.5,
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px',
        color: COLORS.textMuted,
        margin: 0,
        textAlign: 'center',
      }}>Ask a question to see live team data</p>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ResponsePane({ answer, question, loading }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.animation = 'none'
      void ref.current.offsetHeight // reflow
      ref.current.style.animation = 'fadeSlideUp 0.3s ease forwards'
    }
  }, [answer])

  if (!answer && !loading) return <EmptyState />

  return (
    <div
      ref={ref}
      className="response-pane"
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '12px',
        marginBottom: '20px',
        animation: 'fadeSlideUp 0.3s ease forwards',
      }}
    >
      {question && (
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          color: COLORS.textMuted,
          margin: '0 0 14px',
          letterSpacing: '0.03em',
          borderBottom: `1px solid ${COLORS.border}`,
          paddingBottom: '12px',
        }}>
          <span style={{ color: COLORS.primary, marginRight: '6px' }}>YOU</span>
          {question}
        </p>
      )}

      {loading
        ? <LoadingState />
        : parseBlocks(answer).map((block, i) => <AnswerBlock key={i} block={block} />)
      }
    </div>
  )
}
