import logging
import requests
from backend.app.repositories.games import GamesRepository
from backend.app.schemas.games import GameFetched

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