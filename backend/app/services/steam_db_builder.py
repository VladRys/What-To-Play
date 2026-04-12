import logging

import requests
import time

from backend.app.repositories.games import GamesRepository

class SteamBuilder:
    """Service for building the local database of Steam games using Steam API"""
    def __init__(self, repo: GamesRepository, logger: logging.Logger = logging.getLogger(__name__)):
        self.repo = repo
        self.logger = logger

    def get_apps(self, api_key) -> list[dict]:
        url = "https://api.steampowered.com/IStoreService/GetAppList/v1/"
        self.logger.info("Fetching list of all Steam apps from API")
        
        return requests.get(url, params={"key": api_key}).json()["response"]["apps"]

    def get_details(self, appid: int) -> dict | None:
        """Fetch details for a given app ID using Steam API"""
        url = f"https://store.steampowered.com/api/appdetails?appids={appid}"
        r = requests.get(url).json()

        if not r[str(appid)]["success"]:
            return None

        d = r[str(appid)]["data"]

        if d.get("type") != "game":
            return None

        self.logger.info(f"Fetched details for app {appid}: {d.get('name', 'Unknown')}")

        return {
            "appid": appid,
            "name": d.get("name"),
            "genres": ",".join([g["description"] for g in d.get("genres", [])]),
            "categories": ",".join([c["description"] for c in d.get("categories", [])]),
            "is_free": int(d.get("is_free", False)),
            "positive": 0,
            "negative": 0
        }

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

    def build(self, api_key, limit=500):
        """Build the local database by fetching data from Steam API"""
        apps = self.get_apps(api_key)

        for i, app in enumerate(apps[:limit]):
            try:
                data = self.get_details(app["appid"]) or {}
                pos, neg = self.get_reviews(app["appid"])

                data["positive"] = pos
                data["negative"] = neg
            except Exception as e:
                self.logger.warning(f"Error processing game ID {app['appid']}: {str(e)}")
                continue

            if data:
                self.repo.add_game(data)

            if i % 50 == 0:
                self.logger.info(f"Processed {i} apps")

            time.sleep(0.3)
            
