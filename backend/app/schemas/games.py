from pydantic import BaseModel


class Game(BaseModel):
    appid: int
    name: str
    
class GameFetched(Game):
    """Pydantic model for Steam-api base fetched game"""
    genres: str | None
    categories: str | None
    is_free: bool
    positive: int
    negative: int
    header_image: str | None = None

class UserLibraryGame(Game):
    playtime_forever: int | None
    img_icon_url: str | None

class FilteredGamesRequest(BaseModel):
    is_user_library: bool = False
    user_library: list[UserLibraryGame] = []
    vibe: str | None = None
    player_counts: str | None = None
    time_perf: str | None = None
    
class FilteredGamesResponse(BaseModel):
    games: list[Game] | list[GameFetched] | list = []
    vibe: str | None = None
    player_counts: str | None = None
    time_perf: str | None = None
    message: str | None = None
    is_user_library: bool | None = False
    status: int = 404

class VibesGamesResponse(BaseModel):
    games: list[Game] | list = []
    vibe: str
    message: str
    status: int = 404
    
class GetGameInfoResponse(BaseModel):
    """Pydantic model for Steam-API base fetch info about game"""
    data: GameFetched | list[GameFetched] | list = []
    message: str
    status: int
    
    