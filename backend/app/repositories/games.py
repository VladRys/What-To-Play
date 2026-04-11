import logging

from backend.app.db.database import SqliteDatabase

from backend.app.config import config as cfg

class GamesRepository:
    """Repository for managing games in the local database"""
    def __init__(self, db: SqliteDatabase, logger: logging.Logger = logging.getLogger(__name__)):
        self.db = db
        self.logger = logger
        self.create_table()

    def create_table(self):
        # TODO: separate tables for games by genre or categories to optimize filtering
        with open(cfg.GAME_REPOSITORY_MODEL_PATH) as f:
            self.db.execute(f.read())
            
        self.logger.info("Games table created or already exists")

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
        
    def filter_games(self, genre: str | None = None) -> list[dict]:
        """Filter games by genre (partial match)"""
        if genre:
            self.logger.info(f"Filtering games by genre: {genre}")
            return self.db.select_all("""
                SELECT * FROM games
                WHERE genres LIKE ?
            """, (f"%{genre}%",))
        return self.db.select_all("SELECT * FROM games")