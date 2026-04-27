from backend.app.config import config as cfg

def calculate_game_score(game: dict, vibe: str | None, mode: str | None, time_pref: str | None) -> float:
    """Core logic for game filtering and sorting using for /games/filters router."""
    cfg_scoring = cfg.GAME_SCORING_CONFIG
    score = 0.0

    genres = set(g.strip() for g in (game.get("genres") or "").split(","))
    categories = set(c.strip() for c in (game.get("categories") or "").split(","))

    # --- HARD MODE FILTERING ---
    if mode:
        if mode == "single":
            if "Multi-player" in categories:
                return -9999
        elif mode == "multi":
            if "Multi-player" not in categories:
                return -9999

    # --- GENRE ---
    for genre in genres:
        score += cfg_scoring["genre_weights"].get(genre, {}).get(vibe, 0)

    # --- MODE ---
    if mode:
        for cat in categories:
            score += cfg_scoring["mode_weights"].get(cat, {}).get(mode, 0)

    # --- TIME ---
    if time_pref and time_pref in cfg.TIME_PROFILES:
        for genre in genres:
            score += cfg.TIME_PROFILES[time_pref].get(genre, 0)

    # --- RATING ---
    pos = game.get("positive") or 0
    neg = game.get("negative") or 0
    
    total = pos + neg
    if total > 0:
        score += (pos / total) * cfg_scoring["rating_weight"]

    return score