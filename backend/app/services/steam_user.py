import logging

import requests

class SteamUserService:
    """Service for interacting with Steam API to fetch user data"""
    def __init__(self, api_key: str, logger: logging.Logger = logging.getLogger(__name__)):
        self.api_key = api_key
        self.logger = logger

    def get_steam_id_from_vanity_url(self, vanity_url: str) -> str | None:
        """
        Resolve a vanity URL to a Steam ID using Steam API
        
        Vanity URL is the custom profile URL like "https://steamcommunity.com/id/nickname_123/"
        """
        
        url = "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/"

        params = {
            "key": self.api_key,
            "vanityurl": vanity_url
        }

        r = requests.get(url, params=params)

        if r.status_code != 200:
            return None

        data = r.json()

        if data.get("response", {}).get("success") == 1:
            self.logger.info(f"Resolved vanity URL '{vanity_url}' to Steam ID: {data['response']['steamid']}")
            return data["response"]["steamid"]

        self.logger.error(f"Failed to resolve vanity URL '{vanity_url}'")
        return None

    def get_owned_games_by_vanity_url(self, vanity_url: str) -> list[dict]:
        """Fetch owned games for a given vanity URL using Steam API"""
        steam_id = self.get_steam_id_from_vanity_url(vanity_url)
        if steam_id is None:
            return []
        
        return self.get_owned_games_by_steam_id(steam_id)

    def get_owned_games_by_steam_id(self, steam_id: str) -> list[dict]:
        """Fetch owned games for a given Steam ID using Steam API"""
        
        url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"

        params = {
            "key": self.api_key,
            "steamid": steam_id,
            "include_appinfo": 1,
            "include_played_free_games": 1
        }

        r = requests.get(url, params=params)

        if r.status_code != 200:
            return []

        data = r.json()

        self.logger.info(f"Fetched owned games for Steam ID {steam_id}: {len(data.get('response', {}).get('games', []))} games")

        return data.get("response", {}).get("games", [])