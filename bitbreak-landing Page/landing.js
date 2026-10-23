(() => {
  const dialog = document.getElementById('infoDialog');
  const dialogTitle = document.getElementById('dialogTitle');
  const dialogContent = document.getElementById('dialogContent');
  const toast = document.getElementById('toast');
  const nav = document.querySelector('.nav-links');
  let toastTimer;
  const pages = {
    about: { title: 'ABOUT THE ADVENTURE', html: '<p>You are a student at MIT-WPU. Between campus landmarks, CS-inspired puzzles and a suspicious number of deadlines, your mission is to find the way forward.</p><p><strong>BIT//BREAK</strong> is a pixel-art puzzle platformer built around the idea that the tools you learn in computer science can become tools in the world.</p>' },
    controls: { title: 'HOW TO PLAY', html: '<ul><li><strong>Move:</strong> A / D or ← / →</li><li><strong>Jump:</strong> Space</li><li><strong>Commit &amp; replay:</strong> R</li><li><strong>Copy / paste:</strong> C / V</li><li><strong>Rewind:</strong> Ctrl + Z</li><li><strong>Throw student ID:</strong> F</li><li><strong>Pause:</strong> Esc</li></ul><p>Controls are a preview and can be adjusted when the game engine is connected.</p>' },
    credits: { title: 'MADE BETWEEN LECTURES', html: '<p>A student-built MIT-WPU campus adventure inspired by pixel-art platformers, cooperative puzzle games and computer science concepts.</p><p>Game design, story and credits will be updated as the project comes together.</p>' },
    settings: { title: 'GAME SETTINGS', html: '<p><label><input id="reducedMotionToggle" type="checkbox"> Reduce animations</label></p><p>Settings are saved for this browser session only.</p>' },
    how: { title: 'HOW TO PLAY', html: '<p>Explore the campus, experiment with objects, and use your computer-science abilities to solve each room. The landing page is ready; the actual level engine will be connected separately.</p><ul><li>Look for switches, doors and objects you can interact with.</li><li>Use replay ghosts to hold buttons while you move.</li><li>Save your limited rewind and clipboard uses for tricky moments.</li></ul>' }
  };
  function openPage(key) { const page = pages[key]; if (!page) return; dialogTitle.textContent = page.title; dialogContent.innerHTML = page.html; if (typeof dialog.showModal === 'function') dialog.showModal(); else alert(page.title + '\n\n' + dialogContent.textContent); }
  function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3000); }
  document.querySelectorAll('[data-open]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); nav.classList.remove('open'); openPage(link.dataset.open); }));
  document.getElementById('howToPlayButton').addEventListener('click', () => openPage('how'));
  document.getElementById('settingsButton').addEventListener('click', () => openPage('settings'));
  document.getElementById('dialogOk').addEventListener('click', () => dialog.close());
  document.getElementById('mobileMenu').addEventListener('click', () => nav.classList.toggle('open'));
  dialog.addEventListener('change', event => { if (event.target.id === 'reducedMotionToggle') { document.body.classList.toggle('reduce-motion', event.target.checked); showToast(event.target.checked ? 'Animations reduced.' : 'Animations restored.'); } });
  document.getElementById('playButton').addEventListener('click', () => {
    const request = new CustomEvent('bitbreak:play-request', { bubbles: true, detail: { source: 'landing-page' } });
    window.dispatchEvent(request);
    document.dispatchEvent(new CustomEvent('bitbreak:play-request', { detail: { source: 'landing-page' } }));
    showToast('Ready, student? Game engine connection is coming next!');
  });
  window.addEventListener('bitbreak:game-ready', () => { toast.classList.remove('show'); });
})();
