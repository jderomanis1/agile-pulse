export async function askAgilePulse(question, snapshot) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_KEY;
  if (!apiKey) throw new Error('VITE_ANTHROPIC_KEY is not set');

  const dataAge = snapshot?.generatedAt && snapshot.generatedAt !== 'pending'
    ? `Data refreshed: ${new Date(snapshot.generatedAt).toLocaleString()}`
    : 'Data: pending first refresh';

  const SYSTEM_PROMPT = `You are Agile Pulse — an expert Agile Intelligence Advisor for the BrightPath FDP (Foundation Data Platform) team.

${dataAge}
Sprint: ${snapshot?.sprintName || 'Sprint 1 Q2 2026'} (${snapshot?.sprintDates || 'Mar 24 – Apr 8, 2026'})

LIVE JIRA DATA:
${JSON.stringify(snapshot, null, 2)}

YOUR JOB:
1. Answer based ONLY on the Jira data above — no hallucination
2. Format your answer as:
   - RAG status line: start with 🟢 / 🟡 / 🔴 followed by one-sentence verdict
   - 2-4 bullet points with specific evidence (cite FDP-XXXXX keys)
   - End with: **Coach's Signal:** one sentence on what to watch or act on
3. Be direct and exec-ready. No filler.
4. If the data is empty or pending, say so honestly and tell the user to trigger a manual refresh.

TEAM CONTEXT:
- Joe DeRomanis: Scrum Master / Project Lead, FDP
- john: Sr. Data Engineer — owns DW Consolidation (FDP-3), HRIS Integration (FDP-4)
- luis: Reports Migration Lead — owns Dashboard Modernization (FDP-2), Financial Analytics (FDP-5)
- mary: QA/DevOps Lead — production support, DW validation
- sarah: Developer — HRIS pipelines, employee dimension work
- mike: Developer — Teradata migration, dashboard bugs
- henry: Developer — production support, data freshness issues
- babyjazz: Developer — dashboard scheduling, Analytics Engine bugs
- marley: Chief Morale Officer — meeting attendance, treat-based motivation protocols`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Claude API error');
  }

  const data = await response.json();
  return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
}
