// Game-related functionality

import { moodToVibe, translations, timeToDuration } from "./config.js";
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

  // Map UI values to backend filter values
  const duration = userState.time ? timeToDuration[userState.time] : null;
  const players = userState.single !== null && userState.single !== undefined
    ? (userState.single ? "Single-player" : "Multi-player")
    : null;

  // Validate that all filters are selected
  if (!vibe || !duration || !players) {
    resetPopupVisible();
    showErrorPopup(
      translations[currentLang]["select-all-filters"],
      currentLang,
    );
    return;
  }

  // Show loading overlay immediately when search starts
  showLoadingOverlay();

  // Use new /games/filters endpoint with smart filtering system
  const payload = {
    vibe: vibe,
    duration: duration,
    players: players,
    is_user_library: false,
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
