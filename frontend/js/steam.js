// Steam library functionality - fetches and manages user's Steam game library

import {
  showErrorPopup,
  showSuccessPopup,
  resetPopupVisible,
  getPopupVisible,
  showConfirmPopup,
} from "./ui.js";
import { translations } from "./config.js";

// Input mode for Steam: "id" for 17-digit Steam ID, "nickname" for vanity URL
export let steamInputMode = "nickname"; // Default to nickname mode

export function toggleSteamMode() {
  // Toggle between Steam ID and nickname input modes
  // Updates button text and input placeholder accordingly
  steamInputMode = steamInputMode === "id" ? "nickname" : "id";
  $("#toggleSteamMode").text(steamInputMode === "id" ? "SteamID" : "Nickname");
  $("#steamNickname").attr(
    "placeholder",
    steamInputMode === "id" ? "Enter Steam ID..." : "Enter Steam nickname...",
  );
  console.log("Steam input mode changed to:", steamInputMode);
}

export function fetchSteamLibrary(currentLang) {
  // Fetch user's Steam game library using either Steam ID or nickname
  // Parameters:
  //   currentLang: current language code for popup messages
  const inputValue = $("#steamNickname").val().trim();

  // Validate that input is not empty
  if (!inputValue) {
    showErrorPopup(
      steamInputMode === "id"
        ? "Please enter Steam ID"
        : "Please enter Steam nickname",
      currentLang,
    );
    return;
  }

  // Auto-detect input type regardless of selected mode
  // Steam ID: exactly 17 digits
  // Nickname: alphanumeric with underscores and dashes
  const looksLikeID = /^\d{17}$/.test(inputValue);
  const looksLikeNickname = /^[a-zA-Z0-9_-]+$/.test(inputValue) && !looksLikeID;

  // Determine actual input type based on detection
  let actualInputType = steamInputMode;
  if (looksLikeID) actualInputType = "id";
  else if (looksLikeNickname) actualInputType = "nickname";

  // Show warning if selected mode doesn't match detected type
  // Auto-corrects to the detected type without blocking the operation
  if (steamInputMode !== actualInputType) {
    const modeName = actualInputType === "id" ? "ID" : "nickname";
    // Temporarily reset flag to allow this popup to show
    resetPopupVisible();
    showSuccessPopup(
      `Detected ${modeName} mode. Proceeding with ${modeName}...`,
    );
  }

  // Show loading state on button with spinner animation
  const $btn = $("#fetchSteamLibrary");
  const originalText = $btn.html();
  $btn
    .prop("disabled", true)
    .html(
      '<span class="icon-wrapper"><iconify-icon icon="fa-solid:spinner" class="fa-spin"></iconify-icon></span>Loading...',
    );

  // Use appropriate endpoint based on detected input type
  // ID endpoint: /owned-games/id/{steam_id}
  // Nickname endpoint: /owned-games/vanity/{vanity_url}
  const url =
    actualInputType === "id"
      ? `http://127.0.0.1:8000/owned-games/id/${inputValue}`
      : `http://127.0.0.1:8000/owned-games/vanity/${inputValue}`;

  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      // Restore button state after fetch completes
      $btn.prop("disabled", false).html(originalText);

      // Handle fetch errors
      if (data.error || data.status === 404) {
        showErrorPopup(
          data.message || data.error || "Failed to fetch library",
          currentLang,
        );
        return;
      }

      const games = data.owned_games || [];
      console.log(`Fetched ${games.length} games from Steam library`);

      // Save Steam library data to localStorage for future use
      // steamLibraryAppids: array of game appids for quick filtering
      // steamLibrary: full game objects with metadata
      const appids = games.map((game) => game.appid);
      localStorage.setItem("steamLibraryAppids", JSON.stringify(appids));
      localStorage.setItem("steamLibrary", JSON.stringify(games));

      // Call /games/filters endpoint to pre-filter games from user's library
      // This prepares the backend to filter recommendations based on owned games
      const params = new URLSearchParams();
      params.append("is_user_library", "true");
      params.append("user_library", JSON.stringify(games));

      fetch(`http://127.0.0.1:8000/games/filters?${params.toString()}`)
        .then((r) => r.json())
        .then((filterData) => {
          console.log("Filter response:", filterData);

          // Reset flag to allow success popup to show
          resetPopupVisible();
          // Show success message indicating library was successfully fetched
          showSuccessPopup(
            `Successfully fetched ${games.length} games from library`,
          );
        })
        .catch((error) => {
          console.error("Error calling filters endpoint:", error);

          // Reset flag to allow success popup to show
          resetPopupVisible();
          // Show success message even if filters call fails (library was still fetched successfully)
          showSuccessPopup(
            `Successfully fetched ${games.length} games from library`,
          );
        });
    })
    .catch((error) => {
      console.error("Error fetching Steam library:", error);
      // Restore button state on error
      $btn.prop("disabled", false).html(originalText);
      showErrorPopup(translations[currentLang]["server-error"], currentLang);
    });
}

export function clearNickname(currentLang) {
  // Clear the Steam nickname field with user confirmation
  const inputValue = $("#steamNickname").val().trim();

  // Only show confirmation if there's actually something to clear
  if (!inputValue) {
    return;
  }

  // Show custom confirmation popup
  showConfirmPopup(
    translations[currentLang]["confirm-clear-nickname"],
    currentLang,
    () => {
      $("#steamNickname").val("");
    }
  );
}
