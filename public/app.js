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

// Freely-licensed photos only (this repo is public) — see credits in trophyCollageHtml().
// Years without an entry render as a placeholder tile instead of a photo.
const TROPHY_PHOTOS = {
  2006: {
    file: '2006.jpg',
    credit: 'Presidenza della Repubblica (Quirinale.it)',
    license: 'free use, attribution required',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Italy_2006_FIFA_World_Cup_Champion_-_Melandri,_Napolitano,_Cannavaro_and_Lippi.jpg',
  },
  2010: {
    file: '2010.jpg',
    credit: 'Rastrojo, Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Casillas_besando_la_Copa_del_Mundo_de_f%C3%BAtbol.jpg',
  },
  2014: {
    file: '2014.jpg',
    credit: 'Marcello Casal Jr / Agência Brasil',
    license: 'CC BY 3.0 BR',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Germany_lifts_the_2014_FIFA_World_Cup.jpg',
  },
  2018: {
    file: '2018.jpg',
    credit: 'Anton Zaytsev, via soccer.ru',
    license: 'CC BY-SA 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kylian_Mbapp%C3%A9_World_Cup_Trophy.jpg',
  },
  2022: {
    file: '2022.jpg',
    credit: 'Sebas, Wikimedia Commons',
    license: 'CC BY 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Argentina_3-3_Francia_-_Copa_Mundial_2022_-_Argentina_campe%C3%B3n.jpg',
  },
};

function trophyTileHtml(e) {
  const photo = TROPHY_PHOTOS[e.year];
  if (photo) {
    return `
      <a class="trophy-tile" href="#/edition/${e.year}" title="${e.year} — ${escapeHtml(e.winner)}">
        <img src="images/trophies/${photo.file}" alt="${escapeHtml(e.winner)} celebrating with the World Cup trophy, ${e.year}" loading="lazy">
        <div class="tt-scrim">
          <span class="tt-year">${e.year}</span>
          <span class="tt-winner">${flagImgHtml(e.winner)} ${escapeHtml(e.winner)}${titleBadgeHtml(e)}</span>
        </div>
      </a>
    `;
  }
  return `
    <a class="trophy-tile tt-placeholder" href="#/edition/${e.year}" title="${e.year} — ${escapeHtml(e.winner)}">
      <span class="tt-trophy">🏆</span>
      <span class="tt-year">${e.year}</span>
      <span class="tt-winner">${flagImgHtml(e.winner)} ${escapeHtml(e.winner)}${titleBadgeHtml(e)}</span>
      <span class="tt-note">no free-licensed photo on file</span>
    </a>
  `;
}

function trophyCollageHtml(editions) {
  const sorted = [...editions].sort((a, b) => a.year - b.year);
  const credits = Object.entries(TROPHY_PHOTOS).map(([year, p]) => `
    <li><a href="${p.sourceUrl}" target="_blank" rel="noopener">${year} — ${escapeHtml(p.credit)}</a>, ${escapeHtml(p.license)}</li>
  `).join('');
  return `
    <section class="trophy-collage">
      <div class="tc-head">
        <h2 class="tc-title">Champions Through the Years</h2>
        <span class="tc-sub">The trophy, lifted, kissed, and held high after ${sorted.length} finals.</span>
      </div>
      <div class="trophy-strip">
        ${sorted.map(trophyTileHtml).join('')}
      </div>
      <details class="tc-credits">
        <summary>Photo credits</summary>
        <ul>${credits}</ul>
      </details>
    </section>
  `;
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function titleBadgeHtml(e) {
  return e.title_number ? ` <span class="title-count">(${ordinal(e.title_number)} title)</span>` : '';
}

function stageOrder(stage) {
  const order = [
    'Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6',
    'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F', 'Group G', 'Group H',
    'Group I', 'Group J', 'Group K', 'Group L',
    'Final Group',
    'Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Third place', 'Final'
  ];
  // Replays and group-stage playoffs (pre-1982, before penalty shootouts existed)
  // share a stage with their parent round — sort them right after it.
  const base = stage.replace(/\s+(replay|play-?off)$/i, '');
  const idx = order.indexOf(base);
  if (idx === -1) return order.length;
  return stage === base ? idx : idx + 0.5;
}

async function renderHome() {
  app.innerHTML = '<div class="loading">Loading editions…</div>';
  const [editions, stats] = await Promise.all([
    fetchJSON('/api/editions'),
    fetchJSON('/api/stats').catch(() => null),
  ]);
  if (!editions.length) {
    app.innerHTML = '<div class="empty">No editions in the database yet.</div>';
    return;
  }

  const statChips = stats ? `
    <div class="stat-strip">
      <div class="stat-chip"><div class="num">${stats.editions}</div><div class="label">Editions</div></div>
      <div class="stat-chip"><div class="num">${stats.matches}</div><div class="label">Matches</div></div>
      <div class="stat-chip"><div class="num">${stats.goals}</div><div class="label">⚽ Goals</div></div>
      <div class="stat-chip"><div class="num">${stats.countries}</div><div class="label">Nations</div></div>
    </div>
  ` : '';

  app.innerHTML = `
    <div class="hero">
      <span class="eyebrow">World Cup Archive</span>
      <h1>Every Tournament.<br>Every Trophy.</h1>
      <p>Browse World Cup editions, relive every match goal-by-goal, and see who took home the game's biggest individual honors.</p>
      ${statChips}
    </div>
    ${trophyCollageHtml(editions)}
    <div class="edition-grid">
      ${editions.map(e => `
        <a class="card" href="#/edition/${e.year}">
          <div class="year">${e.year}</div>
          <div class="host">📍 Host: ${flagImgHtml(e.host)} ${escapeHtml(e.host)}</div>
          <div class="winner-line champ"><span class="label">Winner:</span> ${flagImgHtml(e.winner)} ${escapeHtml(e.winner)}${titleBadgeHtml(e)}</div>
          <div class="winner-line"><span class="label">Runner-up:</span> ${flagImgHtml(e.runner_up)} ${escapeHtml(e.runner_up)}</div>
        </a>
      `).join('')}
    </div>
  `;
}

function awardTierClass(name) {
  if (/^Golden|Best Young Player/.test(name)) return 'tier-gold';
  if (/^Silver/.test(name)) return 'tier-silver';
  if (/^Bronze/.test(name)) return 'tier-bronze';
  return '';
}

function awardCardHtml(a, wcWinner) {
  const wonWc = a.nationality && wcWinner && a.nationality === wcWinner;
  return `
    <div class="award-card ${awardTierClass(a.award_name)}">
      <div class="award-name">${escapeHtml(a.award_name)}</div>
      <div class="player-name">${escapeHtml(a.player)}</div>
      <div class="club">${flagImgHtml(a.nationality)} ${escapeHtml(a.nationality || '')}${a.club ? ' · ' + escapeHtml(a.club) : ''}</div>
      ${a.detail ? `<div class="detail">${escapeHtml(a.detail)}</div>` : ''}
      ${wonWc ? '<div class="badge">Also won the World Cup</div>' : ''}
    </div>
  `;
}

function goalLabel(g) {
  let label = `⚽ ${escapeHtml(g.player)} ${escapeHtml(g.minute)}'`;
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

function cardLabel(c) {
  let label = `🟥 ${escapeHtml(c.player)} ${escapeHtml(c.minute)}'`;
  if (c.second_yellow) label += ' (2nd yellow)';
  return label;
}

function cardsLineHtml(m) {
  if (!m.cards || !m.cards.length) return '';
  const home = m.cards.filter(c => c.team_side === 'home').map(cardLabel).join(', ');
  const away = m.cards.filter(c => c.team_side === 'away').map(cardLabel).join(', ');
  return `
    <div class="goals-line cards-line">
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
      ${cardsLineHtml(m)}
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
      <div class="summary-box"><div class="label">Winner</div><div class="value">${flagImgHtml(edition.winner)} ${escapeHtml(edition.winner)}${titleBadgeHtml(edition)}</div></div>
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
          ${g.team_side === 'home' ? `<span class="timeline-team">⚽ ${escapeHtml(g.player)}${g.own_goal ? ' (OG)' : ''}${g.penalty ? ' (pen)' : ''}</span><span class="timeline-minute">${escapeHtml(g.minute)}'</span>` : ''}
          ${g.team_side === 'away' ? `<span class="timeline-minute">${escapeHtml(g.minute)}'</span><span class="timeline-team">⚽ ${escapeHtml(g.player)}${g.own_goal ? ' (OG)' : ''}${g.penalty ? ' (pen)' : ''}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function redCardSectionHtml(m) {
  if (!m.cards || !m.cards.length) return '';
  return `
    <h3 style="text-align:center; margin-top:24px;">Red Cards</h3>
    <div class="goal-timeline">
      ${m.cards.map(c => `
        <div class="timeline-entry ${c.team_side}">
          ${c.team_side === 'home' ? `<span class="timeline-team">🟥 ${escapeHtml(c.player)}${c.second_yellow ? ' (2nd yellow)' : ''}</span><span class="timeline-minute card-minute">${escapeHtml(c.minute)}'</span>` : ''}
          ${c.team_side === 'away' ? `<span class="timeline-minute card-minute">${escapeHtml(c.minute)}'</span><span class="timeline-team">🟥 ${escapeHtml(c.player)}${c.second_yellow ? ' (2nd yellow)' : ''}</span>` : ''}
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
      ${redCardSectionHtml(m)}
      ${penSection}
    </div>
  `;
}

function leaderboardHtml(rows, opts) {
  const { nameKey = 'player', teamKey = 'team', totalKey = 'total', totalLabel = '' } = opts || {};
  if (!rows.length) return '<div class="empty">No data yet.</div>';
  return `
    <div class="leaderboard">
      ${rows.map((r, i) => `
        <div class="leaderboard-row">
          <div class="rank rank-${i + 1 <= 3 ? i + 1 : 'other'}">${i + 1}</div>
          <div class="lb-team">${flagImgHtml(r[teamKey])}</div>
          <div class="lb-name">${escapeHtml(r[nameKey])}${r[teamKey] ? ` <span class="lb-sub">${escapeHtml(r[teamKey])}</span>` : ''}</div>
          <div class="lb-total">${r[totalKey]}${totalLabel ? ` <span class="lb-sub">${totalLabel}</span>` : ''}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function recordCardHtml(title, rows, renderRow) {
  return `
    <div class="record-card">
      <h3>${escapeHtml(title)}</h3>
      ${rows.length ? rows.map(renderRow).join('') : '<div class="empty">No data yet.</div>'}
    </div>
  `;
}

function matchLineHtml(m, valueLabel) {
  return `
    <div class="record-match-line">
      <span class="rm-teams">${flagImgHtml(m.home_team)} ${escapeHtml(m.home_team)} ${m.home_score}-${m.away_score} ${escapeHtml(m.away_team)} ${flagImgHtml(m.away_team)}</span>
      <span class="rm-meta">${m.year} · ${escapeHtml(m.stage)}${valueLabel ? ' · ' + valueLabel : ''}</span>
    </div>
  `;
}

async function renderRecords() {
  app.innerHTML = '<div class="loading">Loading records…</div>';
  const r = await fetchJSON('/api/records');

  app.innerHTML = `
    <h1>Records</h1>
    <p style="color:var(--text-dim); max-width:640px;">
      All-time leaderboards and tournament superlatives, aggregated across every World Cup in the archive.
    </p>

    <h2>Player Leaderboards</h2>
    <div class="record-grid">
      <div class="record-card">
        <h3>🥇 Most Goals</h3>
        ${leaderboardHtml(r.topScorers, { totalLabel: 'goals' })}
      </div>
      <div class="record-card">
        <h3>🏅 Most Individual Awards</h3>
        ${leaderboardHtml(r.topAwardWinners, { teamKey: 'nationality', totalLabel: 'awards' })}
      </div>
      <div class="record-card">
        <h3>🟥 Most Red Cards</h3>
        ${leaderboardHtml(r.topRedCards, { totalLabel: 'red cards' })}
      </div>
    </div>

    <h2>Tournament Superlatives</h2>
    <div class="record-grid">
      ${recordCardHtml('🏆 Most Titles', r.mostTitles, t => `
        <div class="leaderboard-row">
          <div class="lb-team">${flagImgHtml(t.team)}</div>
          <div class="lb-name">${escapeHtml(t.team)}</div>
          <div class="lb-total">${t.total} <span class="lb-sub">titles</span></div>
        </div>
      `)}

      ${recordCardHtml('💥 Biggest Win Margins', r.biggestWinMargins, m => matchLineHtml(m, `won by ${m.margin}`))}

      ${recordCardHtml('⚽ Highest-Scoring Matches', r.highestScoringMatches, m => matchLineHtml(m, `${m.total_goals} goals`))}

      ${recordCardHtml('🎯 Longest Shootouts', r.longestShootouts, m => `
        <div class="record-match-line">
          <span class="rm-teams">${flagImgHtml(m.home_team)} ${escapeHtml(m.home_team)} ${escapeHtml(String(m.pen_home_score))}-${escapeHtml(String(m.pen_away_score))} ${escapeHtml(m.away_team)} ${flagImgHtml(m.away_team)}</span>
          <span class="rm-meta">${m.year} · ${escapeHtml(m.stage)} · ${m.total_kicks} kicks taken</span>
        </div>
      `)}

      ${recordCardHtml('🟥 Most Red Cards in a Match', r.mostCardsInAMatch, m => matchLineHtml(m, `${m.total_cards} red card${m.total_cards === 1 ? '' : 's'}`))}

      ${r.highestScoringFinal ? recordCardHtml('🏟️ Highest-Scoring Final', [r.highestScoringFinal], m => matchLineHtml(m, `${m.total_goals} goals${m.extra_time ? ' · a.e.t.' : ''}`)) : ''}
    </div>
  `;
}

function updateActiveNav() {
  const hash = location.hash || '#/';
  const topLevel = hash === '#/records' ? '/records' : '/';
  document.querySelectorAll('.topbar nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === topLevel);
  });
}

async function router() {
  const hash = location.hash || '#/';
  const editionMatch = hash.match(/^#\/edition\/(\d+)$/);
  const matchMatch = hash.match(/^#\/match\/(\d+)$/);

  updateActiveNav();

  try {
    if (hash === '#/records') {
      await renderRecords();
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
