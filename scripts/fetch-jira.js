const JIRA_BASE = 'https://kindercare.atlassian.net/rest/api/3';
const EMAIL = process.env.JIRA_EMAIL;
const TOKEN = process.env.JIRA_API_TOKEN;
const auth = Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');

async function jiraGet(path) {
  const res = await fetch(`${JIRA_BASE}${path}`, {
    headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`Jira API error ${res.status}: ${path}`);
  return res.json();
}

async function main() {
  // 1. Current sprint issues (S7 = 5600)
  const sprintJql = `project = DFTP AND sprint = 5600 AND issuetype in (Story, Bug, Task, "Research Spike")`;
  const sprint = await jiraGet(`/search?jql=${encodeURIComponent(sprintJql)}&fields=summary,status,assignee,issuetype,priority,customfield_10027,labels&maxResults=100`);

  // 2. Velocity: last 3 sprints (S5=5399, S6=5400, S7=5600)
  const velocity = {};
  for (const [name, id] of [['S5',5399],['S6',5400],['S7',5600]]) {
    const doneJql = `project = DFTP AND sprint = ${id} AND status = Closed AND issuetype in (Story, Bug, Task)`;
    const done = await jiraGet(`/search?jql=${encodeURIComponent(doneJql)}&fields=customfield_10027&maxResults=100`);
    velocity[name] = { total: done.total, issues: done.issues.map(i => ({ key: i.key, points: i.fields.customfield_10027 || 0 })) };
  }

  // 3. Blocked items
  const blockedJql = `project = DFTP AND sprint = 5600 AND labels = blocked`;
  const blocked = await jiraGet(`/search?jql=${encodeURIComponent(blockedJql)}&fields=summary,assignee,status&maxResults=20`);

  // 4. Q2 Epics health
  const epicsJql = `project = DFTP AND issuetype = Epic AND sprint = 5600`;
  const epics = await jiraGet(`/search?jql=${encodeURIComponent(epicsJql)}&fields=summary,status,assignee,customfield_10027&maxResults=20`);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    sprintId: 5600,
    sprintName: 'S7',
    sprintDates: 'Mar 24 – Apr 8, 2026',
    issues: sprint.issues.map(i => ({
      key: i.key,
      summary: i.fields.summary,
      status: i.fields.status.name,
      statusCategory: i.fields.status.statusCategory.key,
      assignee: i.fields.assignee?.displayName || 'Unassigned',
      type: i.fields.issuetype.name,
      points: i.fields.customfield_10027 || 0,
      labels: i.fields.labels || []
    })),
    velocity,
    blocked: blocked.issues.map(i => ({
      key: i.key,
      summary: i.fields.summary,
      assignee: i.fields.assignee?.displayName || 'Unassigned',
      status: i.fields.status.name
    })),
    epics: epics.issues.map(i => ({
      key: i.key,
      summary: i.fields.summary,
      status: i.fields.status.name,
      assignee: i.fields.assignee?.displayName || 'Unassigned'
    }))
  };

  const fs = await import('fs');
  fs.writeFileSync('public/jira-snapshot.json', JSON.stringify(snapshot, null, 2));
  console.log(`✅ Snapshot written: ${snapshot.issues.length} issues, generated at ${snapshot.generatedAt}`);
}

main().catch(e => { console.error(e); process.exit(1); });
