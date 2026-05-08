import { translations, moodToVibe } from "./config.js";
import { createParticle } from "./utils.js";
import { showErrorPopup, showSuccessPopup, resetPopupVisible } from "./ui.js";
import { displayGames, findGames, dontCare } from "./games.js";
import { toggleSteamMode, fetchSteamLibrary, clearNickname, steamInputMode, setupSteamInputListener } from "./steam.js";

$(document).ready(function () {
  $("#checkRequirements")
    .prop("disabled", true)
    .css({ opacity: 0.4, cursor: "not-allowed" });

  let currentLang = "en",
    userState = { time: null, mood: null, single: null },
    isResetAnimating = false;

  $(".option-btn, .action-btn").on("mousemove", function (e) {
    const rect = this.getBoundingClientRect();
    $(this).css({
      "--mouse-x": ((e.clientX - rect.left) / rect.width) * 100 + "%",
      "--mouse-y": ((e.clientY - rect.top) / rect.height) * 100 + "%",
    });
  });

  $("#fetchSteamLibrary").on("mousemove", function (e) {
    const rect = this.getBoundingClientRect();
    $(this).css({
      "--mouse-x": ((e.clientX - rect.left) / rect.width) * 100 + "%",
      "--mouse-y": ((e.clientY - rect.top) / rect.height) * 100 + "%",
    });
  });

  $("#toggleSteamMode").on("mousemove", function (e) {
    const rect = this.getBoundingClientRect();
    $(this).css({
      "--mouse-x": ((e.clientX - rect.left) / rect.width) * 100 + "%",
      "--mouse-y": ((e.clientY - rect.top) / rect.height) * 100 + "%",
    });
  });

  $("#clearNickname").on("mousemove", function (e) {
    const rect = this.getBoundingClientRect();
    $(this).css({
      "--mouse-x": ((e.clientX - rect.left) / rect.width) * 100 + "%",
      "--mouse-y": ((e.clientY - rect.top) / rect.height) * 100 + "%",
    });
  });

  $("#checkRequirements").on("mousemove", function (e) {
    const rect = this.getBoundingClientRect();
    $(this).css({
      "--mouse-x": ((e.clientX - rect.left) / rect.width) * 100 + "%",
      "--mouse-y": ((e.clientY - rect.top) / rect.height) * 100 + "%",
    });
  });

  $(document).on("mousemove", ".game-card", function (e) {
    const rect = this.getBoundingClientRect();
    $(this)
      .find(".glow")
      .css({
        "--mouse-x": ((e.clientX - rect.left) / rect.width) * 100 + "%",
        "--mouse-y": ((e.clientY - rect.top) / rect.height) * 100 + "%",
      });
  });

  $(".option-btn").on("click", function (e) {
    const rect = this.getBoundingClientRect();
    $('<span class="ripple"></span>')
      .css({
        left: e.clientX - rect.left + "px",
        top: e.clientY - rect.top + "px",
      })
      .appendTo(this);
    setTimeout(() => $(this).find(".ripple").remove(), 600);
  });

  $(".lang-btn").on("click", function () {
    $(".lang-btn").removeClass("active");
    $(this).addClass("active");
    currentLang = $(this).data("lang");

    const $els = $("[data-translate]");
    const texts = [];
    $els.each(function () {
      const key = $(this).data("translate");
      if (translations[currentLang]?.[key]) {
        const $icon = $(this).find(".icon-wrapper").clone();
        const currentWidth = $(this).outerWidth();
        texts.push({
          el: $(this),
          curr: $(this).text().trim(),
          new: translations[currentLang][key],
          icon: $icon.length ? $icon : "",
          width: currentWidth,
        });
      }
    });

    $("[data-translate-placeholder]").each(function () {
      const key = $(this).data("translate-placeholder");
      if (translations[currentLang]?.[key]) {
        const $input = $(this);
        const currentPlaceholder = $input.attr("placeholder") || "";
        const newPlaceholder = translations[currentLang][key];

        let i = 0,
          max = currentPlaceholder.length;
        const erasePlaceholder = setInterval(() => {
          if (i >= max) {
            clearInterval(erasePlaceholder);
            let j = 0,
              max2 = newPlaceholder.length;
            const writePlaceholder = setInterval(() => {
              if (j >= max2) {
                clearInterval(writePlaceholder);
              } else {
                $input.attr("placeholder", newPlaceholder.substring(0, j + 1));
                j++;
              }
            }, 10);
          } else {
            $input.attr(
              "placeholder",
              currentPlaceholder.substring(0, currentPlaceholder.length - i),
            );
            i++;
          }
        }, 10);
      }
    });

    $("#steamNickname, #toggleSteamMode, #steamCheckmark").css({
      filter: "blur(4px)",
      opacity: 0.5,
      transition: "all 0.2s ease",
    });

    $els.each(function () {
      const textData = texts.find((t) => t.el[0] === this);
      if (textData && !$(this).hasClass("subtitle")) {
        $(this).css("width", textData.width + "px");
      }
    });

    $els.css({
      filter: "blur(4px)",
      opacity: 0.5,
      transition: "all 0.2s ease",
    });
    $(".icon").css({
      filter: "blur(4px)",
      opacity: 0.5,
      transition: "all 0.2s ease",
    });

    setTimeout(() => {
      let i = 0,
        max = Math.max(...texts.map((t) => t.curr.length));
      const erase = setInterval(() => {
        if (i >= max) {
          clearInterval(erase);
          let j = 0,
            max2 = Math.max(...texts.map((t) => t.new.length));
          const write = setInterval(() => {
            if (j >= max2) {
              clearInterval(write);
              $els.css({ filter: "blur(0)", opacity: 1, width: "" });
              $(".icon").css({ filter: "blur(0)", opacity: 1 });
              $("#steamNickname, #toggleSteamMode, #steamCheckmark").css({
                filter: "blur(0)",
                opacity: 1,
              });
            } else {
              texts.forEach(
                (t) =>
                  j < t.new.length &&
                  t.el.html(t.icon).append(" " + t.new.substring(0, j + 1)),
              );
              j++;
            }
          }, 10);
        } else {
          texts.forEach(
            (t) =>
              i < t.curr.length &&
              t.el.html(t.icon).append(" " + t.curr.substring(0, t.curr.length - i)),
          );
          i++;
        }
      }, 10);
    }, 200);
  });

  $(".option-btn").on("click", function (e) {
    const $this = $(this);
    if ($this.hasClass("selected") || $this.hasClass("selecting")) return;

    const rect = this.getBoundingClientRect();
    this.style.setProperty(
      "--click-x",
      ((e.clientX - rect.left) / rect.width) * 100 + "%",
    );
    this.style.setProperty(
      "--click-y",
      ((e.clientY - rect.top) / rect.height) * 100 + "%",
    );

    // Unselect previously selected button in same group with fade-out animation
    $this.siblings(".selected").addClass("unselecting");

    setTimeout(() => {
      $this
        .siblings(".unselecting")
        .removeClass("selected unselecting")
        .find(".topo-flow")
        .remove();
    }, 300);
    $this.find(".topo-flow").length === 0 &&
      $this.append('<div class="topo-flow"></div>');
    $this.addClass("selecting");

    this.style.setProperty(
      "--curve-h",
      (Math.random() * 10 - 5).toFixed(1) + "deg",
    );
    this.style.setProperty(
      "--curve-v",
      (Math.random() * 10 - 5).toFixed(1) + "deg",
    );

    this.style.setProperty("--gradient-opacity", "0");
    this.style.setProperty("--topo-opacity", "0");

    setTimeout(() => {
      $this.addClass("selected fade-in").removeClass("selecting");

      let opacity = 0;
      const fadeIn = setInterval(() => {
        opacity += 0.02;
        this.style.setProperty("--gradient-opacity", opacity);
        if (opacity >= 1) {
          clearInterval(fadeIn);
          this.style.setProperty("--gradient-opacity", "1");
        }
      }, 16);

      setTimeout(() => {
        let topoOpacity = 0;
        const topoFadeIn = setInterval(() => {
          topoOpacity += 0.02;
          this.style.setProperty("--topo-opacity", topoOpacity);
          if (topoOpacity >= 1) {
            clearInterval(topoFadeIn);
            this.style.setProperty("--topo-opacity", "1");
          }
        }, 16);
      }, 300);
    }, 300);

    const idx = $this.closest(".question-section").index() + 1;
    const text = $this.text().trim().replace(/\s+/g, " ");

    if (idx === 1) userState.time = text;
    else if (idx === 2) userState.mood = text;
    else if (idx === 3) userState.single = text === "Solo" || text === "Соло";

    console.log(
      `dict user_state = { time = "${userState.time}", mood = "${userState.mood}", single = ${userState.single} }`,
    );
  });

  $("#reset").on("click", function (e) {
    if (isResetAnimating || $(".option-btn.selected").length === 0) return;
    isResetAnimating = true;

    $("#checkRequirements")
      .prop("disabled", true)
      .css({ opacity: 0.4, cursor: "not-allowed" });

    const $shockwave = $('<div class="shockwave"></div>')
      .css({
        position: "absolute",
        left: e.pageX + "px",
        top: e.pageY + "px",
        width: "0px",
        height: "0px",
        borderRadius: "50%",
        border: "3px solid rgba(239, 68, 68, 0.8)",
        boxShadow:
          "0 0 30px rgba(239, 68, 68, 0.6), inset 0 0 30px rgba(239, 68, 68, 0.4)",
        zIndex: 9998,
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
      })
      .appendTo("body");

    $shockwave.animate(
      { width: "600px", height: "600px", opacity: 0 },
      800,
      () => $shockwave.remove(),
    );

    $(".option-btn.selected").each(function () {
      const rect = this.getBoundingClientRect();
      const cx = rect.left + rect.width / 2,
        cy = rect.top + rect.height / 2;

      this.style.setProperty("--gradient-opacity", "1");
      this.style.setProperty("--topo-opacity", "1");

      let fadeOut = 1;
      const fadeOutInterval = setInterval(() => {
        fadeOut -= 0.08;
        this.style.setProperty("--gradient-opacity", fadeOut);
        this.style.setProperty("--topo-opacity", fadeOut);
        if (fadeOut <= 0) {
          clearInterval(fadeOutInterval);
          this.style.setProperty("--gradient-opacity", "0");
          this.style.setProperty("--topo-opacity", "0");
        }
      }, 16);

      for (let i = 0; i < 24; i++) createParticle(cx, cy, "main");
      for (let i = 0; i < 20; i++) createParticle(cx, cy, "sparkle");

      $(this).addClass("unselecting");
      setTimeout(() => $(this).addClass("exploding"), 150);
    });

    setTimeout(() => {
      $(".option-btn").removeClass(
        "selected unselecting selecting exploding flow-through",
      );
      $(".option-btn .topo-flow").remove();
      isResetAnimating = false;
      userState = { time: null, mood: null, single: null };
    }, 800);
  });

  $("#dontCare").on("click", function () {
    dontCare(currentLang);
  });

  $("#toggleSteamMode").on("click", function () {
    toggleSteamMode();
  });

  setupSteamInputListener(currentLang);

  $("#faqBtn").on("click", function () {
    $("#faqOverlay").addClass("active");
  });

  $("#githubBtn").on("click", function () {
    window.open("https://github.com/VladRys/What-To-Play/tree/main", "_blank");
  });

  $("#faqClose").on("click", function () {
    $("#faqOverlay").removeClass("active");
  });

  $("#faqOverlay").on("click", function (e) {
    if (e.target === this) {
      $(this).removeClass("active");
    }
  });

  $("#clearNickname").on("click", function () {
    clearNickname(currentLang);
  });

  let requirementsMode = false;
  $("#checkRequirements").on("click", function () {
    if ($(".game-card").length === 0) {
      showErrorPopup(
        translations[currentLang]["select-game"] || "No games displayed",
        currentLang,
      );
      return;
    }

    requirementsMode = !requirementsMode;
    $(this).toggleClass("active");

    if ($(".requirements-overlay").length === 0) {
      $("body").append('<div class="requirements-overlay"></div>');
    }

    if (requirementsMode) {
      $(this).css({ opacity: 1, cursor: "pointer" });
      const notificationText =
        translations[currentLang]["select-game"] || "Select a game to check";
      $("html").append(
        '<div class="requirements-notification">' + notificationText + "</div>",
      );

      setTimeout(() => {
        $(".requirements-notification").addClass("show");
      }, 10);

      $(".requirements-overlay").addClass("active");
      $("#gameResult").addClass("elevated");
      $(".game-card").css({
        transform: "scale(1.02)",
        transition: "transform 0.3s ease",
      });
    } else {
      $(this).css({ opacity: 0.7, cursor: "pointer" });

      $(".requirements-notification").addClass("hiding");
      setTimeout(() => {
        $(".requirements-notification").remove();
      }, 500);

      $(".game-card").addClass("no-transition");
      $(".game-card").css({ transform: "scale(1)" });
      $(".requirements-overlay").removeClass("active");
      $("#gameResult").removeClass("elevated");
      setTimeout(() => {
        $(".game-card").removeClass("no-transition");
      }, 200);
    }
  });

  $(document).on("click", ".game-card", function () {
    if (requirementsMode) {
      const appid = $(this).data("appid");
      console.log("Clicked on game with appid:", appid);

      if (appid) {
        const steamUrl = `https://store.steampowered.com/app/${appid}`;
        console.log("Opening Steam page:", steamUrl);
        window.open(steamUrl, "_blank");

        requirementsMode = false;
        $("#checkRequirements")
          .removeClass("active")
          .css({ opacity: 0.7, cursor: "pointer" });

        $(".requirements-notification").addClass("hiding");
        setTimeout(() => {
          $(".requirements-notification").remove();
        }, 500);

        $(".requirements-overlay").removeClass("active");
        $("#gameResult").removeClass("elevated");
        $(".game-card").addClass("no-transition");
        $(".game-card").css({ transform: "scale(1)" });
        setTimeout(() => {
          $(".game-card").removeClass("no-transition");
        }, 50);
      }
    }
  });

  $("#findGames").on("click", function () {
    findGames(userState, currentLang);
  });

  window.getUserState = () => userState;
  window.resetUserState = () => {
    userState = { time: null, mood: null, single: null };
    $(".option-btn").removeClass("selected");
  };
});
