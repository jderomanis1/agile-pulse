const JIRA_BASE = 'https://brightpatheducation.atlassian.net/rest/api/3';
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
  console.log(`POST /search/jql [${jql.substring(0, 60)}...] → ${res.status}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jira API error ${res.status}: ${body}`);
  }
  const data = await res.json();
  console.log(`Response keys: ${Object.keys(data).join(', ')}`);
  if (!data.issues) data.issues = [];
  data.total = data.issues.length;  // derive total from array length — new API has no total field
  console.log(`Issues returned: ${data.issues.length}, isLast: ${data.isLast}`);
  return data;
}

async function main() {
  // AUTH CHECK
  const meRes = await fetch(`${JIRA_BASE}/myself`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json'
    }
  });
  const meData = await meRes.json();
  console.log(`AUTH CHECK → status: ${meRes.status}`);
  console.log(`AUTH CHECK → accountId: ${meData.accountId || 'MISSING'}`);
  console.log(`AUTH CHECK → email: ${meData.emailAddress || 'MISSING'}`);
  console.log(`AUTH CHECK → displayName: ${meData.displayName || 'MISSING'}`);
  console.log(`AUTH CHECK → active: ${meData.active}`);
  if (!meData.accountId) {
    console.log(`AUTH FAILED — full response: ${JSON.stringify(meData).substring(0, 300)}`);
    process.exit(1);
  }

  // DIAGNOSTIC: confirm project access and find active sprints
  const diagnostic = await jiraSearch(`project = FDP ORDER BY created DESC`, 'summary,status,issuetype', 5);
  console.log(`DIAGNOSTIC — FDP project access: ${diagnostic.issues.length} issues returned`);
  if (diagnostic.issues.length > 0) {
    const s = diagnostic.issues[0];
    console.log(`Sample: ${s.key} | ${s.fields?.issuetype?.name} | ${s.fields?.status?.name}`);
  }

  // Find active sprints
  const sprintCheck = await jiraSearch(`project = FDP AND sprint in openSprints()`, 'summary', 1);
  console.log(`DIAGNOSTIC — openSprints() result: ${sprintCheck.issues.length} issues`);

  // Try by sprint name pattern
  const sprintByName = await jiraSearch(`project = FDP AND sprint = "Sprint 1 Q2 2026"`, 'summary', 1);
  console.log(`DIAGNOSTIC — sprint = "Sprint 1 Q2 2026" result: ${sprintByName.issues.length} issues`);

  // 1. Current sprint issues — openSprints() catches the active sprint regardless of ID
  const sprint = await jiraSearch(
    `project = FDP AND sprint in openSprints() AND issuetype in (Story, Bug, Task)`,
    'summary,status,assignee,issuetype,priority,customfield_10038,labels'
  );

  // 2. Velocity: last 3 sprints (explicit IDs — openSprints() won't match historical)
  const velocity = {};
  for (const [name, id] of [['Sprint 3 Q2 2026', 68], ['Sprint 4 Q2 2026', 69], ['Sprint 5 Q2 2026', 70]]) {
    try {
      const done = await jiraSearch(
        `project = FDP AND sprint = ${id} AND statusCategory = Done AND issuetype in (Story, Bug)`,
        'customfield_10038'
      );
      console.log(`Velocity ${name} (ID ${id}): ${done.issues.length} done issues`);
      velocity[name] = { total: done.issues.length, issues: done.issues.map(i => ({ key: i.key, points: i.fields.customfield_10038 || 0 })) };
    } catch (e) {
      console.log(`Velocity ${name} ERROR: ${e.message}`);
      velocity[name] = { total: 0, issues: [] };
    }
  }

  // 3. Blocked items
  const blocked = await jiraSearch(
    `project = FDP AND sprint in openSprints() AND labels = blocked`,
    'summary,assignee,status',
    20
  );

  // 4. Epics health
  const epics = await jiraSearch(
    `project = FDP AND issuetype = Epic AND sprint in openSprints()`,
    'summary,status,assignee,customfield_10038',
    20
  );

  const snapshot = {
    generatedAt: new Date().toISOString(),
    sprintId: 35,
    sprintName: 'Sprint 1 Q2 2026',
    sprintDates: 'Mar 24 – Apr 8, 2026',
    issues: sprint.issues.map(i => ({
      key: i.key,
      summary: i.fields.summary,
      status: i.fields.status.name,
      statusCategory: i.fields.status.statusCategory.key,
      assignee: i.fields.assignee?.displayName || 'Unassigned',
      type: i.fields.issuetype.name,
      points: i.fields.customfield_10038 || 0,
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
  console.log(`Velocity Sprint 3: ${snapshot.velocity['Sprint 3 Q2 2026']?.total}, Sprint 4: ${snapshot.velocity['Sprint 4 Q2 2026']?.total}, Sprint 5: ${snapshot.velocity['Sprint 5 Q2 2026']?.total}`);
  console.log(`Blocked: ${snapshot.blocked.length}, Epics: ${snapshot.epics.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
