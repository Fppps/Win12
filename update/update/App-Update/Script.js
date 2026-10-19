'use strict';

/*
 * Windows 12 (Version 10H10) — desktop/taskbar foundation.
 * Eight-item taskbar foundation with Information and the 9H09-inspired Settings app.
 * Search remains implemented for the available system actions. Start, Defender
 * and other flyouts are reserved for future work.
 * Buttons emit events that later application modules can listen to.
 */
(() => {
  const byId = (id) => document.getElementById(id);
  const clockTime = byId('clock-time');
  const clockDate = byId('clock-date');
  const search = byId('search-input');

  function updateClock() {
    const now = new Date();
    // Settings augments the original clock without changing its defaults.
    const prefs = window.wwTimeFormat || {};
    const locale = prefs.language || 'en-US';
    clockTime.textContent = now.toLocaleTimeString(locale, {
      hour: 'numeric', minute: '2-digit', hour12: prefs.hour24 === true ? false : true,
      ...(prefs.localTime === false ? {timeZone: 'UTC'} : {})
    });
    clockDate.textContent = now.toLocaleDateString(locale, {
      year:'numeric', month:'numeric', day:'numeric',
      ...(prefs.localDate === false ? {timeZone: 'UTC'} : {})
    });
    clockTime.dateTime = now.toISOString();
    clockDate.dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    byId('datetime-button').title = now.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }
  updateClock();
  // Resynchronize each minute rather than letting the display drift.
  const clockTimer = window.setInterval(updateClock, 1000);
  window.addEventListener('pagehide', () => window.clearInterval(clockTimer), { once: true });

  // Icons8 taskbar assets retain their original pixels; Phosphor provides fallback glyphs.
  for (const button of document.querySelectorAll('.app-button, #weather-button')) {
    const icon = button.querySelector('img');
    const loaded = () => button.classList.toggle('image-loaded', icon.naturalWidth > 0);
    icon.addEventListener('load', loaded);
    icon.addEventListener('error', loaded);
    if (icon.complete) loaded();
  }

  // Phosphor glyphs are shown by the regular CSS icon font stylesheet.

  const emit = (event, detail = {}) => window.dispatchEvent(
    new CustomEvent(`webwindows:${event}`, { detail })
  );
  const actions = {
    'weather-button': 'weather-requested',
    'start-button': 'start-requested',
    'settings-button': 'settings-requested',
    'information-button': 'information-requested',
    'defender-button': 'defender-requested',
    'faders-button': 'quick-settings-requested',
    'datetime-button': 'date-time-requested'
  };
  for (const [id, action] of Object.entries(actions)) {
    byId(id).addEventListener('click', () => emit(action));
  }

  // Search flyout: real system actions only, no fictitious Windows results.
  const searchShell = byId('search-shell');
  const searchPanel = byId('search-panel');
  const searchPanelInput = byId('search-panel-input');
  const searchPanelOpen = byId('search-panel-open');
  const searchResults = byId('search-results');
  const searchEmpty = byId('search-empty');
  const searchGlassEditor = byId('search-glass-editor');
  const searchGlassPicker = byId('search-glass-picker');
  const searchGlassHex = byId('search-glass-hex');
  const searchGlassReset = byId('search-glass-reset');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pendingClosures = new WeakMap();
  function cancelAnimatedClose(element) {
    const cancel = pendingClosures.get(element);
    if (cancel) cancel();
  }
  function animatedHide(element, finished) {
    if (element.hidden || element.classList.contains('is-closing')) return;
    if (reducedMotion.matches) { finished(); return; }
    element.classList.add('is-closing');
    let timer;
    let completed = false;
    const finalize = (cancelled = false) => {
      if (completed) return;
      completed = true;
      element.removeEventListener('animationend', onEnd);
      window.clearTimeout(timer);
      element.classList.remove('is-closing');
      pendingClosures.delete(element);
      if (!cancelled) finished();
    };
    const onEnd = event => { if (event.target === element) finalize(); };
    element.addEventListener('animationend', onEnd);
    timer = window.setTimeout(() => finalize(), 340);
    pendingClosures.set(element, () => finalize(true));
  }
  const searchable = [
    { id:'about', title:'About Windows', meta:'System · App', icon:'info-app', keywords:'about windows system information version build', run: () => showInformation() },
    { id:'settings-app', title:'Settings', meta:'System · App', icon:'settings-app', keywords:'settings configuration system app', run: () => emit('settings-requested') },
    { id:'settings-taskbar', title:'Taskbar settings', meta:'Settings · Personalization', icon:'settings', keywords:'taskbar location alignment search floating attached dock top bottom left right', run: () => emit('settings-requested', {section:'taskbar'}) },
    { id:'settings-colors', title:'Colors and transparency', meta:'Settings · Personalization', icon:'brush', keywords:'accent glass color transparency shadow HDR personalization', run: () => emit('settings-requested', {section:'colors'}) },
    { id:'settings-time', title:'Language and time', meta:'Settings · System', icon:'settings', keywords:'clock date time zone 24-hour language english', run: () => emit('settings-requested', {section:'time'}) },
    { id:'settings-updates', title:'Windows Update', meta:'Settings · System', icon:'settings', keywords:'windows update check pause update history', run: () => emit('settings-requested', {section:'updates'}) },
    { id:'settings-login', title:'Login and privacy', meta:'Settings · Account', icon:'shield', keywords:'login privacy profile name PIN account', run: () => emit('settings-requested', {section:'login'}) },
    { id:'security-app', title:'Windows Security', meta:'System · App', icon:'security-app', keywords:'security defender protection app', run: () => emit('defender-requested') },
    { id:'build', title:'Windows 12', meta:'Version 10H10 · OS Build 2610125', icon:'windows', keywords:'build system version 10h10 2610125 operating system', run: () => showInformation() },
    { id:'glass', title:'Adjust Glass Color', meta:'Personalization · Glass', icon:'palette', keywords:'adjust custom glass mica color colour picker hex tint appearance surface personalize', run: () => showSearchGlassEditor() },
    { id:'appearance', title:'Open appearance menu', meta:'Desktop · Action', icon:'sliders', keywords:'open right click context menu color theme personalize', run: () => showAppearanceMenu(Math.round(innerWidth/2), Math.round(innerHeight - 155)) },
    { id:'display', title:'Display settings', meta:'Desktop · Action', icon:'display', keywords:'open monitor display settings screen desktop', run: () => { hideAppearanceMenu(); emit('display-settings-requested'); } },
    { id:'personalize', title:'Personalize settings', meta:'Desktop · Action', icon:'brush', keywords:'open personalize settings theme wallpaper colors desktop', run: () => { hideAppearanceMenu(); emit('personalize-settings-requested'); } },
    { id:'customize-menu', title:'Customize context menu', meta:'Desktop · Action', icon:'customize', keywords:'open customize context menu personalize menu options', run: () => { hideAppearanceMenu(); emit('customize-context-menu-requested'); } },
    { id:'weather', title:'Weather', meta:'Weather · Action', icon:'weather', keywords:'forecast weather temperature partly cloudy', run: () => { byId('weather-button').focus(); emit('weather-requested'); } },
    { id:'shortcut', title:'Search', meta:'Search · Action', icon:'search', keywords:'open search find quick keyboard shortcut', run: () => { search.focus(); showSearchPanel(); } }
  ];
  let visibleResults = [];

  // Measure the actual results, so one match produces a compact panel rather
  // than leaving unused space. Keep it bounded by the viewport and scroll rows.
  function resizeSearchPanel() {
    if (searchPanel.hidden) return;
    const style = getComputedStyle(searchPanel);
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    const gap = parseFloat(style.rowGap) || 0;
    const content = !searchGlassEditor.hidden ? searchGlassEditor.scrollHeight : (visibleResults.length ? searchResults.scrollHeight : searchEmpty.scrollHeight);
    const composer = searchPanel.querySelector('.search-panel-composer').offsetHeight;
    const maxHeight = parseFloat(style.maxHeight);
    const naturalHeight = Math.ceil(padding + border + gap + content + composer);
    searchPanel.style.height = `${Math.min(naturalHeight, maxHeight)}px`;
  }
  function positionSearchPanel() {
    // Fixed CSS left:50% + translate:-50% keeps Search centered at every width.
  }
  function normalizeItemTitle(value) {
    return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  }
  function displayTitle(item) { return item.title; }
  function displayIcon(item) { return item.icon; }
  function exactItemMatch(query, item) {
    const name = normalizeItemTitle(query);
    return name.length > 0 && normalizeItemTitle(displayTitle(item)) === name;
  }
  function renderSearchResults(query = '') {
    const q = query.trim().toLocaleLowerCase();
    visibleResults = searchable.filter(item =>
      !q || `${displayTitle(item)} ${item.meta} ${item.keywords}`.toLocaleLowerCase().includes(q) || exactItemMatch(q, item)
    );
    searchResults.replaceChildren();
    searchEmpty.hidden = visibleResults.length > 0;
    for (const item of visibleResults) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'search-result';
      row.dataset.searchAction = item.id;
      const iconWrap = document.createElement('span');
      iconWrap.className = 'search-result-icon';
      const iconName = displayIcon(item);
      if (iconName === 'windows') {
        const winLogo = document.createElement('span');
        winLogo.className = 'search-windows-logo';
        winLogo.setAttribute('aria-hidden', 'true');
        iconWrap.append(winLogo);
      } else if (iconName === 'info-app' || iconName === 'settings-app' || iconName === 'security-app') {
        const img = document.createElement('img');
        img.className = 'search-app-icon';
        img.src = ({
          'info-app': 'https://img.icons8.com/?size=100&id=VQOfeAx5KWTK&format=png&color=000000',
          'settings-app': 'https://img.icons8.com/?size=100&id=s5NUIabJrb4C&format=png&color=000000',
          'security-app': 'https://img.icons8.com/?size=100&id=oo5voXhXsnEk&format=png&color=000000'
        })[iconName];
        img.alt = '';
        img.draggable = false;
        img.setAttribute('aria-hidden', 'true');
        iconWrap.append(img);
      } else if (iconName === 'weather') {
        const img = document.createElement('img');
        img.className = 'search-weather-icon';
        img.src = 'https://img.icons8.com/?size=100&id=zIVmoh4T8wh7&format=png&color=000000';
        img.alt = '';
        img.draggable = false;
        img.setAttribute('aria-hidden', 'true');
        iconWrap.append(img);
      } else {
        const ph = document.createElement('i');
        ph.className = `ph ph-${({ info:'info', palette:'palette', sliders:'faders-horizontal', cloud:'cloud-sun', search:'magnifying-glass', display:'monitor', brush:'paint-brush', customize:'sliders-horizontal', settings:'gear-six', shield:'shield-check' })[iconName]}`;
        ph.setAttribute('aria-hidden','true');
        iconWrap.append(ph);
      }
      row.style.setProperty('--result-index', String(Math.min(searchResults.childElementCount, 5)));
      const textWrap = document.createElement('span');
      textWrap.className = 'search-result-text';
      const title = document.createElement('span');
      title.className = 'search-result-title';
      title.textContent = displayTitle(item);
      const meta = document.createElement('span');
      meta.className = 'search-result-meta';
      meta.textContent = item.meta;
      textWrap.append(title,meta);
      // The trailing action icon is decorative and uses the same behavior as
      // the whole search result. CSS supplies the Icons8 glyph and fade.
      const hoverIcon = document.createElement('span');
      hoverIcon.className = 'search-result-hover-icon';
      hoverIcon.setAttribute('aria-hidden', 'true');
      row.append(iconWrap, textWrap, hoverIcon);
      row.addEventListener('click', () => executeSearchResult(item));
      searchResults.append(row);
    }
    const exactMatches = searchable.filter(item => exactItemMatch(q, item));
    if (searchPanelOpen) {
      searchPanelOpen.hidden = exactMatches.length === 0;
      searchPanelOpen.disabled = exactMatches.length === 0;
      searchPanelOpen.dataset.targetAction = exactMatches[0]?.id || '';
    }
  }
  // Search only adjusts the persisted glass surface tint; it never changes
  // Wallpaper accent or glass transparency.
  function nativeSearchGlass() {
    return getComputedStyle(document.documentElement).getPropertyValue('--ww10-default-glass-color').trim() ||
      '#ffffff';
  }
  function currentSearchGlass() {
    return window.WebWindowsSettings?.get()?.glass || nativeSearchGlass();
  }
  function syncSearchGlassEditor() {
    if (!searchGlassEditor || searchGlassEditor.hidden) return;
    const state = window.WebWindowsSettings?.get();
    const hex = currentSearchGlass();
    searchGlassPicker.value = hex;
    if (document.activeElement !== searchGlassHex) searchGlassHex.value = hex.toUpperCase();
    searchGlassReset.setAttribute('aria-pressed', String(state?.glass == null));
  }
  function showSearchGlassEditor() {
    if (!window.WebWindowsSettings?.setGlass) return;
    searchResults.hidden = true;
    searchEmpty.hidden = true;
    searchGlassEditor.hidden = false;
    searchPanelOpen.hidden = true;
    syncSearchGlassEditor();
    resizeSearchPanel();
    searchGlassPicker.focus({preventScroll:true});
  }
  function hideSearchGlassEditor(focusResult = true) {
    if (searchGlassEditor.hidden) return;
    searchGlassEditor.hidden = true;
    searchResults.hidden = false;
    renderSearchResults(search.value);
    resizeSearchPanel();
    if (focusResult) searchResults.querySelector('[data-search-action="glass"]')?.focus({preventScroll:true});
  }
  function applySearchGlassHex(raw) {
    const hex = raw.trim().replace(/^([a-f0-9]{6})$/i, '#$1');
    if (!/^#[a-f0-9]{6}$/i.test(hex)) return false;
    window.WebWindowsSettings?.setGlass(hex);
    searchGlassHex.removeAttribute('aria-invalid');
    return true;
  }
  byId('search-glass-back').addEventListener('click', () => hideSearchGlassEditor());
  searchGlassPicker.addEventListener('input', e => window.WebWindowsSettings?.setGlass(e.target.value));
  searchGlassHex.addEventListener('input', e => {
    const valid = applySearchGlassHex(e.target.value);
    if (e.target.value.trim().length >= 7) e.target.setAttribute('aria-invalid', String(!valid));
    else e.target.removeAttribute('aria-invalid');
  });
  searchGlassHex.addEventListener('change', e => {
    if (!applySearchGlassHex(e.target.value)) {
      e.target.value = currentSearchGlass().toUpperCase();
      e.target.removeAttribute('aria-invalid');
    }
  });
  searchGlassReset.addEventListener('click', () => {
    window.WebWindowsSettings?.setGlass(null);
    searchGlassHex.value = currentSearchGlass().toUpperCase();
  });
  window.addEventListener('webwindows:glass-changed', syncSearchGlassEditor);
  function showSearchPanel() {
    // Re-entering Search through typing returns from the glass editor to results.
    if (!searchGlassEditor.hidden) hideSearchGlassEditor(false);
    hideAppearanceMenu();
    cancelAnimatedClose(searchPanel);
    if (searchPanel.hidden) searchPanel.hidden = false;
    search.setAttribute('aria-expanded','true');
    searchPanelInput.value = search.value;
    renderSearchResults(search.value);
    resizeSearchPanel();
    positionSearchPanel();
  }
  function hideSearchPanel() {
    search.setAttribute('aria-expanded','false');
    animatedHide(searchPanel, () => { searchPanel.hidden = true; });
  }
  function setSearchQuery(value, origin) {
    if (origin !== search) search.value = value;
    if (origin !== searchPanelInput) searchPanelInput.value = value;
    showSearchPanel();
    emit('search-input', { query:value });
  }
  function executeSearchResult(item) {
    if (!item) return;
    if (item.id === 'glass') {
      item.run();
      emit('search-submitted', {query:search.value, action:item.id});
      return;
    }
    hideSearchPanel();
    search.blur();
    searchPanelInput.blur();
    item.run();
    emit('search-submitted',{query: search.value, action:item.id});
  }
  searchShell.addEventListener('click',showSearchPanel);
  search.addEventListener('focus',showSearchPanel);
  search.addEventListener('input', () => setSearchQuery(search.value,search));
  searchPanelInput.addEventListener('input', () => setSearchQuery(searchPanelInput.value,searchPanelInput));
  searchPanelOpen.addEventListener('click', () => {
    const item = searchable.find(candidate => candidate.id === searchPanelOpen.dataset.targetAction);
    if (!item || searchPanelOpen.hidden) return;
    executeSearchResult(item);
  });
  searchPanelInput.addEventListener('focus', () => { if(searchPanel.hidden) showSearchPanel(); });
  function handleSearchKeys(event) {
    if (event.key === 'Escape' && !searchPanel.hidden) {
      event.preventDefault();
      event.stopPropagation();
      hideSearchPanel();
      search.blur();
      searchPanelInput.blur();
    } else if (event.key === 'Enter' && !searchPanel.hidden) {
      event.preventDefault();
      const targetId = searchPanelOpen?.dataset.targetAction;
      const target = targetId ? visibleResults.find(item => item.id === targetId) : visibleResults[0];
      executeSearchResult(target || visibleResults[0]);
    } else if (event.key === 'ArrowDown' && !searchPanel.hidden) {
      const first = searchResults.querySelector('button.search-result');
      if (first) { event.preventDefault(); first.focus(); }
    }
  }
  search.addEventListener('keydown',handleSearchKeys);
  searchPanelInput.addEventListener('keydown',handleSearchKeys);
  searchResults.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const rows = [...searchResults.querySelectorAll('button.search-result')];
    const current = rows.indexOf(document.activeElement);
    if (!rows.length) return;
    event.preventDefault();
    rows[(current + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length].focus();
  });
  document.addEventListener('pointerdown', event => {
    if (!searchPanel.hidden && !searchPanel.contains(event.target) && !searchShell.contains(event.target)) hideSearchPanel();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !searchPanel.hidden) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!searchGlassEditor.hidden && searchGlassEditor.contains(event.target)) {
        hideSearchGlassEditor();
        return;
      }
      hideSearchPanel();
      if(document.activeElement?.closest('#search-panel')) search.blur();
    }
  }, true);
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      search.focus();
      search.select();
      showSearchPanel();
    }
  });
  window.addEventListener('resize', () => { resizeSearchPanel(); positionSearchPanel(); });

  // The context menu adjusts the single glass surface, without a separate mode.
  const menu = byId('appearance-menu');
  // Clear the obsolete independent theme preference from older builds.
  try { localStorage.removeItem('webwindows.10h10.appearance'); } catch {}

  function hideAppearanceMenu() {
    animatedHide(menu, () => { menu.hidden = true; });
  }
  function showAppearanceMenu(clientX, clientY) {
    hideSearchPanel();
    cancelAnimatedClose(menu);
    menu.hidden = false;
    // Keep the menu in the viewport even when invoked near a screen edge.
    const padding = 6;
    const x = Math.max(padding, Math.min(clientX, window.innerWidth - menu.offsetWidth - padding));
    const y = Math.max(padding, Math.min(clientY, window.innerHeight - menu.offsetHeight - padding));
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  for (const surface of [byId('desktop'), byId('taskbar')]) {
    surface.addEventListener('contextmenu', (event) => {
      // Text editing keeps its native right-click context menu.
      if (event.target.closest('input, textarea')) return;
      event.preventDefault();
      showAppearanceMenu(event.clientX, event.clientY);
    });
  }
  const menuCommands = [...menu.querySelectorAll('[data-menu-action]')];
  const menuEventMap = {
    display: 'display-settings-requested',
    personalize: 'personalize-settings-requested',
    'customize-menu': 'customize-context-menu-requested'
  };
  for (const command of menuCommands) {
    command.addEventListener('click', () => {
      hideAppearanceMenu();
      emit(menuEventMap[command.dataset.menuAction]);
    });
  }
  document.addEventListener('pointerdown', (event) => {
    if (!menu.hidden && !menu.contains(event.target)) hideAppearanceMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (menu.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      hideAppearanceMenu();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const menuItems = [...menu.querySelectorAll('[role="menuitemradio"], [role="menuitem"]')];
      const index = menuItems.indexOf(document.activeElement);
      menuItems[(index + (event.key === 'ArrowDown' ? 1 : -1) + menuItems.length) % menuItems.length].focus();
    }
  }, true);
  window.addEventListener('blur', hideAppearanceMenu);
  window.addEventListener('resize', hideAppearanceMenu);

  // Existing Information window shares the Mica system with Settings.
  const infoWindow = byId('information-window');
  const infoTaskbarButton = byId('information-button');
  const infoTitlebar = byId('about-titlebar');
  const infoClose = byId('about-close');
  const infoOK = byId('about-ok');
  let drag = null;

// Window dimensions are captured before hiding, so thumbnails retain the exact
// layout they had when the user clicked Minimize.
function rememberMinimizedWindow(win, taskbarId) {
  const rect=win.getBoundingClientRect();
  win.dataset.wwPreviewWidth=String(Math.max(200, Math.round(rect.width)));
  win.dataset.wwPreviewHeight=String(Math.max(150, Math.round(rect.height)));
  win.dataset.wwMinimized='true';
  win.hidden=true;
  window.dispatchEvent(new CustomEvent('webwindows:app-minimized',{detail:{taskbarId}}));
}
function clearMinimizedWindow(win, taskbarId, kind='restored') {
  delete win.dataset.wwMinimized;
  window.dispatchEvent(new CustomEvent('webwindows:app-'+kind,{detail:{taskbarId}}));
}

  function showInformation() {
    const restoring=infoWindow.dataset.wwMinimized==='true';
    if(restoring) clearMinimizedWindow(infoWindow,'information-button');
    hideSearchPanel();
    hideAppearanceMenu();
    cancelAnimatedClose(infoWindow);
    if (!infoWindow.hidden) {
      infoClose.focus();
      return;
    }
    if(!restoring){
      infoWindow.style.left = '50%';
      infoWindow.style.top = 'calc((100vh - var(--taskbar-height)) / 2)';
      infoWindow.style.transform = 'translate(-50%, -50%)';
    }
    infoWindow.hidden = false;
    infoTaskbarButton.classList.add('is-open');
    infoClose.focus({ preventScroll: true });
  }

  function closeInformation() {
    if(infoWindow.dataset.wwMinimized==='true') {
      clearMinimizedWindow(infoWindow,'information-button','closed');
      infoWindow.hidden=true; infoTaskbarButton.classList.remove('is-open');
      return;
    }
    if (infoWindow.hidden) return;
    if (infoWindow.classList.contains('is-closing')) return;
    drag = null;
    infoTaskbarButton.focus({ preventScroll: true });
    animatedHide(infoWindow, () => {
      infoWindow.hidden = true;
      infoTaskbarButton.classList.remove('is-open');
    });
  }

  window.addEventListener('webwindows:information-requested', showInformation);
  infoClose.addEventListener('click', closeInformation);
  byId('about-minimize').addEventListener('click', () => {
    if(infoWindow.hidden || infoWindow.classList.contains('is-closing')) return;
    rememberMinimizedWindow(infoWindow,'information-button');
    infoTaskbarButton.classList.add('is-open');
  });
  window.addEventListener('webwindows:app-preview-close-requested',e=>{
    if(e.detail?.taskbarId==='information-button') closeInformation();
  });
  infoOK.addEventListener('click', closeInformation);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !infoWindow.hidden) {
      event.preventDefault();
      closeInformation();
    }
  });

  // The About window is draggable by its title bar, as a Windows dialog is.
  infoTitlebar.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button') || infoWindow.classList.contains('ww10-maximized')) return;
    const rect = infoWindow.getBoundingClientRect();
    infoWindow.style.left = `${rect.left}px`;
    infoWindow.style.top = `${rect.top}px`;
    infoWindow.style.transform = 'none';
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    infoTitlebar.setPointerCapture(event.pointerId);
  });
  infoTitlebar.addEventListener('pointermove', (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const maxLeft = Math.max(0, window.innerWidth - infoWindow.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - infoWindow.offsetHeight);
    infoWindow.style.left = `${Math.max(0, Math.min(maxLeft, drag.left + event.clientX - drag.x))}px`;
    infoWindow.style.top = `${Math.max(0, Math.min(maxTop, drag.top + event.clientY - drag.y))}px`;
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    infoTitlebar.addEventListener(event, () => { drag = null; });
  }

})();


/* 9H09 Settings port for 10H10. Independent of the 9H09 application manager,
   Tailwind, and its login/updater modules. Default values intentionally match
   the unmodified 10H10 appearance and taskbar. */
(() => {
  function rememberMinimizedWindow(win, taskbarId) {
    const rect=win.getBoundingClientRect();
    win.dataset.wwPreviewWidth=String(Math.max(200,Math.round(rect.width)));
    win.dataset.wwPreviewHeight=String(Math.max(150,Math.round(rect.height)));
    win.dataset.wwMinimized='true';win.hidden=true;
    window.dispatchEvent(new CustomEvent('webwindows:app-minimized',{detail:{taskbarId}}));
  }
  function clearMinimizedWindow(win,taskbarId,kind='restored') {
    delete win.dataset.wwMinimized;
    window.dispatchEvent(new CustomEvent('webwindows:app-'+kind,{detail:{taskbarId}}));
  }

  'use strict';
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const dialog = $('settings-window');
  if (!dialog) return;
  const KEY = 'webwindows.10h10.settings.v1';
  const original = Object.freeze({position:'bottom',align:'center',layout:'attached',searchMode:'box',glass:null,opacity:80,accent:'#0078d4',autoAccent:false,shadows:true,hdr:false,localTime:true,localDate:true,hour24:false,language:'en-US',account:'Administrator',pausedUntil:'',earlyUpdates:true,insiderProduct:'10H10',insiderExperience:'',insiderReleasePreview:false});
  const storage = {
    read: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
    write: (key,value) => { try { localStorage.setItem(key,value); return true; } catch { return false; } }
  };
  let stored = {};
  try { stored = JSON.parse(storage.read(KEY)) || {}; } catch { /* start with system defaults */ }
  let state = {...original};
  for (const key of Object.keys(original)) {
    if (Object.prototype.hasOwnProperty.call(stored, key) && typeof stored[key] === typeof original[key]) state[key] = stored[key];
  }
  // Map the previous unified/separated toggle to the new attached/floating choices.
  if (!Object.prototype.hasOwnProperty.call(stored,'layout') && typeof stored.unified === 'boolean')
    state.layout = stored.unified ? 'attached' : 'floating';
  // glass is a nullable preference and is not accepted from arbitrary non-hex data.
  if (stored.glass === null || /^#[0-9a-fA-F]{6}$/.test(stored.glass || '')) state.glass = stored.glass;
  const allowed = {
    position:['bottom','top','left','right'], align:['center','start'], layout:['attached','floating'], searchMode:['box','icon','hover'],
    language:['en-US','en-GB','es-ES','fr-FR','de-DE','pt-BR','ja-JP']
  };
  for (const [key, options] of Object.entries(allowed)) if (!options.includes(state[key])) state[key] = original[key];
  for (const name of ['accent']) if (!/^#[a-f\d]{6}$/i.test(state[name])) state[name] = original[name];
  state.opacity = Number.isFinite(Number(state.opacity)) ? Math.max(0,Math.min(100,Math.round(Number(state.opacity)))) : original.opacity;
  state.account = (state.account || 'Administrator').slice(0,48);
  // Migrate the earlier Insider preview selection without resetting the user's choice.
  if (state.insiderProduct === '9H09') state.insiderProduct = '11H11';
  if (!['10H10','11H11','future'].includes(state.insiderProduct)) state.insiderProduct='10H10';
  if (!['','beta','experimental','release'].includes(state.insiderExperience)) state.insiderExperience='';
  const persist = () => storage.write(KEY, JSON.stringify(state));
  const pages = [...dialog.querySelectorAll('[data-ww-view]')];
  const navItems = [...dialog.querySelectorAll('[role="tab"][data-ww-page]')];
  let currentPage = 'home';
  function showPage(name) {
    if (!pages.some(p => p.dataset.wwView === name)) return;
    closeChoice();
    currentPage = name;
    pages.forEach(p => {
      const active = p.dataset.wwView === name;
      p.hidden = !active;
      p.classList.remove('ww9-page-enter');
      if (active && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Re-trigger 9H09-style page entrance on every navigation.
        void p.offsetWidth;
        p.classList.add('ww9-page-enter');
      }
    });
    let active = name;
    if (['colors','taskbar'].includes(name)) active = 'personalization';
    if (name === 'language') active = 'time';
    if (name === 'pin') active = 'login';
    if (name === 'insider') active = 'updates';
    navItems.forEach(item => item.setAttribute('aria-selected', String(item.dataset.wwPage === active)));
    $('ww-settings-scroll').scrollTop = 0;
    if (name === 'insider') void checkInsiderPreviewAvailability();
  }
  // Windows Settings-style search only returns existing, functioning routes.
  const settingsSearch = $('ww11-settings-search');
  const searchResults = $('ww11-search-results');
  const searchablePages = [
    {name:'Home',detail:'Settings overview',page:'home',terms:'start main recommended'},
    {name:'Background',detail:'Personalization',page:'personalization',terms:'wallpaper picture desktop photos'},
    {name:'Colors and transparency',detail:'Personalization',page:'colors',terms:'accent glass mica custom color opacity appearance'},
    {name:'Taskbar',detail:'Personalization',page:'taskbar',terms:'taskbar position alignment search floating'},
    {name:'Date and time',detail:'Time & language',page:'time',terms:'clock zone 12 hour 24 hour'},
    {name:'Language',detail:'Time & language',page:'language',terms:'display language region translation'},
    {name:'Windows Update',detail:'Updates',page:'updates',terms:'check update history pause build'},
    {name:'Windows Insider Program',detail:'Windows Update',page:'insider',terms:'insider preview builds channel feedback'},
    {name:'Account and privacy',detail:'Accounts',page:'login',terms:'profile image name login sign in'},
    {name:'PIN options',detail:'Accounts',page:'pin',terms:'privacy security pin sign in'},
  ];
  function closeSettingsSearch(clear=false) {
    searchResults.hidden=true;
    settingsSearch.setAttribute('aria-expanded','false');
    if(clear)settingsSearch.value='';
  }
  function renderSettingsSearch() {
    const term=settingsSearch.value.trim().toLocaleLowerCase();
    searchResults.replaceChildren();
    if(!term){closeSettingsSearch();return;}
    const matches=searchablePages.filter(p=>(p.name+' '+p.detail+' '+p.terms).toLocaleLowerCase().includes(term));
    if(!matches.length) {
      const empty=document.createElement('div');empty.className='ww11-search-empty';empty.textContent='No matching settings';searchResults.append(empty);
    } else {
      matches.forEach(p=>{
        const button=document.createElement('button');button.type='button';button.className='ww11-search-result';button.dataset.wwPage=p.page;
        const label=document.createElement('span');label.textContent=p.name;
        const detail=document.createElement('small');detail.textContent=p.detail;
        button.append(label,detail);searchResults.append(button);
      });
    }
    searchResults.hidden=false;settingsSearch.setAttribute('aria-expanded','true');
  }
  settingsSearch.addEventListener('input',renderSettingsSearch);
  settingsSearch.addEventListener('keydown',event=>{
    if(event.key==='Escape'){closeSettingsSearch(true);event.stopPropagation();event.preventDefault();}
    if(event.key==='Enter'){
      const first=searchResults.querySelector('button[data-ww-page]');
      if(first){showPage(first.dataset.wwPage);closeSettingsSearch(true);event.preventDefault();}
    }
  });
  dialog.addEventListener('click',event=>{
    if(event.target.closest('#ww11-search-results [data-ww-page]'))closeSettingsSearch(true);
    else if(!event.target.closest('.ww11-search-wrap'))closeSettingsSearch();
  });
  // Dragging works like the native About Windows dialog. Moving the window never
  // changes its original centered location after it is closed and reopened.
  let drag = null;
  const titlebar = $('ww-settings-titlebar');
  titlebar.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('button') || dialog.classList.contains('ww10-maximized')) return;
    const r = dialog.getBoundingClientRect();
    dialog.style.left = `${r.left}px`; dialog.style.top = `${r.top}px`;
    dialog.style.transform = 'none';
    drag = {pointerId:e.pointerId, x:e.clientX, y:e.clientY, left:r.left, top:r.top};
    titlebar.setPointerCapture(e.pointerId);
  });
  titlebar.addEventListener('pointermove', e => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    dialog.style.left = `${Math.max(0, Math.min(innerWidth - dialog.offsetWidth, drag.left + e.clientX - drag.x))}px`;
    dialog.style.top = `${Math.max(0, Math.min(innerHeight - dialog.offsetHeight, drag.top + e.clientY - drag.y))}px`;
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) titlebar.addEventListener(type, () => { drag = null; });
  let closeTimer = null;
  let closeEnd = null;
  function cancelClose() {
    if (closeTimer !== null) clearTimeout(closeTimer);
    if (closeEnd) dialog.removeEventListener('animationend', closeEnd);
    closeTimer = null; closeEnd = null; closing = false;
    dialog.classList.remove('is-closing');
  }
  function openSettings(section) {
    const restoring=dialog.dataset.wwMinimized==='true';
    if(restoring) clearMinimizedWindow(dialog,'settings-button');
    cancelClose(); dialog.hidden = false;
    if(!restoring){
      dialog.style.left = '50%'; dialog.style.top = 'calc((100dvh - var(--taskbar-height)) / 2)';
      dialog.style.transform = 'translate(-50%,-50%)';
    }
    $('settings-button').classList.add('is-open');
    // A minimized 9H09 window restores exactly where and how the user left it.
    if (section) showPage(section);
    else if(!restoring) showPage(currentPage);
    dialog.focus?.({preventScroll:true});
  }
  let closing = false;
  function closeSettings() {
    if(dialog.dataset.wwMinimized==='true') {
      clearMinimizedWindow(dialog,'settings-button','closed');
      dialog.hidden=true;
      $('settings-button').classList.remove('is-open');
      closeChoice();
      return;
    }
    if (dialog.hidden || closing) return;
    closeChoice();
    closing = true;
    dialog.classList.add('is-closing');
    const finish = () => {
      if (!closing) return;
      cancelClose(); dialog.hidden = true;
      $('settings-button').classList.remove('is-open');
      $('settings-button').focus({preventScroll:true});
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    closeTimer = setTimeout(finish, 280);
    closeEnd = e => { if (e.target === dialog) finish(); };
    dialog.addEventListener('animationend',closeEnd);
  }
  window.addEventListener('webwindows:settings-requested', e => openSettings(e.detail?.section));
  window.addEventListener('webwindows:personalize-settings-requested', () => openSettings('personalization'));
  window.addEventListener('webwindows:display-settings-requested', () => openSettings('colors'));
  window.addEventListener('webwindows:customize-context-menu-requested', () => openSettings('colors'));
  $('ww-settings-close').addEventListener('click', closeSettings);
  $('ww-settings-minimize').addEventListener('click', () => {
    if(dialog.hidden || closing) return;
    closeChoice();
    rememberMinimizedWindow(dialog,'settings-button');
    $('settings-button').classList.add('is-open');
  });
  window.addEventListener('webwindows:app-preview-close-requested',e=>{
    if(e.detail?.taskbarId==='settings-button') closeSettings();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !dialog.hidden && !closing) { e.preventDefault(); closeSettings(); }
  });
  dialog.addEventListener('click', e => {
    const route = e.target.closest('[data-ww-page]');
    if (route && dialog.contains(route)) showPage(route.dataset.wwPage);
  });
  // Functions exposed for other future 10H10 modules; not window-global 9H09 functions.
  // Public controller is exported after all Settings handlers are installed.

  const rgb = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16));
  const toHex = (r,g,b) => '#' + [r,g,b].map(c=>Math.min(255,Math.max(0,Math.round(c))).toString(16).padStart(2,'0')).join('');
  // Single 10H10 material engine. The chosen glass swatch defines all UI
  // surfaces; contrast is derived directly from its perceived luminance.
  function nativeGlassColor() {
    return getComputedStyle(root).getPropertyValue('--ww10-default-glass-color').trim() || '#ffffff';
  }
  function applyGlass() {
    const base = rgb(state.glass || nativeGlassColor());
    const channel = c => {
      c /= 255;
      return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
    };
    const luminosity = base.reduce((total,c,i)=>total+channel(c)*[.2126,.7152,.0722][i],0);
    const deep = luminosity < .27;
    // Labels track brightness automatically; this is NOT an appearance mode.
    root.dataset.wwInk = deep ? 'light' : 'dark';
    root.style.colorScheme = deep ? 'dark' : 'light';
    const mix = (a,b,weight) => Math.round(a*(1-weight)+b*weight);
    const towards = (dest,weight) => base.map(c=>mix(c,dest,weight));
    const rgba = (channels,a) => `rgba(${channels.join(',')},${Math.max(0,Math.min(1,a)).toFixed(4)})`;
    const opacity = Math.max(0,Math.min(1,state.opacity/100));
    const hover = towards(deep ? 255 : 0,deep ? .115 : .065);
    const control = towards(deep ? 255 : 0,deep ? .072 : .027);
    const selected = towards(deep ? 255 : 0,deep ? .17 : .10);
    const foreground = deep ? '#f2f3f5' : '#202936';
    const secondary = deep ? '#b6bbc4' : '#526075';
    const rgbBorder = deep ? [255,255,255] : [42,57,79];

    root.style.setProperty('--mica-surface',rgba(base,opacity));
    root.style.setProperty('--titlebar-surface',rgba(base,Math.min(1,.30+opacity*.68)));
    root.style.setProperty('--control-surface',rgba(control,Math.min(1,.30+opacity*.60)));
    root.style.setProperty('--control-hover',rgba(hover,Math.min(1,.50+opacity*.48)));
    root.style.setProperty('--taskbar-hover',rgba(hover,Math.min(1,.28+opacity*.58)));
    root.style.setProperty('--taskbar-pressed',rgba(selected,Math.min(1,.50+opacity*.44)));
    root.style.setProperty('--menu-icon-surface',rgba(control,Math.min(1,.30+opacity*.54)));
    root.style.setProperty('--menu-selected',rgba(selected,Math.min(1,.44+opacity*.48)));
    root.style.setProperty('--text-primary',foreground);
    root.style.setProperty('--text-secondary',secondary);
    root.style.setProperty('--taskbar-color',foreground);
    root.style.setProperty('--mica-border',rgba(rgbBorder,deep ? .12 : .11));
    root.style.setProperty('--mica-control-border',rgba(rgbBorder,deep ? .13 : .12));
    root.style.setProperty('--menu-separator',rgba(rgbBorder,.12));
    root.style.setProperty('--ww-selected-surface',rgba(selected,.96));
    root.style.setProperty('--ww-popup-surface',rgba(base,.965));
    root.style.setProperty('--ww-highlight-surface',rgba(control,.94));
    root.style.setProperty('--ww-glass-ink',foreground);
    root.style.setProperty('--ww-glass-ink-muted',secondary);
    root.style.setProperty('--ww10-default-glass-color','#ffffff');
    // A very faint sheen preserves Mica depth without bleaching black glass.
    // HDR reflections are an additional translucent light layer. The selected
    // glass color, surface opacity and readable foreground remain untouched.
    const nativeSheen=deep
      ? 'linear-gradient(135deg,rgba(255,255,255,.032),rgba(255,255,255,0))'
      : 'linear-gradient(135deg,rgba(255,255,255,.07),rgba(0,0,0,.012))';
    root.style.setProperty('--mica-sheen',state.hdr
      ? `var(--ww10-hdr-reflection,linear-gradient(transparent,transparent)), ${nativeSheen}`
      : nativeSheen);
  }
  function applyColors() {
    root.style.setProperty('--ww-accent',state.accent);
    // Keep the original blue accent until changed; all other controls inherit it.
    $('ww-accent-custom').value = state.accent;
    $('ww-glass-custom').value = state.glass || nativeGlassColor();
    $('ww-auto-accent').checked = state.autoAccent;
    $('ww-accent-presets').querySelectorAll('[data-ww-accent]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.wwAccent === state.accent)));
    $('ww-glass-presets').querySelectorAll('[data-ww-glass]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.wwGlass === (state.glass ?? 'default'))));
    $('ww-transparency').value = String(state.opacity);
    $('ww-transparency').style.setProperty('--ww-range-fill',`${state.opacity}%`);
    $('ww-transparency-label').textContent = `${state.opacity}%`;
    $('ww-shadow-toggle').checked = state.shadows;
    $('ww-hdr-toggle').checked = state.hdr;
    root.dataset.wwShadow = state.shadows ? 'on':'off';
    root.dataset.wwHdr = state.hdr ? 'on':'off';
    applyGlass();
    // This is a non-destructive wallpaper post-process; the HDR toggle does
    // not change the user-selected glass or accent colors.
    hdrRenderer.setEnabled(state.hdr);
    document.querySelectorAll('[data-ww-context-glass]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.wwContextGlass === (state.glass ?? 'default'))));
    const glassPicker=$('ww-context-glass-picker'); if (glassPicker) glassPicker.value=state.glass || nativeGlassColor();
    const opacity=$('ww-context-opacity'); if (opacity) { opacity.value=state.opacity;opacity.style.setProperty('--ww-range-fill',`${state.opacity}%`); }
    const opacityLabel=$('ww-context-opacity-value'); if (opacityLabel) opacityLabel.textContent=state.opacity+'%';
    const currentGlass=state.glass||nativeGlassColor();
    /* Fine-tune panel removed; swatches and context-menu HEX remain supported. */
    $('ww-context-glass-hex').value=currentGlass;
    
    
    window.dispatchEvent(new CustomEvent('webwindows:glass-changed',{detail:{glass:state.glass,opacity:state.opacity,accent:state.accent}}));
  }
  function setAccent(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
    state.autoAccent = false; state.accent=hex.toLowerCase();
    persist(); applyColors();
  }
  async function autoAccentFromWallpaper() {
    if (!state.autoAccent) return;
    const image = new Image();
    const source = wallpaper || 'Background/Background.png';
    if (!source.startsWith('data:')) image.crossOrigin = 'anonymous';
    try {
      await new Promise((resolve,reject) => {
        image.onload=resolve; image.onerror=reject; image.src=source;
        if (image.complete && image.naturalWidth) resolve();
      });
      const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(image,0,0,32,32);
      const pixels=ctx.getImageData(0,0,32,32).data;
      let values=[0,0,0], total=0;
      for(let i=0;i<pixels.length;i+=4) {
        const v=[pixels[i],pixels[i+1],pixels[i+2]];
        const chroma=Math.max(...v)-Math.min(...v);
        const weight=1+chroma/40;
        for(let k=0;k<3;k++)values[k]+=v[k]*weight;
        total+=weight;
      }
      if (!state.autoAccent) return;
      const h=toHex(...values.map(v=>v/total));
      state.accent=h; persist(); applyColors();
    } catch { $('ww-wallpaper-status').textContent='Automatic accent extraction needs a readable local wallpaper; the current accent has been retained.'; }
  }
  $('ww-accent-presets').addEventListener('click',e=> { const btn=e.target.closest('[data-ww-accent]');if(btn)setAccent(btn.dataset.wwAccent); });
  $('ww-accent-custom').addEventListener('input',e=>setAccent(e.target.value));
  $('ww-glass-presets').addEventListener('click',e=> { const btn=e.target.closest('[data-ww-glass]');if(btn){state.glass=btn.dataset.wwGlass === 'default' ? null : btn.dataset.wwGlass;persist();applyColors();} });
  $('ww-glass-custom').addEventListener('input',e=> {state.glass=e.target.value;persist();applyColors();});
  $('ww-auto-accent').addEventListener('change',e=> {state.autoAccent=e.target.checked;persist();applyColors();if(state.autoAccent)autoAccentFromWallpaper();});
  $('ww-transparency').addEventListener('input',e=> {state.opacity=Number(e.target.value);persist();applyColors();});
  $('ww-shadow-toggle').addEventListener('change',e=> {state.shadows=e.target.checked;persist();applyColors();});
  $('ww-hdr-toggle').addEventListener('change',e=> {state.hdr=e.target.checked;persist();applyColors();});
  $('ww-appearance-reset').addEventListener('click',()=>{
    Object.assign(state,{accent:original.accent, autoAccent:original.autoAccent, glass:null, opacity:80, shadows:true,hdr:false});
    persist();applyColors();
  });

  function applyTaskbar() {
    root.dataset.wwTaskbar=state.position;
    root.dataset.wwAlign=state.align;
    root.dataset.wwLayout=state.layout;
    root.dataset.wwSearch=state.searchMode;
    $('ww-taskbar-align').value=state.align;
    dialog.querySelectorAll('[data-ww-layout-choice]').forEach(button => {
      const checked = button.dataset.wwLayoutChoice===state.layout;
      button.setAttribute('aria-checked',String(checked));
      button.tabIndex=checked?0:-1;
    });
    $('ww-search-mode').value=state.searchMode;
    dialog.querySelectorAll('[data-ww-position]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.wwPosition===state.position)));
    dialog.querySelectorAll('[data-ww-search-choice]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.wwSearchChoice===state.searchMode)));
    syncChoices();
  }
  let taskbarMotionTimeout;
  function animateTaskbarMove() {
    root.classList.remove('ww9-taskbar-transition');
    clearTimeout(taskbarMotionTimeout);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    void document.getElementById('taskbar').offsetHeight;
    root.classList.add('ww9-taskbar-transition');
    taskbarMotionTimeout=setTimeout(()=>root.classList.remove('ww9-taskbar-transition'),410);
  }
  $('ww-position-choices').addEventListener('click',e=>{const btn=e.target.closest('[data-ww-position]');if(btn){
    if(state.position===btn.dataset.wwPosition)return;
    state.position=btn.dataset.wwPosition;persist();applyTaskbar();animateTaskbarMove();
  }});
  $('ww-taskbar-align').addEventListener('change',e=>{state.align=e.target.value;persist();applyTaskbar();animateTaskbarMove();});
  const taskbarLayoutGrid=$('ww-taskbar-layout-choices');
  taskbarLayoutGrid.addEventListener('click',e=>{
    const button=e.target.closest('[data-ww-layout-choice]');
    if(!button || button.dataset.wwLayoutChoice===state.layout)return;
    state.layout=button.dataset.wwLayoutChoice; persist(); applyTaskbar(); animateTaskbarMove();
  });
  taskbarLayoutGrid.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    const buttons=[...taskbarLayoutGrid.querySelectorAll('[data-ww-layout-choice]')];
    const i=buttons.indexOf(document.activeElement);if(i<0)return;
    e.preventDefault();buttons[(i+(e.key==='ArrowRight'||e.key==='ArrowDown'?1:buttons.length-1))%buttons.length].focus();
    buttons[(i+(e.key==='ArrowRight'||e.key==='ArrowDown'?1:buttons.length-1))%buttons.length].click();
  });
  $('ww-search-mode').addEventListener('change',e=>{state.searchMode=e.target.value;persist();applyTaskbar();animateTaskbarMove();});
  // The 9H09 visual Search preview cards drive the same persisted setting as the native select.
  $('ww9-search-choice-grid').addEventListener('click',e=>{
    const btn=e.target.closest('[data-ww-search-choice]');
    if (!btn) return;
    state.searchMode=btn.dataset.wwSearchChoice;
    persist();applyTaskbar();animateTaskbarMove();
  });
  $('ww9-search-choice-grid').addEventListener('keydown',e=>{
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
    const cards=[...$('ww9-search-choice-grid').querySelectorAll('[data-ww-search-choice]')];
    const focused=document.activeElement;
    const idx=cards.indexOf(focused);
    if(idx<0)return;
    e.preventDefault();
    const next=cards[(idx+(e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1)+cards.length)%cards.length];
    next.focus();next.click();
  });
  // A compact Search icon is a label linked to the existing input; keeping the
  // original search handlers preserves keyboard and search-result behavior.

  const wwLegacyTranslations = {"en-US":{"accentColor":"Manual accent color","accountName":"Account Name","administrator":"Administrator","appearance":"Appearance","backg":"Background behaviors","bottom":"Bottom","browseFiles":"Browse files","browsePhotos":"Browse","checkUpdates":"Check for updates","chooseLocalImage":"Choose a local image","colorsTheme":"Colors & transparency effects","colorsThemeDesc":"Accent colors, materials, transparency, and visual effects","dynamicLockBg":"Dynamic Lock Screen Background","dynamicLockBgDesc":"Show a random curated image on the login screen","glassColor":"Glass surface color","glassTrans":"Transparency effects","hdrLighting":"HDR Lighting","langDisp":"Windows display language","langTime":"Language & time","language":"Language","left":"Left","localAccount":"Local Account","loginPrivacy":"Login & privacy","moreOptions":"More options","pauseUpdates":"Pause updates","pauseUpdatesDesc":"Pause for up to 1 month","personalization":"Personalization","privacy":"Privacy","profilePic":"Profile picture","recentImages":"Recent images","right":"Right","save":"Save","setDateAuto":"Synchronize clocks automatically","setTimeAuto":"Set time zone automatically","settings":"Settings","taskbar":"Taskbar","taskbarAlign":"Taskbar alignment","taskbarBehaviors":"Taskbar behaviors","taskbarLocation":"Taskbar location on screen","taskbarLocationDesc":"Choose where the taskbar appears","taskbarSubtitle":"Control how your taskbar behaves and appears on screen","top":"Top","twentyFourHour":"Show 24-hour clock","twentyFourHourDesc":"Use a 24-hour format (e.g. 13:00)","unifiedTaskbar":"Unified taskbar layout","update":"Update","updateHistory":"Update history","updates":"Windows Update","v6H06":"Version 6H06 (New-valley)","v7H07":"Version 7H07 (New-land)","v8H08":"Version 8H08 (Fresh-Eyes)","v9H09":"Version 9H09 (Deja vu)","visualEffects":"Visual effects","winUpdate":"Windows Update","windowShadows":"Window drop shadows"},"en-GB":{"accentColor":"Manual accent colour","accountName":"Account Name","administrator":"Administrator","appearance":"Appearance","backg":"Background behaviours","bottom":"Bottom","browseFiles":"Browse files","browsePhotos":"Browse","checkUpdates":"Check for updates","chooseLocalImage":"Choose a local image","colorsTheme":"Colours & transparency effects","colorsThemeDesc":"Accent colours, materials, transparency, and visual effects","dynamicLockBg":"Dynamic Lock Screen Background","dynamicLockBgDesc":"Show a random curated image on the login screen","glassColor":"Glass surface colour","glassTrans":"Transparency effects","hdrLighting":"HDR Lighting","langDisp":"Windows display language","langTime":"Language & time","language":"Language","left":"Left","localAccount":"Local Account","loginPrivacy":"Login & privacy","moreOptions":"More options","pauseUpdates":"Pause updates","pauseUpdatesDesc":"Pause for up to 1 month","personalization":"Personalisation","privacy":"Privacy","profilePic":"Profile picture","recentImages":"Recent images","right":"Right","save":"Save","setDateAuto":"Synchronise clocks automatically","setTimeAuto":"Set time zone automatically","settings":"Settings","taskbar":"Taskbar","taskbarAlign":"Taskbar alignment","taskbarBehaviors":"Taskbar behaviours","taskbarLocation":"Taskbar location on screen","taskbarLocationDesc":"Choose where the taskbar appears","taskbarSubtitle":"Control how your taskbar behaves and appears on screen","top":"Top","twentyFourHour":"Show 24-hour clock","twentyFourHourDesc":"Use a 24-hour format (e.g. 13:00)","unifiedTaskbar":"Unified taskbar layout","update":"Update","updateHistory":"Update history","updates":"Windows Update","v6H06":"Version 6H06 (New-valley)","v7H07":"Version 7H07 (New-land)","v8H08":"Version 8H08 (Fresh-Eyes)","v9H09":"Version 9H09 (Deja vu)","visualEffects":"Visual effects","winUpdate":"Windows Update","windowShadows":"Window drop shadows"},"es-ES":{"accentColor":"Color de énfasis manual","accountName":"Nombre de la cuenta","administrator":"Administrador","appearance":"Apariencia","backg":"Comportamientos del fondo","bottom":"Abajo","browseFiles":"Examinar archivos","browsePhotos":"Examinar","checkUpdates":"Buscar actualizaciones","chooseLocalImage":"Elige una imagen local","colorsTheme":"Colores y efectos de transparencia","colorsThemeDesc":"Color de énfasis, materiales de cristal y controles","dynamicLockBg":"Fondo de pantalla de bloqueo dinámico","dynamicLockBgDesc":"Mostrar una imagen seleccionada al azar en la pantalla de inicio de sesión","glassColor":"Color de superficie de cristal","glassTrans":"Efectos de transparencia","hdrLighting":"Iluminación HDR","langDisp":"Idioma de visualización de Ventanas","langTime":"Hora e idioma","language":"Idioma","left":"Izquierda","localAccount":"Cuenta local","loginPrivacy":"Inicio de sesión y privacidad","moreOptions":"Más opciones","pauseUpdates":"Pausar actualizaciones","pauseUpdatesDesc":"Pausar hasta por 1 mes","personalization":"Personalización","privacy":"Privacidad","profilePic":"Foto de perfil","recentImages":"Imágenes recientes","right":"Derecha","save":"Guardar","setDateAuto":"Sincronizar relojes automáticamente","setTimeAuto":"Establecer la zona horaria automáticamente","settings":"Configuración","taskbar":"Barra de tareas","taskbarAlign":"Alineación de la barra de tareas","taskbarBehaviors":"Comportamientos de la barra de tareas","taskbarLocation":"Ubicación de la barra de tareas en la pantalla","taskbarLocationDesc":"Elige dónde aparece la barra de tareas","taskbarSubtitle":"Controla cómo se comporta y aparece la barra de tareas","top":"Arriba","twentyFourHour":"Mostrar reloj de 24 horas","twentyFourHourDesc":"Usar un formato de 24 horas (ej. 13:00)","unifiedTaskbar":"Diseño de barra de tareas unificada","update":"Actualizar","updateHistory":"Historial de actualizaciones","updates":"Actualización de Ventanas","v6H06":"Versión 6H06 (Nuevo Valle)","v7H07":"Versión 7H07 (Nueva Tierra)","v8H08":"Versión 8H08 (Ojos Frescos)","v9H09":"Versión 9H09 (Déjà vu)","visualEffects":"Efectos visuales","winUpdate":"Actualización de Ventanas","windowShadows":"Sombras de las ventanas"},"fr-FR":{"accentColor":"Couleur d'accentuation manuelle","accountName":"Nom du compte","administrator":"Administrateur","appearance":"Apparence","backg":"Comportements de l'arrière-plan","bottom":"En bas","browseFiles":"Parcourir les fichiers","browsePhotos":"Parcourir","checkUpdates":"Rechercher des mises à jour","chooseLocalImage":"Choisissez une image locale","colorsTheme":"Couleurs et effets de transparence","colorsThemeDesc":"Couleur d'accentuation, matériaux de verre et curseurs","dynamicLockBg":"Arrière-plan dynamique de verrouillage","dynamicLockBgDesc":"Afficher une image aléatoire sur l'écran de verrouillage","glassColor":"Couleur de surface en verre","glassTrans":"Effets de transparence","hdrLighting":"Éclairage HDR","langDisp":"Langue d'affichage de Fenêtres","langTime":"Heure et langue","language":"Langue","left":"À gauche","localAccount":"Compte local","loginPrivacy":"Connexion et confidentialité","moreOptions":"Plus d'options","pauseUpdates":"Suspendre les mises à jour","pauseUpdatesDesc":"Suspendre jusqu'à 1 mois","personalization":"Personnalisation","privacy":"Confidentialité","profilePic":"Photo de profil","recentImages":"Images récentes","right":"À droite","save":"Enregistrer","setDateAuto":"Synchroniser les horloges automatiquement","setTimeAuto":"Définir le fuseau horaire automatiquement","settings":"Paramètres","taskbar":"Barre des tâches","taskbarAlign":"Alignement de la barre des tâches","taskbarBehaviors":"Comportements de la barre des tâches","taskbarLocation":"Emplacement de la barre des tâches","taskbarLocationDesc":"Choisissez où la barre des tâches apparaît","taskbarSubtitle":"Contrôlez le comportement de votre barre des tâches","top":"En haut","twentyFourHour":"Afficher l'horloge sur 24 heures","twentyFourHourDesc":"Utiliser un format de 24 heures (ex: 13:00)","unifiedTaskbar":"Disposition unifiée de la barre des tâches","update":"Mettre à jour","updateHistory":"Historique des mises à jour","updates":"Mise à jour de Fenêtres","v6H06":"Version 6H06 (Nouvelle Vallée)","v7H07":"Version 7H07 (Nouvelle Terre)","v8H08":"Version 8H08 (Regard Neuf)","v9H09":"Version 9H09 (Déjà vu)","visualEffects":"Effets visuels","winUpdate":"Mise à jour de Fenêtres","windowShadows":"Ombres des fenêtres"},"de-DE":{"accentColor":"Manuelle Akzentfarbe","accountName":"Kontoname","administrator":"Administrator","appearance":"Darstellung","backg":"Hintergrundverhalten","bottom":"Unten","browseFiles":"Dateien durchsuchen","browsePhotos":"Durchsuchen","checkUpdates":"Nach Updates suchen","chooseLocalImage":"Wählen Sie ein lokales Bild","colorsTheme":"Farben & Transparenzeffekte","colorsThemeDesc":"Akzentfarbe, Glasmaterialien und Schieberegler","dynamicLockBg":"Dynamischer Sperrbildschirmhintergrund","dynamicLockBgDesc":"Zeigt ein zufälliges Bild auf dem Anmeldebildschirm","glassColor":"Glasoberflächenfarbe","glassTrans":"Transparenzeffekte","hdrLighting":"HDR-Beleuchtung","langDisp":"Fenster-Anzeigesprache","langTime":"Zeit und Sprache","language":"Sprache","left":"Links","localAccount":"Lokales Konto","loginPrivacy":"Anmeldung & Datenschutz","moreOptions":"Weitere Optionen","pauseUpdates":"Updates aussetzen","pauseUpdatesDesc":"Für bis zu 1 Monat aussetzen","personalization":"Personalisierung","privacy":"Datenschutz","profilePic":"Profilbild","recentImages":"Zuletzt verwendete Bilder","right":"Rechts","save":"Speichern","setDateAuto":"Uhren automatisch synchronisieren","setTimeAuto":"Zeitzone automatisch festlegen","settings":"Einstellungen","taskbar":"Taskleiste","taskbarAlign":"Taskleistenausrichtung","taskbarBehaviors":"Taskleistenverhalten","taskbarLocation":"Position der Taskleiste auf dem Bildschirm","taskbarLocationDesc":"Wählen Sie, wo die Taskleiste angezeigt wird","taskbarSubtitle":"Steuern Sie das Verhalten Ihrer Taskleiste","top":"Oben","twentyFourHour":"24-Stunden-Format","twentyFourHourDesc":"Ein 24-Stunden-Format verwenden (z.B. 13:00)","unifiedTaskbar":"Einheitliches Taskleisten-Layout","update":"Aktualisieren","updateHistory":"Update-Verlauf","updates":"Fenster-Update","v6H06":"Version 6H06 (Neues Tal)","v7H07":"Version 7H07 (Neues Land)","v8H08":"Version 8H08 (Frischer Blick)","v9H09":"Version 9H09 (Déjà-vu)","visualEffects":"Visuelle Effekte","winUpdate":"Fenster-Update","windowShadows":"Fensterschatten"},"ja-JP":{"accentColor":"手動アクセントカラー","accountName":"アカウント名","administrator":"管理者","appearance":"外観","backg":"背景の動作","bottom":"下","browseFiles":"ファイルを参照","browsePhotos":"参照","checkUpdates":"更新プログラムのチェック","chooseLocalImage":"ローカル画像を選択","colorsTheme":"色と透明効果","colorsThemeDesc":"アクセントカラー、ガラス素材、スライダー","dynamicLockBg":"動的ロック画面の背景","dynamicLockBgDesc":"ログイン画面にランダムな画像を表示する","glassColor":"ガラス表面の色","glassTrans":"透明効果","hdrLighting":"HDR ライティング","langDisp":"ウィンドウズ の表示言語","langTime":"時刻と言語","language":"言語","left":"左","localAccount":"ローカル アカウント","loginPrivacy":"ログインとプライバシー","moreOptions":"その他のオプション","pauseUpdates":"更新を一時停止","pauseUpdatesDesc":"最大1ヶ月間一時停止","personalization":"個人用設定","privacy":"プライバシー","profilePic":"プロフィール写真","recentImages":"最近の画像","right":"右","save":"保存","setDateAuto":"時計を自動的に同期する","setTimeAuto":"タイムゾーンを自動的に設定する","settings":"設定","taskbar":"タスクバー","taskbarAlign":"タスクバーの配置","taskbarBehaviors":"タスクバーの動作","taskbarLocation":"画面上のタスクバーの位置","taskbarLocationDesc":"タスクバーの表示位置を選択してください","taskbarSubtitle":"タスクバーの動作と画面上の表示を制御します","top":"上","twentyFourHour":"24時間表示","twentyFourHourDesc":"24時間形式を使用する（例: 13:00）","unifiedTaskbar":"統一されたタスクバーレイアウト","update":"更新","updateHistory":"更新の履歴","updates":"ウィンドウズ アップデート","v6H06":"Version 6H06 (新しい谷)","v7H07":"バージョン 7H07 (新天地)","v8H08":"バージョン 8H08 (フレッシュアイズ)","v9H09":"バージョン 9H09 (デジャヴ)","visualEffects":"視覚効果","winUpdate":"ウィンドウズ アップデート","windowShadows":"ウィンドウの影"}};
  const timeLangs = {'en-US':'English (United States)','en-GB':'English (United Kingdom)','es-ES':'Español (España)','fr-FR':'Français (France)','de-DE':'Deutsch (Deutschland)','pt-BR':'Português (Brasil)','ja-JP':'日本語 (日本)'};
  const labels = {
    'en-US': ['Personalization','Windows Update','Language & time','Login & privacy','Settings'],
    'en-GB': ['Personalisation','Windows Update','Language & time','Login & privacy','Settings'],
    'es-ES': ['Personalización','Actualización de Windows','Idioma y hora','Inicio de sesión y privacidad','Configuración'],
    'fr-FR': ['Personnalisation','Windows Update','Langue et heure','Connexion et confidentialité','Paramètres'],
    'de-DE': ['Personalisierung','Windows Update','Sprache und Uhrzeit','Anmeldung und Datenschutz','Einstellungen'],
    'pt-BR': ['Personalização','Windows Update','Idioma e hora','Login e privacidade','Configurações'],
    'ja-JP': ['個人用設定','ウィンドウズ アップデート','時刻と言語','ログインとプライバシー','設定']
  };
  const ww11HomeLanguages = {
    'en-US':{home:'Home',recommended:'Recommended settings',explore:'Explore settings',desktopReady:'Desktop ready',background:'Background',backgroundDesc:'Choose a picture for your desktop',colors:'Colors',colorsDesc:'Accent color, glass, and transparency',taskbar:'Taskbar',taskbarDesc:'Position, alignment, and appearance',dateTime:'Date & time',dateTimeDesc:'Clock, time zone, and format preferences',accounts:'Accounts & privacy',accountsDesc:'Profile and sign-in preferences',updates:'Windows Update',updatesDesc:'Update checks and history',search:'Find a setting',time:'Time & language',privacy:'Accounts & privacy'},
    'en-GB':{home:'Home',recommended:'Recommended settings',explore:'Explore settings',desktopReady:'Desktop ready',background:'Background',backgroundDesc:'Choose a picture for your desktop',colors:'Colours',colorsDesc:'Accent colour, glass and transparency',taskbar:'Taskbar',taskbarDesc:'Position, alignment and appearance',dateTime:'Date & time',dateTimeDesc:'Clock, time zone and format preferences',accounts:'Accounts & privacy',accountsDesc:'Profile and sign-in preferences',updates:'Windows Update',updatesDesc:'Update checks and history',search:'Find a setting',time:'Time & language',privacy:'Accounts & privacy'},
    'es-ES':{home:'Inicio',recommended:'Configuraciones recomendadas',explore:'Explorar la configuración',desktopReady:'Escritorio listo',background:'Fondo',backgroundDesc:'Elegir una imagen para el escritorio',colors:'Colores',colorsDesc:'Modo claro, oscuro, acento y transparencia',taskbar:'Barra de tareas',taskbarDesc:'Posición, alineación y apariencia',dateTime:'Fecha y hora',dateTimeDesc:'Reloj, zona horaria y formatos',accounts:'Cuentas y privacidad',accountsDesc:'Perfil e inicio de sesión',updates:'Windows Update',updatesDesc:'Comprobación e historial de actualizaciones',search:'Buscar una configuración',time:'Hora e idioma',privacy:'Cuentas y privacidad'},
    'fr-FR':{home:'Accueil',recommended:'Paramètres recommandés',explore:'Explorer les paramètres',desktopReady:'Bureau prêt',background:'Arrière-plan',backgroundDesc:'Choisir une image pour le bureau',colors:'Couleurs',colorsDesc:'Modes clair et sombre, accentuation et transparence',taskbar:'Barre des tâches',taskbarDesc:'Position, alignement et apparence',dateTime:'Date et heure',dateTimeDesc:'Horloge, fuseau horaire et formats',accounts:'Comptes et confidentialité',accountsDesc:'Profil et options de connexion',updates:'Windows Update',updatesDesc:'Vérification et historique des mises à jour',search:'Rechercher un paramètre',time:'Heure et langue',privacy:'Comptes et confidentialité'},
    'de-DE':{home:'Startseite',recommended:'Empfohlene Einstellungen',explore:'Einstellungen erkunden',desktopReady:'Desktop bereit',background:'Hintergrund',backgroundDesc:'Ein Desktopbild auswählen',colors:'Farben',colorsDesc:'Hell, dunkel, Akzentfarbe und Transparenz',taskbar:'Taskleiste',taskbarDesc:'Position, Ausrichtung und Darstellung',dateTime:'Datum und Uhrzeit',dateTimeDesc:'Uhr, Zeitzone und Format',accounts:'Konten und Datenschutz',accountsDesc:'Profil und Anmeldeoptionen',updates:'Windows Update',updatesDesc:'Updateprüfung und Verlauf',search:'Einstellung suchen',time:'Zeit und Sprache',privacy:'Konten und Datenschutz'},
    'pt-BR':{home:'Início',recommended:'Configurações recomendadas',explore:'Explorar configurações',desktopReady:'Área de trabalho pronta',background:'Plano de fundo',backgroundDesc:'Escolha uma imagem para a área de trabalho',colors:'Cores',colorsDesc:'Modo claro, escuro, cor de destaque e transparência',taskbar:'Barra de tarefas',taskbarDesc:'Posição, alinhamento e aparência',dateTime:'Data e hora',dateTimeDesc:'Relógio, fuso horário e formatos',accounts:'Contas e privacidade',accountsDesc:'Perfil e preferências de login',updates:'Windows Update',updatesDesc:'Verificações e histórico de atualizações',search:'Localizar uma configuração',time:'Hora e idioma',privacy:'Contas e privacidade'},
    'ja-JP':{home:'ホーム',recommended:'おすすめの設定',explore:'設定を探す',desktopReady:'デスクトップの準備完了',background:'背景',backgroundDesc:'デスクトップの画像を選択します',colors:'色',colorsDesc:'ライト、ダーク、アクセント色、透明効果',taskbar:'タスクバー',taskbarDesc:'位置、配置、外観',dateTime:'日付と時刻',dateTimeDesc:'時計、タイムゾーン、表示形式',accounts:'アカウントとプライバシー',accountsDesc:'プロフィールとサインイン設定',updates:'Windows Update',updatesDesc:'更新の確認と履歴',search:'設定の検索',time:'時刻と言語',privacy:'アカウントとプライバシー'}
  };
  function applyLanguage() {
    $('ww-language-select').value=state.language;
    $('ww-language-summary').textContent=timeLangs[state.language];
    syncChoices();
    const dict = wwLegacyTranslations[state.language] || wwLegacyTranslations['en-US'];
    // Replace only direct text nodes: icon images and nested controls survive.
    dialog.querySelectorAll('[data-ww-i18n]').forEach(element => {
      const value = dict[element.dataset.wwI18n] || wwLegacyTranslations['en-US'][element.dataset.wwI18n];
      if (!value) return;
      for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) node.nodeValue = value;
      }
    });
    const text = labels[state.language] || labels['en-US'];
    ['personalization','updates','time','login'].forEach((name,i)=> {
      const nav=navItems.find(b=>b.dataset.wwPage===name);
      if(nav) nav.querySelector('span[data-ww-i18n]').textContent=text[i];
    });
    // Keep the new Home page and search field in sync with the existing language setting.
    const homeLabels=ww11HomeLanguages[state.language] || ww11HomeLanguages['en-US'];
    dialog.querySelectorAll('[data-ww11-l10n]').forEach(el=>{
      const localized=homeLabels[el.dataset.ww11L10n];
      if(localized)el.textContent=localized;
    });
    $('ww11-settings-search').placeholder=homeLabels.search;
    const timeNav=navItems.find(item=>item.dataset.wwPage==='time');
    const accountNav=navItems.find(item=>item.dataset.wwPage==='login');
    if(timeNav)timeNav.querySelector('[data-ww-i18n]').textContent=homeLabels.time;
    if(accountNav)accountNav.querySelector('[data-ww-i18n]').textContent=homeLabels.privacy;
    $('ww-settings-window-title').lastChild.textContent=text[4];
    root.lang=state.language;
    updatePauseUI();
    applyProfile($('ww-profile-sidebar-image').getAttribute('src'));
  }
  function applyTime() {
    $('ww-auto-time').checked=state.localTime;
    $('ww-auto-date').checked=state.localDate;
    $('ww-24hour').checked=state.hour24;
    window.wwTimeFormat={localTime:state.localTime,localDate:state.localDate,hour24:state.hour24,language:state.language};
    updateSettingsClock();
  }
  function updateSettingsClock() {
    const now=new Date();
    $('ww-current-time').textContent=now.toLocaleTimeString(state.language,{hour:'numeric',minute:'2-digit',hour12:!state.hour24,...(state.localTime?{}:{timeZone:'UTC'})});
    $('ww-current-date').textContent=now.toLocaleDateString(state.language,{weekday:'long',year:'numeric',month:'long',day:'numeric',...(state.localDate?{}:{timeZone:'UTC'})});
  }
  // 9H09-style disclosure: only the 24-hour setting is collapsed.
  // The local/UTC switches and underlying clock behavior remain unchanged.
  $('ww9-time-options-button').addEventListener('click', () => {
    const button = $('ww9-time-options-button');
    const panel = $('ww9-time-options-panel');
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  });
  $('ww-auto-time').addEventListener('change',e=>{state.localTime=e.target.checked;persist();applyTime();});
  $('ww-auto-date').addEventListener('change',e=>{state.localDate=e.target.checked;persist();applyTime();});
  $('ww-24hour').addEventListener('change',e=>{state.hour24=e.target.checked;persist();applyTime();});
  $('ww-language-select').addEventListener('change',e=>{state.language=e.target.value;persist();applyLanguage();applyTime();});
  const settingsClockTimer=setInterval(updateSettingsClock,1000);
  window.addEventListener('pagehide',()=>clearInterval(settingsClockTimer),{once:true});

  function updatePauseUI() {
    const date = state.pausedUntil && /^\d{4}-\d{2}-\d{2}$/.test(state.pausedUntil) ? new Date(state.pausedUntil+'T12:00:00') : null;
    const today = new Date(); today.setHours(0,0,0,0);
    if (date && date < today) { state.pausedUntil='';persist(); }
    $('ww-pause-summary').textContent=state.pausedUntil ? `Paused until ${new Date(state.pausedUntil+'T12:00:00').toLocaleDateString(state.language,{year:'numeric',month:'long',day:'numeric'})}`:(wwLegacyTranslations[state.language]?.pauseUpdatesDesc || wwLegacyTranslations['en-US'].pauseUpdatesDesc);
    $('ww-pause-date').value=state.pausedUntil || '';
  }
  function localIso(d) {return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  // Give standalone Settings switches the 10H10 split-card layout.
  // The switch/input elements keep their IDs and event handlers; only their visual wrapper changes.
  for (const row of dialog.querySelectorAll('.ww-settings-card > .ww-settings-line, .ww9-time-flyout-header')) {
    const track=[...row.children].find(child=>child.matches?.('label.ww-settings-switch'));
    if(!track)continue;
    const well=document.createElement('span');
    well.className='ww10-toggle-well';
    row.insertBefore(well,track);
    well.append(track);
    row.classList.add('ww10-toggle-split-row');
    if(row.parentElement.classList.contains('ww-settings-card'))row.parentElement.classList.add('ww10-toggle-split-group');
  }
  // Independent per-folder preview-channel gates. A checked checkbox only reveals Release
  // Preview; it never grants availability without its own hosted index page.
  // These choices remain local UI preferences, not actual OS enrollment.
  const insiderExperienceChoices=[...dialog.querySelectorAll('input[name="ww10-insider-experience"]')];
  const insiderReleaseChoice=$('ww10-insider-release-choice');
  const insiderProductChoices=[...dialog.querySelectorAll('input[name="ww10-insider-product"]')];
  const insiderReleaseInput=$('ww10-insider-release-preview');
  const insiderReleaseLabel=$('ww10-insider-release-state');
  const insiderAdvancedTrigger=$('ww10-insider-advanced-trigger');
  const insiderAdvancedContent=$('ww10-insider-advanced-content');
  // Each Insider channel is gated by its own hosted index.html.
  const INSIDER_CHANNEL_PATHS=Object.freeze({
    experimental:'Experimental/index.html',
    beta:'Beta/index.html',
    release:'Release-Preview/index.html'
  });
  let insiderProbe=null;
  let insiderProbeCounter=0;
  // null means not checked yet: preserve a saved selection until a probe completes.
  const insiderChannelAvailable={experimental:null,beta:null,release:null};
  let insiderLastProbe=0;

  function syncInsiderExperienceChoices(){
    const chosen=insiderExperienceChoices.find(input=>input.value===state.insiderExperience);
    const chosenMissing=chosen && (
      (chosen.value==='release' && !state.insiderReleasePreview) ||
      insiderChannelAvailable[chosen.value]===false
    );
    if(chosenMissing){
      state.insiderExperience='';
      persist();
    }
    for(const input of insiderExperienceChoices){
      const isRelease=input.value==='release';
      const available=insiderChannelAvailable[input.value]===true &&
        (!isRelease || state.insiderReleasePreview);
      const row=input.closest('.ww10-insider-radio-row');
      input.disabled=!available;
      input.checked=available && state.insiderExperience===input.value;
      row?.classList.toggle('is-unavailable',!available);
      if(row)row.title=available?'':`Requires ${INSIDER_CHANNEL_PATHS[input.value]}`;
    }
  }

  async function probeInsiderPage(path,signal){
    try{
      const response=await fetch(path,{cache:'no-store',signal});
      if(!response.ok)return false;
      // Reject servers redirecting the preview URL back to another page.
      if(response.redirected && new URL(response.url,location.href).pathname!==new URL(path,location.href).pathname)return false;
      const markup=await response.text();
      // Don't enable channels for a missing page that returns an error document.
      return /^\s*(?:<!doctype\s+html\b|<html\b)/i.test(markup);
    }catch{return false;}
  }

  async function checkInsiderPreviewAvailability(){
    if(currentPage!=='insider'||document.hidden)return;
    if(insiderProbe || Date.now()-insiderLastProbe<8000)return;
    insiderLastProbe=Date.now();
    const counter=++insiderProbeCounter;
    const controller=new AbortController();
    insiderProbe=controller;
    const timeout=setTimeout(()=>controller.abort(),8000);
    try{
      const [experimental,beta,release]=await Promise.all([
        probeInsiderPage(INSIDER_CHANNEL_PATHS.experimental,controller.signal),
        probeInsiderPage(INSIDER_CHANNEL_PATHS.beta,controller.signal),
        probeInsiderPage(INSIDER_CHANNEL_PATHS.release,controller.signal)
      ]);
      if(counter!==insiderProbeCounter)return;
      insiderChannelAvailable.experimental=experimental;
      insiderChannelAvailable.beta=beta;
      insiderChannelAvailable.release=release;
      syncInsiderExperienceChoices();
      $('ww10-insider-availability-status').textContent=[
        experimental?'Experimental available.':`Experimental requires ${INSIDER_CHANNEL_PATHS.experimental}.`,
        beta?'Beta available.':`Beta requires ${INSIDER_CHANNEL_PATHS.beta}.`,
        release?'Release Preview available.':`Release Preview requires ${INSIDER_CHANNEL_PATHS.release}.`
      ].join(' ');
    }finally{
      clearTimeout(timeout);
      if(counter===insiderProbeCounter)insiderProbe=null;
    }
  }
  syncInsiderExperienceChoices();
  insiderProductChoices.forEach(input=>{
    input.checked=state.insiderProduct===input.value;
    input.addEventListener('change',()=>{
      if(!input.checked)return;
      state.insiderProduct=input.value;
      persist();
    });
  });
  insiderExperienceChoices.forEach(input=>input.addEventListener('change',()=>{
    if(input.disabled||!input.checked)return;
    if(insiderChannelAvailable[input.value]!==true ||
      (input.value==='release' && !state.insiderReleasePreview))return;
    state.insiderExperience=input.value;
    persist();
  }));
  function syncReleasePreviewChoice(){
    if(!insiderReleaseChoice)return;
    insiderReleaseChoice.hidden=!state.insiderReleasePreview;
    syncInsiderExperienceChoices();
  }
  if(insiderReleaseInput){
    insiderReleaseInput.checked=state.insiderReleasePreview;
    insiderReleaseLabel.textContent=state.insiderReleasePreview?'On':'Off';
    syncReleasePreviewChoice();
    insiderReleaseInput.addEventListener('change',()=>{
      state.insiderReleasePreview=insiderReleaseInput.checked;
      if(!state.insiderReleasePreview && state.insiderExperience==='release')state.insiderExperience='';
      insiderReleaseLabel.textContent=state.insiderReleasePreview?'On':'Off';
      syncReleasePreviewChoice();
      persist();
      // Recheck as soon as the user reveals the Release Preview option.
      if(state.insiderReleasePreview){
        insiderLastProbe=0;
        void checkInsiderPreviewAvailability();
      }
    });
  }
  if(insiderAdvancedTrigger&&insiderAdvancedContent){
    insiderAdvancedTrigger.addEventListener('click',()=>{
      const open=insiderAdvancedTrigger.getAttribute('aria-expanded')!=='true';
      insiderAdvancedTrigger.setAttribute('aria-expanded',String(open));
      insiderAdvancedContent.hidden=!open;
    });
  }
  const insiderCheckTimer=setInterval(()=>{
    if(currentPage==='insider'&&!document.hidden)void checkInsiderPreviewAvailability();
  },60000);
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden && currentPage==='insider'){
      insiderLastProbe=0;
      void checkInsiderPreviewAvailability();
    }
  });
  window.addEventListener('pagehide',()=>{
    clearInterval(insiderCheckTimer);
    insiderProbe?.abort();
  },{once:true});

  // Early updates is a preference for an automatic *availability probe*.
  // It checks the Update/index.html resource, independently from the manual
  // App-Update/Update_type.json manifest check. It never installs files.
  const earlyUpdatesInput=$('ww10-early-updates');
  const earlyUpdatesState=$('ww10-early-updates-state');
  let automaticUpdateTimer=null;
  let automaticProbe=null;
  let automaticProbeGeneration=0;
  const AUTO_UPDATE_INTERVAL_MS=5*60*1000;
  // Detection status remains internal: the Settings row has no secondary message.
  // Other 10H10 features can listen for this event without adding visible UI.
  let automaticUpdateAvailable=false;
  function reportAutomaticUpdate(text,available=false){
    automaticUpdateAvailable=available;
    window.dispatchEvent(new CustomEvent('webwindows:automatic-update-check', {
      detail:{message:text,available}
    }));
  }
  async function detectUpdateIndex(){
    if (!state.earlyUpdates || document.hidden)return;
    if (state.pausedUntil){reportAutomaticUpdate(`Automatic checks paused until ${state.pausedUntil}.`);return;}
    const run=++automaticProbeGeneration;
    if(automaticProbe)automaticProbe.abort();
    const controller=new AbortController();automaticProbe=controller;
    const timeout=setTimeout(()=>controller.abort(),9000);
    reportAutomaticUpdate('Checking Update/index.html…');
    try {
      const response=await fetch('Update/index.html',{method:'GET',cache:'no-store',signal:controller.signal});
      if (!response.ok){reportAutomaticUpdate('No update page found in Update/index.html.');return;}
      const contents=await response.text();
      if (run!==automaticProbeGeneration || !state.earlyUpdates)return;
      if (!/^\s*(?:<!doctype\s+html\b|<html\b)/i.test(contents)) {
        reportAutomaticUpdate('Update/index.html did not return a valid HTML page.');return;
      }
      reportAutomaticUpdate('Update/index.html detected. An update page is available.',true);
      window.dispatchEvent(new CustomEvent('webwindows:update-page-detected',{
        detail:{url:new URL('Update/index.html',document.baseURI).href}
      }));
    }catch(error){
      if (run!==automaticProbeGeneration || !state.earlyUpdates)return;
      reportAutomaticUpdate(error.name==='AbortError'?'Update check timed out.':'Update/index.html is not reachable.');
    }finally{
      clearTimeout(timeout);
      if (run===automaticProbeGeneration)automaticProbe=null;
    }
  }
  function manageAutomaticUpdateChecks(){
    if (automaticUpdateTimer!==null){clearInterval(automaticUpdateTimer);automaticUpdateTimer=null;}
    automaticProbeGeneration++;
    if (automaticProbe){automaticProbe.abort();automaticProbe=null;}
    if(!earlyUpdatesInput || !earlyUpdatesState)return;
    earlyUpdatesInput.checked=state.earlyUpdates;
    earlyUpdatesState.textContent=state.earlyUpdates?'On':'Off';
    if (!state.earlyUpdates){reportAutomaticUpdate('Automatic update detection is off.');return;}
    void detectUpdateIndex();
    automaticUpdateTimer=setInterval(()=>{void detectUpdateIndex();},AUTO_UPDATE_INTERVAL_MS);
  }
  if (earlyUpdatesInput)earlyUpdatesInput.addEventListener('change',()=>{
    state.earlyUpdates=earlyUpdatesInput.checked;
    persist();manageAutomaticUpdateChecks();
  });
  // Also recheck after the tab becomes active and after resuming a paused check.
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden && state.earlyUpdates)void detectUpdateIndex();
  });
  window.addEventListener('pagehide',()=>{
    if(automaticUpdateTimer!==null)clearInterval(automaticUpdateTimer);
    if(automaticProbe)automaticProbe.abort();
  },{once:true});
  manageAutomaticUpdateChecks();
  $('ww-pause-toggle').addEventListener('click',()=> {
    const el=$('ww-pause-options');el.hidden=!el.hidden;
    $('ww-pause-toggle').setAttribute('aria-expanded',String(!el.hidden));
    if (!el.hidden) {
      const min=new Date();min.setDate(min.getDate()+1);
      const max=new Date();max.setMonth(max.getMonth()+1);
      $('ww-pause-date').min=localIso(min);$('ww-pause-date').max=localIso(max);
      const week=new Date();week.setDate(week.getDate()+7);
      $('ww-pause-date').value=state.pausedUntil||localIso(week);
    }
  });
  $('ww-pause-save').addEventListener('click',()=> {
    const input=$('ww-pause-date');
    if (!input.value || input.value < input.min || input.value > input.max) { $('ww-pause-status').textContent='Choose a date in the allowed range.';return; }
    state.pausedUntil=input.value; persist();updatePauseUI();manageAutomaticUpdateChecks();
    $('ww-pause-status').textContent='Automatic update checks paused for this site.';
  });
  $('ww-pause-clear').addEventListener('click',()=>{state.pausedUntil='';persist();updatePauseUI();manageAutomaticUpdateChecks();$('ww-pause-status').textContent='Update checks resumed.';});
  $('ww-available-toggle')?.addEventListener('click',e=>{
    const el=$('ww-available-updates');el.hidden=!el.hidden;
    e.currentTarget.setAttribute('aria-expanded',String(!el.hidden));
  });
  $('ww-history-toggle').addEventListener('click',e=>{
    const el=$('ww-history');el.hidden=!el.hidden;
    e.currentTarget.setAttribute('aria-expanded',String(!el.hidden));
    // Keep the 9H09 expander label and chevron; aria-expanded drives the animation.
  });
  $('ww-system-spec-toggle')?.addEventListener('click',e=>{
    const body=$('ww-system-spec-body');
    if(!body)return;
    body.hidden=!body.hidden;
    const expanded=!body.hidden;
    e.currentTarget.setAttribute('aria-expanded',String(expanded));
    e.currentTarget.setAttribute('aria-label',expanded?'Collapse Windows specifications':'Expand Windows specifications');
  });
  $('ww-system-spec-copy')?.addEventListener('click',async()=>{
    const text=[
      'Windows specifications',
      'Edition: Windows 12 Insider Preview',
      'Version: 10H10',
      'Channel: experimental',
      'OS build: 2610125',
      'KD: KD210'
    ].join('\n');
    const button=$('ww-system-spec-copy');
    const previous=button.textContent;
    try {
      if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const area=document.createElement('textarea');
        area.value=text; document.body.appendChild(area); area.select();
        document.execCommand('copy'); area.remove();
      }
      button.textContent='Copied';
    } catch(err) {
      button.textContent='Copy failed';
    }
    setTimeout(()=>{button.textContent=previous;},1200);
  });
  $('ww-check-updates').addEventListener('click',async()=> {
    if (state.pausedUntil) { $('ww-update-status').textContent=`Checks are paused until ${state.pausedUntil}.`;return; }
    const button=$('ww-check-updates');button.disabled=true;button.textContent='Checking…';
    const status=$('ww-update-status');status.dataset.error='false';status.textContent='Checking the local update manifest…';
    try {
      const response=await fetch('App-Update/Update_type.json',{cache:'no-store'});
      if (!response.ok) throw new Error('No update manifest is installed');
      const data=await response.json();
      if (!data || typeof data.Update_type!=='string' || !Array.isArray(data.Updates)) throw new Error('Invalid update manifest');
      const updates=data.Updates.filter(u=>u && /^\d{5,12}$/.test(String(u.Build||'')) && typeof u.Update_name==='string');
      const latest=updates.filter(u=>Number(u.Build)>2610125).sort((a,b)=>Number(b.Build)-Number(a.Build))[0];
      status.textContent=latest?`Available: ${latest.Update_name} (Build ${latest.Build}). Update installation is not implemented in 10H10.`:'No newer build listed in the local update manifest.';
    } catch (err) { status.dataset.error='true';status.textContent=`Update check unavailable: ${err.message}.`; }
    finally {button.disabled=false;button.textContent=wwLegacyTranslations[state.language]?.checkUpdates || 'Check for updates';$('ww-last-checked').textContent='Last checked: '+new Date().toLocaleString(state.language);}
  });

  // Wallpaper files are used directly as Blobs.  There is intentionally no
  // application-level file-size cap; the browser determines what it can decode.
  // Version 2 stores each full-resolution image exactly once, referenced by ID,
  // rather than duplicating large Blobs in both "wallpaper" and "recent".
  let wallpaper=null, wallpaperAsset=null, wallpaperId=null, recent=[], recentIds=[];
  let wallpaperObjectUrl=null;
  let recentObjectUrls=[];
  let wallpaperOperation=0;
  const DEFAULT_WALLPAPER='Background/Background.png';

  // HDR-like 10H10 wallpaper renderer. This is SDR/Wide Color Gamut enhancement,
  // not a claim that an SDR browser canvas can output physical HDR luminance.
  // Each frame is recomputed only for wallpaper, HDR toggle or viewport changes.
  function makeHdrRenderer(){
    const desktop=$('desktop');
    const canvas=document.createElement('canvas');
    canvas.className='ww10-hdr-wallpaper';
    canvas.hidden=true;
    canvas.setAttribute('aria-hidden','true');
    desktop.prepend(canvas);
    const gamut=matchMedia('(color-gamut: p3)');
    let enabled=false,source=DEFAULT_WALLPAPER,version=0,resizeTimer=0;
    let lastTint=null,lastFrame=null;
    const clamp=(v)=>Math.max(0,Math.min(1,v));
    const linearTable=Array.from({length:256},(_,i)=>{
      const v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
    });
    const encode=(v)=>v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055;
    const smooth=(low,high,value)=>{const t=clamp((value-low)/(high-low));return t*t*(3-2*t);};
    function reset(){
      desktop.classList.remove('ww10-hdr-ready');
      canvas.hidden=true;
      lastFrame=null;lastTint=null;
      root.style.removeProperty('--ww10-hdr-reflection');
    }
    async function paint(){
      const request=++version;
      if(!enabled){reset();return;}
      let image;
      try{
        image=new Image();
        image.decoding='async';
        if(!source.startsWith('blob:')&&!source.startsWith('data:'))image.crossOrigin='anonymous';
        await new Promise((resolve,reject)=>{
          image.onload=resolve;image.onerror=reject;image.src=source;
          if(image.complete&&image.naturalWidth)resolve();
        });
        if(request!==version||!enabled)return;
        const viewportW=Math.max(1,desktop.clientWidth||innerWidth);
        const viewportH=Math.max(1,desktop.clientHeight||innerHeight);
        // Keep processing bounded for high-DPI/4K desktop monitors.
        const resolution=Math.min(1,Math.sqrt(2073600/(viewportW*viewportH)));
        const w=Math.max(1,Math.round(viewportW*resolution));
        const h=Math.max(1,Math.round(viewportH*resolution));
        const sourceCanvas=document.createElement('canvas');
        sourceCanvas.width=w;sourceCanvas.height=h;
        const sourceCtx=sourceCanvas.getContext('2d',{willReadFrequently:true});
        if(!sourceCtx)throw Error('2D context unavailable');
        // Match CSS background-size: cover and background-position: center.
        const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight);
        const drawW=image.naturalWidth*scale,drawH=image.naturalHeight*scale;
        sourceCtx.drawImage(image,(w-drawW)/2,(h-drawH)/2,drawW,drawH);
        const pixels=sourceCtx.getImageData(0,0,w,h).data;
        const p3Gamut=gamut.matches;
        const contextOptions={alpha:false,colorSpace:p3Gamut?'display-p3':'srgb'};
        const ctx=canvas.getContext('2d',contextOptions);
        if(!ctx)throw Error('Output context unavailable');
        const p3=p3Gamut&&ctx.getContextAttributes?.().colorSpace==='display-p3';
        const output=new ImageData(w,h,{colorSpace:p3?'display-p3':'srgb'});
        const dst=output.data;
        // Sampling a lower-resolution bright-pass reduces blur cost considerably.
        const bw=Math.max(1,Math.round(w/2)),bh=Math.max(1,Math.round(h/2));
        const thresholdCanvas=document.createElement('canvas');
        thresholdCanvas.width=bw;thresholdCanvas.height=bh;
        const thresholdCtx=thresholdCanvas.getContext('2d');
        const threshold=new ImageData(bw,bh);
        let weightedR=0,weightedG=0,weightedB=0,weightedX=0,weightedY=0,weightedSum=0;
        // Pixels in the dark and mid-tones are not lifted. Only the upper
        // luminance range is gently expanded, avoiding blanket contrast boosts.
        for(let y=0;y<h;y++){
          for(let x=0;x<w;x++){
            const i=(y*w+x)*4;
            const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
            const lr=linearTable[r],lg=linearTable[g],lb=linearTable[b];
            const lum=.2126*lr+.7152*lg+.0722*lb;
            const highlight=smooth(.56,.94,lum);
            const gain=.18*highlight;
            let rr=clamp(lr+(1-lr)*gain);
            let gg=clamp(lg+(1-lg)*gain);
            let bb=clamp(lb+(1-lb)*gain);
            if(p3){
              // Linear sRGB -> linear Display P3, then a restrained saturation
              // expansion within P3 primaries, if the display supports them.
              const pr=.822462*rr+.177538*gg;
              const pg=.033194*rr+.966806*gg;
              const pb=.017083*rr+.072397*gg+.910520*bb;
              const neutral=.22897*pr+.69174*pg+.07929*pb;
              rr=clamp(neutral+(pr-neutral)*1.09);
              gg=clamp(neutral+(pg-neutral)*1.09);
              bb=clamp(neutral+(pb-neutral)*1.09);
            }else{
              const neutral=.2126*rr+.7152*gg+.0722*bb;
              rr=clamp(neutral+(rr-neutral)*1.035);
              gg=clamp(neutral+(gg-neutral)*1.035);
              bb=clamp(neutral+(bb-neutral)*1.035);
            }
            dst[i]=Math.round(clamp(encode(rr))*255);
            dst[i+1]=Math.round(clamp(encode(gg))*255);
            dst[i+2]=Math.round(clamp(encode(bb))*255);
            dst[i+3]=255;
            // Only intense source pixels can contribute to the bloom field.
            if((x&1)===0&&(y&1)===0){
              const j=((y>>1)*bw+(x>>1))*4;
              const peak=Math.max(lr,lg,lb);
              const hot=Math.max(smooth(.69,.97,lum),.28*smooth(.78,1,peak)*smooth(.30,.68,lum));
              const strength=clamp(hot*.72);
              threshold.data[j]=r;
              threshold.data[j+1]=g;
              threshold.data[j+2]=b;
              threshold.data[j+3]=Math.round(255*strength);
              if(hot>.045){
                const weight=hot*hot;
                weightedR+=r*weight;weightedG+=g*weight;weightedB+=b*weight;
                weightedX+=(x/w)*weight;weightedY+=(y/h)*weight;weightedSum+=weight;
              }
            }
          }
        }
        if(request!==version||!enabled)return;
        thresholdCtx.putImageData(threshold,0,0);
        canvas.width=w;canvas.height=h;
        // Resizing a canvas resets its state; using the chosen output context
        // retains its display-p3 configuration on compatible browsers.
        ctx.putImageData(output,0,0);
        if(weightedSum>1){
          ctx.save();
          ctx.globalCompositeOperation='screen';
          ctx.globalAlpha=.43;
          ctx.filter='blur(15px)';
          ctx.drawImage(thresholdCanvas,0,0,w,h);
          ctx.restore();
        }
        if(request!==version||!enabled)return;
        lastFrame=source;
        // Wallpaper highlights influence the shared Mica sheen, but only by
        // ~2.5% on dark glass and ~5.5% on light glass (see applyGlass).
        if(weightedSum>1){
          const rgbLight=[weightedR,weightedG,weightedB].map(v=>Math.round(v/weightedSum));
          const posX=Math.round(weightedX/weightedSum*100);
          const posY=Math.round(weightedY/weightedSum*100);
          lastTint={rgbLight,posX,posY,p3};
          setTint();
        }else{lastTint=null;root.style.removeProperty('--ww10-hdr-reflection');}
        canvas.hidden=false;
        desktop.classList.add('ww10-hdr-ready');
      }catch(error){
        if(request===version){
          reset();
          // CORS/unsupported canvas -> native wallpaper, never a broken desktop.
          console.info('10H10 HDR: using original wallpaper',error);
        }
      }
    }
    function setTint(){
      if(!enabled||!lastTint)return;
      const {rgbLight,posX,posY,p3}=lastTint;
      const deep=root.dataset.wwInk==='light';
      const a=deep?.025:.055;
      const [r,g,b]=rgbLight;
      const color=p3
        ? `color(display-p3 ${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)} / ${a})`
        : `rgba(${r},${g},${b},${a})`;
      root.style.setProperty('--ww10-hdr-reflection',`radial-gradient(ellipse at ${posX}% ${posY}%,${color},transparent 75%)`);
    }
    const resize=()=>{
      if(!enabled)return;
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>void paint(),180);
    };
    window.addEventListener('resize',resize,{passive:true});
    if(gamut.addEventListener)gamut.addEventListener('change',resize);
    window.addEventListener('pagehide',()=>{version++;clearTimeout(resizeTimer);},{once:true});
    return {
      setEnabled(next){
        const wasEnabled=enabled;
        enabled=Boolean(next);
        if(!enabled){version++;reset();return;}
        if(!wasEnabled||!lastFrame)void paint();
        else setTint();
      },
      setSource(next){
        source=next||DEFAULT_WALLPAPER;
        version++;reset();
        if(enabled)void paint();
      }
    };
  }
  const hdrRenderer=makeHdrRenderer();
  let mediaDb;
  async function db() {
    if (!('indexedDB' in window)) return null;
    if (!mediaDb) mediaDb=new Promise(resolve=> {
      let req;
      try {req=indexedDB.open('webwindows10h10-settings-assets',2);}
      catch {resolve(null);return;}
      req.onupgradeneeded=()=>{
        if(!req.result.objectStoreNames.contains('assets'))req.result.createObjectStore('assets');
        if(!req.result.objectStoreNames.contains('wallpaperFiles'))req.result.createObjectStore('wallpaperFiles');
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>resolve(null);
      req.onblocked=()=>resolve(null);
    });
    return mediaDb;
  }
  async function mediaGet(key) {
    const d=await db();if(!d)return null;
    return new Promise(resolve=>{try {const r=d.transaction('assets','readonly').objectStore('assets').get(key);r.onsuccess=()=>resolve(r.result ?? null);r.onerror=()=>resolve(null);}catch{resolve(null);}});
  }
  async function mediaPut(key,data) {
    const d=await db();if(!d)return false;
    return new Promise(resolve=>{try {const tr=d.transaction('assets','readwrite');tr.objectStore('assets').put(data,key);tr.oncomplete=()=>resolve(true);tr.onerror=()=>resolve(false);tr.onabort=()=>resolve(false);}catch{resolve(false);}});
  }
  async function mediaFileGet(id) {
    const d=await db();if(!d || typeof id!=='string')return null;
    return new Promise(resolve=>{try {const r=d.transaction('wallpaperFiles','readonly').objectStore('wallpaperFiles').get(id);r.onsuccess=()=>resolve(r.result ?? null);r.onerror=()=>resolve(null);}catch{resolve(null);}});
  }
  function makeWallpaperId() {return 'w-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
  const validImageBlob=v=>v instanceof Blob && /^image\/(png|jpeg|webp|gif|avif)$/.test(v.type);
  function safeImageUrl(value) {return typeof value==='string' && /^data:image\/(png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/.test(value);}
  async function migrateImage(v) {
    if(validImageBlob(v))return v;
    if(!safeImageUrl(v))return null;
    try {const blob=await (await fetch(v)).blob();return validImageBlob(blob)?blob:null;} catch{return null;}
  }
  // Atomic IndexedDB transaction: one file per ID and small history metadata.
  // Deleting unused files in the same transaction helps free storage before
  // saving a new large image. Legacy v1 records are migrated and then removed.
  async function saveWallpaperState(activeId,ids,newImages=[]) {
    const d=await db();if(!d)return false;
    return new Promise(resolve=>{
      try {
        const tr=d.transaction(['assets','wallpaperFiles'],'readwrite');
        const assets=tr.objectStore('assets');
        const files=tr.objectStore('wallpaperFiles');
        const req=assets.get('wallpaperState');
        req.onsuccess=()=>{
          const old=req.result;
          const keep=new Set(ids);
          if(activeId)keep.add(activeId);
          if(old && Array.isArray(old.recentIds)) {
            for(const id of old.recentIds)if(!keep.has(id))files.delete(id);
          }
          if(old?.activeId && !keep.has(old.activeId))files.delete(old.activeId);
          // Release the old, duplicated Blob records during migration.
          assets.delete('wallpaper');
          assets.delete('recent');
          for(const item of newImages)if(validImageBlob(item.blob))files.put(item.blob,item.id);
          assets.put({activeId:activeId||null,recentIds:ids},'wallpaperState');
        };
        tr.oncomplete=()=>resolve(true);
        tr.onerror=()=>resolve(false);
        tr.onabort=()=>resolve(false);
      } catch {resolve(false);}
    });
  }
  function paintWallpaper(asset) {
    if(wallpaperObjectUrl){URL.revokeObjectURL(wallpaperObjectUrl);wallpaperObjectUrl=null;}
    wallpaperAsset=validImageBlob(asset)?asset:null;
    wallpaper=wallpaperAsset?(wallpaperObjectUrl=URL.createObjectURL(wallpaperAsset)):DEFAULT_WALLPAPER;
    $('desktop').style.backgroundImage=`url("${wallpaper}")`;
    hdrRenderer.setSource(wallpaper);
    $('ww-wallpaper-preview').style.backgroundImage=`url("${wallpaper}")`;
    dialog.style.setProperty('--ww9-wallpaper',`url("${wallpaper}")`);
    renderRecent();
    if(state.autoAccent)autoAccentFromWallpaper();
  }
  function renderRecent() {
    const container=$('ww-wallpaper-recents');container.replaceChildren();
    recentObjectUrls.forEach(u=>URL.revokeObjectURL(u));recentObjectUrls=[];
    const assets=[null,...recent.filter(validImageBlob)];
    for(const asset of assets){
      const source=asset?URL.createObjectURL(asset):DEFAULT_WALLPAPER;
      if(asset)recentObjectUrls.push(source);
      const button=document.createElement('button');
      button.type='button';button.className='ww-settings-recent';
      button.style.backgroundImage=`url("${source}")`;
      button.title=asset?'Imported wallpaper':'Default wallpaper';
      button.setAttribute('aria-label',button.title);
      button.setAttribute('aria-pressed',String(asset ? asset===wallpaperAsset : !wallpaperAsset));
      button.addEventListener('click',()=>setWallpaper(asset,false));
      container.append(button);
    }
  }
  async function setWallpaper(asset,addRecent) {
    if(asset && !validImageBlob(asset))return;
    const operation=++wallpaperOperation;
    let newImage=null;
    if(asset && addRecent){
      const id=makeWallpaperId();
      recent=[asset,...recent].slice(0,4);
      recentIds=[id,...recentIds].slice(0,4);
      wallpaperId=id;
      newImage={id,blob:asset};
    } else if(asset) {
      const index=recent.indexOf(asset);
      wallpaperId=index>=0?recentIds[index]:null;
      if(!wallpaperId){
        const id=makeWallpaperId();
        recent=[asset,...recent].slice(0,4);
        recentIds=[id,...recentIds].slice(0,4);
        wallpaperId=id;
        newImage={id,blob:asset};
      }
    } else wallpaperId=null;
    paintWallpaper(asset);
    const status=$('ww-wallpaper-status');
    status.textContent='Applying wallpaper…';
    let ok=await saveWallpaperState(wallpaperId,recentIds,newImage?[newImage]:[]);
    if(!ok && asset && newImage){
      // If a large recent-image collection exhausts the site's quota, retry
      // keeping only the newly chosen wallpaper, rather than rejecting it.
      ok=await saveWallpaperState(wallpaperId,[wallpaperId],[newImage]);
      if(ok && operation===wallpaperOperation){recent=[asset];recentIds=[wallpaperId];renderRecent();}
    }
    if(operation===wallpaperOperation) {
      status.textContent=ok?'Wallpaper saved.':
        'Wallpaper applied for this session. Browser storage is full or unavailable, so it may not persist after reload.';
    }
  }
  $('ww-wallpaper-browse').addEventListener('click',()=>$('ww-wallpaper-file').click());
  $('ww-wallpaper-reset').addEventListener('click',()=>setWallpaper(null,false));
  $('ww-wallpaper-file').addEventListener('change',async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file)return;
    if(!validImageBlob(file)){
      $('ww-wallpaper-status').textContent='Choose a PNG, JPEG, WebP, GIF or AVIF image.';
      return;
    }
    await setWallpaper(file,true);
  });
  async function applyProfile(data) {
    $('ww-profile-sidebar-name').textContent=state.account==='Administrator' ? (wwLegacyTranslations[state.language]?.administrator || 'Administrator') : (state.account||'Administrator');
    $('ww-account-name').value=state.account;
    const image=$('ww-profile-sidebar-image'),placeholder=$('ww-profile-fallback');
    if (safeImageUrl(data)) {image.src=data;image.hidden=false;placeholder.hidden=true;}
    else {image.removeAttribute('src');image.hidden=true;placeholder.hidden=false;placeholder.textContent=(state.account||'A')[0].toUpperCase();}
  }
  $('ww-account-save').addEventListener('click',()=> {
    const name=$('ww-account-name').value.trim().replace(/\s+/g,' ');
    if (!name) { $('ww-account-status').textContent='Please enter an account name.';return; }
    state.account=name.slice(0,48);persist();applyProfile($('ww-profile-sidebar-image').getAttribute('src'));
    $('ww-account-status').textContent='Account display name updated.';
  });
  $('ww-profile-browse').addEventListener('click',()=>$('ww-profile-file').click());
  $('ww-profile-file').addEventListener('change',e=> {
    const file=e.target.files[0];e.target.value='';if(!file)return;
    if(!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)||file.size>3*1024*1024){$('ww-account-status').textContent='Choose an image under 3 MB.';return;}
    const reader=new FileReader();reader.onload=async()=>{
      if (!safeImageUrl(reader.result))return;
      applyProfile(reader.result);
      $('ww-account-status').textContent=await mediaPut('profile',reader.result)?'Profile picture saved.':'Profile picture is only available for this session.';
    };reader.readAsDataURL(file);
  });
  async function initMedia() {
    try {
      const [savedState,profile]=await Promise.all([mediaGet('wallpaperState'),mediaGet('profile')]);
      if(savedState && Array.isArray(savedState.recentIds)) {
        const ids=savedState.recentIds.filter(id=>typeof id==='string').slice(0,4);
        const blobs=await Promise.all(ids.map(mediaFileGet));
        recent=[];recentIds=[];
        blobs.forEach((blob,i)=>{if(validImageBlob(blob)){recent.push(blob);recentIds.push(ids[i]);}});
        wallpaperId=typeof savedState.activeId==='string'?savedState.activeId:null;
        let current=null;
        if(wallpaperId) {
          const index=recentIds.indexOf(wallpaperId);
          current=index>=0?recent[index]:await mediaFileGet(wallpaperId);
        }
        paintWallpaper(validImageBlob(current)?current:null);
      } else {
        // Read the previous version's Blob/base64 wallpaper records once.
        // Existing wallpapers and recent images survive the storage upgrade.
        const [savedWallpaper,oldRecent]=await Promise.all([mediaGet('wallpaper'),mediaGet('recent')]);
        const current=await migrateImage(savedWallpaper);
        const oldEntries=Array.isArray(oldRecent)?oldRecent.slice(0,4):[];
        recent=(await Promise.all(oldEntries.map(migrateImage))).filter(Boolean).slice(0,4);
        if(current && !recent.includes(current))recent=[current,...recent].slice(0,4);
        recentIds=recent.map(makeWallpaperId);
        wallpaperId=current ? recentIds[recent.indexOf(current)] : null;
        paintWallpaper(current);
        if(savedWallpaper!==null || oldRecent!==null) {
          await saveWallpaperState(wallpaperId,recentIds,recent.map((blob,i)=>({id:recentIds[i],blob})));
        }
      }
      applyProfile(profile);
    } catch {paintWallpaper(null);applyProfile(null);}
  }
  window.addEventListener('pagehide',()=>{
    if(wallpaperObjectUrl)URL.revokeObjectURL(wallpaperObjectUrl);
    recentObjectUrls.forEach(url=>URL.revokeObjectURL(url));
  },{once:true});
  window.WebWindowsSettings=Object.freeze({
    open:openSettings,close:closeSettings,showPage,get:()=>({...state}),
    setGlass(value) {
      if (value !== null && (typeof value!=='string' || !/^#[0-9a-f]{6}$/i.test(value))) return;
      state.glass=value===null ? null : value.toLowerCase();persist();applyColors();
    },
    setOpacity(value) {
      const n=Number(value);if(!Number.isFinite(n))return;
      state.opacity=Math.round(Math.max(0,Math.min(100,n)));persist();applyColors();
    },
    setAccent,
    setTaskbar(settings) {
      if(settings.position && allowed.position.includes(settings.position))state.position=settings.position;
      if(settings.align && ['center','start'].includes(settings.align))state.align=settings.align;
      if(settings.searchMode && allowed.searchMode.includes(settings.searchMode))state.searchMode=settings.searchMode;
      if (['attached','floating'].includes(settings.layout))state.layout=settings.layout;
      else if(typeof settings.unified==='boolean')state.layout=settings.unified?'attached':'floating'; // legacy API
      persist();applyTaskbar();animateTaskbarMove();
    },
    resetAppearance() { $('ww-appearance-reset').click(); }
  });

  // Keep the prior 10H10 mode menu, with the original 9H09 fine-grained material controls.
  const chosenGlass = () => state.glass || nativeGlassColor();
  function changeGlass(hex) {
    if (typeof hex !== 'string' || !/^#[a-f0-9]{6}$/i.test(hex)) return false;
    state.glass = hex.toLowerCase(); persist(); applyColors(); return true;
  }
  function updateHexField(field) {
    const value = field.value.trim().replace(/^([a-f0-9]{6})$/i, '#$1');
    if (!changeGlass(value)) { field.value=chosenGlass(); field.setAttribute('aria-invalid','true'); }
    else field.removeAttribute('aria-invalid');
  }
  $('ww-context-glass-hex').addEventListener('change',e=>updateHexField(e.currentTarget));
  $('ww-context-glass-hex').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}});
  $('ww-context-glass-swatches').addEventListener('click',e=>{
    const choice=e.target.closest('[data-ww-context-glass]');
    if(choice) {
      if (choice.dataset.wwContextGlass === 'default') { state.glass=null;persist();applyColors(); }
      else changeGlass(choice.dataset.wwContextGlass);
    }
  });
  $('ww-context-glass-picker').addEventListener('input',e=>changeGlass(e.target.value));
  $('ww-context-opacity').addEventListener('input',e=>{
    state.opacity=Math.round(Math.min(100,Math.max(0,Number(e.target.value))));persist();applyColors();
  });
  $('ww-context-glass-reset').addEventListener('click',()=>{state.glass=null;state.opacity=original.opacity;persist();applyColors();});
  $('ww-context-more').addEventListener('click',()=>{
    // Close via the existing context-menu's own commands rather than replacing its logic.
    document.querySelector('[data-menu-action="personalize"]')?.click();
    requestAnimationFrame(()=>window.WebWindowsSettings?.open?.('colors'));
  });
  // Original Icons8 pictures, with Phosphor glyphs if an external image fails.
  // Their color pixels remain untouched; no filters, masks or local vector copies.
  for (const asset of dialog.querySelectorAll('img[data-icons8-src]')) {
    const holder=asset.closest('.ww-sidebar-icon,.ww-title-icon,.ww9-update-hero-icon,.ww10-insider-advanced-icon');
    const update=()=>holder?.classList.toggle('loaded', asset.complete && asset.naturalWidth>0);
    asset.addEventListener('load', update);
    asset.addEventListener('error', update);
    if (asset.complete) update();
  }

  // 9H09 dropdown selector: detached flyout, keyboard navigation, focus control,
  // original <select> retained as the single source of truth for actual behavior.
  const flyout=$('ww-choice-flyout');
  const choices=[...dialog.querySelectorAll('.ww-choice')];
  let openChoice=null;
  function syncChoices() {
    for (const wrap of choices) {
      const native=wrap.querySelector('select');
      const label=wrap.querySelector('.ww-choice-value');
      if(native && native.selectedOptions[0]) label.textContent=native.selectedOptions[0].textContent;
    }
  }
  function closeChoice(focus=false) {
    if(!openChoice) return;
    const trigger=openChoice.querySelector('.ww-choice-trigger');
    trigger.setAttribute('aria-expanded','false');
    flyout.hidden=true;flyout.replaceChildren();
    openChoice=null;
    if(focus && !dialog.hidden) trigger.focus({preventScroll:true});
  }
  function positionChoice() {
    if(!openChoice || flyout.hidden) return;
    const r=openChoice.querySelector('.ww-choice-trigger').getBoundingClientRect();
    const pad=8;
    flyout.style.width=`${Math.max(170,Math.round(r.width))}px`;
    flyout.style.maxWidth=`calc(100vw - ${pad*2}px)`;
    const roomBelow=innerHeight-r.bottom-pad, roomAbove=r.top-pad;
    const below=roomBelow>=Math.min(210,flyout.scrollHeight) || roomBelow>=roomAbove;
    const room=Math.max(65,below?roomBelow:roomAbove);
    flyout.style.maxHeight=`${Math.min(425,room)}px`;
    flyout.style.left=`${Math.max(pad,Math.min(r.left,innerWidth-flyout.offsetWidth-pad))}px`;
    flyout.style.top=below?`${Math.min(innerHeight-pad-flyout.offsetHeight,r.bottom+3)}px`:`${Math.max(pad,r.top-flyout.offsetHeight-3)}px`;
  }
  function openSelector(wrap,focusOption=false) {
    if(openChoice===wrap){closeChoice();return;}
    closeChoice();
    const native=wrap.querySelector('select'),trigger=wrap.querySelector('.ww-choice-trigger');
    if(!native || native.disabled)return;
    openChoice=wrap;
    flyout.replaceChildren();
    flyout.setAttribute('aria-label',trigger.getAttribute('aria-label')||'Settings options');
    [...native.options].forEach((option,index)=>{
      const b=document.createElement('button');b.type='button';b.className='ww-choice-option';
      b.id=`ww-choice-opt-${index}`;b.setAttribute('role','option');b.setAttribute('aria-selected',String(option.selected));
      b.dataset.value=option.value;
      const mark=document.createElement('span');mark.className='ww-choice-option-mark';mark.textContent='✓';mark.setAttribute('aria-hidden','true');
      const copy=document.createElement('span');copy.className='ww-choice-option-copy';
      const heading=document.createElement('span');heading.className='ww-choice-option-label';heading.textContent=option.textContent;
      const hint=document.createElement('span');hint.className='ww-choice-option-detail';hint.textContent=wrap.querySelector('.ww-choice-detail').textContent;
      copy.append(heading,hint);b.append(mark,copy);
      b.addEventListener('click',()=>{
        native.value=option.value;
        native.dispatchEvent(new Event('change',{bubbles:true}));
        syncChoices();closeChoice(true);
      });
      flyout.append(b);
    });
    trigger.setAttribute('aria-expanded','true');
    flyout.hidden=false;positionChoice();
    if(focusOption) (flyout.querySelector('[aria-selected="true"]')||flyout.firstElementChild)?.focus({preventScroll:true});
  }
  choices.forEach(wrap=>{
    const trigger=wrap.querySelector('.ww-choice-trigger');
    trigger.addEventListener('click',()=>openSelector(wrap,false));
    trigger.addEventListener('keydown',e=>{
      if(['ArrowDown','ArrowUp',' ','Enter'].includes(e.key)) {e.preventDefault();openSelector(wrap,true);}
    });
    wrap.querySelector('select').addEventListener('change',syncChoices);
  });
  flyout.addEventListener('keydown',e=>{
    const options=[...flyout.querySelectorAll('.ww-choice-option')];
    const i=options.indexOf(document.activeElement);
    let next=null;
    if(e.key==='Escape'){e.preventDefault();closeChoice(true);return;}
    if(e.key==='ArrowDown')next=options[(i+1)%options.length];
    else if(e.key==='ArrowUp')next=options[(i+options.length-1)%options.length];
    else if(e.key==='Home')next=options[0];
    else if(e.key==='End')next=options.at(-1);
    else if(e.key==='Tab'){closeChoice();return;}
    if(next){e.preventDefault();next.focus({preventScroll:true});next.scrollIntoView({block:'nearest'});}
  });
  document.addEventListener('pointerdown',e=>{
    if(openChoice && !flyout.contains(e.target) && !openChoice.contains(e.target))closeChoice();
  });
  // Reposition the detached 9H09 selector when the settings pane scrolls.
  // Closing it on scroll made keyboard / click selection unreliable in longer pages.
  $('ww-settings-scroll').addEventListener('scroll',()=>positionChoice(),{passive:true});
  window.addEventListener('resize',closeChoice);
  dialog.addEventListener('ww10-settings-layout-change',()=>closeChoice());
  syncChoices();

  // 9H09/WinUI range fill: a unified track/thumb/value layout, not three unrelated slider themes.
  const winuiRanges=[...document.querySelectorAll('.ww-winui-range')];
  function paintWinuiRange(input) {
    const min=Number(input.min || 0), max=Number(input.max || 100), value=Number(input.value);
    const fraction=max>min ? (value-min)/(max-min) : 0;
    input.style.setProperty('--ww-range-fill',`${Math.max(0,Math.min(100,fraction*100))}%`);
  }
  winuiRanges.forEach(range=>{
    range.addEventListener('input',()=>paintWinuiRange(range));
    paintWinuiRange(range);
  });

  // Initialize the glass-derived contrast colors before showing UI controls.
  applyTaskbar(); applyColors();applyLanguage();applyTime();updatePauseUI();
  applyProfile(null);initMedia();
})();

/* 9H09 Quick Settings controls on the 10H10 web desktop. */
(() => {
  'use strict';
  const byId=id=>document.getElementById(id);
  const panel=byId('ww-quick'), brightness=byId('ww9-brightness'), nightRange=byId('ww9-night-intensity');
  if(!panel || !brightness || !nightRange || !window.WebWindowsSettings)return;
  const api=window.WebWindowsSettings;
  const KEY='webwindows10h10.quick-9h09.v1';
  let state={brightness:100,night:0,intensity:50,expanded:false};
  try {const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved && typeof saved==='object')state={...state,...saved};}catch{}
  const clamp=(v,min,max,otherwise)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):otherwise;
  state.brightness=clamp(state.brightness,20,100,100);
  state.intensity=clamp(state.intensity,0,100,50);
  state.night=state.night?1:0;
  const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}};
  function update() {
    brightness.value=String(state.brightness);
    nightRange.value=String(state.intensity);
    brightness.style.setProperty('--ww-range-fill',((state.brightness-20)/80*100)+'%');
    nightRange.style.setProperty('--ww-range-fill',state.intensity+'%');
    const dim=byId('ww-screen-dim');
    dim.style.opacity=String(1-state.brightness/100);
    dim.style.display=state.brightness===100?'none':'block';
    const night=byId('ww-screen-night');
    night.style.display=state.night && state.intensity>0?'block':'none';
    night.style.background='rgba(255,147,48,'+(state.intensity/100*.32)+')';
    const main=byId('ww9-night-main'),expand=byId('ww9-night-expand'),wrap=byId('ww9-night-intensity-wrap');
    main.setAttribute('aria-pressed',String(!!state.night));
    expand.setAttribute('aria-expanded',String(!!state.expanded));
    wrap.classList.toggle('is-open',!!state.expanded);
    wrap.setAttribute('aria-hidden',String(!state.expanded));
    nightRange.tabIndex=state.expanded?0:-1;
  }
  const close=()=>{panel.hidden=true;byId('faders-button')?.setAttribute('aria-expanded','false');};
  window.addEventListener('webwindows:quick-settings-requested',()=> {
    const opening=panel.hidden;
    document.querySelectorAll('.ww-flyout').forEach(el=>{if(el!==panel)el.hidden=true;});
    panel.hidden=!opening;
    byId('faders-button')?.setAttribute('aria-expanded',String(opening));
    if(opening)update();
  });
  document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!e.target.closest('#faders-button'))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();close();byId('faders-button')?.focus({preventScroll:true});}});
  byId('ww9-night-main').addEventListener('click',()=>{state.night=state.night?0:1;if(state.night&&!state.intensity)state.intensity=50;store();update();});
  byId('ww9-night-expand').addEventListener('click',()=>{state.expanded=!state.expanded;store();update();});
  brightness.addEventListener('input',()=>{state.brightness=clamp(brightness.value,20,100,100);store();update();});
  nightRange.addEventListener('input',()=>{state.intensity=clamp(nightRange.value,0,100,50);state.night=state.intensity>0?1:0;store();update();});
  byId('ww9-quick-settings').addEventListener('click',()=>{close();api.open('personalization');});
  update();
})();

/* 9H09 taskbar preview: true miniature, shown only for minimized app windows. */
(() => {
  'use strict';
  const byId=id=>document.getElementById(id);
  const panel=byId('ww10-app-preview'); if(!panel)return;
  const items={
    'settings-button':{name:'Settings',window:'settings-window',icon:'s5NUIabJrb4C',event:'settings-requested'},
    'information-button':{name:'About Windows',window:'information-window',icon:'VQOfeAx5KWTK',event:'information-requested'},
    'defender-button':{name:'Windows Security',window:'ww-security',icon:'oo5voXhXsnEk',event:'defender-requested'}
  };
  let active=null,showTimer,hideTimer;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const isMinimized=item=>byId(item.window)?.dataset.wwMinimized==='true';
  function hide(){
    clearTimeout(showTimer); clearTimeout(hideTimer);
    panel.hidden=true; active=null;
  }
  function scheduleHide(){
    clearTimeout(showTimer); clearTimeout(hideTimer);
    hideTimer=setTimeout(hide,250); // 9H09 allows crossing from taskbar to preview.
  }
  function place(button){
    const rect=button.getBoundingClientRect(),width=panel.offsetWidth,height=panel.offsetHeight;
    const side=document.documentElement.dataset.wwTaskbar||'bottom';
    const gap=document.documentElement.dataset.wwLayout==='floating'?18:12;
    let left,top;
    if(side==='left'){left=rect.right+gap;top=rect.top+rect.height/2-height/2;}
    else if(side==='right'){left=rect.left-width-gap;top=rect.top+rect.height/2-height/2;}
    else{left=rect.left+rect.width/2-width/2;top=side==='top'?rect.bottom+gap:rect.top-height-gap;}
    panel.style.left=Math.max(8,Math.min(Math.max(8,innerWidth-width-8),left))+'px';
    panel.style.top=Math.max(8,Math.min(Math.max(8,innerHeight-height-8),top))+'px';
  }
  function show(id){
    const config=items[id],button=byId(id);
    if(!config||!button||!isMinimized(config)) {hide();return;}
    const source=byId(config.window);
    clearTimeout(showTimer);clearTimeout(hideTimer);active=id;
    byId('ww10-preview-icon').src=`https://img.icons8.com/?size=100&id=${config.icon}&format=png`;
    byId('ww10-preview-title').textContent=config.name;
    panel.setAttribute('aria-label',config.name+' minimized window preview. Click to restore.');

    // This snapshot retains the actual app content/scroll position from before
    // minimization, rather than substituting generic lines or action cards.
    const clone=source.cloneNode(true);
    clone.removeAttribute('hidden');
    clone.removeAttribute('aria-modal');
    clone.classList.remove('is-closing');
    const width=Number(source.dataset.wwPreviewWidth)||Math.max(200,Math.round(source.offsetWidth));
    const height=Number(source.dataset.wwPreviewHeight)||Math.max(160,Math.round(source.offsetHeight));
    clone.style.cssText+=';position:absolute!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;transform:none!important;translate:none!important;scale:1!important;opacity:1!important;animation:none!important;max-width:none!important;max-height:none!important;width:'+width+'px!important;height:'+height+'px!important;display:'+(config.window==='settings-window'?'flex':'block')+'!important;';
    // Equivalent to 9H09's 0.22-scale live-window preview. An isolated frame
    // preserves selectors such as #settings-window without duplicate page IDs.
    const scale=Math.min(.22,(innerWidth-40)/width,(innerHeight-90)/height);
    const thumb=byId('ww10-thumbnail');
    thumb.style.width=Math.round(width*scale)+'px';
    thumb.style.height=Math.round(height*scale)+'px';
    const frame=document.createElement('iframe');
    frame.className='ww10-thumbnail-frame';
    frame.setAttribute('aria-hidden','true');
    frame.setAttribute('tabindex','-1');
    frame.setAttribute('sandbox','');
    frame.style.width=width+'px';frame.style.height=height+'px';
    frame.style.transform=`translate(-${width*scale/2}px,-${height*scale/2}px) scale(${scale})`;
    const rootAttrs=[...document.documentElement.attributes].filter(a=>a.name.startsWith('data-')).map(a=>a.name+'="'+a.value.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'"').join(' ');
    const rootStyle=document.documentElement.style.cssText.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    const css=[...document.querySelectorAll('style')].map(el=>el.textContent).join('\n').replace(/<\/style/gi,'&lt;/style');
    // Phosphor is external to <style>, so the visual-only thumbnail loads it too.
    frame.srcdoc='<!doctype html><html '+rootAttrs+' style="'+rootStyle+'"><head><meta charset="utf-8"><link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.2/src/regular/style.css"><style>'+css+'</style><style>html,body{margin:0!important;overflow:hidden!important;width:100%;height:100%;} *::-webkit-scrollbar{display:none!important;} #settings-window .ww-settings-content{overflow:hidden!important;}</style></head><body>'+clone.outerHTML+'</body></html>';
    thumb.replaceChildren(frame);
    panel.hidden=false;
    if(!reduced.matches){panel.style.animation='none';void panel.offsetWidth;panel.style.animation='';}
    place(button);
  }
  for(const id of Object.keys(items)){
    const button=byId(id);
    button.addEventListener('pointerenter',()=>{
      clearTimeout(hideTimer);clearTimeout(showTimer);
      if(isMinimized(items[id])) showTimer=setTimeout(()=>show(id),175);
      else hide();
    });
    button.addEventListener('pointerleave',scheduleHide);
    button.addEventListener('focus',()=>{
      clearTimeout(hideTimer);clearTimeout(showTimer);
      if(isMinimized(items[id])) showTimer=setTimeout(()=>show(id),200);
    });
    button.addEventListener('blur',scheduleHide);
    button.addEventListener('click',hide); // A taskbar click restores; never show a preview for an open window.
  }
  panel.addEventListener('pointerenter',()=>clearTimeout(hideTimer));
  panel.addEventListener('pointerleave',scheduleHide);
  panel.addEventListener('focusin',()=>clearTimeout(hideTimer));
  panel.addEventListener('focusout',e=>{if(!panel.contains(e.relatedTarget))scheduleHide();});
  function restore(){
    if(!active)return;
    const config=items[active]; hide();
    window.dispatchEvent(new CustomEvent('webwindows:'+config.event,{detail:{}}));
  }
  panel.addEventListener('click',e=>{if(!e.target.closest('#ww10-preview-close'))restore();});
  panel.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target===panel){e.preventDefault();restore();}
    if(e.key==='Escape')hide();
  });
  byId('ww10-preview-close').addEventListener('click',e=>{
    e.stopPropagation();
    if(!active)return;
    const taskbarId=active;hide();
    window.dispatchEvent(new CustomEvent('webwindows:app-preview-close-requested',{detail:{taskbarId}}));
  });
  document.addEventListener('pointerdown',e=>{if(!panel.contains(e.target)&&!e.target.closest('#taskbar'))hide();});
  window.addEventListener('resize',hide);
  for(const type of ['app-minimized','app-restored','app-closed']){
    window.addEventListener('webwindows:'+type,e=>{
      if(type!=='app-minimized'&&active===e.detail?.taskbarId)hide();
    });
  }
  window.addEventListener('webwindows:settings-requested',()=>{if(active)hide();});
})();


/* 10H10 window expansion: maximize/restore and drag-to-resize for the two
   windowed system applications. Existing taskbar/minimize flows are unchanged. */
(() => {
  'use strict';
  const definitions = [
    {window:'settings-window', button:'ww-settings-maximize', bar:'ww-settings-titlebar', label:'settings', minW:390, minH:320},
    {window:'information-window', button:'about-maximize', bar:'about-titlebar', label:'About Windows', minW:335, minH:325}
  ];
  const viewportMax = () => {
    const taskbar=document.getElementById('taskbar');
    const dock=document.documentElement.dataset.wwTaskbar || 'bottom';
    const bounds=taskbar?.getBoundingClientRect();
    return {
      w: window.innerWidth-16-(dock==='left'||dock==='right' ? (bounds?.width||0) : 0),
      h: window.innerHeight-16-(dock==='top'||dock==='bottom' ? (bounds?.height||0) : 0)
    };
  };
  const fields=['left','top','right','bottom','width','height','transform'];
  for(const def of definitions){
    const win=document.getElementById(def.window);
    const button=document.getElementById(def.button);
    const bar=document.getElementById(def.bar);
    const grip=win?.querySelector('.ww10-window-resize-grip');
    if(!win||!button||!bar||!grip) continue;
    let oldStyle=null;
    function toggleMaximize(){
      if (win.hidden) return;
      if (win.classList.contains('ww10-maximized')) {
        win.classList.remove('ww10-maximized');
        if(oldStyle){for(const key of fields)win.style[key]=oldStyle[key];}
      } else {
        oldStyle=Object.fromEntries(fields.map(key=>[key,win.style[key]]));
        win.classList.add('ww10-maximized');
      }
      const isMax=win.classList.contains('ww10-maximized');
      const action=isMax?'Restore':'Maximize';
      button.title=action;
      button.setAttribute('aria-label',`${action} ${def.label}`);
      button.setAttribute('aria-pressed',String(isMax));
      button.querySelector('i')?.classList.toggle('ph-squares-four',isMax);
      button.querySelector('i')?.classList.toggle('ph-square',!isMax);
    }
    button.addEventListener('click',toggleMaximize);
    bar.addEventListener('dblclick',event=>{
      if(event.target.closest('button')) return;
      toggleMaximize();
    });
    let resize=null;
    grip.addEventListener('pointerdown',event=>{
      if(event.button!==0||win.classList.contains('ww10-maximized'))return;
      const r=win.getBoundingClientRect();
      const min=viewportMax();
      if(r.width<200 || r.height<150) return;
      for(const key of ['right','bottom']) win.style[key]='auto';
      win.style.left=`${r.left}px`;
      win.style.top=`${r.top}px`;
      win.style.transform='none';
      win.style.width=`${r.width}px`;
      win.style.height=`${r.height}px`;
      resize={id:event.pointerId,x:event.clientX,y:event.clientY,w:r.width,h:r.height,left:r.left,top:r.top};
      grip.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    grip.addEventListener('pointermove',event=>{
      if(!resize||resize.id!==event.pointerId)return;
      const m=viewportMax();
      const maxWidth=Math.max(240,Math.min(m.w,window.innerWidth-resize.left-8));
      const maxHeight=Math.max(230,Math.min(m.h,window.innerHeight-resize.top-8));
      const width=Math.max(Math.min(def.minW,maxWidth),Math.min(maxWidth,resize.w+event.clientX-resize.x));
      const height=Math.max(Math.min(def.minH,maxHeight),Math.min(maxHeight,resize.h+event.clientY-resize.y));
      win.style.width=`${width}px`;
      win.style.height=`${height}px`;
    });
    for(const name of ['pointerup','pointercancel','lostpointercapture']) {
      grip.addEventListener(name,()=>{resize=null;});
    }
  }
})();


/* 10H10 Settings responsive navigation. This observes actual app dimensions,
   including maximize and drag-to-resize, not only browser resize events. */
(()=>{
  'use strict';
  const windowEl=document.getElementById('settings-window');
  const button=document.getElementById('ww10-settings-navigation-toggle');
  const nav=document.getElementById('ww10-settings-navigation');
  const scrim=document.getElementById('ww10-settings-nav-scrim');
  const content=document.getElementById('ww-settings-scroll');
  if(!windowEl||!button||!nav||!scrim||!content)return;
  let narrow=false;
  let lastWidth=0;
  function setOpen(open,{restoreFocus=false}={}){
    const next=Boolean(open)&&narrow;
    const wasOpen=windowEl.classList.contains('ww10-settings-nav-open');
    windowEl.classList.toggle('ww10-settings-nav-open',next);
    button.setAttribute('aria-expanded',String(next));
    button.setAttribute('aria-label',next?'Close Settings navigation':'Open Settings navigation');
    button.title=next?'Close navigation':'Navigation menu';
    nav.inert=narrow&&!next;
    if(narrow&&!next)nav.setAttribute('aria-hidden','true');
    else nav.removeAttribute('aria-hidden');
    scrim.setAttribute('aria-hidden',String(!next));
    if(restoreFocus&&wasOpen&&!next&&!windowEl.hidden)button.focus({preventScroll:true});
  }
  function updateLayout(){
    const rect=windowEl.getBoundingClientRect();
    if(!rect.width)return;
    const width=Math.round(rect.width),height=Math.round(rect.height);
    const wasNarrow=narrow;
    narrow=width<=720;
    windowEl.classList.toggle('ww10-settings-short',height<510);
    windowEl.classList.toggle('ww10-settings-compact',narrow);
    if(wasNarrow!==narrow)setOpen(false);
    if(!narrow)setOpen(false);
    if(width!==lastWidth){
      lastWidth=width;
      windowEl.dispatchEvent(new Event('ww10-settings-layout-change'));
    }
  }
  button.addEventListener('click',()=>setOpen(!windowEl.classList.contains('ww10-settings-nav-open')));
  scrim.addEventListener('click',()=>setOpen(false,{restoreFocus:true}));
  nav.addEventListener('click',event=>{
    if(narrow&&event.target.closest('[data-ww-page]'))setOpen(false);
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&windowEl.classList.contains('ww10-settings-nav-open')){
      event.preventDefault();setOpen(false,{restoreFocus:true});
    }
  });
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(updateLayout):null;
  observer?.observe(windowEl);
  window.addEventListener('resize',updateLayout,{passive:true});
  updateLayout();
  window.addEventListener('pagehide',()=>observer?.disconnect(),{once:true});
})();
