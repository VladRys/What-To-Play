import logging
import random

from backend.app.db.database import SqliteDatabase
from backend.app.config import config as cfg
from backend.app.exceptions import UnknownVibeException
from backend.app.repositories import utils

class GamesRepository:
    """Repository for managing games in the local database"""
    def __init__(self, db: SqliteDatabase, logger: logging.Logger = logging.getLogger(__name__)):
        self.db = db
        self.logger = logger
        self.create_table()

    def create_table(self):
        with open(cfg.GAME_REPOSITORY_MODEL_PATH) as f:
            sql_content = f.read()
        
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        for statement in statements:
            if statement:
                self.db.execute(statement)

        self._migrate_game_genres()
        self.logger.info("Games tables created or already exist")

    def _migrate_game_genres(self):
        """Migrate old game_genres schema to new one-row-per-game format."""
        pragma_rows = self.db.select_all("PRAGMA table_info(game_genres)")
        if not pragma_rows:
            return

        column_names = [row[1] for row in pragma_rows]
        if "genre_ids" in column_names:
            return
        if "genre_id" not in column_names:
            return

        self.db.execute("""
            CREATE TABLE IF NOT EXISTS game_genres_new (
                game_appid INTEGER PRIMARY KEY,
                genre_ids TEXT NOT NULL,
                FOREIGN KEY (game_appid) REFERENCES games(appid) ON DELETE CASCADE
            )
        """)

        rows = self.db.select_all("SELECT game_appid, genre_id FROM game_genres")
        genres_by_game = {}
        for appid, genre_id in rows:
            genres_by_game.setdefault(appid, []).append(str(genre_id))

        for appid, ids in genres_by_game.items():
            genre_ids = ",".join(sorted(set(ids), key=int))
            self.db.execute(
                "INSERT OR REPLACE INTO game_genres_new (game_appid, genre_ids) VALUES (?, ?)",
                (appid, genre_ids)
            )

        self.db.execute("DROP TABLE game_genres")
        self.db.execute("ALTER TABLE game_genres_new RENAME TO game_genres")
        self.logger.info("Migrated game_genres to genre_ids format")

    def _serialize_genre_ids(self, genre_ids: list[int]) -> str:
        return ",".join(str(genre_id) for genre_id in sorted(set(genre_ids)))

    def _parse_genre_ids(self, genre_ids_text: str) -> list[int]:
        return [int(genre_id) for genre_id in genre_ids_text.split(",") if genre_id.strip()]

    def _get_or_create_genre_id(self, genre_name: str) -> int | None:
        self.db.execute("INSERT OR IGNORE INTO genres (name) VALUES (?)", (genre_name,))
        genre_row = self.db.select_one("SELECT id FROM genres WHERE name = ?", (genre_name,))
        return genre_row[0] if genre_row else None

    def add_game(self, game: dict) -> None:
        """Add a game to the database"""
        try:
            self.db.execute("""
                INSERT OR IGNORE INTO games
                (appid, name, genres, categories, is_free, positive, negative)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                game["appid"],
                game["name"],
                game["genres"],
                game["categories"],
                game["is_free"],
                game["positive"],
                game["negative"]
            ))

            if game.get("genres"):
                genres_list = [g.strip() for g in game["genres"].split(",") if g.strip()]
                genre_ids = [genre_id for genre_name in genres_list if (genre_id := self._get_or_create_genre_id(genre_name))]

                if genre_ids:
                    existing = self.db.select_one(
                        "SELECT genre_ids FROM game_genres WHERE game_appid = ?",
                        (game["appid"],)
                    )

                    if existing and existing[0]:
                        current_ids = self._parse_genre_ids(existing[0])
                        genre_ids = sorted(set(current_ids) | set(genre_ids))
                        self.db.execute(
                            "UPDATE game_genres SET genre_ids = ? WHERE game_appid = ?",
                            (self._serialize_genre_ids(genre_ids), game["appid"])
                        )
                    else:
                        self.db.execute(
                            "INSERT OR REPLACE INTO game_genres (game_appid, genre_ids) VALUES (?, ?)",
                            (game["appid"], self._serialize_genre_ids(genre_ids))
                        )

            self.db.commit()
            
            self.logger.info(f"Added game to database: {game['name']} (AppID: {game['appid']})")
        
        except Exception as e:
            self.logger.error(f"Error adding game: {str(e)}")
            self.db.rollback()

    def get_random(self) -> dict | None:
        """Get a random game from the database"""
        row = self.db.select_one("""
            SELECT appid, name, genres, categories, is_free, positive, negative
            FROM games
            ORDER BY RANDOM()
            LIMIT 1
        """)
        if row is None:
            return None

        self.logger.info(f"Fetched random game from database: {row[1]} (AppID: {row[0]})")
        return {
            "appid": row[0],
            "name": row[1],
            "genres": row[2],
            "categories": row[3],
            "is_free": bool(row[4]),
            "positive": row[5],
            "negative": row[6],
        }
        
    def filter_games_by_genre(self, genre: str | None = None) -> list[dict]:
        """Filter games by genre name"""
        if genre:
            self.logger.info(f"Filtering games by genre: {genre}")
            genre_row = self.db.select_one("SELECT id FROM genres WHERE name = ?", (genre,))
            if not genre_row:
                return []
            return self.db.select_all("""
                SELECT g.appid, g.name, g.genres, g.categories, g.is_free, g.positive, g.negative
                FROM games g
                JOIN game_genres gg ON g.appid = gg.game_appid
                WHERE INSTR(',' || gg.genre_ids || ',', ',' || ? || ',') > 0
            """, (str(genre_row[0]),))
        return self.db.select_all("SELECT * FROM games")
        
    def get_games_by_vibe(self, vibe: str) -> list[dict]:
        """Get 3 random games from different genres based on vibe from VIBES_MAP"""
        if cfg.VIBE_CHECKING and vibe not in cfg.VIBES_MAP:
            self.logger.error(f"Unknown vibe: {vibe}")
            raise UnknownVibeException 
            
        genres = cfg.VIBES_MAP[vibe]
        if not genres:
            return []
            
        games = []
        selected_appids = set()
        
        for genre in genres:
            if len(games) >= 3:
                break
                
            genre_row = self.db.select_one("SELECT id FROM genres WHERE name = ?", (genre,))
            if not genre_row:
                continue
            genre_id = genre_row[0]

            rows = self.db.select_all("""
                SELECT g.appid, g.name, g.genres, g.categories, g.is_free, g.positive, g.negative
                FROM games g
                JOIN game_genres gg ON g.appid = gg.game_appid
                WHERE INSTR(',' || gg.genre_ids || ',', ',' || ? || ',') > 0
                ORDER BY RANDOM()
                LIMIT 1
            """, (str(genre_id),))
            
            if rows:
                row = rows[0]
                if row[0] not in selected_appids:
                    games.append({
                        "appid": row[0],
                        "name": row[1],
                        "genres": row[2],
                        "categories": row[3],
                        "is_free": bool(row[4]),
                        "positive": row[5],
                        "negative": row[6],
                    })
                    selected_appids.add(row[0])
        
        if len(games) < 3:
            remaining_needed = 3 - len(games)
            genre_ids = []
            for genre in genres:
                genre_row = self.db.select_one("SELECT id FROM genres WHERE name = ?", (genre,))
                if genre_row:
                    genre_ids.append(str(genre_row[0]))

            if genre_ids:
                or_clauses = " OR ".join(
                    "INSTR(',' || gg.genre_ids || ',', ',' || ? || ',') > 0" for _ in genre_ids
                )
                excluded_clause = ""
                params = genre_ids
                if selected_appids:
                    excluded_clause = "AND g.appid NOT IN ({})".format(
                        ",".join("?" for _ in selected_appids)
                    )
                    params += [*selected_appids]
                params.append(remaining_needed)

                query = f"""
                    SELECT g.appid, g.name, g.genres, g.categories, g.is_free, g.positive, g.negative
                    FROM games g
                    JOIN game_genres gg ON g.appid = gg.game_appid
                    WHERE ({or_clauses})
                    {excluded_clause}
                    ORDER BY RANDOM()
                    LIMIT ?
                """

                rows = self.db.select_all(query, params)
                for row in rows:
                    if len(games) >= 3:
                        break
                    if row[0] in selected_appids:
                        continue
                    games.append({
                        "appid": row[0],
                        "name": row[1],
                        "genres": row[2],
                        "categories": row[3],
                        "is_free": bool(row[4]),
                        "positive": row[5],
                        "negative": row[6],
                    })
                    selected_appids.add(row[0])
        
        self.logger.info(f"Fetched {len(games)} games for vibe '{vibe}': {[g['name'] for g in games]}")
        return games
    
    def smart_filter_games(self, vibe: str | None = None, mode: str | None = None, time_pref: str | None = None, limit: int = 3) -> list[dict]:
        if cfg.VIBE_CHECKING and vibe not in cfg.VIBES_MAP:
            self.logger.error(f"Unknown vibe: {vibe}")
            raise UnknownVibeException
        
        rows = self.db.select_all("""
            SELECT appid, name, genres, categories, is_free, positive, negative
            FROM games
        """)

        games = []
        for row in rows:
            game = {
                "appid": row[0],
                "name": row[1],
                "genres": row[2],
                "categories": row[3],
                "is_free": bool(row[4]),
                "positive": row[5],
                "negative": row[6],
            }

            score = utils.calculate_game_score(game, vibe, mode, time_pref)
            game["score"] = score
            games.append(game)

        games.sort(key=lambda x: x["score"], reverse=True)

        TOP_K = 150
        top_games = games[:TOP_K]

        return random.sample(top_games, min(limit, len(top_games)))