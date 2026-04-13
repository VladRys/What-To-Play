import logging
from backend.app.repositories.games import GamesRepository

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