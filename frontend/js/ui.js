// UI functions - popups and overlays

import { translations } from "./config.js";

// Flag to prevent multiple popups from showing simultaneously
let popupVisible = false;

export function showErrorPopup(message, currentLang = "en") {
  // Display error popup with overlay
  // Returns early if another popup is already visible to prevent overlap
  console.log("showErrorPopup called, popupVisible:", popupVisible, "message:", message);
  if (popupVisible) return;
  popupVisible = true;
  console.log("popupVisible set to true");
  const overlay = $('<div class="error-popup-overlay"></div>');
  const popup = $(`
    <div class="error-popup">
      <div class="error-popup-content">
        <div class="error-popup-icon">⚠️</div>
        <h3>${translations[currentLang]["error-title"]}</h3>
        <p>${message}</p>
      </div>
    </div>
  `);

  $("html").append(overlay);
  $("html").append(popup);

  overlay.hide().fadeIn(300);
  // Animate popup entrance with slide-up and fade-in effect
  popup.css({ opacity: 0, transform: "translate(-50%, -40%)" }).show().animate(
    {
      opacity: 1,
      marginTop: "-=20px",
    },
    300,
  );

  // Auto-hide popup after 1.2 seconds
  setTimeout(() => {
    popup.animate(
      {
        opacity: 0,
        marginTop: "+=20px",
      },
      300,
      () => {
        popup.remove();
        overlay.fadeOut(300, () => {
          overlay.remove();
          popupVisible = false;
        });
      },
    );
  }, 1200);
}

export function showSuccessPopup(message) {
  // Display success popup with overlay
  // Returns early if another popup is already visible to prevent overlap
  if (popupVisible) return;
  popupVisible = true;

  const overlay = $('<div class="success-popup-overlay"></div>');
  const popup = $(`
    <div class="success-popup">
      <div class="success-popup-content">
        <div class="success-popup-icon">✓</div>
        <h3>Success</h3>
        <p>${message}</p>
      </div>
    </div>
  `);

  $("html").append(overlay);
  $("html").append(popup);

  overlay.hide().fadeIn(300);
  // Animate popup entrance with fade-in effect only
  popup.css({ opacity: 0, transform: "translate(-50%, -50%)" }).show().animate(
    {
      opacity: 1,
    },
    300,
  );

  // Auto-hide popup after 1.2 seconds
  setTimeout(() => {
    popup.animate(
      {
        opacity: 0,
      },
      300,
      () => {
        popup.remove();
        overlay.fadeOut(300, () => {
          overlay.remove();
          popupVisible = false;
        });
      },
    );
  }, 1200);
}

export function resetPopupVisible() {
  // Reset popup visibility flag to allow new popups to show
  // Used when we want to force a popup to appear even if one was recently shown
  popupVisible = false;
}

export function getPopupVisible() {
  // Check if a popup is currently visible
  return popupVisible;
}

export function showLoadingOverlay() {
  // Show the loading overlay with blur effect and centered text
  // Used during game fetching to provide visual feedback
  const overlay = $("#loadingOverlay");
  if (overlay.length) {
    overlay.addClass("active");
  }
}

export function hideLoadingOverlay() {
  // Hide the loading overlay
  // Called after game cards finish animating or on error
  const overlay = $("#loadingOverlay");
  if (overlay.length) {
    overlay.removeClass("active");
  }
}

export function showConfirmPopup(message, currentLang = "en", onConfirm) {
  // Display confirmation popup with OK/Cancel buttons
  // Returns early if another popup is already visible to prevent overlap
  if (popupVisible) return;
  popupVisible = true;

  const overlay = $('<div class="confirm-popup-overlay"></div>');
  const popup = $(`
    <div class="confirm-popup">
      <div class="confirm-popup-content">
        <div class="confirm-popup-icon">❓</div>
        <h3>Confirm</h3>
        <p>${message}</p>
        <div class="confirm-popup-buttons">
          <button class="confirm-btn cancel-btn">Cancel</button>
          <button class="confirm-btn confirm-ok-btn">OK</button>
        </div>
      </div>
    </div>
  `);

  $("html").append(overlay);
  $("html").append(popup);

  overlay.hide().fadeIn(300);
  popup.css({ opacity: 0, transform: "translate(-50%, -50%)" }).show().animate(
    {
      opacity: 1,
    },
    300,
  );

  // Handle button clicks
  popup.find(".cancel-btn").on("click", function() {
    popup.animate(
      {
        opacity: 0,
      },
      300,
      () => {
        popup.remove();
        overlay.fadeOut(300, () => {
          overlay.remove();
          popupVisible = false;
        });
      },
    );
  });

  popup.find(".confirm-ok-btn").on("click", function() {
    popup.animate(
      {
        opacity: 0,
      },
      300,
      () => {
        popup.remove();
        overlay.fadeOut(300, () => {
          overlay.remove();
          popupVisible = false;
          if (onConfirm) onConfirm();
        });
      },
    );
  });
}
