const app = document.getElementById('app');

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return res.json();
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stageOrder(stage) {
  const order = [
    'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F', 'Group G', 'Group H',
    'Round of 16', 'Quarter-final', 'Semi-final', 'Third place', 'Final'
  ];
  const idx = order.indexOf(stage);
  return idx === -1 ? order.length : idx;
}

async function renderHome() {
  app.innerHTML = '<div class="loading">Loading editions…</div>';
  const editions = await fetchJSON('/api/editions');
  if (!editions.length) {
    app.innerHTML = '<div class="empty">No editions in the database yet.</div>';
    return;
  }
  app.innerHTML = `
    <h1>World Cup Editions</h1>
    <div class="edition-grid">
      ${editions.map(e => `
        <a class="card" href="#/edition/${e.year}">
          <div class="year">${e.year}</div>
          <div class="host">${flagImgHtml(e.host)} Host: ${escapeHtml(e.host)}</div>
          <div class="winner-line"><span class="label">Winner:</span> ${flagImgHtml(e.winner)} ${escapeHtml(e.winner)}</div>
          <div class="winner-line"><span class="label">Runner-up:</span> ${flagImgHtml(e.runner_up)} ${escapeHtml(e.runner_up)}</div>
        </a>
      `).join('')}
    </div>
  `;
}

function awardCardHtml(a, wcWinner) {
  const wonWc = a.nationality && wcWinner && a.nationality === wcWinner;
  return `
    <div class="award-card">
      <div class="award-name">${escapeHtml(a.award_name)}</div>
      <div class="player-name">${escapeHtml(a.player)}</div>
      <div class="club">${flagImgHtml(a.nationality)} ${escapeHtml(a.nationality || '')}${a.club ? ' · ' + escapeHtml(a.club) : ''}</div>
      ${a.detail ? `<div class="detail">${escapeHtml(a.detail)}</div>` : ''}
      ${wonWc ? '<div class="badge">Also won the World Cup</div>' : ''}
    </div>
  `;
}

function goalLabel(g) {
  let label = `${escapeHtml(g.player)} ${escapeHtml(g.minute)}'`;
  if (g.own_goal) label += ' (OG)';
  if (g.penalty) label += ' (pen)';
  return label;
}

function goalsLineHtml(m) {
  if (!m.goals || !m.goals.length) return '';
  const home = m.goals.filter(g => g.team_side === 'home').map(goalLabel).join(', ');
  const away = m.goals.filter(g => g.team_side === 'away').map(goalLabel).join(', ');
  return `
    <div class="goals-line">
      <div class="goals-home">${home}</div>
      <div class="goals-away">${away}</div>
    </div>
  `;
}

function matchRowHtml(m) {
  const penNote = m.pen_home_score != null
    ? `pens ${m.pen_home_score}-${m.pen_away_score}`
    : (m.extra_time ? 'a.e.t.' : '');
  return `
    <div class="match-block">
      <a class="match-row" href="#/match/${m.id}">
        <div class="date">${escapeHtml(m.match_date || '')}</div>
        <div class="team home">${escapeHtml(m.home_team)} ${flagImgHtml(m.home_team)}</div>
        <div class="score">${m.home_score} - ${m.away_score}</div>
        <div class="team away">${flagImgHtml(m.away_team)} ${escapeHtml(m.away_team)}</div>
        <div class="expand-icon">${penNote ? penNote : '›'}</div>
      </a>
      ${goalsLineHtml(m)}
    </div>
  `;
}

async function renderEdition(year) {
  app.innerHTML = '<div class="loading">Loading…</div>';
  const data = await fetchJSON(`/api/editions/${year}`);
  const { edition, awards, matches } = data;

  const grouped = {};
  for (const m of matches) {
    if (!grouped[m.stage]) grouped[m.stage] = [];
    grouped[m.stage].push(m);
  }
  const stages = Object.keys(grouped).sort((a, b) => stageOrder(a) - stageOrder(b));

  app.innerHTML = `
    <a class="back-link" href="#/">← All editions</a>
    <h1>${year} World Cup</h1>
    <div class="summary-grid">
      <div class="summary-box"><div class="label">Host</div><div class="value">${flagImgHtml(edition.host)} ${escapeHtml(edition.host)}</div></div>
      <div class="summary-box"><div class="label">Winner</div><div class="value">${flagImgHtml(edition.winner)} ${escapeHtml(edition.winner)}</div></div>
      <div class="summary-box"><div class="label">Runner-up</div><div class="value">${flagImgHtml(edition.runner_up)} ${escapeHtml(edition.runner_up)}</div></div>
      <div class="summary-box"><div class="label">3rd Place</div><div class="value">${edition.third_place ? flagImgHtml(edition.third_place) + ' ' + escapeHtml(edition.third_place) : '—'}</div></div>
      <div class="summary-box"><div class="label">4th Place</div><div class="value">${edition.fourth_place ? flagImgHtml(edition.fourth_place) + ' ' + escapeHtml(edition.fourth_place) : '—'}</div></div>
    </div>

    <h2>Awards</h2>
    <div class="award-grid">
      ${awards.length ? awards.map(a => awardCardHtml(a, edition.winner)).join('') : '<div class="empty">No award data.</div>'}
    </div>

    <h2>Matches</h2>
    ${stages.map(stage => `
      <div class="stage-group">
        <h3>${escapeHtml(stage)}</h3>
        ${grouped[stage].map(matchRowHtml).join('')}
      </div>
    `).join('')}
  `;
}

function penKickHtml(k) {
  const icon = k.result === 'scored' ? '●' : '✕';
  return `
    <div class="pen-kick ${k.result === 'scored' ? 'scored' : 'missed'}">
      <span>${escapeHtml(k.player)}</span>
      <span class="result-icon">${icon}</span>
    </div>
  `;
}

function goalTimelineHtml(m) {
  if (!m.goals || !m.goals.length) return '';
  return `
    <h3 style="text-align:center; margin-top:24px;">Goals</h3>
    <div class="goal-timeline">
      ${m.goals.map(g => `
        <div class="timeline-entry ${g.team_side}">
          ${g.team_side === 'home' ? `<span class="timeline-team">${escapeHtml(g.player)}${g.own_goal ? ' (OG)' : ''}${g.penalty ? ' (pen)' : ''}</span><span class="timeline-minute">${escapeHtml(g.minute)}'</span>` : ''}
          ${g.team_side === 'away' ? `<span class="timeline-minute">${escapeHtml(g.minute)}'</span><span class="timeline-team">${escapeHtml(g.player)}${g.own_goal ? ' (OG)' : ''}${g.penalty ? ' (pen)' : ''}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

async function renderMatch(id) {
  app.innerHTML = '<div class="loading">Loading…</div>';
  const m = await fetchJSON(`/api/matches/${id}`);

  const penSection = m.penaltyKicks ? `
    <h3 style="text-align:center; margin-top:24px;">Penalty Shootout ${m.pen_home_score}-${m.pen_away_score}</h3>
    <div class="pen-columns">
      <div>
        <h4>${escapeHtml(m.home_team)}</h4>
        ${m.penaltyKicks.home.map(penKickHtml).join('')}
      </div>
      <div>
        <h4>${escapeHtml(m.away_team)}</h4>
        ${m.penaltyKicks.away.map(penKickHtml).join('')}
      </div>
    </div>
  ` : '';

  app.innerHTML = `
    <a class="back-link" href="#/edition/${m.year}">← Back to ${m.year} World Cup</a>
    <div class="match-detail">
      <div class="headline">${flagImgHtml(m.home_team, 'flag flag-lg')} ${escapeHtml(m.home_team)} ${m.home_score} - ${m.away_score} ${escapeHtml(m.away_team)} ${flagImgHtml(m.away_team, 'flag flag-lg')}</div>
      <div class="subline">${escapeHtml(m.stage)} · ${escapeHtml(m.match_date || '')}${m.extra_time ? ' · a.e.t.' : ''}</div>
      ${goalTimelineHtml(m)}
      ${penSection}
    </div>
  `;
}

async function renderMultiAwards() {
  app.innerHTML = '<div class="loading">Loading…</div>';
  const list = await fetchJSON('/api/multi-award-winners');

  if (!list.length) {
    app.innerHTML = '<h1>Multi-Award Winners</h1><div class="empty">None found yet.</div>';
    return;
  }

  app.innerHTML = `
    <h1>Multi-Award Winners</h1>
    <p style="color:var(--text-dim); max-width:640px;">
      Players who picked up more than one individual honor in the same tournament, or won an
      individual award while their national team lifted the trophy.
    </p>
    <div class="multi-award-list">
      ${list.map(e => `
        <div class="multi-award-card">
          <div class="player-name">${escapeHtml(e.player)}</div>
          <div class="meta">${e.year} · ${flagImgHtml(e.nationality)} ${escapeHtml(e.nationality || '')}${e.club ? ' · ' + escapeHtml(e.club) : ''}</div>
          <div class="pill-row">
            ${e.awards.map(a => `<span class="pill">${escapeHtml(a.name)}${a.detail ? ' — ' + escapeHtml(a.detail) : ''}</span>`).join('')}
            ${e.wonWorldCup ? '<span class="pill wc-pill">World Cup Winner</span>' : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function router() {
  const hash = location.hash || '#/';
  const editionMatch = hash.match(/^#\/edition\/(\d+)$/);
  const matchMatch = hash.match(/^#\/match\/(\d+)$/);

  try {
    if (hash === '#/multi-awards') {
      await renderMultiAwards();
    } else if (editionMatch) {
      await renderEdition(editionMatch[1]);
    } else if (matchMatch) {
      await renderMatch(matchMatch[1]);
    } else {
      await renderHome();
    }
  } catch (err) {
    app.innerHTML = `<div class="empty">Something went wrong: ${escapeHtml(err.message)}</div>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
