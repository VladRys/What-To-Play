CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
    appid INTEGER PRIMARY KEY,
    name TEXT,
    genres TEXT,
    categories TEXT,
    is_free INTEGER,
    positive INTEGER,
    negative INTEGER
);

CREATE TABLE IF NOT EXISTS game_genres (
    game_appid INTEGER PRIMARY KEY,
    genre_ids TEXT NOT NULL,
    FOREIGN KEY (game_appid) REFERENCES games(appid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_game_genres_game_appid ON game_genres(game_appid);