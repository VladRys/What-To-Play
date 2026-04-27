import { translations } from "./config.js";

let popupVisible = false;

export function showErrorPopup(message, currentLang = "en") {
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
  popup.css({ opacity: 0, transform: "translate(-50%, -50%)" }).show().animate(
    {
      opacity: 1,
    },
    300,
  );

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
  popupVisible = false;
}

export function getPopupVisible() {
  return popupVisible;
}

export function showLoadingOverlay() {
  const overlay = $("#loadingOverlay");
  if (overlay.length) {
    overlay.addClass("active");
  }
}

export function showLoadingOverlayWithText(text) {
  const overlay = $("#loadingOverlay");
  const loadingText = $("#loadingText");
  if (overlay.length) {
    loadingText.text(text);
    overlay.addClass("active");
  }
}

export function hideLoadingOverlay(currentLang = "en") {
  const overlay = $("#loadingOverlay");
  if (overlay.length) {
    overlay.removeClass("active");
    $("#loadingText").text(translations[currentLang].loading);
  }
}

export function showConfirmPopup(message, currentLang = "en", onConfirm) {
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

  popup.find(".cancel-btn").on("click", function () {
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

  popup.find(".confirm-ok-btn").on("click", function () {
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
