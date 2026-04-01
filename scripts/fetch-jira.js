const JIRA_BASE = 'https://kindercare.atlassian.net/rest/api/3';
const EMAIL = process.env.JIRA_EMAIL;
const TOKEN = process.env.JIRA_API_TOKEN;
const auth = Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');

async function jiraSearch(jql, fields, maxResults = 100) {
  const res = await fetch(`${JIRA_BASE}/search/jql`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ jql, fields: fields.split(','), maxResults })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jira API error ${res.status}: ${body}`);
  }
  return res.json();
}

async function main() {
  // 1. Current sprint issues — openSprints() catches the active sprint regardless of ID
  const sprint = await jiraSearch(
    `project = DFTP AND sprint in openSprints() AND issuetype in (Story, Bug, Task, "Research Spike")`,
    'summary,status,assignee,issuetype,priority,customfield_10027,labels'
  );

  // 2. Velocity: last 3 sprints (explicit IDs — openSprints() won't match historical)
  const velocity = {};
  for (const [name, id] of [['S5',5399],['S6',5400],['S7',5600]]) {
    const done = await jiraSearch(
      `project = DFTP AND sprint = ${id} AND status = Closed AND issuetype in (Story, Bug, Task)`,
      'customfield_10027'
    );
    velocity[name] = { total: done.total, issues: done.issues.map(i => ({ key: i.key, points: i.fields.customfield_10027 || 0 })) };
  }

  // 3. Blocked items
  const blocked = await jiraSearch(
    `project = DFTP AND sprint in openSprints() AND labels = blocked`,
    'summary,assignee,status',
    20
  );

  // 4. Q2 Epics health
  const epics = await jiraSearch(
    `project = DFTP AND issuetype = Epic AND sprint in openSprints()`,
    'summary,status,assignee,customfield_10027',
    20
  );

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
  console.log(`Sprint issues: ${snapshot.issues.length}`);
  console.log(`Velocity S5: ${snapshot.velocity.S5?.total}, S6: ${snapshot.velocity.S6?.total}, S7: ${snapshot.velocity.S7?.total}`);
  console.log(`Blocked: ${snapshot.blocked.length}, Epics: ${snapshot.epics.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
