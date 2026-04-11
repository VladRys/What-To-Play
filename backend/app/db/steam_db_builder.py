import requests
import time

from .database import SqliteDatabase
from ..repositories.games import GamesRepository

class SteamBuilder:
    def __init__(self, repo):
        self.repo = repo

    def get_apps(self, api_key):
        url = "https://api.steampowered.com/IStoreService/GetAppList/v1/"
        return requests.get(url, params={"key": api_key}).json()["response"]["apps"]

    def get_details(self, appid):
        try:
            url = f"https://store.steampowered.com/api/appdetails?appids={appid}"
            r = requests.get(url, timeout=10)

            if r.status_code != 200:
                print(f"✗ HTTP error {r.status_code} for app {appid}")
                return None

            r = r.json()

            if not r[str(appid)]["success"]:
                print(f"✗ API returned no success for app {appid}")
                return None

            d = r[str(appid)]["data"]

            if d.get("type") != "game":
                print(f"✗ App {appid} is not a game (type: {d.get('type')})")
                return None

            return {
                "appid": appid,
                "name": d.get("name", "Unknown"),
                "genres": ",".join([g["description"] for g in d.get("genres", [])]),
                "categories": ",".join([c["description"] for c in d.get("categories", [])]),
                "is_free": int(d.get("is_free", False)),
                "positive": 0,
                "negative": 0
            }
        except KeyError as e:
            print(f"✗ KeyError in get_details for app {appid}: {str(e)}")
            return None
        except requests.RequestException as e:
            print(f"✗ Request error for app {appid}: {str(e)}")
            return None
        except Exception as e:
            print(f"✗ Unexpected error in get_details for app {appid}: {str(e)}")
            return None

    def get_reviews(self, appid):
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

            return (
                summary.get("total_positive", 0),
                summary.get("total_negative", 0)
            )

        except Exception as e:
            print("Error:", e)
            return (0, 0)

    def build(self, api_key, limit=500):
        apps = self.get_apps(api_key)

        for i, app in enumerate(apps[:limit]):
            try:
                data = self.get_details(app["appid"])
                if data:
                    self.repo.add_game(data)
                    print(f"✓ Added game: {data['name']} (ID: {app['appid']})")
                else:
                    print(f"✗ Skipped game ID: {app['appid']} (not a game or no data)")
            except Exception as e:
                print(f"✗ Error processing game ID {app['appid']}: {str(e)}")
                continue

            if i % 50 == 0:
                print(f"Processed {i} games")

            time.sleep(0.3)
            