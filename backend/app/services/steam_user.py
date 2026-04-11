import requests

class SteamUserService:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def get_steam_id_from_vanity_url(self, vanity_url: str):
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
            return data["response"]["steamid"]

        return None

    def get_owned_games(self, steam_id: str):
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

        return data.get("response", {}).get("games", [])