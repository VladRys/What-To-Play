# What to Play

A web application that helps users discover new games to play based on Steam store or their own library.

## Features

- Fetch user's Steam library by Steam ID or vanity URL
- Enrich game data with genres, categories, and reviews from Steam Store API
- Smart game filtering and recommendations based on user preferences (vibe, player count, time)
- Responsive web interface
- Async and parallel API requests for better performance

## Tech Stack

- **Backend**: FastAPI, Python 3.13
- **Frontend**: HTML, CSS, JavaScript
- **Database**: SQLite
- **APIs**: Steam Web API
- **Async HTTP**: httpx

## Installation

### Docker 

You can run the application using Docker:

1. Build the Docker image with your Steam API key:
   ```bash
   docker build --build-arg STEAM_API_KEY=your_steam_api_key_here -t what-to-play .
   ```

2. Run the container:
   ```bash
   docker run -p 8000:8000 what-to-play
   ```

3. Open the frontend:
   - Open `frontend/index.html` in your web browser
   - Or serve the frontend files with a web server

> **Note**: Building the Docker image will automatically populate the database with game data. If you skip the `STEAM_API_KEY` build arg, you'll need to build the database manually after running the container.

### Installation without Docker

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd what-to-play
   ```
2. Set up the backend:

   ```bash
   cd backend
   pip install -r app/requirements.txt
   ```
3. Create a `.env` file in the `backend/app` directory with your Steam API key:

   ```
   STEAM_API_KEY=your_steam_api_key_here
   DB_PATH=app.db
   ```
4. Build the local games database (this may take several minutes):

   ```bash
   cd backend
   python -m app.services.steam_db_builder
   ```

   > **Note**: This step fetches game data from Steam API and populates the local database. It processes ~5000 games by default and may take 10-15 minutes depending on your internet connection.
   >
5. Run the backend server:

   ```bash
   uvicorn app.main:app --reload
   ```
6. Open the frontend:

   - Open `frontend/index.html` in your web browser (You can also use Live server Vs Code extension)
   - Or serve the frontend files with a web server

## API Endpoints

### Steam Routes (`/steam/`)

- `GET /steam/owned-games/id/{steam_id}` - Get owned games by Steam ID
- `GET /steam/owned-games/vanity/{vanity_url}` - Get owned games by vanity URL
- `GET /steam/owned-games/enriched/id/{steam_id}` - Get enriched owned games by Steam ID (with genres, categories, reviews)
- `GET /steam/owned-games/enriched/vanity/{vanity_url}` - Get enriched owned games by vanity URL
- `GET /steam/get-game-info-by-id/{app_id}` - Get detailed game info by app ID

### Games Routes (`/games/`)

- `POST /games/filters` - Get smart filtered game recommendations based on user library and preferences
- `GET /games/random` - Get a random game from the database

## Usage

1. Enter your Steam ID or vanity URL in the web interface
2. Select your preferences:
   - Vibe (e.g., action, adventure, casual)
   - Player count (single/multiplayer)
   - Time preference (short/long sessions)
3. Get personalized game recommendations from your library

## Project Structure

```
what-to-play/
├── backend/
│   ├── app/
│   │   ├── config.py          # Configuration and constants
│   │   ├── dependencies.py    # Dependency injection
│   │   ├── exceptions.py      # Custom exceptions
│   │   ├── main.py            # FastAPI app setup
│   │   ├── db/
│   │   │   └── database.py    # SQLite database setup
│   │   ├── repositories/
│   │   │   ├── games.py       # Game data repository
│   │   │   └── utils.py       # Game scoring logic
│   │   ├── routers/
│   │   │   ├── games.py       # Games API routes
│   │   │   └── steam.py       # Steam API routes
│   │   ├── schemas/
│   │   │   └── games.py       # Pydantic models
│   │   └── services/
│   │       ├── games_service.py    # Game business logic
│   │       └── steam_user.py       # Steam API service
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── css/
│   │   ├── base.css
│   │   ├── buttons.css
│   │   ├── cards.css
│   │   ├── header.css
│   │   ├── keyframes.css
│   │   ├── layout.css
│   │   ├── main.css
│   │   ├── media.css
│   │   ├── popups.css
│   │   └── utilities.css
│   └── js/
│       ├── config.js
│       ├── games.js
│       ├── main.js
│       ├── steam.js
│       └── ui.js
├── Dockerfile
└── README.md
```

## Configuration

The application uses the following environment variables:

- `STEAM_API_KEY` - Your Steam Web API key (get from https://steamcommunity.com/dev/apikey)
- `DB_PATH` - Path to SQLite database file (default: `backend/app/db/steam_games.db`)

## Development

- Backend runs on `http://localhost:8000` by default
- API documentation available at `http://localhost:8000/docs`
- Frontend is static HTML/CSS/JS, no build process required

## Performance Optimizations

- Async HTTP requests using `httpx`
- Parallel fetching of game data with `asyncio.gather`
- Efficient database queries with SQLite

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
