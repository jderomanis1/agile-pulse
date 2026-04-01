import { useState, useRef, useEffect } from 'react'
import COLORS from './design-system'
import { askAgilePulse } from './api/claudeApi'

const CHIPS = [
  '🏃 Sprint status right now',
  '⚡ Current velocity',
  '🚧 Active blockers',
  '📊 Epic health overview',
  '👥 Who owns what this sprint',
  '🎯 What\'s due this week',
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

function HistoryItem({ item }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '10px',
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          color: COLORS.primary,
          background: `${COLORS.primary}1A`,
          border: `1px solid ${COLORS.primary}40`,
          borderRadius: '4px',
          padding: '2px 8px',
          flexShrink: 0,
          marginTop: '2px',
        }}>YOU</span>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          color: COLORS.text,
          margin: 0,
          lineHeight: 1.5,
        }}>{item.q}</p>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          color: COLORS.klc,
          background: `${COLORS.klc}1A`,
          border: `1px solid ${COLORS.klc}40`,
          borderRadius: '4px',
          padding: '2px 8px',
          flexShrink: 0,
          marginTop: '2px',
          whiteSpace: 'nowrap',
        }}>PULSE</span>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          color: COLORS.text,
          margin: 0,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}>{item.a}</p>
      </div>
    </div>
  )
}

export default function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [submitHovered, setSubmitHovered] = useState(false)
  const answerRef = useRef(null)

  useEffect(() => {
    if (history.length > 0 && answerRef.current) {
      answerRef.current.scrollTop = answerRef.current.scrollHeight
    }
  }, [history])

  function handleChipClick(label) {
    setQuestion(label)
    handleSubmit(label)
  }

  async function handleSubmit(overrideQuestion) {
    const q = (overrideQuestion ?? question).trim()
    if (!q || loading) return
    setLoading(true)
    setAnswer('')
    setQuestion('')
    try {
      const a = await askAgilePulse(q)
      setHistory(prev => [...prev, { q, a }])
    } catch (err) {
      const a = `⚠️ Unable to reach Jira right now. Check your connection and try again.\n\n${err.message}`
      setHistory(prev => [...prev, { q, a }])
    } finally {
      setLoading(false)
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
      {/* Header */}
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

      {/* Main */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '80px',
        paddingBottom: '140px',
        paddingLeft: '24px',
        paddingRight: '24px',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {showHero ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            paddingTop: '80px',
            paddingBottom: '48px',
            width: '100%',
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
        ) : (
          <div
            ref={answerRef}
            style={{
              flex: 1,
              width: '100%',
              overflowY: 'auto',
              paddingTop: '24px',
              paddingBottom: '16px',
            }}
          >
            {history.map((item, i) => (
              <HistoryItem key={i} item={item} />
            ))}
            {loading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '11px',
                  color: COLORS.klc,
                  background: `${COLORS.klc}1A`,
                  border: `1px solid ${COLORS.klc}40`,
                  borderRadius: '4px',
                  padding: '2px 8px',
                }}>PULSE</span>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '13px',
                  color: COLORS.textMuted,
                  animation: 'blink 1.2s step-start infinite',
                }}>Querying Jira...</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Input bar — fixed at bottom */}
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
          maxWidth: '800px',
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
            onClick={handleSubmit}
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
            {loading ? 'Thinking...' : 'Ask Agile Pulse →'}
          </button>
        </div>
        {history.length === 0 && !showHero && (
          <p style={{
            textAlign: 'center',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: COLORS.textMuted,
            margin: '8px 0 0',
          }}>Ask a question to see live Jira data</p>
        )}
      </div>
    </div>
  )
}
