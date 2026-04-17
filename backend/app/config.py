import os
from dotenv import load_dotenv
from pathlib import Path
from backend.app.main import logger

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Config:
    def __init__(self):
        load_dotenv()
        
        """Configuration class"""
        self.STEAM_API_KEY = os.getenv("STEAM_DEVELOPER_KEY", "") # Steam DEV Key
        self.TEST_STEAM_ID = int(os.getenv("TEST_STEAM_ID") or 0) # Test Steam ID
        self.DB_PATH = os.getenv("DB_PATH", "backend/app/db/steam_games.db")
        self.GAME_REPOSITORY_MODEL_PATH = "backend/app/db/models.sql" # Path to SQL file for creating the games table

        self.VIBES_MAP = {
            "chill": ("Adventure", "Indie", "Casual", "Simulation", "Strategy", "Sports", "Racing"),
            "sweat": ("Action", "RPG", "Strategy", "Multiplayer", "Competitive", "FPS"),
            "brain": ("Puzzle", "Strategy", "Simulation")
        }

config = Config()
logger.info("Config was successfully loaded!")