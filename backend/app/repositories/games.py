from backend.app.db.database import SqliteDatabase

class GamesRepository:
    def __init__(self, db: SqliteDatabase):
        self.db = db
        self.create_table()

    def create_table(self):
        with open("app/db/models.sql") as f:
            self.db.execute(f.read())

    def add_game(self, game: dict):
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
        
        except Exception as e:
            print(f"Error adding game: {str(e)}")
            self.db.rollback()

    def get_random(self):
        row = self.db.select_one("""
            SELECT appid, name, genres, categories, is_free, positive, negative
            FROM games
            ORDER BY RANDOM()
            LIMIT 1
        """)
        if row is None:
            return None

        return {
            "appid": row[0],
            "name": row[1],
            "genres": row[2],
            "categories": row[3],
            "is_free": bool(row[4]),
            "positive": row[5],
            "negative": row[6],
        }

    def filter_games(self, genre: str | None = None):
        if genre:
            return self.db.select_all("""
                SELECT * FROM games
                WHERE genres LIKE ?
            """, (f"%{genre}%",))
        return self.db.select_all("SELECT * FROM games")