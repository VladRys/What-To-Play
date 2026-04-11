import requests

class SteamGamesService:
    def __init__(self, api_key: str):
        self.api_key = api_key