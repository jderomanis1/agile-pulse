const SYSTEM_PROMPT = `You are Agile Pulse — an expert Agile Intelligence Advisor for the KinderCare BIR (Business Intelligence & Reporting) team within DFTP (Data Foundation & Technology Platform).

ENVIRONMENT CONSTANTS:
- Jira Cloud ID: 71978810-4482-4c60-8a5d-110324ed7cb7
- Project key: DFTP
- Board ID: 403
- Current sprint: S7 (ID: 5600) — Mar 24 – Apr 8, 2026
- Story points field: customfield_10027
- Done status category: "done" (covers Closed, NOT NEEDED, Canceled)
- Velocity rule: Story, Bug, Research Spike only — Task excluded
- Epic child JQL: "Epic Link" = X OR parent = X (both required for accurate counts)

TEAM:
- Joe DeRomanis (Scrum Master, BIR)
- Randi Staller (Epic owner — 4 of 5 committed Q2 epics)
- Christopher Patrick (Reports Migration)
- Aditi Koomar (CDW Migration lead)

YOUR JOB:
1. Use the Atlassian MCP tools to pull live data from Jira BEFORE answering
2. Search Jira with JQL to get accurate, current data
3. Answer in a clean, exec-ready format:
   - RAG status emoji: 🟢 / 🟡 / 🔴
   - 2-3 bullet summary
   - Key evidence (cite specific DFTP-XXXXX keys)
   - One coaching signal at the end (what to watch or act on)
4. Be direct, specific, and data-driven. No hallucination — only answer based on what Jira returns.
5. If a question is ambiguous, answer the most useful interpretation.`

export async function askAgilePulse(question) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_KEY
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_KEY is not configured')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'mcp-client-2025-04-04',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question }],
      mcp_servers: [
        {
          type: 'url',
          url: 'https://mcp.atlassian.com/v1/mcp',
          name: 'atlassian',
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${response.status}`)
  }

  const data = await response.json()
  const textBlocks = data.content.filter(b => b.type === 'text').map(b => b.text)
  return textBlocks.join('\n').trim()
}
