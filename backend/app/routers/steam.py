from fastapi import APIRouter, Depends
from backend.app.dependencies import get_steam_user_service, get_logger, get_games_service
from backend.app.services.steam_user import SteamUserService
from backend.app.services.games_service import GameService

from backend.app.schemas.games import GetGameInfoResponse, GameFetched

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

@router.get("/owned-games/enriched/id/{steam_id}")
def get_owned_games_enriched_by_id(steam_id: str, steam_user_service: SteamUserService = Depends(get_steam_user_service), game_service: GameService = Depends(get_games_service), logger = Depends(get_logger)) -> dict[str, list[dict] | str | int]:
    """Get owned games for a given Steam ID with enrichment from Steam Store API"""
    logger.info(f"Fetching enriched owned games for Steam ID: {steam_id}")
    games = steam_user_service.get_owned_games_by_steam_id(steam_id)

    if not games:
        logger.warning(f"No owned games found for Steam ID: {steam_id}")
        return {"message": "No owned games found for the provided Steam ID", "status": 404}

    # Sort by playtime to get top played games
    games.sort(key=lambda x: x.get("playtime_forever", 0), reverse=True)

    # Enrich ALL games from Steam Store API
    enriched_count = 0
    for game in games:
        steam_game = game_service.get_game_info_by_id(game['appid'])
        if isinstance(steam_game, GameFetched):
            game["genres"] = steam_game.genres
            game["categories"] = steam_game.categories
            game["positive"] = steam_game.positive
            game["negative"] = steam_game.negative
            enriched_count += 1

    logger.info(f"Enriched {enriched_count} games from Steam Store API out of {len(games)} total")

    logger.info(f"Fetched and enriched {len(games)} owned games for Steam ID: {steam_id}")
    return {"owned_games": games, "status": 200}

@router.get("/owned-games/enriched/vanity/{vanity_url}")
def get_owned_games_enriched(vanity_url: str, steam_user_service: SteamUserService = Depends(get_steam_user_service), game_service: GameService = Depends(get_games_service), logger = Depends(get_logger)) -> dict[str, list[dict] | str | int]:
    """Get owned games for a given vanity URL with enrichment from Steam Store API"""
    logger.info(f"Fetching enriched owned games for vanity URL: {vanity_url}")
    games = steam_user_service.get_owned_games_by_vanity_url(vanity_url)

    if not games:
        logger.warning(f"No owned games found for vanity URL: {vanity_url}")
        return {"message": "No owned games found for the provided vanity URL", "status": 404}

    # Sort by playtime to get top played games
    games.sort(key=lambda x: x.get("playtime_forever", 0), reverse=True)

    # Enrich ALL games from Steam Store API
    enriched_count = 0
    for game in games:
        steam_game = game_service.get_game_info_by_id(game['appid'])
        if isinstance(steam_game, GameFetched):
            game["genres"] = steam_game.genres
            game["categories"] = steam_game.categories
            game["positive"] = steam_game.positive
            game["negative"] = steam_game.negative
            enriched_count += 1

    logger.info(f"Enriched {enriched_count} games from Steam Store API out of {len(games)} total")

    logger.info(f"Fetched and enriched {len(games)} owned games for vanity URL: {vanity_url}")
    return {"owned_games": games, "status": 200}

@router.get("/get-game-info-by-id/{app_id}", response_model=GetGameInfoResponse)
def get_game_info_by_id(app_id: int, game_service: GameService = Depends(get_games_service), logger = Depends(get_logger)) -> GetGameInfoResponse:
    """Get game enhanced game info by id """
    try:
        data = game_service.get_game_info_by_id(app_id)
        if not data:
            raise Exception
        
        return GetGameInfoResponse(
            data = data,
            message=f"Succesfully fetched info about app {app_id}",
            status=200
        )

    except Exception as e:
        logger.error(f"Failed to get game-info: {e}")
        return GetGameInfoResponse(
            message=f"Failed while trying to get game-info {e}",
            status=500
        )