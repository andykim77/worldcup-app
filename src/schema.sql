DROP TABLE IF EXISTS penalty_kicks;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS awards;
DROP TABLE IF EXISTS editions;

CREATE TABLE editions (
  year INTEGER PRIMARY KEY,
  host TEXT NOT NULL,
  winner TEXT NOT NULL,
  runner_up TEXT NOT NULL,
  third_place TEXT,
  fourth_place TEXT
);

-- One row per individual award given out at an edition (Golden Ball, Golden Boot, etc.)
CREATE TABLE awards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL REFERENCES editions(year),
  award_name TEXT NOT NULL,       -- e.g. "Golden Ball", "Golden Boot"
  player TEXT NOT NULL,
  club TEXT,                      -- club the player played for at the time of the tournament
  nationality TEXT,                -- national team the player represented
  detail TEXT                     -- e.g. goal count for Golden Boot
);

CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL REFERENCES editions(year),
  stage TEXT NOT NULL,
  match_date TEXT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  extra_time INTEGER NOT NULL DEFAULT 0,
  pen_home_score INTEGER,
  pen_away_score INTEGER
);

CREATE TABLE penalty_kicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches(id),
  team_side TEXT NOT NULL,        -- 'home' or 'away'
  kick_order INTEGER NOT NULL,
  player TEXT NOT NULL,
  result TEXT NOT NULL            -- 'scored' or 'missed'
);

-- One row per goal scored during normal/extra time (not shootout kicks)
CREATE TABLE goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches(id),
  team_side TEXT NOT NULL,        -- 'home' or 'away' -- side credited with the goal
  player TEXT NOT NULL,
  minute TEXT NOT NULL,           -- e.g. "23" or "45+2"
  own_goal INTEGER NOT NULL DEFAULT 0,
  penalty INTEGER NOT NULL DEFAULT 0,
  goal_order INTEGER NOT NULL     -- chronological order within the match
);

-- One row per red card (straight red or second-yellow red). Plain yellow
-- cards that did not lead to a sending-off are not tracked.
CREATE TABLE cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches(id),
  team_side TEXT NOT NULL,        -- 'home' or 'away'
  player TEXT NOT NULL,
  minute TEXT NOT NULL,
  second_yellow INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_matches_year ON matches(year);
CREATE INDEX idx_awards_year ON awards(year);
CREATE INDEX idx_awards_player ON awards(player);
CREATE INDEX idx_penkicks_match ON penalty_kicks(match_id);
CREATE INDEX idx_goals_match ON goals(match_id);
CREATE INDEX idx_cards_match ON cards(match_id);
CREATE INDEX idx_cards_player ON cards(player);
