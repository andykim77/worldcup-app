const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, '..', 'data', 'worldcup.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const DATA_DIR = path.join(__dirname, '..', 'data');

if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const db = new DatabaseSync(DB_PATH);
db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));

const AWARD_KEYS = [
  ['goldenBall', 'Golden Ball'],
  ['silverBall', 'Silver Ball'],
  ['bronzeBall', 'Bronze Ball'],
  ['goldenBoot', 'Golden Boot'],
  ['silverBoot', 'Silver Boot'],
  ['bronzeBoot', 'Bronze Boot'],
  ['goldenGlove', 'Golden Glove'],
  ['bestYoungPlayer', "Best Young Player"],
];

const insertEdition = db.prepare(`
  INSERT INTO editions (year, host, winner, runner_up, third_place, fourth_place)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertAward = db.prepare(`
  INSERT INTO awards (year, award_name, player, club, nationality, detail)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertMatch = db.prepare(`
  INSERT INTO matches (year, stage, match_date, home_team, away_team, home_score, away_score, extra_time, pen_home_score, pen_away_score)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertPenKick = db.prepare(`
  INSERT INTO penalty_kicks (match_id, team_side, kick_order, player, result)
  VALUES (?, ?, ?, ?, ?)
`);

const insertGoal = db.prepare(`
  INSERT INTO goals (match_id, team_side, player, minute, own_goal, penalty, goal_order)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertCard = db.prepare(`
  INSERT INTO cards (match_id, team_side, player, minute, second_yellow)
  VALUES (?, ?, ?, ?, ?)
`);

const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('wc') && f.endsWith('.json'));

if (files.length === 0) {
  console.error('No wc*.json data files found in data/. Aborting seed.');
  process.exit(1);
}

let totalMatches = 0;
let totalAwards = 0;
let totalPenKicks = 0;
let totalGoals = 0;
let totalCards = 0;

for (const file of files.sort()) {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse ${file}: ${e.message}`);
    process.exit(1);
  }

  const ed = json.edition;
  insertEdition.run(
    ed.year, ed.host, ed.winner, ed.runnerUp,
    ed.thirdPlace || null, ed.fourthPlace || null
  );

  for (const [key, label] of AWARD_KEYS) {
    const a = ed[key];
    if (!a || !a.player) continue;
    insertAward.run(
      ed.year, label, a.player, a.club || null, a.nationality || null,
      a.goals != null ? `${a.goals} goals` : (a.detail || null)
    );
    totalAwards++;
  }

  for (const m of json.matches) {
    const penHome = m.penalties ? m.penalties.homeScore : null;
    const penAway = m.penalties ? m.penalties.awayScore : null;
    const result = insertMatch.run(
      ed.year, m.stage, m.date || null, m.homeTeam, m.awayTeam,
      m.homeScore, m.awayScore, m.extraTime ? 1 : 0, penHome, penAway
    );
    const matchId = result.lastInsertRowid;
    totalMatches++;

    if (m.penalties) {
      (m.penalties.homeTakers || []).forEach((t, i) => {
        insertPenKick.run(matchId, 'home', i + 1, t.player, t.result);
        totalPenKicks++;
      });
      (m.penalties.awayTakers || []).forEach((t, i) => {
        insertPenKick.run(matchId, 'away', i + 1, t.player, t.result);
        totalPenKicks++;
      });
    }

    (m.goals || []).forEach((g, i) => {
      insertGoal.run(
        matchId, g.team, g.player, String(g.minute),
        g.ownGoal ? 1 : 0, g.penalty ? 1 : 0, i + 1
      );
      totalGoals++;
    });

    (m.redCards || []).forEach((c) => {
      insertCard.run(matchId, c.team, c.player, String(c.minute), c.secondYellow ? 1 : 0);
      totalCards++;
    });
  }

  console.log(`Seeded ${file}: ${json.matches.length} matches, edition ${ed.year}`);
}

console.log(`Done. Editions: ${files.length}, matches: ${totalMatches}, awards: ${totalAwards}, penalty kicks: ${totalPenKicks}, goals: ${totalGoals}, red cards: ${totalCards}`);
db.close();
