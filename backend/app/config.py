import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuration class"""
    STEAM_API_KEY = os.getenv("STEAM_DEVELOPER_KEY", "") # Stean DEV Key
    TEST_STEAM_ID = int(os.getenv("TEST_STEAM_ID") or 0) # Test Steam ID
    DB_PATH = os.getenv("DB_PATH") or "backend/app/db/steam_games.db"
    GAME_REPOSITORY_MODEL_PATH = "backend/app/db/models.sql" # Path to SQL file for creating the games table

config = Config()