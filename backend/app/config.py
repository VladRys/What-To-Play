import os
from dotenv import load_dotenv
from pathlib import Path

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

        self.VIBE_CHECKING = True

        self.VIBES_MAP = {
            "chill": ("Adventure", "Indie", "Casual", "Simulation", "Strategy", "Sports", "Racing"),
            "sweat": ("Action", "RPG", "Strategy", "Multiplayer", "Competitive", "FPS"),
            "brain": ("Puzzle", "Strategy", "Simulation")
        }

        self.GAME_SCORING_CONFIG = {
            "genre_weights": {
                "Casual": {"chill": 3, "sweat": -1, "brain": 1},
                "Action": {"chill": -2, "sweat": 3},
                "Strategy": {"brain": 3, "chill": 1, "sweat": 1},
                "Adventure": {"chill": 3, "sweat": 1, "brain": 0},
                "Indie": {"chill": 3, "sweat": 1, "brain": 1},
                "Simulation": {"chill": 3, "sweat": 1, "brain": 1},
                "RPG": {"chill": 0, "sweat": 3, "brain": 2},
                "Sports": {"chill": 2, "sweat": 2, "brain": 0},
                "Racing": {"chill": 2, "sweat": 2, "brain": 0},
                "Puzzle": {"chill": 0, "sweat": 0, "brain": 3},
                "Multiplayer": {"chill": -1, "sweat": 3, "brain": 0},
                "Competitive": {"chill": -2, "sweat": 3, "brain": 0},
                "FPS": {"chill": -2, "sweat": 3, "brain": 0},
            },
            
            "mode_weights": {
                "Single-player": {"single": 2},
                "Multi-player": {"multi": 2, "single": -1},
                "Co-op": {"coop": 3}
            },
            
            "rating_weight": 3.0
        }

        self.TIME_PROFILES = {
            "short": { 
                "Casual": 2,
                "Arcade": 2,
                "Indie": 1,
                "Puzzle": 1,
                "Racing": 2,
                "Sports": 2
            },
            "medium": {
                "Action": 2,
                "Adventure": 2,
                "Simulation": 1,
                "FPS": 3,
                "Competitive": 3,
                "Multiplayer": 3
            },
            "long": { 
                "RPG": 3,
                "Strategy": 2,
                "Simulation": 3,
                "FPS": 3,
                "Competitive": 3,
                "Multiplayer": 3,
            }
        }

config = Config()