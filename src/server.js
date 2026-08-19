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

// FIFA credits Germany's title record as continuous through reunification, so
// "West Germany" (1954/1974/1990) and "Germany" (2014) count as one title lineage.
const TITLE_LINEAGE = `CASE WHEN winner IN ('West Germany', 'Germany') THEN 'Germany' ELSE winner END`;

// List all editions with summary info
app.get('/api/editions', (req, res) => {
  const editions = all(`
    SELECT *, COUNT(*) OVER (PARTITION BY ${TITLE_LINEAGE} ORDER BY year) AS title_number
    FROM editions
    ORDER BY year
  `);
  res.json(editions);
});

// Aggregate totals across all editions, for the homepage hero strip
app.get('/api/stats', (req, res) => {
  const editions = get('SELECT COUNT(*) AS n FROM editions').n;
  const matches = get('SELECT COUNT(*) AS n FROM matches').n;
  const goals = get('SELECT COUNT(*) AS n FROM goals WHERE own_goal = 0').n;
  const countries = get(`
    SELECT COUNT(DISTINCT team) AS n FROM (
      SELECT home_team AS team FROM matches
      UNION
      SELECT away_team AS team FROM matches
    )
  `).n;
  res.json({ editions, matches, goals, countries });
});

// Full detail for one edition: info + awards + matches
app.get('/api/editions/:year', (req, res) => {
  const year = Number(req.params.year);
  const edition = get(`
    SELECT * FROM (
      SELECT *, COUNT(*) OVER (PARTITION BY ${TITLE_LINEAGE} ORDER BY year) AS title_number
      FROM editions
    ) WHERE year = ?
  `, [year]);
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

  let cardsByMatch = {};
  if (matchIds.length) {
    const placeholders = matchIds.map(() => '?').join(',');
    const cards = all(
      `SELECT * FROM cards WHERE match_id IN (${placeholders}) ORDER BY match_id, id`,
      matchIds
    );
    for (const c of cards) {
      if (!cardsByMatch[c.match_id]) cardsByMatch[c.match_id] = [];
      cardsByMatch[c.match_id].push(c);
    }
  }

  const matchesOut = matches.map(m => ({
    ...m,
    penaltyKicks: penKicksByMatch[m.id] || null,
    goals: goalsByMatch[m.id] || [],
    cards: cardsByMatch[m.id] || [],
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
  const cards = all('SELECT * FROM cards WHERE match_id = ? ORDER BY id', [id]);
  res.json({ ...match, penaltyKicks: kicks.length ? penaltyKicks : null, goals, cards });
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

// Cross-tournament records: player leaderboards + team/match superlatives.
app.get('/api/records', (req, res) => {
  const topScorers = all(`
    SELECT player, team, SUM(cnt) AS total
    FROM (
      SELECT g.player AS player,
             CASE WHEN g.team_side = 'home' THEN m.home_team ELSE m.away_team END AS team,
             COUNT(*) AS cnt
      FROM goals g JOIN matches m ON m.id = g.match_id
      WHERE g.own_goal = 0
      GROUP BY g.player, team
    )
    GROUP BY player
    ORDER BY total DESC
    LIMIT 10
  `);

  const topAwardWinners = all(`
    SELECT player, nationality, COUNT(*) AS total
    FROM awards
    GROUP BY player
    HAVING total >= 2
    ORDER BY total DESC
    LIMIT 10
  `);

  const topRedCards = all(`
    SELECT player, team, SUM(cnt) AS total
    FROM (
      SELECT c.player AS player,
             CASE WHEN c.team_side = 'home' THEN m.home_team ELSE m.away_team END AS team,
             COUNT(*) AS cnt
      FROM cards c JOIN matches m ON m.id = c.match_id
      GROUP BY c.player, team
    )
    GROUP BY player
    ORDER BY total DESC
    LIMIT 10
  `);

  const mostTitles = all(`
    SELECT ${TITLE_LINEAGE} AS team, COUNT(*) AS total
    FROM editions
    GROUP BY team
    ORDER BY total DESC
    LIMIT 5
  `);

  const biggestWinMargins = all(`
    SELECT year, stage, home_team, away_team, home_score, away_score,
           ABS(home_score - away_score) AS margin
    FROM matches
    ORDER BY margin DESC, (home_score + away_score) DESC
    LIMIT 5
  `);

  const highestScoringMatches = all(`
    SELECT year, stage, home_team, away_team, home_score, away_score,
           (home_score + away_score) AS total_goals
    FROM matches
    ORDER BY total_goals DESC
    LIMIT 5
  `);

  const highestScoringFinal = get(`
    SELECT year, stage, home_team, away_team, home_score, away_score, extra_time,
           pen_home_score, pen_away_score, (home_score + away_score) AS total_goals
    FROM matches
    WHERE stage = 'Final'
    ORDER BY total_goals DESC
    LIMIT 1
  `);

  const longestShootouts = all(`
    SELECT m.year, m.stage, m.home_team, m.away_team, m.pen_home_score, m.pen_away_score,
           COUNT(pk.id) AS total_kicks
    FROM penalty_kicks pk JOIN matches m ON m.id = pk.match_id
    GROUP BY pk.match_id
    ORDER BY total_kicks DESC
    LIMIT 3
  `);

  const mostCardsInAMatch = all(`
    SELECT m.year, m.stage, m.home_team, m.away_team, m.match_date, COUNT(c.id) AS total_cards
    FROM cards c JOIN matches m ON m.id = c.match_id
    GROUP BY c.match_id
    ORDER BY total_cards DESC
    LIMIT 5
  `);

  res.json({
    topScorers,
    topAwardWinners,
    topRedCards,
    mostTitles,
    biggestWinMargins,
    highestScoringMatches,
    highestScoringFinal,
    longestShootouts,
    mostCardsInAMatch,
  });
});

app.listen(PORT, () => {
  console.log(`World Cup app running at http://localhost:${PORT}`);
});
