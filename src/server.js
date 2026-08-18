const path = require('node:path');
const express = require('express');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, '..', 'data', 'worldcup.db');
const db = new DatabaseSync(DB_PATH, { readOnly: false });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

// List all editions with summary info
app.get('/api/editions', (req, res) => {
  const editions = all('SELECT * FROM editions ORDER BY year');
  res.json(editions);
});

// Full detail for one edition: info + awards + matches
app.get('/api/editions/:year', (req, res) => {
  const year = Number(req.params.year);
  const edition = get('SELECT * FROM editions WHERE year = ?', [year]);
  if (!edition) return res.status(404).json({ error: 'Edition not found' });

  const awards = all('SELECT * FROM awards WHERE year = ? ORDER BY id', [year]);
  const matches = all('SELECT * FROM matches WHERE year = ? ORDER BY id', [year]);

  const matchIds = matches.map(m => m.id);
  let penKicksByMatch = {};
  if (matchIds.length) {
    const placeholders = matchIds.map(() => '?').join(',');
    const kicks = all(
      `SELECT * FROM penalty_kicks WHERE match_id IN (${placeholders}) ORDER BY match_id, team_side, kick_order`,
      matchIds
    );
    for (const k of kicks) {
      if (!penKicksByMatch[k.match_id]) penKicksByMatch[k.match_id] = { home: [], away: [] };
      penKicksByMatch[k.match_id][k.team_side].push({ player: k.player, result: k.result });
    }
  }

  let goalsByMatch = {};
  if (matchIds.length) {
    const placeholders = matchIds.map(() => '?').join(',');
    const goals = all(
      `SELECT * FROM goals WHERE match_id IN (${placeholders}) ORDER BY match_id, goal_order`,
      matchIds
    );
    for (const g of goals) {
      if (!goalsByMatch[g.match_id]) goalsByMatch[g.match_id] = [];
      goalsByMatch[g.match_id].push(g);
    }
  }

  const matchesOut = matches.map(m => ({
    ...m,
    penaltyKicks: penKicksByMatch[m.id] || null,
    goals: goalsByMatch[m.id] || [],
  }));

  res.json({ edition, awards, matches: matchesOut });
});

// All matches across all editions, optionally filtered by team
app.get('/api/matches', (req, res) => {
  const { team, stage } = req.query;
  let sql = 'SELECT * FROM matches WHERE 1=1';
  const params = [];
  if (team) {
    sql += ' AND (home_team = ? OR away_team = ?)';
    params.push(team, team);
  }
  if (stage) {
    sql += ' AND stage = ?';
    params.push(stage);
  }
  sql += ' ORDER BY year, id';
  res.json(all(sql, params));
});

app.get('/api/matches/:id', (req, res) => {
  const id = Number(req.params.id);
  const match = get('SELECT * FROM matches WHERE id = ?', [id]);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  const kicks = all(
    'SELECT * FROM penalty_kicks WHERE match_id = ? ORDER BY team_side, kick_order',
    [id]
  );
  const penaltyKicks = { home: [], away: [] };
  for (const k of kicks) penaltyKicks[k.team_side].push({ player: k.player, result: k.result });
  const goals = all('SELECT * FROM goals WHERE match_id = ? ORDER BY goal_order', [id]);
  res.json({ ...match, penaltyKicks: kicks.length ? penaltyKicks : null, goals });
});

// All awards, optionally filtered by player
app.get('/api/awards', (req, res) => {
  const { player } = req.query;
  let sql = 'SELECT * FROM awards WHERE 1=1';
  const params = [];
  if (player) {
    sql += ' AND player = ?';
    params.push(player);
  }
  sql += ' ORDER BY year, id';
  res.json(all(sql, params));
});

// Players who won multiple things "at once" in the same edition:
// either (a) received 2+ individual awards in the same year, or
// (b) received an individual award AND their nationality's team won the World Cup that year.
app.get('/api/multi-award-winners', (req, res) => {
  const awards = all(`
    SELECT a.*, e.winner AS wc_winner
    FROM awards a
    JOIN editions e ON e.year = a.year
    ORDER BY a.year, a.player
  `);

  const byPlayerYear = new Map();
  for (const a of awards) {
    const key = `${a.year}|${a.player}`;
    if (!byPlayerYear.has(key)) {
      byPlayerYear.set(key, { year: a.year, player: a.player, club: a.club, nationality: a.nationality, awards: [], wonWorldCup: false });
    }
    const entry = byPlayerYear.get(key);
    entry.awards.push({ name: a.award_name, detail: a.detail });
    if (a.nationality && a.wc_winner && a.nationality === a.wc_winner) {
      entry.wonWorldCup = true;
    }
  }

  const result = [...byPlayerYear.values()]
    .filter(e => e.awards.length > 1 || (e.wonWorldCup && e.awards.length >= 1))
    .sort((a, b) => b.year - a.year);

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`World Cup app running at http://localhost:${PORT}`);
});
