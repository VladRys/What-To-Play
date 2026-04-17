from pydantic import BaseModel

class Game(BaseModel):
    appid: int
    name: str
    genres: str | None
    categories: str | None
    is_free: bool
    positive: int
    negative: int
    
class FilteredGamesRequest(BaseModel):
    vibe: str | None = None
    is_user_library: bool = False
    library: list[Game] = []
    
class FilteredGamesResponse(BaseModel):
    games: list[Game] | list = []
    vibe: str | None = None
    message: str | None = None
    is_user_library: bool | None = None
    status: int = 404

class VibesGamesResponse(BaseModel):
    games: list[Game] | list = []
    vibe: str
    message: str
    status: int = 404