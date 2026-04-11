from fastapi import FastAPI
from backend.app.db.database import SqliteDatabase
from backend.app.repositories.games import GamesRepository
from backend.app.services.steam_db_builder import SteamBuilder
from backend.app.config import config
from fastapi.middleware.cors import CORSMiddleware
from backend.app.services.steam_user import SteamUserService 

import logging

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db = SqliteDatabase(config.DB_PATH)
repo = GamesRepository(db, logger)
builder = SteamBuilder(repo, logger)

steam_user_service = SteamUserService(config.STEAM_API_KEY)

# TODO: move routes to separate file

@app.get("/")
def home():
    """Test route to check if API is working"""
    logger.info("Home route accessed")
    return {"message": "API is working"}

@app.get("/owned-games/{steam_id}")
def get_owned_games_api(steam_id: str) -> dict[str, list[dict] | str | int]:
    """Deprecated: Get owned games for a given Steam ID using Steam API (for testing purposes)"""
    logger.info(f"Fetching owned games for Steam ID: {steam_id}")
    games = steam_user_service.get_owned_games(steam_id)
    
    logger.info(f"Fetched {len(games)} owned games for Steam ID: {steam_id}")
    return {"owned_games": games, "status": 200}

@app.get("/random")
def random_game() -> dict[str, str | dict | int]:
    """Get a random game from local database (NO STEAM API using) w/o filters"""
    game = repo.get_random()
    if game is None:
        logger.warning(f"{random_game.__name__}: No games found in the database")
        return {"message": "No games found in the database", "status": 404}
    
    logger.info(f"{random_game.__name__}: Returning random game: {game['name']} (AppID: {game['appid']})")
    return {
        "game": game, 
        "header_image": f"https://cdn.akamai.steamstatic.com/steam/apps/{game['appid']}/header.jpg",
        "status": 200
        }