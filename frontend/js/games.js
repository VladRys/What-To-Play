// Game-related functionality

import { moodToVibe } from './config.js';
import { showErrorPopup, showSuccessPopup, resetPopupVisible } from './ui.js';

export function displayGames(games) {
  const seenGames = new Set(localStorage.getItem('seenGames')?.split(',') || []);
  const $gameResult = $('#gameResult').empty().show();

  games.forEach((game, index) => {
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
    seenGames.add(game.appid);

    // Animate card appearance with staggered delay
    setTimeout(() => {
      $card.css({
        opacity: 1,
        transform: 'translateY(0)',
        filter: 'blur(0px)',
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      });
    }, 50 + index * 150);
  });

  // Save seen games to localStorage
  localStorage.setItem('seenGames', Array.from(seenGames).join(','));

  // Enable requirements button when games are displayed
  $('#checkRequirements').prop('disabled', false).css({ opacity: 1, cursor: 'pointer' });
}

export function findGames(userState, currentLang) {
  const vibe = userState.mood ? moodToVibe[userState.mood] : null;

  if (vibe) {
    // Use new vibe endpoint
    fetch(`http://127.0.0.1:8000/games/vibe/${vibe}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          showErrorPopup(data.message || 'Failed to fetch games by vibe', currentLang);
          return;
        }

        const games = data.games || [];

        if (games.length === 0) {
          showErrorPopup('No games found for this vibe', currentLang);
          return;
        }

        displayGames(games);
      })
      .catch(error => {
        console.error('Error fetching games by vibe:', error);
        showErrorPopup(translations[currentLang]['server-error'], currentLang);
      });
  } else {
    // Fallback to old endpoint if no vibe selected
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
          showErrorPopup(data.message || 'Database access error', currentLang);
          return;
        }

        const games = data.games || [];

        if (games.length === 0) {
          if (data.message) {
            showErrorPopup(data.message, currentLang);
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
                showErrorPopup(data.message || 'Database access error', currentLang);
                return;
              }
              const games = data.games || [];
              if (games.length === 0) {
                showErrorPopup('No games found matching your criteria', currentLang);
                return;
              }
              displayGames(games);
            });
          return;
        }

        displayGames(games);
      })
      .catch(error => {
        showErrorPopup(translations[currentLang]['server-error'], currentLang);
      });
  }
}

export function dontCare(currentLang) {
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
      showErrorPopup(translations[currentLang]['server-error'], currentLang);
    });
}
