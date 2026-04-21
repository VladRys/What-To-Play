from fastapi import APIRouter, Depends
from backend.app.dependencies import get_games_repo, get_logger, get_games_service
from backend.app.schemas.games import FilteredGamesRequest, FilteredGamesResponse, VibesGamesResponse
from backend.app.exceptions import UnknownVibeException
from backend.app.services.games_service import GameService
import random

from backend.app.config import config

router = APIRouter()

@router.get("/random")
def random_game(repo = Depends(get_games_repo), logger = Depends(get_logger), service = Depends(get_games_service)) -> dict[str, str | dict | int]:
    """Get a random game from local database (NO STEAM API using) w/o filters"""
    return service.get_random_steam_game_no_filters()

# TODO: completely refactor this endpoint, it's a mess, but it works for now, will be improved in the future
@router.get("/games/random")
def get_random_games(count: int = 6, exclude: str | None = None, solo: bool | None = None, mood: str | None = None, repo = Depends(get_games_repo)):
    try:
        games = repo.filter_games_by_genre()
        exclude_list = exclude.split(',') if exclude else []

        filtered_games = [game for game in games if str(game[0]) not in exclude_list]

        if solo is not None:
            if solo:
                filtered_games = [game for game in filtered_games if game[3] and 'multi-player' not in game[3].lower()]
            else:
                filtered_games = [game for game in filtered_games if game[3] and 'multi-player' in game[3].lower()]

        if mood:
            mood_lower = mood.lower()
            if 'chill' in mood_lower:
                chill_genres = ['casual', 'indie', 'simulation', 'strategy', 'puzzle', 'platformer']
                mood_filtered = [game for game in filtered_games if game[2] and any(g in game[2].lower() for g in chill_genres)]
                if len(mood_filtered) >= count:
                    filtered_games = mood_filtered
            elif 'sweat' in mood_lower:
                sweat_genres = ['action', 'rpg', 'adventure', 'racing', 'fighting']
                mood_filtered = [game for game in filtered_games if game[2] and any(g in game[2].lower() for g in sweat_genres)]
                if len(mood_filtered) >= count:
                    filtered_games = mood_filtered
            elif 'think' in mood_lower:
                think_genres = ['strategy', 'simulation', 'rpg', 'indie', 'strategy']
                mood_filtered = [game for game in filtered_games if game[2] and any(g in game[2].lower() for g in think_genres)]
                if len(mood_filtered) >= count:
                    filtered_games = mood_filtered

        if len(filtered_games) == 0:
            return {"games": []}
        selected = random.sample(filtered_games, min(count, len(filtered_games)))

        result = []
        for game in selected:
            result.append({
                "appid": game[0],
                "name": game[1],
                "genres": game[2],
                "categories": game[3],
                "is_free": bool(game[4]),
                "positive": game[5],
                "negative": game[6]
            })
        return {"games": result}
    except Exception as e:
        return {"games": [], "error": str(e), "message": "Database access error"}

@router.get("/games/vibe/{vibe}", response_model=VibesGamesResponse)
def get_games_by_vibe(vibe: str, repo = Depends(get_games_repo), logger = Depends(get_logger)) -> VibesGamesResponse:
    """Get 3 games from different genres based on vibe (chill/sweat/brain)"""
    try:
        games = repo.get_games_by_vibe(vibe)
        return VibesGamesResponse(
            games=games,
            vibe=vibe,
            status=200,
            message=f"Succesfully fetched games by vibe from /games/vibe/{vibe}"
        )
    except UnknownVibeException:
        msg = f"Uknown vibe: {vibe}, no games was returned. Use {config.VIBES_MAP.keys()}."
        
        logger.warning(msg)
        return VibesGamesResponse(
            message=msg, vibe=vibe
        )
    except Exception as e:
        logger.error(f"Error getting games by vibe '{vibe}': {str(e)}")
        return VibesGamesResponse(vibe=vibe, message="Error getting games by vibe.")
    
@router.post("/games/filters", response_model=FilteredGamesResponse)
def get_games_with_filters(request: FilteredGamesRequest, logger = Depends(get_logger), game_service: GameService = Depends(get_games_service)) -> FilteredGamesResponse:    
    """Get games based on filters. Can be used to get games from user library (rn only fully random game) or get ganes based on filters from local database"""
    logger.info(f"Fetching games with filters - Vibe: {request.vibe}, Player counts: {request.player_counts}, Time Perf: {request.time_perf} Is User Library: {request.is_user_library}, User Library Count: {len(request.user_library) if request.user_library else 0}")
    response = game_service.get_smart_filtered_games(request.user_library, request.is_user_library, request.vibe, request.player_counts, request.time_perf)
    return FilteredGamesResponse(
        games = response,
        vibe=request.vibe,
        player_counts=request.player_counts,
        time_perf=request.time_perf,
        is_user_library=request.is_user_library,
        message="Successfully smart filtered games from user library.",
        status=200
    )