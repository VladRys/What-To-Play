CREATE TABLE IF NOT EXISTS games (
    appid INTEGER PRIMARY KEY,
    name TEXT,
    genres TEXT,
    categories TEXT,
    is_free INTEGER,
    positive INTEGER,
    negative INTEGER
);