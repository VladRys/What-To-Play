from fastapi import APIRouter, Depends
from backend.app.dependencies import get_steam_user_service, get_logger
from backend.app.services.steam_user import SteamUserService

router = APIRouter()

@router.get("/owned-games/id/{steam_id}")
def get_owned_games_api(steam_id: str, steam_user_service: SteamUserService = Depends(get_steam_user_service), logger = Depends(get_logger)) -> dict[str, list[dict] | str | int]:
    """Deprecated: Get owned games for a given Steam ID using Steam API (for testing purposes)"""
    logger.info(f"Fetching owned games for Steam ID: {steam_id}")
    games = steam_user_service.get_owned_games_by_steam_id(steam_id)
    
    if not games:
        logger.warning(f"No owned games found for Steam ID: {steam_id}")
        return {"message": "No owned games found for the provided Steam ID", "status": 404}
    
    logger.info(f"Fetched {len(games)} owned games for Steam ID: {steam_id}")
    return {"owned_games": games, "status": 200}

@router.get("/owned-games/vanity/{vanity_url}")
def get_owned_games_by_vanity_url(vanity_url: str, steam_user_service: SteamUserService = Depends(get_steam_user_service), logger = Depends(get_logger)) -> dict[str, list[dict] | str | int]:
    """Get owned games for a given vanity URL using Steam API"""
    logger.info(f"Fetching owned games for vanity URL: {vanity_url}")
    games = steam_user_service.get_owned_games_by_vanity_url(vanity_url)

    if not games:
        logger.warning(f"No owned games found for vanity URL: {vanity_url}")
        return {"message": "No owned games found for the provided vanity URL", "status": 404}
    
    logger.info(f"Fetched {len(games)} owned games for vanity URL: {vanity_url}")
    return {"owned_games": games, "status": 200}