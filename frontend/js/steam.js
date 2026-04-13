// Steam library functionality

import {
  showErrorPopup,
  showSuccessPopup,
  resetPopupVisible,
  getPopupVisible,
} from "./ui.js";

export let steamInputMode = "nickname"; // Default to nickname mode

export function toggleSteamMode() {
  steamInputMode = steamInputMode === "id" ? "nickname" : "id";
  $("#toggleSteamMode").text(steamInputMode === "id" ? "SteamID" : "Nickname");
  $("#steamNickname").attr(
    "placeholder",
    steamInputMode === "id" ? "Enter Steam ID..." : "Enter Steam nickname...",
  );
  console.log("Steam input mode changed to:", steamInputMode);
}

export function fetchSteamLibrary(currentLang) {
  const inputValue = $("#steamNickname").val().trim();

  if (!inputValue) {
    showErrorPopup(
      steamInputMode === "id"
        ? "Please enter Steam ID"
        : "Please enter Steam nickname",
      currentLang,
    );
    return;
  }

  // Detect input type
  const looksLikeID = /^\d{17}$/.test(inputValue);
  const looksLikeNickname = /^[a-zA-Z0-9_-]+$/.test(inputValue) && !looksLikeID;

  // Determine actual input type
  let actualInputType = steamInputMode;
  if (looksLikeID) actualInputType = "id";
  else if (looksLikeNickname) actualInputType = "nickname";

  // Show warning if mode doesn't match detected type (without blocking other popups)
  if (steamInputMode !== actualInputType) {
    const modeName = actualInputType === "id" ? "ID" : "nickname";
    // Temporarily reset flag to allow this popup
    resetPopupVisible();
    showSuccessPopup(
      `Detected ${modeName} mode. Proceeding with ${modeName}...`,
    );
  }

  // Show loading state
  const $btn = $("#fetchSteamLibrary");
  const originalText = $btn.html();
  $btn
    .prop("disabled", true)
    .html(
      '<span class="icon-wrapper"><iconify-icon icon="fa-solid:spinner" class="fa-spin"></iconify-icon></span>Loading...',
    );

  // Use appropriate endpoint based on detected type
  const url =
    actualInputType === "id"
      ? `http://127.0.0.1:8000/owned-games/id/${inputValue}`
      : `http://127.0.0.1:8000/owned-games/vanity/${inputValue}`;

  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      // Restore button state
      $btn.prop("disabled", false).html(originalText);

      if (data.error || data.status === 404) {
        showErrorPopup(
          data.message || data.error || "Failed to fetch library",
          currentLang,
        );
        return;
      }

      const games = data.owned_games || [];
      console.log(`Fetched ${games.length} games from Steam library`);

      // Save Steam library data to localStorage
      const appids = games.map((game) => game.appid);
      localStorage.setItem("steamLibraryAppids", JSON.stringify(appids));
      localStorage.setItem("steamLibrary", JSON.stringify(games));

      // Reset flag to allow success popup to show
      resetPopupVisible();
      // Show success message
      showSuccessPopup(
        `Successfully fetched ${games.length} games from library`,
      );
    })
    .catch((error) => {
      console.error("Error fetching Steam library:", error);
      $btn.prop("disabled", false).html(originalText);
      showErrorPopup(translations[currentLang]["server-error"], currentLang);
    });
}
