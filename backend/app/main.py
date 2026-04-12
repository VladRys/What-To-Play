from fastapi import FastAPI
from backend.app.db.database import SqliteDatabase
from backend.app.repositories.games import GamesRepository
from backend.app.services.steam_db_builder import SteamBuilder

from backend.app.config import config

from fastapi.middleware.cors import CORSMiddleware

from backend.app.services.steam_user import SteamUserService 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = SqliteDatabase(config.DB_PATH)
repo = GamesRepository(db)
builder = SteamBuilder(repo)

steam_user_service = SteamUserService(config.STEAM_API_KEY)

@app.get("/")
def home():
    return {"message": "API is working"}

@app.get("/owned-games/{steam_id}")
def get_owned_games_api(steam_id: str):
    games = steam_user_service.get_owned_games(steam_id)
    return {"owned_games": games}

@app.get("/random")
def random_game():
    game = repo.get_random()
    if game is None:
        return {"message": "No games found in the database", "status": 404}

    return {
        "game": game,
        "header_image": f"https://cdn.akamai.steamstatic.com/steam/apps/{game['appid']}/header.jpg",
        "status": 200
    }