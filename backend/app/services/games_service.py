import logging
import requests
import random
from backend.app.config import config as cfg
from backend.app.repositories.games import GamesRepository
from backend.app.schemas.games import GameFetched, UserLibraryGame
from backend.app.exceptions import UnknownVibeException
from backend.app.repositories.utils import calculate_game_score

class GameService:
    def __init__(self, repo: GamesRepository, logger: logging.Logger = logging.getLogger(__name__)):
        self.repo = repo
        self.logger = logger
        
    def get_random_steam_game_no_filters(self) -> dict[str, str | dict | int]:
        """Get a random game from local database (NO STEAM API using) w/o filters"""
        game = self.repo.get_random()
        if game is None:
            self.logger.warning(f"{self.get_random_steam_game_no_filters.__name__}: No games found in the database")
            return {"message": "No games found in the database", "status": 404}
        
        self.logger.info(f"{self.get_random_steam_game_no_filters.__name__}: Returning random game: {game['name']} (AppID: {game['appid']})")
        return {
            "game": game, 
            "header_image": f"https://cdn.akamai.steamstatic.com/steam/apps/{game['appid']}/header.jpg",
            "status": 200
            }
    
    def get_random_game_from_library(self, user_library: list[UserLibraryGame]) -> dict | None:
        game = random.choice(user_library).model_dump()
        enhanced_game = self.get_game_info_by_id(game["appid"])
        
        if isinstance(enhanced_game, GameFetched):
            return enhanced_game.model_dump()
        
        return
    
    def get_game_info_by_id(self, app_id: int) -> GameFetched | list:
        """Fetch details for a given app ID using Steam API"""
        url = f"https://store.steampowered.com/api/appdetails?appids={app_id}"
        r = requests.get(url).json()

        if not r[str(app_id)]["success"]:
            return []

        d = r[str(app_id)]["data"]

        if d.get("type") != "game":
            return []

        self.logger.info(f"Fetched details for app {app_id}: {d.get('name', 'Unknown')}")

        try:
            pos, neg = self.get_reviews(app_id)
            return GameFetched(
                appid = app_id,
                name =  d.get("name"),
                genres = ",".join([g["description"] for g in d.get("genres", [])]),
                categories = ",".join([c["description"] for c in d.get("categories", [])]),
                is_free = d.get("is_free", False),
                positive = pos,
                negative = neg,
                header_image=f"https://cdn.akamai.steamstatic.com/steam/apps/{app_id}/header.jpg"
            )
        except Exception as e:
            self.logger.error(f"Error occured while getting reviews for {app_id}, {d["name"]}: {e}")
            return GameFetched(
                appid = app_id,
                name =  d.get("name"),
                genres = ",".join([g["description"] for g in d.get("genres", [])]),
                categories = ",".join([c["description"] for c in d.get("categories", [])]),
                is_free = d.get("is_free", False),
                positive = 0,
                negative = 0,
                header_image=f"https://cdn.akamai.steamstatic.com/steam/apps/{app_id}/header.jpg"
            )
            
    def get_reviews(self, appid: int) -> tuple[int, int]:
        """Fetch review summary for a given app ID using Steam store reviews API"""
        url = f"https://store.steampowered.com/appreviews/{appid}?json=1&num_per_page=0"

        headers = {
            "User-Agent": "Mozilla/5.0"
        }

        try:
            r = requests.get(url, headers=headers, timeout=10)

            if r.status_code != 200:
                print("Bad status:", r.status_code)
                return (0, 0)

            data = r.json()
            summary = data.get("query_summary", {})

            self.logger.info(f"Fetched reviews for app {appid}: {summary.get('total_positive', 0)} positive, {summary.get('total_negative', 0)} negative")

            return (
                summary.get("total_positive", 0),
                summary.get("total_negative", 0)
            )

        except Exception as e:
            self.logger.warning(f"Error fetching reviews for app {appid}: {str(e)}")
            return (0, 0)
        
    def get_smart_filtered_games(self, user_libary: list[UserLibraryGame] | list, is_user_library: bool = False, vibe: str | None = None, player_counts: str | None = None, time_pref: str | None = None):
        if cfg.VIBE_CHECKING and vibe not in cfg.VIBES_MAP:
            self.logger.error(f"Unknown vibe: {vibe}")
            raise UnknownVibeException
        
        if is_user_library and user_libary:
            games = []
            for game in user_libary:
                dumped_game = game.model_dump()
                score = calculate_game_score(dumped_game, vibe, player_counts, time_pref)
                dumped_game["score"] = score
                games.append(dumped_game)

            games.sort(key=lambda x: x["score"], reverse=True)

            TOP_K = 150
            top_games = games[:TOP_K]

            items = random.sample(top_games, min(3, len(top_games)))
            
            result = []
            for item in items:
                result.append(self.get_game_info_by_id(item['appid']))

            return result            


        self.logger.info("Smart filtering through local db")
        return self.repo.smart_filter_games(vibe, player_counts, time_pref)