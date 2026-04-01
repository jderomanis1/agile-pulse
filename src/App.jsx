import { useState, useRef, useEffect } from 'react'
import COLORS from './design-system'
import { askAgilePulse } from './api/claudeApi'
import ResponsePane from './components/ResponsePane'
import HistoryPanel from './components/HistoryPanel'

const CHIPS = [
  '🏃 Sprint status right now',
  '⚡ Current velocity',
  '🚧 Active blockers',
  '📊 Epic health overview',
  '👥 Who owns what this sprint',
  "🎯 What's due this week",
]

function ChipButton({ label, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={() => onClick(label)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 16px',
        borderRadius: '9999px',
        border: `1px solid ${COLORS.primary}`,
        background: hovered ? COLORS.primary : 'transparent',
        color: hovered ? COLORS.bg : COLORS.primary,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

export default function App() {
  const [question, setQuestion] = useState('')
  const [pendingQuestion, setPendingQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [submitHovered, setSubmitHovered] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, loading])

  function handleChipClick(label) {
    setQuestion(label)
    handleSubmit(label)
  }

  async function handleSubmit(overrideQuestion) {
    const q = (overrideQuestion ?? question).trim()
    if (!q || loading) return
    setPendingQuestion(q)
    setLoading(true)
    setQuestion('')
    try {
      const a = await askAgilePulse(q)
      setHistory(prev => [...prev, { q, a, ts: Date.now() }])
    } catch (err) {
      const a = `⚠️ Unable to reach Jira right now. Check your connection and try again.\n\n${err.message}`
      setHistory(prev => [...prev, { q, a, ts: Date.now() }])
    } finally {
      setLoading(false)
      setPendingQuestion('')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const showHero = history.length === 0 && !loading

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      color: COLORS.text,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Header ── */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px',
        background: `${COLORS.bg}F0`,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '16px',
          fontWeight: 600,
          color: COLORS.primary,
          letterSpacing: '0.04em',
        }}>⚡ AGILE PULSE</span>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          fontWeight: 500,
          color: '#fff',
          background: COLORS.klc,
          borderRadius: '4px',
          padding: '3px 10px',
          letterSpacing: '0.06em',
        }}>BIR Intelligence</span>
      </header>

      {/* ── Main scrollable area ── */}
      <main
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '80px',
          paddingBottom: '140px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '760px' }}>
          {/* ── Hero ── */}
          {showHero && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              paddingTop: '80px',
              paddingBottom: '48px',
            }}>
              <h1 style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 'clamp(28px, 5vw, 42px)',
                fontWeight: 700,
                color: COLORS.text,
                margin: '0 0 8px',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                position: 'relative',
                display: 'inline-block',
              }}>
                What would you like to know
                <br />about the team?
                <span style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60%',
                  height: '2px',
                  background: `linear-gradient(90deg, transparent, ${COLORS.primary}, transparent)`,
                  borderRadius: '1px',
                  animation: 'pulseWidth 3s ease-in-out infinite',
                }} />
              </h1>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: COLORS.textMuted,
                margin: '20px 0 40px',
                letterSpacing: '0.02em',
              }}>
                Powered by live Jira data · KinderCare DFTP/BIR
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                justifyContent: 'center',
                maxWidth: '680px',
              }}>
                {CHIPS.map(chip => (
                  <ChipButton key={chip} label={chip} onClick={handleChipClick} />
                ))}
              </div>
            </div>
          )}

          {/* ── Conversation history ── */}
          {history.map((item, i) => (
            <ResponsePane
              key={i}
              question={item.q}
              answer={item.a}
              loading={false}
            />
          ))}

          {/* ── In-flight loading pane ── */}
          {loading && (
            <ResponsePane
              question={pendingQuestion}
              answer=""
              loading={true}
            />
          )}

          {/* ── History panel (recent questions) ── */}
          {history.length > 0 && !loading && (
            <HistoryPanel
              history={history}
              onRerun={q => { setQuestion(q); handleSubmit(q) }}
            />
          )}
        </div>
      </main>

      {/* ── Fixed input bar ── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: `${COLORS.bg}F5`,
        backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${COLORS.border}`,
        padding: '16px 24px 24px',
      }}>
        <div style={{
          maxWidth: '760px',
          margin: '0 auto',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end',
        }}>
          <textarea
            rows={1}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about BIR..."
            style={{
              flex: 1,
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '10px',
              padding: '12px 16px',
              color: COLORS.text,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.5,
              transition: 'border-color 0.15s',
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = COLORS.primary }}
            onBlur={e => { e.target.style.borderColor = COLORS.border }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!question.trim() || loading}
            onMouseEnter={() => setSubmitHovered(true)}
            onMouseLeave={() => setSubmitHovered(false)}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              background: (!question.trim() || loading)
                ? COLORS.border
                : submitHovered ? COLORS.primaryDim : COLORS.primary,
              color: (!question.trim() || loading) ? COLORS.textMuted : COLORS.bg,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px',
              fontWeight: 600,
              cursor: (!question.trim() || loading) ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {loading ? 'Thinking…' : 'Ask Agile Pulse →'}
          </button>
        </div>
      </div>
    </div>
  )
}
