// Game-related functionality

import { moodToVibe, translations } from "./config.js";
import { showErrorPopup, showSuccessPopup, resetPopupVisible, showLoadingOverlay, hideLoadingOverlay } from "./ui.js";

export function displayGames(games) {
  // Load previously seen games from localStorage to avoid duplicates
  const seenGames = new Set(
    localStorage.getItem("seenGames")?.split(",") || [],
  );
  const $gameResult = $("#gameResult").empty().show();

  games.forEach((game, index) => {
    const Image = `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
    const genres = game.genres || "Unknown Genre";
    const categories = game.categories || "";
    const isMultiplayer = categories.toLowerCase().includes("multi-player");

    const $card = $(`
      <div class="game-card" style="opacity: 0; transform: translateY(30px); filter: blur(10px);" data-appid="${game.appid}" data-game-name="${game.name || "Unknown Game"}">
        <div class="glow"></div>
        <div class="game-banner">
          <img src="${Image}" alt="Game Banner">
        </div>
        <div class="game-info">
          <h3 class="game-title">${game.name || "Unknown Game"}</h3>
          <p class="game-genre">${typeof genres === "string" ? genres : genres.join(", ")}</p>
          <div class="game-meta">
            <span class="game-time">${game.is_free ? "Free to Play" : "Paid"}</span>
            <span class="game-difficulty">${game.positive || 0 > game.negative || 0 ? "Positive Reviews" : "Mixed Reviews"}</span>
            ${isMultiplayer ? '<span class="game-friends">With Friends</span>' : ""}
          </div>
        </div>
      </div>
    `);

    $gameResult.append($card);
    seenGames.add(game.appid);

    // Animate card appearance with staggered delay (each card appears 150ms after the previous)
    setTimeout(
      () => {
        $card.css({
          opacity: 1,
          transform: "translateY(0)",
          filter: "blur(0px)",
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        });
      },
      50 + index * 150,
    );
  });

  // Save seen games to localStorage to remember them for future requests
  localStorage.setItem("seenGames", Array.from(seenGames).join(","));

  // Hide loading overlay after all card animations complete
  // Calculate max delay: 50ms initial + 150ms per card + 500ms animation duration
  const maxDelay = 50 + games.length * 150;
  setTimeout(() => {
    hideLoadingOverlay();
  }, maxDelay + 500);

  // Enable requirements button when games are displayed
  $("#checkRequirements")
    .prop("disabled", false)
    .css({ opacity: 1, cursor: "pointer" });
}

export function findGames(userState, currentLang) {
  // Convert mood text to vibe parameter (chill/sweat/brain)
  const vibe = userState.mood ? moodToVibe[userState.mood] : null;

  // Show loading overlay immediately when search starts
  showLoadingOverlay();

  if (vibe) {
    // Check if user entered Steam nickname/ID to filter by their library
    const steamNickname = $("#steamNickname").val().trim();

    if (steamNickname) {
      // Detect if input is Steam ID (17 digits) or vanity URL nickname
      const isSteamId = /^\d{17}$/.test(steamNickname);
      const steamUrl = isSteamId
        ? `http://127.0.0.1:8000/owned-games/id/${steamNickname}`
        : `http://127.0.0.1:8000/owned-games/vanity/${steamNickname}`;

      fetch(steamUrl)
        .then((r) => r.json())
        .then((libraryData) => {
          if (libraryData.error || libraryData.status === 404) {
            hideLoadingOverlay();
            resetPopupVisible();
            showErrorPopup(
              libraryData.message || "Failed to fetch Steam library",
              currentLang,
            );
            return;
          }

          const userLibrary = libraryData.owned_games || [];

          // Save user's Steam library to localStorage for future use
          localStorage.setItem("steamLibrary", JSON.stringify(userLibrary));

          // Send POST request to /games/filters with library in body
          // This endpoint filters games from user's library based on vibe
          const payload = {
            vibe: vibe,
            is_user_library: true,
            library: userLibrary
          };

          fetch("http://127.0.0.1:8000/games/filters", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.error) {
                hideLoadingOverlay();
                resetPopupVisible();
                showErrorPopup(
                  data.message || "Failed to fetch games",
                  currentLang,
                );
                return;
              }

              const games = data.games || [];

              if (games.length === 0) {
                hideLoadingOverlay();
                resetPopupVisible();
                showErrorPopup("No games found", currentLang);
                return;
              }

              displayGames(games);
            })
            .catch((error) => {
              console.error("Error fetching games:", error);
              hideLoadingOverlay();
              resetPopupVisible();
              showErrorPopup(translations[currentLang]["server-error"], currentLang);
            });
        })
        .catch((error) => {
          console.error("Error fetching Steam library:", error);
          hideLoadingOverlay();
          resetPopupVisible();
          showErrorPopup(translations[currentLang]["server-error"], currentLang);
        });
    } else {
      // Use regular vibe endpoint without Steam library filtering
      // Returns 3 random games matching the vibe from the full database
      fetch(`http://127.0.0.1:8000/games/vibe/${vibe}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            hideLoadingOverlay();
            resetPopupVisible();
            showErrorPopup(
              data.message || "Failed to fetch games by vibe",
              currentLang,
            );
            return;
          }

          const games = data.games || [];

          if (games.length === 0) {
            hideLoadingOverlay();
            resetPopupVisible();
            showErrorPopup("No games found for this vibe", currentLang);
            return;
          }

          displayGames(games);
        })
        .catch((error) => {
          console.error("Error fetching games by vibe:", error);
          hideLoadingOverlay();
          resetPopupVisible();
          showErrorPopup(translations[currentLang]["server-error"], currentLang);
        });
    }
  } else {
    // Fallback to old endpoint if no vibe selected (legacy behavior)
    // Uses time/single/mood filters without vibe-based recommendation
    const seenGames = localStorage.getItem("seenGames") || "";

    const params = new URLSearchParams();
    if (seenGames) params.append("exclude", seenGames);
    if (userState.single !== null && userState.single !== undefined)
      params.append("solo", userState.single);
    if (userState.mood) params.append("mood", userState.mood);
    if (userState.time) params.append("time", userState.time);

    fetch(`http://127.0.0.1:8000/games/random?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          resetPopupVisible();
          showErrorPopup(data.message || "Database access error", currentLang);
          return;
        }

        const games = data.games || [];

        if (games.length === 0) {
          if (data.message) {
            resetPopupVisible();
            showErrorPopup(data.message, currentLang);
            return;
          }
          // If no games found with exclusions, try again without them
          localStorage.removeItem("seenGames");
          const params2 = new URLSearchParams();
          if (userState.single !== null && userState.single !== undefined)
            params2.append("solo", userState.single);
          if (userState.mood) params2.append("mood", userState.mood);
          if (userState.time) params2.append("time", userState.time);

          fetch(`http://127.0.0.1:8000/games/random?${params2.toString()}`)
            .then((r) => r.json())
            .then((data) => {
              if (data.error) {
                resetPopupVisible();
                showErrorPopup(
                  data.message || "Database access error",
                  currentLang,
                );
                return;
              }
              const games = data.games || [];
              if (games.length === 0) {
                resetPopupVisible();
                showErrorPopup(
                  "No games found matching your criteria",
                  currentLang,
                );
                return;
              }
              displayGames(games);
            });
          return;
        }

        displayGames(games);
      })
      .catch((error) => {
        hideLoadingOverlay();
        resetPopupVisible();
        showErrorPopup(translations[currentLang]["server-error"], currentLang);
      });
    }
}


export function dontCare(currentLang) {
  // Show loading overlay when fetching random game
  showLoadingOverlay();

  // Fetch a completely random game from the database (no filters applied)
  fetch("http://127.0.0.1:8000/random")
    .then((r) => r.json())
    .then((data) => {
      const game = data.game || {};
      const Image = data.header_image || "img/testimg.png";
      const genres = game.genres || "Unknown Genre";
      const categories = game.categories || "";
      const isMultiplayer = categories.toLowerCase().includes("multi-player");
      const gameCard = `
        <div class="game-card" style="opacity: 0; transform: translateY(30px); filter: blur(10px);" data-appid="${game.appid}" data-game-name="${game.name || "Unknown Game"}">
          <div class="glow"></div>
          <div class="game-banner">
            <img src="${Image}" alt="Game Banner">
          </div>
          <div class="game-info">
            <h3 class="game-title">${game.name || "Unknown Game"}</h3>
            <p class="game-genre">${typeof genres === "string" ? genres : genres.join(", ")}</p>
            <div class="game-meta">
              <span class="game-time">${game.is_free ? "Free to Play" : "Paid"}</span>
              <span class="game-difficulty">${game.positive || 0 > game.negative || 0 ? "Positive Reviews" : "Mixed Reviews"}</span>
              ${isMultiplayer ? '<span class="game-friends">With Friends</span>' : ""}
            </div>
          </div>
        </div>
      `;
      const $card = $(gameCard);
      $("#gameResult").html($card).show();

      // Animate card appearance (single card, no stagger needed)
      setTimeout(() => {
        $card.css({
          opacity: 1,
          transform: "translateY(0)",
          filter: "blur(0px)",
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        });
      }, 50);

      // Hide loading overlay after animation completes
      // 50ms initial delay + 500ms animation duration
      setTimeout(() => {
        hideLoadingOverlay();
      }, 550);
    })
    .catch((error) => {
      hideLoadingOverlay();
      resetPopupVisible();
      showErrorPopup(translations[currentLang]["server-error"], currentLang);
    });
}
