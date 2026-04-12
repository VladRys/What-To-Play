from backend.app.db.database import SqliteDatabase
from backend.app.repositories.games import GamesRepository
from backend.app.services.steam_db_builder import SteamBuilder
from backend.app.config import config
from backend.app.services.steam_user import SteamUserService

import logging

logger = logging.getLogger(__name__)

db = SqliteDatabase(config.DB_PATH)
games_repo = GamesRepository(db, logger)
builder = SteamBuilder(games_repo, logger)
steam_user_service = SteamUserService(config.STEAM_API_KEY)

def get_games_repo():
    return games_repo

def get_logger():
    return logger

def get_steam_user_service():
    return steam_user_service