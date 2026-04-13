from backend.app.db.database import SqliteDatabase
from backend.app.repositories.games import GamesRepository
from backend.app.config import config
from backend.app.services.steam_user import SteamUserService
from backend.app.services.games_service import GameService

import logging

"""
Dependency injection module for FastAPI routes. Provides instances of repositories and services.
This module centralizes the creation and management of dependencies, allowing for easier testing and maintenance.
"""

logger = logging.getLogger(__name__)

db = SqliteDatabase(config.DB_PATH)
logger.info("Initializing database and repositories...")
games_repo = GamesRepository(db, logger)
logger.info("Games repository initialized")
steam_user_service = SteamUserService(config.STEAM_API_KEY)
games_service = GameService(games_repo, logger)

def get_games_repo():
    return games_repo

def get_games_service():
    return games_service

def get_logger():
    return logger

def get_steam_user_service():
    return steam_user_service