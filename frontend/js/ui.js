// UI functions

import { translations } from "./config.js";

let popupVisible = false;

export function showErrorPopup(message, currentLang = "en") {
  if (popupVisible) return;
  popupVisible = true;
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
  popup.css({ opacity: 0, transform: "translate(-50%, -40%)" }).show().animate(
    {
      opacity: 1,
      marginTop: "-=20px",
    },
    300,
  );

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
  popup.css({ opacity: 0, transform: "translate(-50%, -40%)" }).show().animate(
    {
      opacity: 1,
      marginTop: "-=20px",
    },
    300,
  );

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

export function resetPopupVisible() {
  popupVisible = false;
}

export function getPopupVisible() {
  return popupVisible;
}
