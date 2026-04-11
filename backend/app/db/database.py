import sqlite3


class SqliteDatabase:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.connection = sqlite3.connect(self.db_path, check_same_thread=False)
        self.cursor = self.connection.cursor()

    def execute(self, query: str, params=()):
        self.cursor.execute(query, params)

    def select_one(self, query: str, params=()):
        self.cursor.execute(query, params)
        return self.cursor.fetchone()

    def select_all(self, query: str, params=()):
        self.cursor.execute(query, params)
        return self.cursor.fetchall()

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()

    def close(self):
        self.connection.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.rollback()
        else:
            self.commit()
        self.close()