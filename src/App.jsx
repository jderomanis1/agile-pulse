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
      className="chip-btn"
      onClick={() => onClick(label)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Ask: ${label}`}
      style={{
        padding: '10px 12px',
        borderRadius: '9999px',
        border: `1px solid ${COLORS.primary}`,
        background: hovered ? COLORS.primary : 'transparent',
        color: hovered ? COLORS.bg : COLORS.primary,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        width: '100%',
        textAlign: 'center',
        lineHeight: 1.3,
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
  const [snapshot, setSnapshot] = useState(null)
  const scrollRef = useRef(null)

  // Load Jira snapshot on mount
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'jira-snapshot.json')
      .then(r => r.json())
      .then(data => setSnapshot(data))
      .catch(() => setSnapshot({ generatedAt: 'error', issues: [], velocity: {}, blocked: [], epics: [] }))
  }, [])

  // Dynamic page title
  useEffect(() => {
    document.title = loading
      ? 'Agile Pulse | Thinking...'
      : 'Agile Pulse | BIR Intelligence'
  }, [loading])

  // Auto-scroll to bottom on new answers
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
      const a = await askAgilePulse(q, snapshot)
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
  const isDisabled = !question.trim() || loading

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      color: COLORS.text,
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Header ── */}
      <header
        role="banner"
        aria-label="Agile Pulse"
        className="site-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: `${COLORS.bg}F0`,
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div className="site-header-inner">
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
            flexShrink: 0,
          }}>BIR Intelligence</span>
        </div>

        {/* ── Snapshot status bar ── */}
        {snapshot !== null && (() => {
          const isPending = snapshot.generatedAt === 'pending'
          const isError   = snapshot.generatedAt === 'error'
          const dotColor  = isError ? COLORS.statusRed : isPending ? COLORS.statusYellow : COLORS.statusGreen
          const label     = isError
            ? 'Snapshot unavailable'
            : isPending
            ? 'Data refresh pending — trigger workflow'
            : `Data as of ${new Date(snapshot.generatedAt).toLocaleString()}`
          return (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '5px',
              paddingTop: '4px',
            }}>
              <span aria-hidden="true" style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: dotColor,
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '10px',
                color: COLORS.textMuted,
                letterSpacing: '0.02em',
              }}>{label}</span>
            </div>
          )
        })()}
      </header>

      {/* ── Main scrollable area ── */}
      <main
        ref={scrollRef}
        id="main-content"
        role="main"
        aria-label="Agile Pulse conversation"
        className="main-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '104px',
          paddingBottom: '185px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '760px' }}>

          {/* ── Hero ── */}
          {showHero && (
            <section
              aria-label="Welcome"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                paddingTop: '64px',
                paddingBottom: '48px',
              }}
            >
              <h1 style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 'clamp(24px, 5vw, 42px)',
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
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '2px',
                    background: `linear-gradient(90deg, transparent, ${COLORS.primary}, transparent)`,
                    borderRadius: '1px',
                    animation: 'pulseWidth 3s ease-in-out infinite',
                  }}
                />
              </h1>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: COLORS.textMuted,
                margin: '20px 0 36px',
                letterSpacing: '0.02em',
              }}>
                Powered by live Jira data · KinderCare DFTP/BIR
              </p>

              {/* Responsive chip grid */}
              <div
                className="chip-grid"
                role="list"
                aria-label="Quick questions"
              >
                {CHIPS.map(chip => (
                  <div key={chip} role="listitem">
                    <ChipButton label={chip} onClick={handleChipClick} />
                  </div>
                ))}
              </div>
            </section>
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

          {/* ── History panel ── */}
          {history.length > 0 && !loading && (
            <HistoryPanel
              history={history}
              onRerun={q => { setQuestion(q); handleSubmit(q) }}
            />
          )}

          {/* ── Footer ── */}
          <footer
            role="contentinfo"
            style={{
              textAlign: 'center',
              paddingTop: '32px',
              paddingBottom: '8px',
            }}
          >
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '11px',
              color: COLORS.border,
              margin: 0,
              letterSpacing: '0.04em',
            }}>
              Agile Pulse · KinderCare DFTP/BIR · Powered by Claude
            </p>
          </footer>

        </div>
      </main>

      {/* ── Fixed input bar ── */}
      <div
        role="search"
        aria-label="Ask a question"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: `${COLORS.bg}F5`,
          backdropFilter: 'blur(16px)',
          borderTop: `1px solid ${COLORS.border}`,
          padding: '14px 24px 20px',
        }}
      >
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          {/* Visually hidden label for screen readers */}
          <label htmlFor="ask-input" className="sr-only">
            Ask anything about BIR team
          </label>

          <div className="input-row">
            <textarea
              id="ask-input"
              className="ask-input"
              rows={1}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about BIR..."
              aria-label="Question input"
              aria-describedby="input-hint"
              disabled={loading}
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
                lineHeight: 1.5,
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1,
              }}
            />
            <button
              className="submit-btn"
              onClick={() => handleSubmit()}
              disabled={isDisabled}
              onMouseEnter={() => setSubmitHovered(true)}
              onMouseLeave={() => setSubmitHovered(false)}
              aria-label={loading ? 'Waiting for response' : 'Submit question to Agile Pulse'}
              aria-busy={loading}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                background: isDisabled
                  ? COLORS.border
                  : submitHovered ? COLORS.primaryDim : COLORS.primary,
                color: isDisabled ? COLORS.textMuted : COLORS.bg,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                fontWeight: 600,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Thinking…' : 'Ask Agile Pulse →'}
            </button>
          </div>

          <p
            id="input-hint"
            className="sr-only"
          >
            Press Enter to submit, Shift+Enter for a new line
          </p>
        </div>
      </div>

    </div>
  )
}
