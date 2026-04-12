$(document).ready(function () {
  // Initialize requirements button as disabled
  $('#checkRequirements').prop('disabled', true).css({ opacity: 0.4, cursor: 'not-allowed' });

  // Translations
  const translations = {
    en: { subtitle: 'What To Play Today', 'time-question': 'How much time you have to play?', 'time-30min': '30 min', 'time-1-2hrs': '1-2 hours', 'time-long': 'A long while', 'mood-question': 'Mood?', 'mood-chill': 'Chill (Hui DrochiLL)', 'mood-sweat': 'Sweat', 'mood-think': 'Think', 'mode-question': 'Single?', 'mode-solo': 'Solo', 'mode-friends': 'With Friends', 'find-games': 'Find games', 'reset': 'Reset', 'your-game': 'Your game:', 'dont-care': "Don't care", 'server-error': 'Failed to connect to server. Please try again.', 'error-title': 'Error', 'check-requirements': 'Check Requirements', 'steam-placeholder': 'Enter Steam nickname...', 'fetch-library': 'Fetch Library', 'select-game': 'Select a game to check' },
    ru: { subtitle: 'Во что поиграть сегодня', 'time-question': 'Сколько у тебя времени?', 'time-30min': '30 мин', 'time-1-2hrs': '1-2 часа', 'time-long': 'Долго', 'mood-question': 'Вайб?', 'mood-chill': 'Чилл (Хуи Дрочил)', 'mood-sweat': 'Потеть', 'mood-think': 'Думать', 'mode-question': 'Режим?', 'mode-solo': 'Соло', 'mode-friends': 'С друзьями', 'find-games': 'Найти игры', 'reset': 'Сброс', 'your-game': 'Твоя игра:', 'dont-care': 'Мне похуй', 'server-error': 'Не удалось подключиться к серверу. Попробуйте снова.', 'error-title': 'Ошибка', 'check-requirements': 'Проверить требования', 'steam-placeholder': 'Введите никнейм Steam...', 'fetch-library': 'Загрузить библиотеку', 'select-game': 'Выбери игру для проверки' },
    uk: { subtitle: 'У Що Пограти Сьогодні', 'time-question': 'Скільки часу є?', 'time-30min': '30 хв', 'time-1-2hrs': '1-2 години', 'time-long': 'Довго', 'mood-question': 'Настрій?', 'mood-chill': 'Чілл (Хуй дрочіЛЛ)', 'mood-sweat': 'Потіти (ціцкі тикатИ)', 'mood-think': 'Думати', 'mode-question': 'Режим?', 'mode-solo': 'Соло', 'mode-friends': 'З друзями', 'find-games': 'Знайти ігри', 'reset': 'Скинути', 'your-game': 'Твоя гра:', 'dont-care': 'Мені похуй', 'server-error': 'Не вдалося підключитися до серверу. Спробуйте ще раз.', 'error-title': 'Помилка', 'check-requirements': 'Перевірити вимоги', 'steam-placeholder': 'Введіть нікнейм Steam...', 'fetch-library': 'Завантажити бібліотеку', 'select-game': 'Вибери гру для перевірки' }
  };

  let currentLang = 'en', userState = { time: null, mood: null, single: null }, isResetAnimating = false;

  // Mouse tracking
  $('.option-btn, .action-btn').on('mousemove', function (e) {
    const rect = this.getBoundingClientRect();
    $(this).css({ '--mouse-x': ((e.clientX - rect.left) / rect.width) * 100 + '%', '--mouse-y': ((e.clientY - rect.top) / rect.height) * 100 + '%' });
  });

  // Mouse tracking for requirements button
  $('#checkRequirements').on('mousemove', function (e) {
    const rect = this.getBoundingClientRect();
    $(this).css({ '--mouse-x': ((e.clientX - rect.left) / rect.width) * 100 + '%', '--mouse-y': ((e.clientY - rect.top) / rect.height) * 100 + '%' });
  });

  // Mouse tracking for game cards (added dynamically)
  $(document).on('mousemove', '.game-card', function (e) {
    const rect = this.getBoundingClientRect();
    $(this).find('.glow').css({ '--mouse-x': ((e.clientX - rect.left) / rect.width) * 100 + '%', '--mouse-y': ((e.clientY - rect.top) / rect.height) * 100 + '%' });
  });

  // Ripple effect
  $('.option-btn').on('click', function (e) {
    const rect = this.getBoundingClientRect();
    $('<span class="ripple"></span>').css({ left: e.clientX - rect.left + 'px', top: e.clientY - rect.top + 'px' }).appendTo(this);
    setTimeout(() => $(this).find('.ripple').remove(), 600);
  });

  // Language switcher
  $('.lang-btn').on('click', function () {
    $('.lang-btn').removeClass('active');
    $(this).addClass('active');
    currentLang = $(this).data('lang');

    const $els = $('[data-translate]');
    const texts = [];
    $els.each(function () {
      const key = $(this).data('translate');
      if (translations[currentLang]?.[key]) {
        const $icon = $(this).find('.icon-wrapper').clone();
        const currentWidth = $(this).outerWidth();
        texts.push({ el: $(this), curr: $(this).text().trim(), new: translations[currentLang][key], icon: $icon.length ? $icon : '', width: currentWidth });
      }
    });

    // Handle placeholder translations with typewriter effect
    $('[data-translate-placeholder]').each(function () {
      const key = $(this).data('translate-placeholder');
      if (translations[currentLang]?.[key]) {
        const $input = $(this);
        const currentPlaceholder = $input.attr('placeholder') || '';
        const newPlaceholder = translations[currentLang][key];

        // Typewriter effect for placeholder
        let i = 0, max = currentPlaceholder.length;
        const erasePlaceholder = setInterval(() => {
          if (i >= max) {
            clearInterval(erasePlaceholder);
            let j = 0, max2 = newPlaceholder.length;
            const writePlaceholder = setInterval(() => {
              if (j >= max2) {
                clearInterval(writePlaceholder);
              } else {
                $input.attr('placeholder', newPlaceholder.substring(0, j + 1));
                j++;
              }
            }, 15);
          } else {
            $input.attr('placeholder', currentPlaceholder.substring(0, currentPlaceholder.length - i));
            i++;
          }
        }, 15);
      }
    });

    // Apply blur to steam input during translation
    $('#steamNickname').css({ filter: 'blur(4px)', opacity: 0.5, transition: 'all 0.2s ease' });

    // Set fixed width during translation
    $els.each(function() {
      const textData = texts.find(t => t.el[0] === this);
      if (textData && !$(this).hasClass('subtitle')) {
        $(this).css('width', textData.width + 'px');
      }
    });

    $els.css({ filter: 'blur(4px)', opacity: 0.5, transition: 'all 0.2s ease' });
    $('.icon').css({ filter: 'blur(4px)', opacity: 0.5, transition: 'all 0.2s ease' });

    setTimeout(() => {
      let i = 0, max = Math.max(...texts.map(t => t.curr.length));
      const erase = setInterval(() => {
        if (i >= max) {
          clearInterval(erase);
          let j = 0, max2 = Math.max(...texts.map(t => t.new.length));
          const write = setInterval(() => {
            if (j >= max2) {
              clearInterval(write);
              $els.css({ filter: 'blur(0)', opacity: 1, width: '' });
              $('.icon').css({ filter: 'blur(0)', opacity: 1 });
              $('#steamNickname').css({ filter: 'blur(0)', opacity: 1 });
            } else {
              texts.forEach(t => j < t.new.length && t.el.html(t.icon).append(' ' + t.new.substring(0, j + 1)));
              j++;
            }
          }, 15);
        } else {
          texts.forEach(t => t.el.html(t.icon).append(' ' + (i < t.curr.length ? t.curr.substring(0, t.curr.length - i) : ' ')));
          i++;
        }
      }, 15);
    }, 200);
  });

  // Option button click
  $('.option-btn').on('click', function (e) {
    const $this = $(this);
    if ($this.hasClass('selected') || $this.hasClass('selecting')) return;

    const rect = this.getBoundingClientRect();
    this.style.setProperty('--click-x', ((e.clientX - rect.left) / rect.width) * 100 + '%');
    this.style.setProperty('--click-y', ((e.clientY - rect.top) / rect.height) * 100 + '%');

    // Fade out 1
    $this.siblings('.selected').addClass('unselecting');

    setTimeout(() => {
      $this.siblings('.unselecting').removeClass('selected unselecting').find('.topo-flow').remove();
    }, 300);
    $this.find('.topo-flow').length === 0 && $this.append('<div class="topo-flow"></div>');
    $this.addClass('selecting');

    this.style.setProperty('--curve-h', (Math.random() * 10 - 5).toFixed(1) + 'deg');
    this.style.setProperty('--curve-v', (Math.random() * 10 - 5).toFixed(1) + 'deg');

    // Easing-helper
    this.style.setProperty('--gradient-opacity', '0');
    this.style.setProperty('--topo-opacity', '0');

    setTimeout(() => {
      $this.addClass('selected fade-in').removeClass('selecting');

      // Gradient easing
      let opacity = 0;
      const fadeIn = setInterval(() => {
        opacity += 0.02;
        this.style.setProperty('--gradient-opacity', opacity);
        if (opacity >= 1) {
          clearInterval(fadeIn);
          this.style.setProperty('--gradient-opacity', '1');
        }
      }, 16);

      // Grid easing
      setTimeout(() => {
        let topoOpacity = 0;
        const topoFadeIn = setInterval(() => {
          topoOpacity += 0.02;
          this.style.setProperty('--topo-opacity', topoOpacity);
          if (topoOpacity >= 1) {
            clearInterval(topoFadeIn);
            this.style.setProperty('--topo-opacity', '1');
          }
        }, 16);
      }, 300);
    }, 300);

    const idx = $this.closest('.question-section').index() + 1;
    const text = $this.text().trim();

    if (idx === 1) userState.time = text;
    else if (idx === 2) userState.mood = text;
    else if (idx === 3) userState.single = text === 'Solo';

    console.log(`dict user_state = { time = "${userState.time}", mood = "${userState.mood}", single = ${userState.single} }`);
  });

  // Particles
  const createParticle = (x, y, type) => {
    const p = document.createElement('div');
    p.className = type === 'main' ? 'explosion-particle' : 'explosion-sparkle';
    const angle = type === 'main' ? (Math.PI * 2 * Math.random()) : Math.random() * Math.PI * 2;
    const vel = type === 'main' ? 100 + Math.random() * 250 : 60 + Math.random() * 150;
    const vx = Math.cos(angle) * vel;
    const vy = Math.sin(angle) * vel + (type === 'main' ? 80 : 0);
    const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ffffff'];

    p.style.cssText = `
            position: fixed; left: ${x}px; top: ${y}px;
            width: ${type === 'main' ? 6 + Math.random() * 12 : 2 + Math.random() * 3}px;
            height: ${type === 'main' ? 6 + Math.random() * 12 : 2 + Math.random() * 3}px;
            background: ${type === 'main' ? colors[Math.floor(Math.random() * colors.length)] : '#ffffff'};
            border-radius: 50%;
            box-shadow: ${type === 'main' ? `0 0 ${15 + Math.random() * 15}px ${p.style.background}` : '0 0 15px #ffffff, 0 0 30px #8b5cf6'};
            z-index: 9999; pointer-events: none;
            --tx: ${vx}px; --ty: ${vy}px;
            animation: ${type === 'main' ? 'particleExplode' : 'sparkleExplode'} ${type === 'main' ? 0.6 + Math.random() * 0.4 : 0.4 + Math.random() * 0.3}s ease-out forwards;
        `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), type === 'main' ? 1200 : 800);
  };

  // Reset
  $('#reset').on('click', function (e) {
    if (isResetAnimating || $('.option-btn.selected').length === 0) return;
    isResetAnimating = true;

    // Disable requirements button on reset
    $('#checkRequirements').prop('disabled', true).css({ opacity: 0.4, cursor: 'not-allowed' });

    const $shockwave = $('<div class="shockwave"></div>').css({
      position: 'absolute', left: e.pageX + 'px', top: e.pageY + 'px',
      width: '0px', height: '0px', borderRadius: '50%',
      border: '3px solid rgba(239, 68, 68, 0.8)',
      boxShadow: '0 0 30px rgba(239, 68, 68, 0.6), inset 0 0 30px rgba(239, 68, 68, 0.4)',
      zIndex: 9998, pointerEvents: 'none', transform: 'translate(-50%, -50%)'
    }).appendTo('body');

    $shockwave.animate({ width: '600px', height: '600px', opacity: 0 }, 800, () => $shockwave.remove());

    $('.option-btn.selected').each(function () {
      const rect = this.getBoundingClientRect();
      const cx = rect.left + rect.width / 2 + window.scrollX, cy = rect.top + rect.height / 2 + window.scrollY;

      // Fade out 2
      this.style.setProperty('--gradient-opacity', '1');
      this.style.setProperty('--topo-opacity', '1');

      let fadeOut = 1;
      const fadeOutInterval = setInterval(() => {
        fadeOut -= 0.08;
        this.style.setProperty('--gradient-opacity', fadeOut);
        this.style.setProperty('--topo-opacity', fadeOut);
        if (fadeOut <= 0) {
          clearInterval(fadeOutInterval);
          this.style.setProperty('--gradient-opacity', '0');
          this.style.setProperty('--topo-opacity', '0');
        }
      }, 16);

      for (let i = 0; i < 24; i++) createParticle(cx, cy, 'main');
      for (let i = 0; i < 20; i++) createParticle(cx, cy, 'sparkle');

      $(this).addClass('unselecting');
      setTimeout(() => $(this).addClass('exploding'), 150);
    });

    setTimeout(() => {
      $('.option-btn').removeClass('selected unselecting selecting exploding flow-through');
      $('.option-btn .topo-flow').remove();
      isResetAnimating = false;
      userState = { time: null, mood: null, single: null };
    }, 800);
  });

  // Don't care btn
  $('#dontCare').on('click', function () {
    fetch("http://127.0.0.1:8000/random")
      .then(r => r.json())
      .then(data => {
        const game = data.game || {};
        const Image = data.header_image || 'img/testimg.png';
        const genres = game.genres || 'Unknown Genre';
        const categories = game.categories || '';
        const isMultiplayer = categories.toLowerCase().includes('multi-player');
        const gameCard = `
          <div class="game-card" style="opacity: 0; transform: translateY(30px); filter: blur(10px);" data-appid="${game.appid}" data-game-name="${game.name || 'Unknown Game'}">
            <div class="glow"></div>
            <div class="game-banner">
              <img src="${Image}" alt="Game Banner">
            </div>
            <div class="game-info">
              <h3 class="game-title">${game.name || 'Unknown Game'}</h3>
              <p class="game-genre">${typeof genres === 'string' ? genres : genres.join(', ')}</p>
              <div class="game-meta">
                <span class="game-time">${game.is_free ? 'Free to Play' : 'Paid'}</span>
                <span class="game-difficulty">${game.positive || 0 > game.negative || 0 ? 'Positive Reviews' : 'Mixed Reviews'}</span>
                ${isMultiplayer ? '<span class="game-friends">With Friends</span>' : ''}
              </div>
            </div>
          </div>
        `;
        const $card = $(gameCard);
        $('#gameResult').html($card).show();

        // Animate card appearance
        setTimeout(() => {
          $card.css({
            opacity: 1,
            transform: 'translateY(0)',
            filter: 'blur(0px)',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          });
        }, 50);
      })
      .catch(error => {
        showErrorPopup(translations[currentLang]['server-error']);
      });
  });

  // Steam mode toggle (ID/Nickname)
  let steamInputMode = 'nickname'; // Default to nickname mode
  $('#toggleSteamMode').on('click', function () {
    steamInputMode = steamInputMode === 'id' ? 'nickname' : 'id';
    $(this).text(steamInputMode === 'id' ? 'SteamID' : 'Nickname');
    $('#steamNickname').attr('placeholder', steamInputMode === 'id' ? 'Enter Steam ID...' : 'Enter Steam nickname...');
    console.log('Steam input mode changed to:', steamInputMode);
  });

  // Fetch Steam library btn
  $('#fetchSteamLibrary').on('click', function () {
    const inputValue = $('#steamNickname').val().trim();

    if (!inputValue) {
      showErrorPopup(steamInputMode === 'id' ? 'Please enter Steam ID' : 'Please enter Steam nickname');
      return;
    }

    // Detect input type
    const looksLikeID = /^\d{17}$/.test(inputValue);
    const looksLikeNickname = /^[a-zA-Z0-9_-]+$/.test(inputValue) && !looksLikeID;

    // Determine actual input type
    let actualInputType = steamInputMode;
    if (looksLikeID) actualInputType = 'id';
    else if (looksLikeNickname) actualInputType = 'nickname';

    // Show warning if mode doesn't match detected type (without blocking other popups)
    if (steamInputMode !== actualInputType) {
      const modeName = actualInputType === 'id' ? 'ID' : 'nickname';
      // Temporarily reset flag to allow this popup
      popupVisible = false;
      showSuccessPopup(`Detected ${modeName} mode. Proceeding with ${modeName}...`);
    }

    // Show loading state
    const $btn = $(this);
    const originalText = $btn.html();
    $btn.prop('disabled', true).html('<span class="icon-wrapper"><iconify-icon icon="fa-solid:spinner" class="fa-spin"></iconify-icon></span>Loading...');

    // Use appropriate endpoint based on detected type
    const url = actualInputType === 'id'
      ? `http://127.0.0.1:8000/owned-games/id/${inputValue}`
      : `http://127.0.0.1:8000/owned-games/vanity/${inputValue}`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        // Restore button state
        $btn.prop('disabled', false).html(originalText);

        if (data.error || data.status === 404) {
          showErrorPopup(data.message || data.error || 'Failed to fetch library');
          return;
        }

        const games = data.owned_games || [];
        console.log(`Fetched ${games.length} games from Steam library`);

        // Save Steam library data to localStorage
        const appids = games.map(game => game.appid);
        localStorage.setItem('steamLibraryAppids', JSON.stringify(appids));
        localStorage.setItem('steamLibrary', JSON.stringify(games));

        // Reset flag to allow success popup to show
        popupVisible = false;
        // Show success message
        showSuccessPopup(`Successfully fetched ${games.length} games from library`);
      })
      .catch(error => {
        console.error('Error fetching Steam library:', error);
        $btn.prop('disabled', false).html(originalText);
        showErrorPopup(translations[currentLang]['server-error']);
      });
  });

  // Requirements check btn (ОБНОВЛЕННЫЙ БЛОК)
  let requirementsMode = false;
  $('#checkRequirements').on('click', function () {
    // Check if any games are displayed
    if ($('.game-card').length === 0) {
      showErrorPopup(translations[currentLang]['select-game'] || 'No games displayed');
      return;
    }

    requirementsMode = !requirementsMode;
    $(this).toggleClass('active');

    // Создаем слой-подложку, если его еще нет
    if ($('.requirements-overlay').length === 0) {
      $('body').append('<div class="requirements-overlay"></div>');
    }

    if (requirementsMode) {
      $(this).css({ opacity: 1, cursor: 'pointer' });
      const notificationText = translations[currentLang]['select-game'] || 'Select a game to check';
      $('html').append('<div class="requirements-notification">' + notificationText + '</div>');

      // Включаем идеальный блюр-слой и поднимаем карточки
      $('.requirements-overlay').addClass('active');
      $('#gameResult').addClass('elevated');
      $('.game-card').css({ transform: 'scale(1.02)', transition: 'transform 0.3s ease' });

    } else {
      $(this).css({ opacity: 0.7, cursor: 'pointer' });

      // Fade out notification before removing
      $('.requirements-notification').addClass('hiding');
      setTimeout(() => {
        $('.requirements-notification').remove();
      }, 500);

      // Выключаем блюр immediately
      $('.requirements-overlay').removeClass('active');
      $('#gameResult').removeClass('elevated');
      $('.game-card').css({ transform: 'scale(1)' });
    }
  });

  // Game card click handler for requirements check (ОБНОВЛЕННЫЙ БЛОК)
  $(document).on('click', '.game-card', function () {
    if (requirementsMode) {
      const appid = $(this).data('appid');
      console.log('Clicked on game with appid:', appid);

      if (appid) {
        // Redirect to Steam game page
        const steamUrl = `https://store.steampowered.com/app/${appid}`;
        console.log('Opening Steam page:', steamUrl);
        window.open(steamUrl, '_blank');

        // Remove blur and reset
        requirementsMode = false;
        $('#checkRequirements').removeClass('active').css({ opacity: 0.7, cursor: 'pointer' });

        // Fade out notification before removing
        $('.requirements-notification').addClass('hiding');
        setTimeout(() => {
          $('.requirements-notification').remove();
        }, 500);

        // Отключаем оверлей immediately
        $('.requirements-overlay').removeClass('active');
        $('#gameResult').removeClass('elevated');
        $('.game-card').css({ transform: 'scale(1)' });
      }
    }
  });

  // Find games btn
  $('#findGames').on('click', function () {
    // Get seen game IDs from localStorage to avoid repeats
    const seenGames = localStorage.getItem('seenGames') || '';

    const params = new URLSearchParams();
    if (seenGames) params.append('exclude', seenGames);
    if (userState.single !== null && userState.single !== undefined) params.append('solo', userState.single);
    if (userState.mood) params.append('mood', userState.mood);
    if (userState.time) params.append('time', userState.time);

    fetch(`http://127.0.0.1:8000/games/random?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          showErrorPopup(data.message || 'Database access error');
          return;
        }

        const games = data.games || [];

        if (games.length === 0) {
          if (data.message) {
            showErrorPopup(data.message);
            return;
          }
          localStorage.removeItem('seenGames');
          const params2 = new URLSearchParams();
          if (userState.single !== null && userState.single !== undefined) params2.append('solo', userState.single);
          if (userState.mood) params2.append('mood', userState.mood);
          if (userState.time) params2.append('time', userState.time);

          fetch(`http://127.0.0.1:8000/games/random?${params2.toString()}`)
            .then(r => r.json())
            .then(data => {
              if (data.error) {
                showErrorPopup(data.message || 'Database access error');
                return;
              }
              const games = data.games || [];
              if (games.length === 0) {
                showErrorPopup('No games found matching your criteria');
                return;
              }
              displayGames(games);
            });
          return;
        }

        displayGames(games);
      })
      .catch(error => {
        showErrorPopup(translations[currentLang]['server-error']);
      });
  });

  let popupVisible = false;

  function showErrorPopup(message) {
    if (popupVisible) return;
    popupVisible = true;
    const overlay = $('<div class="error-popup-overlay"></div>');
    const popup = $(`
      <div class="error-popup">
        <div class="error-popup-content">
          <div class="error-popup-icon">⚠️</div>
          <h3>${translations[currentLang]['error-title']}</h3>
          <p>${message}</p>
        </div>
      </div>
    `);

    $('html').append(overlay);
    $('html').append(popup);

    overlay.hide().fadeIn(300);
    popup.css({ opacity: 0, transform: 'translate(-50%, -40%)' }).show().animate({
      opacity: 1,
      marginTop: '-=20px'
    }, 300);

    setTimeout(() => {
      popup.animate({
        opacity: 0,
        marginTop: '+=20px'
      }, 300, () => {
        popup.remove();
        overlay.fadeOut(300, () => {
          overlay.remove();
          popupVisible = false;
        });
      });
    }, 1200);
  }

  function showSuccessPopup(message) {
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

    $('html').append(overlay);
    $('html').append(popup);

    overlay.hide().fadeIn(300);
    popup.css({ opacity: 0, transform: 'translate(-50%, -40%)' }).show().animate({
      opacity: 1,
      marginTop: '-=20px'
    }, 300);

    setTimeout(() => {
      popup.animate({
        opacity: 0,
        marginTop: '+=20px'
      }, 300, () => {
        popup.remove();
        overlay.fadeOut(300, () => {
          overlay.remove();
          popupVisible = false;
        });
      });
    }, 1200);
  }

  function displayGames(games) {
    const seenGames = new Set(localStorage.getItem('seenGames')?.split(',') || []);
    const $gameResult = $('#gameResult').empty().show();

    let currentIndex = 0;

    function showNextCard() {
      if (currentIndex >= games.length) {
        // Save seen games to localStorage
        localStorage.setItem('seenGames', Array.from(seenGames).join(','));
        return;
      }

      const game = games[currentIndex];
      const Image = `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
      const genres = game.genres || 'Unknown Genre';
      const categories = game.categories || '';
      const isMultiplayer = categories.toLowerCase().includes('multi-player');

      const $card = $(`
        <div class="game-card" style="opacity: 0; transform: translateY(30px); filter: blur(10px);" data-appid="${game.appid}" data-game-name="${game.name || 'Unknown Game'}">
          <div class="glow"></div>
          <div class="game-banner">
            <img src="${Image}" alt="Game Banner">
          </div>
          <div class="game-info">
            <h3 class="game-title">${game.name || 'Unknown Game'}</h3>
            <p class="game-genre">${typeof genres === 'string' ? genres : genres.join(', ')}</p>
            <div class="game-meta">
              <span class="game-time">${game.is_free ? 'Free to Play' : 'Paid'}</span>
              <span class="game-difficulty">${game.positive || 0 > game.negative || 0 ? 'Positive Reviews' : 'Mixed Reviews'}</span>
              ${isMultiplayer ? '<span class="game-friends">With Friends</span>' : ''}
            </div>
          </div>
        </div>
      `);

      $gameResult.append($card);

      // Animate card appearance
      setTimeout(() => {
        $card.css({
          opacity: 1,
          transform: 'translateY(0)',
          filter: 'blur(0px)',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        });

        // Add to seen games
        seenGames.add(String(game.appid));

        // Enable requirements button when games are displayed
        $('#checkRequirements').prop('disabled', false).css({ opacity: 0.7, cursor: 'pointer' });

        // Show next card
        currentIndex++;
        setTimeout(showNextCard, 200);
      }, 50);
    }

    // Disable requirements button when no games
    $('#checkRequirements').prop('disabled', true).css({ opacity: 0.4, cursor: 'not-allowed' });

    showNextCard();
  }

  window.getUserState = () => userState;
  window.resetUserState = () => { userState = { time: null, mood: null, single: null }; $('.option-btn').removeClass('selected'); };
});