from fastapi import APIRouter, Depends
from backend.app.dependencies import get_steam_user_service, get_logger

router = APIRouter()

@router.get("/owned-games/{steam_id}")
def get_owned_games_api(steam_id: str, steam_user_service = Depends(get_steam_user_service), logger = Depends(get_logger)) -> dict[str, list[dict] | str | int]:
    """Deprecated: Get owned games for a given Steam ID using Steam API (for testing purposes)"""
    logger.info(f"Fetching owned games for Steam ID: {steam_id}")
    games = steam_user_service.get_owned_games(steam_id)
    
    logger.info(f"Fetched {len(games)} owned games for Steam ID: {steam_id}")
    return {"owned_games": games, "status": 200}