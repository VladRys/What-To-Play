from fastapi import APIRouter, Depends
from backend.app.dependencies import get_logger, get_games_service
from backend.app.schemas.games import FilteredGamesRequest, FilteredGamesResponse, UserLibraryRequest
from backend.app.services.games_service import GameService

router = APIRouter()

@router.get("/random")
def random_game(service = Depends(get_games_service)) -> dict[str, str | dict | int]:
    """Get a random game from local database (NO STEAM API using) no filters"""
    return service.get_random_steam_game_no_filters()

@router.post("/random/library")
def random_game_from_library(request: UserLibraryRequest, service: GameService = Depends(get_games_service)) -> dict | None:
    """Get a random game from user steam library. (Also no Steam API using) no filters"""
    return service.get_random_game_from_library(request.user_library, request.seen_games)

@router.post("/games/filters", response_model=FilteredGamesResponse)
def get_games_with_filters(request: FilteredGamesRequest, logger = Depends(get_logger), game_service: GameService = Depends(get_games_service)) -> FilteredGamesResponse:
    """Get games based on filters. Can be used to get games from user library (rn only fully random game) or get ganes based on filters from local database"""
    logger.info(f"Fetching games with filters - Vibe: {request.vibe}, Player counts: {request.player_counts}, Time Pref: {request.time_pref} Is User Library: {request.is_user_library}, User Library Count: {len(request.user_library) if request.user_library else 0}")
    response = game_service.get_smart_filtered_games(request.user_library, request.is_user_library, request.vibe, request.player_counts, request.time_pref, request.seen_games)
    return FilteredGamesResponse(
        games = response,
        vibe=request.vibe,
        player_counts=request.player_counts,
        time_pref=request.time_pref,
        is_user_library=request.is_user_library,
        message="Successfully smart filtered games from user library.",
        status=200
    )