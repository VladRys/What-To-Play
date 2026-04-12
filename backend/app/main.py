from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routers.games import router as games_router
from backend.app.routers.steam import router as steam_router

import logging

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.include_router(games_router)
app.include_router(steam_router)

@app.get("/")
def home():
    """Test route to check if API is working"""
    logger.info("Home route accessed")
    return {"message": "API is working"}