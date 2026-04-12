from fastapi import FastAPI
from backend.app.db.database import SqliteDatabase
from backend.app.repositories.games import GamesRepository
from backend.app.services.steam_db_builder import SteamBuilder
from backend.app.config import config
from fastapi.middleware.cors import CORSMiddleware
from backend.app.services.steam_user import SteamUserService 

import logging
import random

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

# TODO: completely refactor this endpoint, it's a mess, but it works for now, will be improved in the future
@app.get("/games/random")
def get_random_games(count: int = 6, exclude: str | None = None, solo: bool | None = None, mood: str | None = None):
    try:
        games = repo.filter_games()
        exclude_list = exclude.split(',') if exclude else []

        filtered_games = [game for game in games if str(game[0]) not in exclude_list]

        if solo is not None:
            if solo:
                filtered_games = [game for game in filtered_games if game[3] and 'multi-player' not in game[3].lower()]
            else:
                filtered_games = [game for game in filtered_games if game[3] and 'multi-player' in game[3].lower()]

        if mood:
            mood_lower = mood.lower()
            if 'chill' in mood_lower:
                chill_genres = ['casual', 'indie', 'simulation', 'strategy', 'puzzle', 'platformer']
                mood_filtered = [game for game in filtered_games if game[2] and any(g in game[2].lower() for g in chill_genres)]
                if len(mood_filtered) >= count:
                    filtered_games = mood_filtered
            elif 'sweat' in mood_lower:
                sweat_genres = ['action', 'rpg', 'adventure', 'racing', 'fighting']
                mood_filtered = [game for game in filtered_games if game[2] and any(g in game[2].lower() for g in sweat_genres)]
                if len(mood_filtered) >= count:
                    filtered_games = mood_filtered
            elif 'think' in mood_lower:
                think_genres = ['strategy', 'simulation', 'rpg', 'indie', 'strategy']
                mood_filtered = [game for game in filtered_games if game[2] and any(g in game[2].lower() for g in think_genres)]
                if len(mood_filtered) >= count:
                    filtered_games = mood_filtered

        if len(filtered_games) == 0:
            return {"games": []}
        selected = random.sample(filtered_games, min(count, len(filtered_games)))

        result = []
        for game in selected:
            result.append({
                "appid": game[0],
                "name": game[1],
                "genres": game[2],
                "categories": game[3],
                "is_free": bool(game[4]),
                "positive": game[5],
                "negative": game[6]
            })
        return {"games": result}
    except Exception as e:
        return {"games": [], "error": str(e), "message": "Database access error"}