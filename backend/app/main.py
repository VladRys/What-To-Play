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

@app.get("/games/random")
def get_random_games(count: int = 6, exclude: str = None, solo: bool = None, mood: str = None):
    try:
        games = repo.filter_games()
        exclude_list = exclude.split(',') if exclude else []

        # Filter out excluded games
        filtered_games = [game for game in games if str(game[0]) not in exclude_list]

        # Filter by solo/multiplayer
        if solo is not None:
            if solo:
                # Solo mode: exclude multiplayer games
                filtered_games = [game for game in filtered_games if game[3] and 'multi-player' not in game[3].lower()]
            else:
                # Friends mode: prefer multiplayer games
                filtered_games = [game for game in filtered_games if game[3] and 'multi-player' in game[3].lower()]

        # Filter by mood (based on actual genres in database)
        if mood:
            mood_lower = mood.lower()
            if 'chill' in mood_lower:
                # Chill mood: casual, indie, simulation, strategy, puzzle
                chill_genres = ['casual', 'indie', 'simulation', 'strategy', 'puzzle', 'platformer']
                mood_filtered = [game for game in filtered_games if game[2] and any(g in game[2].lower() for g in chill_genres)]
                # If mood filtering returns too few games, relax the filter
                if len(mood_filtered) >= count:
                    filtered_games = mood_filtered
            elif 'sweat' in mood_lower:
                # Sweat mood: action, rpg, adventure, racing
                sweat_genres = ['action', 'rpg', 'adventure', 'racing', 'fighting']
                mood_filtered = [game for game in filtered_games if game[2] and any(g in game[2].lower() for g in sweat_genres)]
                # If mood filtering returns too few games, relax the filter
                if len(mood_filtered) >= count:
                    filtered_games = mood_filtered
            elif 'think' in mood_lower:
                # Think mood: strategy, simulation, rpg
                think_genres = ['strategy', 'simulation', 'rpg', 'indie', 'strategy']
                mood_filtered = [game for game in filtered_games if game[2] and any(g in game[2].lower() for g in think_genres)]
                # If mood filtering returns too few games, relax the filter
                if len(mood_filtered) >= count:
                    filtered_games = mood_filtered

        # Randomly select games
        import random
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