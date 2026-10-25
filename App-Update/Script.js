
/* Use genuine Phosphor glyphs when the declared icon font becomes available.
 * Do not let an unavailable external font blank out app chrome. */
(() => {
  'use strict';
  const updateIconAvailability=() => {
    if(!document.fonts)return;
    try {
      const available=[...document.fonts].some(face =>
        /phosphor/i.test(face.family) && face.status==='loaded');
      document.documentElement.classList.toggle('ww10-ph-fallback',!available);
    } catch(error) { document.documentElement.classList.add('ww10-ph-fallback'); }
  };
  document.addEventListener('DOMContentLoaded',updateIconAvailability,{once:true});
  document.fonts?.ready?.then(updateIconAvailability).catch(()=>{});
  document.fonts?.addEventListener?.('loadingdone',updateIconAvailability);
  document.getElementById('phosphor-css')?.addEventListener('load',()=>{
    document.fonts?.ready?.then(updateIconAvailability).catch(()=>{});
  });
})();

'use strict';

/* Defensive boundaries for independently developed Windows-style apps.
 * These are narrow compatibility fallbacks, not replacements for broken business logic.
 * Keep failures visible in the console instead of silently swallowing them.
 */
const WWCompat = (() => {
  function warn(message, error) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function')
      console.warn(`[WebWindows] ${message}`, error || '');
  }
  function boot(name, initialize) {
    try { initialize(); }
    catch (error) {
      warn(`${name} could not initialize; other apps will continue.`, error);
      emit('webwindows:module-error', { module: name, message: String(error?.message || error) });
    }
  }
  function emit(type, detail = {}) {
    try {
      // Some embedded browsers have Event but not CustomEvent.
      let event;
      if (typeof window.CustomEvent === 'function') {
        event = new window.CustomEvent(type, { detail });
      } else {
        event = document.createEvent('Event');
        event.initEvent(type, false, false);
        Object.defineProperty(event, 'detail', { value: detail });
      }
      return window.dispatchEvent(event);
    } catch (error) {
      warn(`Could not dispatch ${type}.`, error);
      return false;
    }
  }
  function media(query) {
    try {
      if (typeof window.matchMedia === 'function') return window.matchMedia(query);
    } catch (error) { warn('Media preferences are unavailable.', error); }
    return { matches: false }; // Default to normal transitions if preferences cannot be read.
  }
  function frame(callback) {
    return typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame(callback) : window.setTimeout(callback, 16);
  }
  function replaceChildren(node, ...children) {
    if (!node) return;
    if (typeof node.replaceChildren === 'function') node.replaceChildren(...children);
    else { while (node.firstChild) node.removeChild(node.firstChild); node.append(...children); }
  }
  // Single geometry engine for Search and Start. Use the taskbar's rendered
  // rectangle (including the floating gap), not a hardcoded 45px dock offset.
  function positionTaskbarPanel(panel, {width = 500, height = 560, gap = 9, inset = 8} = {}) {
    if (!panel || panel.hidden) return null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const side = document.documentElement.dataset.wwTaskbar || 'bottom';
    const bar = document.getElementById('taskbar');
    const dock = bar?.getBoundingClientRect() || {left:0,top:vh-45,right:vw,bottom:vh};
    const usable = {left:inset, top:inset, right:Math.max(inset,vw-inset), bottom:Math.max(inset,vh-inset)};
    if (side === 'bottom') usable.bottom = Math.max(usable.top, Math.min(usable.bottom, dock.top-gap));
    else if (side === 'top') usable.top = Math.min(usable.bottom, Math.max(usable.top, dock.bottom+gap));
    else if (side === 'left') usable.left = Math.min(usable.right, Math.max(usable.left, dock.right+gap));
    else if (side === 'right') usable.right = Math.max(usable.left, Math.min(usable.right, dock.left-gap));

    const aw = Math.max(0, usable.right-usable.left);
    const ah = Math.max(0, usable.bottom-usable.top);
    const w = Math.max(0,Math.min(width,aw));
    const h = Math.max(0,Math.min(height,ah));
    // For a horizontal bar, the flyout is centered above/below it. For a
    // vertical bar it opens directly beside the bar, centered vertically.
    const x = side === 'left' ? usable.left : side === 'right' ? usable.right-w : usable.left+(aw-w)/2;
    const y = side === 'top' ? usable.top : side === 'bottom' ? usable.bottom-h : usable.top+(ah-h)/2;
    Object.assign(panel.style, {
      left:`${Math.round(x)}px`, top:`${Math.round(y)}px`,
      right:'auto', bottom:'auto', translate:'none',
      width:`${Math.floor(w)}px`, maxWidth:`${Math.floor(w)}px`,
      height:`${Math.floor(h)}px`, maxHeight:`${Math.floor(ah)}px`
    });
    return {side,width:w,height:h};
  }

  function openSettings(section) {
    const api = window.WebWindowsSettings;
    if (typeof api?.open === 'function') {
      try { api.open(section); return true; }
      catch (error) { warn('Settings API failed; attempting its event interface.', error); }
    }
    // A prior integration may still subscribe even if the public method was removed.
    return emit('webwindows:settings-requested', { section });
  }

  // 9H09 sidebar indicator, shared by Settings, Feedback Hub and Defender.
  // Ported from 9H09's switchSettingsTab / switchDefenderTab two-step
  // rubber-band: 150ms ease-in extension followed by 200ms ease-out recovery.
  // The only additions are cancellation and geometry guards for 10H10's
  // resizable windows, scrolling rails, and fast sequential navigation.
  function createSidebarIndicator({ root, rail, indicator, getActive, scrollParents=[] }) {
    const reducedMotion = media('(prefers-reduced-motion: reduce)');
    const markerHeight = 16; // 9H09 marker geometry (not 10H10's 20px)
    const extendMs = 150;
    const settleMs = 200;
    let placed = false;
    let pendingFrame = 0;
    let wantsMotion = false;
    let phaseTimer = null;
    let settleTimer = null;
    let currentRow = null;
    let targetTop = null;
    let animating = false;

    function measure() {
      if (!root || !rail || !indicator || root.hidden || root.dataset.wwMinimized === 'true') return null;
      const active = getActive();
      if (!active || !active.getClientRects().length || !rail.getClientRects().length) return null;
      const railRect = rail.getBoundingClientRect();
      const rowRect = active.getBoundingClientRect();
      const oldRect = indicator.getBoundingClientRect();
      const offset = rail.scrollTop - rail.clientTop - railRect.top;
      const dpr = window.devicePixelRatio || 1;
      const align = n => Math.round(n * dpr) / dpr;
      return {
        active,
        top: align(rowRect.top + offset + (rowRect.height - markerHeight) / 2),
        oldTop: align(oldRect.top + offset),
        oldHeight: placed ? Math.max(1, oldRect.height) : markerHeight
      };
    }

    function cancelTimers() {
      if (phaseTimer !== null) { window.clearTimeout(phaseTimer); phaseTimer = null; }
      if (settleTimer !== null) { window.clearTimeout(settleTimer); settleTimer = null; }
      animating = false;
    }

    function snap(top) {
      cancelTimers();
      indicator.style.transition = 'none';
      indicator.style.top = `${top}px`;
      indicator.style.height = `${markerHeight}px`;
      indicator.style.opacity = '1';
    }

    function move(animate = false) {
      const state = measure();
      if (!state) return;
      const { active, top, oldTop, oldHeight } = state;
      const sameRow = active === currentRow;
      const distanceFromDestination = targetTop === null ? Infinity : Math.abs(top - targetTop);
      // ResizeObserver/scroll events from an unchanged destination must not
      // restart the rubber band halfway through either phase.
      if (animating && sameRow && distanceFromDestination < 1.25) return;
      // Reposition without motion for window resizing, a drawer collapsing,
      // or the initial appearance; these aren't user page selections.
      const needsTravel = Math.abs(top - oldTop) > 1;
      const doAnimate = placed && animate && needsTravel && !reducedMotion.matches;
      cancelTimers();
      currentRow = active;
      targetTop = top;
      indicator.style.transform = 'none';
      indicator.style.opacity = '1';

      if (!doAnimate) {
        snap(top);
        placed = true;
        return;
      }

      // Use the actual rendered rectangle as the start when a previous
      // selection is interrupted. This preserves the 9H09 rubber-band motion
      // without the snap/jump that its original timer could introduce.
      const oldBottom = oldTop + oldHeight;
      const newBottom = top + markerHeight;
      const extendedTop = Math.min(oldTop, top);
      const extendedBottom = Math.max(oldBottom, newBottom);
      animating = true;
      // 9H09 phase 1: extend toward the newly selected navigation row.
      indicator.style.transition = `top ${extendMs}ms ease-in, height ${extendMs}ms ease-in, opacity 150ms ease`;
      indicator.style.top = `${extendedTop}px`;
      indicator.style.height = `${extendedBottom - extendedTop}px`;

      phaseTimer = window.setTimeout(() => {
        phaseTimer = null;
        // 9H09 phase 2: contract into a 16px bar at the destination.
        indicator.style.transition = `top ${settleMs}ms ease-out, height ${settleMs}ms ease-out, opacity 150ms ease`;
        indicator.style.top = `${top}px`;
        indicator.style.height = `${markerHeight}px`;
        settleTimer = window.setTimeout(() => {
          settleTimer = null;
          animating = false;
          // Reconcile position only after the transition; do not replay it.
          schedule(false);
        }, settleMs + 20);
      }, extendMs);
      placed = true;
    }

    function schedule(animate = false) {
      wantsMotion ||= animate;
      if (pendingFrame) return;
      pendingFrame = frame(() => {
        pendingFrame = 0;
        const shouldAnimate = wantsMotion;
        wantsMotion = false;
        move(shouldAnimate);
      });
    }
    function cancel() {
      cancelTimers();
      if (pendingFrame) {
        if (typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(pendingFrame);
        else window.clearTimeout(pendingFrame);
        pendingFrame = 0;
      }
      wantsMotion = false;
    }
    for (const node of [rail, ...scrollParents.filter(Boolean)])
      node.addEventListener('scroll', () => schedule(false), {passive:true});
    window.addEventListener('resize', () => schedule(false), {passive:true});
    root.addEventListener('transitionend', event => {
      if (event.target === root || rail.contains(event.target) || scrollParents.some(p => p?.contains(event.target)))
        schedule(false);
    });
    const observer = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => schedule(false)) : null;
    if (observer) {
      observer.observe(root);
      observer.observe(rail);
      for (const item of rail.querySelectorAll('button')) observer.observe(item);
    }
    window.addEventListener('pagehide', () => { observer?.disconnect(); cancel(); }, {once:true});
    return { move, schedule, cancel };
  }
  return Object.freeze({ boot, emit, media, frame, replaceChildren, openSettings, positionTaskbarPanel, createSidebarIndicator });
})();
window.WebWindowsCompat = WWCompat;


/*
 * Windows 12 (Version 10H10) — desktop/taskbar foundation.
 * Taskbar foundation with Information, Settings, and Feedback hub.
 * Search and Start launch the available apps; other system flyouts may be
 * reserved for future work.
 * Buttons emit events that later application modules can listen to.
 */
WWCompat.boot('Desktop and Search', () => {
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
    if (!icon) continue; // Another app may supply a CSS-only icon.
    const loaded = () => button.classList.toggle('image-loaded', icon.naturalWidth > 0);
    icon.addEventListener('load', loaded);
    icon.addEventListener('error', loaded);
    if (icon.complete) loaded();
  }

  // Phosphor glyphs are shown by the regular CSS icon font stylesheet.

  const emit = (event, detail = {}) => WWCompat.emit(`webwindows:${event}`, detail);
  const actions = {
    'weather-button': 'weather-requested',
    'settings-button': 'settings-requested',
    'information-button': 'information-requested',
    'defender-button': 'defender-requested',
    'feedback-button': 'feedback-requested',
    'faders-button': 'quick-settings-requested',
    'datetime-button': 'date-time-requested'
  };
  for (const [id, action] of Object.entries(actions)) {
    const control=byId(id);
    if (control) control.addEventListener('click', () => emit(action));
    else console.warn(`[WebWindows] Missing optional taskbar control: ${id}`);
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
  const reducedMotion = WWCompat.media('(prefers-reduced-motion: reduce)');
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
    { id:'settings-taskbar', title:'Taskbar settings', meta:'Settings · Personalization', icon:'settings', keywords:'taskbar location alignment search floating attached dock top bottom left right app icon name labels', run: () => emit('settings-requested', {section:'taskbar'}) },
    { id:'settings-colors', title:'Colors and transparency', meta:'Settings · Personalization', icon:'brush', keywords:'accent glass color transparency shadow HDR personalization', run: () => emit('settings-requested', {section:'colors'}) },
    { id:'settings-time', title:'Language and time', meta:'Settings · System', icon:'settings', keywords:'clock date time zone 24-hour language english', run: () => emit('settings-requested', {section:'time'}) },
    { id:'settings-updates', title:'Windows Update', meta:'Settings · System', icon:'settings', keywords:'windows update check pause update history', run: () => emit('settings-requested', {section:'updates'}) },
    { id:'settings-login', title:'Login and privacy', meta:'Settings · Account', icon:'shield', keywords:'login privacy profile name PIN account', run: () => emit('settings-requested', {section:'login'}) },
    { id:'security-app', title:'Windows Security', meta:'System · App', icon:'security-app', keywords:'security defender protection app', run: () => emit('defender-requested') },
    { id:'feedback-app', title:'Feedback hub', meta:'System · App', icon:'feedback-app', keywords:'feedback hub bug report suggestion idea problem feature request', run: () => emit('feedback-requested') },
    { id:'build', title:'Windows 12', meta:'Version 10H10 · OS Build 2610130', icon:'windows', keywords:'build system version 10h10 2610130 operating system', run: () => showInformation() },
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
    const naturalHeight = Math.ceil(padding + border + gap + content + composer);
    // Let the same dock-aware geometry used by Start constrain Search. Search
    // keeps its natural (content-dependent) height within the 560/520px cap.
    const cap = window.innerWidth <= 520 ? 520 : 560;
    WWCompat.positionTaskbarPanel(searchPanel, {width:500, height:Math.min(naturalHeight,cap)});
  }
  function positionSearchPanel() {
    resizeSearchPanel();
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
    WWCompat.replaceChildren(searchResults);
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
      } else if (iconName === 'info-app' || iconName === 'settings-app' || iconName === 'security-app' || iconName === 'feedback-app') {
        const img = document.createElement('img');
        img.className = 'search-app-icon';
        img.src = ({
          'info-app': 'https://img.icons8.com/?size=100&id=VQOfeAx5KWTK&format=png&color=000000',
          'settings-app': 'https://img.icons8.com/?size=100&id=s5NUIabJrb4C&format=png&color=000000',
          'security-app': 'https://img.icons8.com/?size=100&id=oo5voXhXsnEk&format=png&color=000000',
          'feedback-app': 'https://img.icons8.com/?size=100&id=XFOumBmRR5zT&format=png&color=000000'
        })[iconName];
        img.alt = '';
        img.draggable = false;
        img.setAttribute('aria-hidden', 'true');
        iconWrap.append(img);
      } else if (!iconName || (item.meta.includes('App') && !['weather','info-app','settings-app','security-app','feedback-app'].includes(iconName))) {
        const img = document.createElement('img');
        img.className = 'search-app-icon';
        img.src = window.WebWindowsAppIcons?.resolve('') || 'https://img.icons8.com/?size=100&id=tWYgsDQo4Sq4&format=png&color=000000';
        img.alt = ''; img.draggable = false;
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
    return window.WebWindowsSettings?.get?.()?.glass || nativeSearchGlass();
  }
  function syncSearchGlassEditor() {
    if (!searchGlassEditor || searchGlassEditor.hidden) return;
    const state = window.WebWindowsSettings?.get?.();
    const hex = currentSearchGlass();
    searchGlassPicker.value = hex;
    if (document.activeElement !== searchGlassHex) searchGlassHex.value = hex.toUpperCase();
    searchGlassReset.setAttribute('aria-pressed', String(state?.glass == null));
  }
  function showSearchGlassEditor() {
    if (typeof window.WebWindowsSettings?.setGlass !== 'function') return;
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
    window.WebWindowsSettings?.setGlass?.(hex);
    searchGlassHex.removeAttribute('aria-invalid');
    return true;
  }
  byId('search-glass-back').addEventListener('click', () => hideSearchGlassEditor());
  searchGlassPicker.addEventListener('input', e => window.WebWindowsSettings?.setGlass?.(e.target.value));
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
    window.WebWindowsSettings?.setGlass?.(null);
    searchGlassHex.value = currentSearchGlass().toUpperCase();
  });
  window.addEventListener('webwindows:glass-changed', syncSearchGlassEditor);
  function showSearchPanel() {
    WWCompat.emit('webwindows:search-opening');
    // Re-entering Search through typing returns from the glass editor to results.
    if (!searchGlassEditor.hidden) hideSearchGlassEditor(false);
    hideAppearanceMenu();
    cancelAnimatedClose(searchPanel);
    if (searchPanel.hidden) searchPanel.hidden = false;
    search.setAttribute('aria-expanded','true');
    searchPanelInput.value = search.value;
    renderSearchResults(search.value);
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
  // Reposition after docking changes, resizing, and the taskbar's move effect.
  let searchPositionFrame = 0;
  function scheduleSearchPosition() {
    if (searchPanel.hidden || searchPositionFrame) return;
    searchPositionFrame = requestAnimationFrame(() => {
      searchPositionFrame = 0;
      positionSearchPanel();
    });
  }
  window.addEventListener('resize', scheduleSearchPosition);
  window.addEventListener('webwindows:taskbar-layout-changed', scheduleSearchPosition);
  document.getElementById('taskbar')?.addEventListener('animationend', scheduleSearchPosition);
  window.addEventListener('webwindows:start-opening', hideSearchPanel);

  // The context menu adjusts the single glass surface, without a separate mode.
  const menu = byId('appearance-menu');
  // Clear the obsolete independent theme preference from older builds.
  try { localStorage.removeItem('webwindows.10h10.appearance'); } catch {}

  function hideAppearanceMenu() {
    animatedHide(menu, () => { menu.hidden = true; });
  }
  function showAppearanceMenu(clientX, clientY) {
    hideTaskbarMenu();
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

  // Start takes focus away from the existing Search and desktop context flyouts.
  window.addEventListener('webwindows:start-opening', () => {
    if (!searchPanel.hidden) hideSearchPanel();
    if (!menu.hidden) hideAppearanceMenu();
    hideTaskbarMenu();
  });

  // Right-click on the desktop retains the existing Appearance controls.
  byId('desktop').addEventListener('contextmenu', (event) => {
    if(event.target.closest('input, textarea'))return;
    event.preventDefault();
    hideTaskbarMenu();
    showAppearanceMenu(event.clientX,event.clientY);
  });

  const taskbarMenu=byId('ww10-taskbar-menu');
  const taskbarSurface=byId('taskbar');
  function hideTaskbarMenu(){taskbarMenu.hidden=true;}
  function showTaskbarMenu(clientX,clientY){
    // Switching context menus must not leave the desktop menu visible mid-animation.
    cancelAnimatedClose(menu);
    menu.classList.remove('is-closing');
    menu.hidden=true;
    hideSearchPanel();
    taskbarMenu.hidden=false;
    const padding=6;
    const w=taskbarMenu.offsetWidth,h=taskbarMenu.offsetHeight;
    taskbarMenu.style.left=`${Math.max(padding,Math.min(clientX,innerWidth-w-padding))}px`;
    // Open upward when close to the bottom of the screen.
    const above=clientY-h-5;
    const y=clientY+h+padding>innerHeight&&above>=padding?above:clientY;
    taskbarMenu.style.top=`${Math.max(padding,Math.min(y,innerHeight-h-padding))}px`;
  }
  taskbarSurface.addEventListener('contextmenu',event=>{
    if(event.target.closest('input,textarea,[contenteditable="true"]'))return;
    event.preventDefault();
    showTaskbarMenu(event.clientX,event.clientY);
  });
  taskbarMenu.addEventListener('click',event=>{
    if(!event.target.closest('#ww10-taskbar-menu-settings'))return;
    hideTaskbarMenu();
    WWCompat.openSettings('taskbar');
  });
  document.addEventListener('pointerdown',event=>{
    if(!taskbarMenu.hidden&&!taskbarMenu.contains(event.target))hideTaskbarMenu();
  });
  document.addEventListener('keydown',event=>{
    if(taskbarMenu.hidden)return;
    if(event.key==='Escape'){
      event.preventDefault();event.stopImmediatePropagation();hideTaskbarMenu();
    }else if(['ArrowDown','ArrowUp'].includes(event.key)){
      event.preventDefault();
      const items=[...taskbarMenu.querySelectorAll('[role="menuitem"]')];
      const index=items.indexOf(document.activeElement);
      items[(index+(event.key==='ArrowDown'?1:items.length-1))%items.length].focus();
    }
  },true);
  window.addEventListener('blur',hideTaskbarMenu);
  window.addEventListener('resize',hideTaskbarMenu);

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
  WWCompat.emit('webwindows:app-minimized', {taskbarId});
}
function clearMinimizedWindow(win, taskbarId, kind='restored') {
  delete win.dataset.wwMinimized;
  WWCompat.emit('webwindows:app-'+kind, {taskbarId});
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
    if (typeof infoTitlebar.setPointerCapture === 'function') infoTitlebar.setPointerCapture(event.pointerId);
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
  document.documentElement.dataset.wwCoreReady = '1';

});


/* 9H09 Settings port for 10H10. Independent of the 9H09 application manager,
   Tailwind, and its login/updater modules. Default values intentionally match
   the unmodified 10H10 appearance and taskbar. */
WWCompat.boot('Settings', () => {
  function rememberMinimizedWindow(win, taskbarId) {
    const rect=win.getBoundingClientRect();
    win.dataset.wwPreviewWidth=String(Math.max(200,Math.round(rect.width)));
    win.dataset.wwPreviewHeight=String(Math.max(150,Math.round(rect.height)));
    win.dataset.wwMinimized='true';win.hidden=true;
    WWCompat.emit('webwindows:app-minimized', {taskbarId});
  }
  function clearMinimizedWindow(win,taskbarId,kind='restored') {
    delete win.dataset.wwMinimized;
    WWCompat.emit('webwindows:app-'+kind, {taskbarId});
  }

  'use strict';
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const dialog = $('settings-window');
  if (!dialog) return;
  const KEY = 'webwindows.10h10.settings.v1';
  const original = Object.freeze({position:'bottom',align:'center',layout:'attached',searchMode:'box',appLabels:'icon',glass:null,opacity:80,accent:'#0078d4',autoAccent:false,shadows:true,hdr:false,localTime:true,localDate:true,hour24:false,language:'en-US',account:'Administrator',pausedUntil:'',earlyUpdates:true,insiderProduct:'10H10',insiderExperience:'',insiderReleasePreview:false});
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
    position:['bottom','top','left','right'], align:['center','start'], layout:['attached','floating'], searchMode:['box','icon','hover'], appLabels:['icon','name'],
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
  const settingsRail = dialog.querySelector('.ww-settings-nav');
  const settingsIndicator = WWCompat.createSidebarIndicator({
    root:dialog, rail:settingsRail,
    indicator:$('ww10-settings-active-indicator'),
    getActive:()=>navItems.find(item=>item.getAttribute('aria-selected')==='true'),
    scrollParents:[$('ww10-settings-navigation')]
  });
  let currentPage = 'home';
  function showPage(name) {
    if (!pages.some(p => p.dataset.wwView === name)) return;
    closeChoice();
    const changingPage = currentPage !== name;
    currentPage = name;
    pages.forEach(p => {
      const active = p.dataset.wwView === name;
      p.hidden = !active;
      p.classList.remove('ww9-page-enter');
      if (active && !WWCompat.media('(prefers-reduced-motion: reduce)').matches) {
        // Re-trigger 9H09-style page entrance on every navigation.
        void p.offsetWidth;
        p.classList.add('ww9-page-enter');
      }
    });
    let active = name;
    if (['colors','desktop','taskbar'].includes(name)) active = 'personalization';
    if (name === 'language') active = 'time';
    if (name === 'pin') active = 'login';
    if (name === 'insider') active = 'updates';
    navItems.forEach(item => item.setAttribute('aria-selected', String(item.dataset.wwPage === active)));
    settingsIndicator.schedule(changingPage);
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
    {name:'Desktop appearance',detail:'Personalization',page:'desktop',terms:'desktop elements appearance taskbar'},
    {name:'Taskbar',detail:'Desktop appearance',page:'taskbar',terms:'taskbar position alignment search floating app icon name labels'},
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
    WWCompat.replaceChildren(searchResults);
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
    if (typeof titlebar.setPointerCapture === 'function') titlebar.setPointerCapture(e.pointerId);
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
    settingsIndicator.schedule(false);
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
    if (WWCompat.media('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
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

    // Every translucent UI tint uses the selected glass RGB, independent from
    // the separate accent applied to functional controls and status indicators.
    root.style.setProperty('--ww-glass-tint-color',state.glass || nativeGlassColor());
    root.style.setProperty('--ww-glass-tint-selected',rgba(selected,Math.min(1,.28+opacity*.62)));
    root.style.setProperty('--ww-glass-tint-soft',rgba(control,Math.min(1,.20+opacity*.38)));
    root.style.setProperty('--ww-glass-tint-hover',rgba(hover,Math.min(1,.50+opacity*.48)));
    root.style.setProperty('--mica-surface',rgba(base,opacity));
    // For dark-colored GLASS, an inset header must be darker than the glass,
    // not brighter because control surfaces are tuned toward white for contrast.
    // The opacity slider still controls this material; no extra theme mode.
    const accountSurface = deep
      ? rgba(base.map(c=>Math.round(c*.55)),opacity*.82)
      : `color-mix(in srgb,var(--control-surface) 38%,transparent)`;
    root.style.setProperty('--ww10-start-account-surface',accountSurface);
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
    
    
    WWCompat.emit('webwindows:glass-changed', {glass:state.glass,opacity:state.opacity,accent:state.accent});
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
    root.dataset.wwAppLabels=state.appLabels;
    WWCompat.emit('webwindows:taskbar-layout-changed', {position:state.position,layout:state.layout,align:state.align});
    const appLabelSummary=$('ww10-taskbar-app-label-summary');
    if(appLabelSummary)appLabelSummary.textContent=`Current: ${state.appLabels==='name'?'Icon & app name':'Icon only'}`;
    dialog.querySelectorAll('[data-ww-app-label-choice]').forEach(button=>{
      const chosen=button.dataset.wwAppLabelChoice===state.appLabels;
      button.setAttribute('aria-checked',String(chosen));button.tabIndex=chosen?0:-1;
    });
    $('ww-taskbar-align').value=state.align;
    dialog.querySelectorAll('[data-ww-layout-choice]').forEach(button => {
      const checked = button.dataset.wwLayoutChoice===state.layout;
      button.setAttribute('aria-checked',String(checked));
      button.tabIndex=checked?0:-1;
    });
    $('ww-search-mode').value=state.searchMode;
    const searchDescriptions={box:'Icon & search bar',icon:'Icon only',hover:'Expand on hover'};
    $('ww10-taskbar-search-summary').textContent=`Current: ${searchDescriptions[state.searchMode] || 'Search bar'}`;
    const positionDescriptions={bottom:'Bottom',top:'Top',left:'Left',right:'Right'};
    $('ww10-taskbar-location-summary').textContent=`Current: ${positionDescriptions[state.position] || 'Bottom'}`;
    $('ww10-taskbar-style-summary').textContent=`Current: ${state.layout === 'floating' ? 'Floating' : 'Attached'}`;
    dialog.querySelectorAll('[data-ww-position]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.wwPosition===state.position)));
    dialog.querySelectorAll('[data-ww-search-choice]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.wwSearchChoice===state.searchMode)));
    syncChoices();
  }
  let taskbarMotionTimeout;
  function animateTaskbarMove() {
    root.classList.remove('ww9-taskbar-transition');
    clearTimeout(taskbarMotionTimeout);
    if (WWCompat.media('(prefers-reduced-motion: reduce)').matches) return;
    void document.getElementById('taskbar').offsetHeight;
    root.classList.add('ww9-taskbar-transition');
    taskbarMotionTimeout=setTimeout(()=>root.classList.remove('ww9-taskbar-transition'),410);
  }
  for(const [buttonId,panelId] of [
    ['ww10-taskbar-search-toggle','ww10-taskbar-search-options'],
    ['ww10-taskbar-location-toggle','ww10-taskbar-location-options'],
    ['ww10-taskbar-style-toggle','ww10-taskbar-style-options'],
    ['ww10-taskbar-app-label-toggle','ww10-taskbar-app-label-options']
  ]) {
    const trigger=$(buttonId),panel=$(panelId);
    trigger.addEventListener('click',()=>{
      const expand=trigger.getAttribute('aria-expanded')!=='true';
      trigger.setAttribute('aria-expanded',String(expand));
      panel.hidden=!expand;
    });
  }
  // Taskbar item labels share the same persisted state as the context-menu radio actions.
  const appLabelChoices=$('ww10-taskbar-app-label-options');
  appLabelChoices.addEventListener('click',event=>{
    const button=event.target.closest('[data-ww-app-label-choice]');
    if(!button)return;
    state.appLabels=button.dataset.wwAppLabelChoice;
    persist();applyTaskbar();
  });
  appLabelChoices.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    const buttons=[...appLabelChoices.querySelectorAll('[data-ww-app-label-choice]')];
    const index=buttons.indexOf(document.activeElement);if(index<0)return;
    event.preventDefault();
    const next=buttons[(index+(event.key==='ArrowRight'||event.key==='ArrowDown'?1:buttons.length-1))%buttons.length];
    next.focus();next.click();
  });
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
    WWCompat.emit('webwindows:automatic-update-check', {message:text,available});
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
      WWCompat.emit('webwindows:update-page-detected', {url:new URL('Update/index.html',document.baseURI).href});
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
      'Channel: beta',
      'OS build: 2610130',
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
      const latest=updates.filter(u=>Number(u.Build)>2610130).sort((a,b)=>Number(b.Build)-Number(a.Build))[0];
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
    const gamut=WWCompat.media('(color-gamut: p3)');
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
        // Wallpaper highlights determine only the reflection position.
        // Its tint hue comes from the selected glass color, not the wallpaper.
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
      // Keep wallpaper highlight position but never let wallpaper RGB
      // override the selected glass tint. Refreshes on glass-color changes.
      const [r,g,b]=rgb(state.glass || nativeGlassColor());
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
    const container=$('ww-wallpaper-recents');WWCompat.replaceChildren(container);
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
      if(settings.appLabels && allowed.appLabels.includes(settings.appLabels))state.appLabels=settings.appLabels;
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
    WWCompat.frame(() => WWCompat.openSettings('colors'));
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
    flyout.hidden=true;WWCompat.replaceChildren(flyout);
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
    WWCompat.replaceChildren(flyout);
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
    else if(e.key==='End')next=options[options.length-1];
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
  document.documentElement.dataset.wwSettingsReady = '1';
});

/* 9H09 Quick Settings controls on the 10H10 web desktop. */
WWCompat.boot('Quick Settings', () => {
  'use strict';
  const byId=id=>document.getElementById(id);
  const panel=byId('ww-quick'), brightness=byId('ww9-brightness'), nightRange=byId('ww9-night-intensity');
  if(!panel || !brightness || !nightRange)return;
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
  byId('ww9-quick-settings').addEventListener('click',()=>{close();WWCompat.openSettings('personalization');});
  update();
});


/* Feedback hub: native taskbar app, browser-local feedback list, and window lifecycle. */
WWCompat.boot('Feedback hub', () => {
  'use strict';
  const $ = id => document.getElementById(id);
  const windowEl = $('feedback-window');
  const taskbarButton = $('feedback-button');
  const titlebar = $('feedback-titlebar');
  const form = $('feedback-form');
  if (!windowEl || !taskbarButton || !titlebar || !form ||
      !$('feedback-status') || !$('feedback-list') || !$('feedback-empty') || !$('feedback-count') ||
      !$('feedback-close') || !$('feedback-minimize') || !$('feedback-title') ||
      !$('feedback-type') || !$('feedback-details')) {
    console.warn('[WebWindows] Feedback hub markup is incomplete; the app was skipped.');
    return;
  }
  const key = 'webwindows.10h10.feedback-hub.v1';
  const status = $('feedback-status');
  const list = $('feedback-list');
  const empty = $('feedback-empty');
  const count = $('feedback-count');
  const reducedMotion = WWCompat.media('(prefers-reduced-motion: reduce)');
  // Match the Settings custom selector exactly: native <select> remains the
  // form source of truth, while a detached WinUI flyout avoids scroll clipping.
  const feedbackType = $('feedback-type');
  const typeTrigger = $('feedback-type-trigger');
  const typeFlyout = $('feedback-choice-flyout');
  const typeValue = $('feedback-type-value');
  let typeMenuOpen = false;
  function syncTypeChoice() {
    const selected = feedbackType.selectedOptions[0];
    if (selected) typeValue.textContent = selected.textContent;
  }
  function closeTypeChoice(restoreFocus = false) {
    if (!typeMenuOpen) return;
    typeMenuOpen = false;
    typeTrigger.setAttribute('aria-expanded', 'false');
    typeFlyout.hidden = true;
    WWCompat.replaceChildren(typeFlyout);
    if (restoreFocus && !windowEl.hidden) typeTrigger.focus({preventScroll:true});
  }
  function positionTypeChoice() {
    if (!typeMenuOpen || typeFlyout.hidden) return;
    const rect = typeTrigger.getBoundingClientRect();
    const pad = 8;
    typeFlyout.style.width = `${Math.max(170, Math.round(rect.width))}px`;
    typeFlyout.style.maxWidth = `calc(100vw - ${pad * 2}px)`;
    const belowRoom = innerHeight - rect.bottom - pad;
    const aboveRoom = rect.top - pad;
    const below = belowRoom >= Math.min(210, typeFlyout.scrollHeight) || belowRoom >= aboveRoom;
    typeFlyout.style.maxHeight = `${Math.min(425, Math.max(65, below ? belowRoom : aboveRoom))}px`;
    typeFlyout.style.left = `${Math.max(pad, Math.min(rect.left, innerWidth - typeFlyout.offsetWidth - pad))}px`;
    typeFlyout.style.top = below
      ? `${Math.min(innerHeight - pad - typeFlyout.offsetHeight, rect.bottom + 3)}px`
      : `${Math.max(pad, rect.top - typeFlyout.offsetHeight - 3)}px`;
  }
  function openTypeChoice(focusOption = false) {
    if (typeMenuOpen) {closeTypeChoice();return;}
    if (feedbackType.disabled || windowEl.hidden) return;
    WWCompat.replaceChildren(typeFlyout);
    [...feedbackType.options].forEach((option, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'ww-choice-option';
      item.id = `feedback-choice-option-${index}`;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(option.selected));
      const mark = document.createElement('span');
      mark.className = 'ww-choice-option-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = '✓';
      const copy = document.createElement('span');
      copy.className = 'ww-choice-option-copy';
      const heading = document.createElement('span');
      heading.className = 'ww-choice-option-label';
      heading.textContent = option.textContent;
      const detail = document.createElement('span');
      detail.className = 'ww-choice-option-detail';
      detail.textContent = 'Feedback category';
      copy.append(heading, detail);
      item.append(mark, copy);
      item.addEventListener('click', () => {
        feedbackType.value = option.value;
        feedbackType.dispatchEvent(new Event('change', {bubbles:true}));
        closeTypeChoice(true);
      });
      typeFlyout.append(item);
    });
    typeMenuOpen = true;
    typeTrigger.setAttribute('aria-expanded', 'true');
    typeFlyout.hidden = false;
    positionTypeChoice();
    if (focusOption) (typeFlyout.querySelector('[aria-selected="true"]') || typeFlyout.firstElementChild)?.focus({preventScroll:true});
  }
  typeTrigger.addEventListener('click', () => openTypeChoice());
  typeTrigger.addEventListener('keydown', event => {
    if (['ArrowDown','ArrowUp',' ','Enter'].includes(event.key)) {
      event.preventDefault();openTypeChoice(true);
    } else if (event.key === 'Escape' && typeMenuOpen) {
      event.preventDefault();event.stopPropagation();closeTypeChoice(true);
    }
  });
  typeFlyout.addEventListener('keydown', event => {
    const options = [...typeFlyout.querySelectorAll('.ww-choice-option')];
    const current = options.indexOf(document.activeElement);
    let next;
    if (event.key === 'Escape') {
      event.preventDefault();event.stopPropagation();closeTypeChoice(true);return;
    }
    if (event.key === 'Tab') {closeTypeChoice();return;}
    if (event.key === 'ArrowDown') next = options[(current + 1) % options.length];
    else if (event.key === 'ArrowUp') next = options[(current + options.length - 1) % options.length];
    else if (event.key === 'Home') next = options[0];
    else if (event.key === 'End') next = options[options.length - 1];
    if (next) {
      event.preventDefault();next.focus({preventScroll:true});next.scrollIntoView({block:'nearest'});
    }
  });
  feedbackType.addEventListener('change', syncTypeChoice);
  form.addEventListener('reset', () => WWCompat.frame(syncTypeChoice));
  windowEl.querySelector('.ww-feedback-scroll').addEventListener('scroll', positionTypeChoice, {passive:true});
  window.addEventListener('resize', () => closeTypeChoice());
  document.addEventListener('pointerdown', event => {
    if (typeMenuOpen && !typeFlyout.contains(event.target) && !typeTrigger.contains(event.target)) closeTypeChoice();
  });
  syncTypeChoice();
  windowEl.classList.add('ww-feedback-choice-ready');

  // Hub navigation: home shows the two cards, selecting a card opens the
  // original local feedback form, and saved entries have their own page.
  const pages = {
    home:$('feedback-home-view'), form:$('feedback-form-view'), saved:$('feedback-saved-view')
  };
  const homeNav = $('feedback-nav-home');
  const savedNav = $('feedback-nav-saved');
  const feedbackScroller = $('feedback-content-scroll');
  const labels = {
    Suggestion:'Make a suggestion', Problem:'Report a problem'
  };
  // Navigation behaves like the responsive Settings sidebar: at compact app
  // widths it starts as icons and the menu button reveals a temporary drawer.
  const navToggle = $('feedback-nav-toggle');
  const navSidebar = $('feedback-sidebar');
  let manualNavCollapsed = false;
  let compactNav = false;
  let compactNavOpen = false;
  let compactNavClosing = false;
  let navExitTimer = 0;
  function cancelCompactNavExit() {
    window.clearTimeout(navExitTimer);
    navExitTimer = 0;
    compactNavClosing = false;
  }
  function syncFeedbackNav() {
    const width = windowEl.getBoundingClientRect().width;
    if (!width) return; // Hidden window; ResizeObserver updates on opening.
    const nowCompact = width <= 640;
    if (nowCompact !== compactNav) {
      compactNavOpen = false;
      cancelCompactNavExit();
    }
    compactNav = nowCompact;
    const collapsed = compactNav || manualNavCollapsed;
    windowEl.classList.toggle('ww-feedback-nav-compact', compactNav);
    windowEl.classList.toggle('ww-feedback-nav-collapsed', collapsed);
    // Keep the overlay in place until its exit keyframes finish.
    windowEl.classList.toggle('ww-feedback-nav-expanded', compactNav && (compactNavOpen || compactNavClosing));
    windowEl.classList.toggle('ww-feedback-nav-drawer-closing', compactNav && compactNavClosing);
    const expanded = compactNav ? compactNavOpen : !manualNavCollapsed;
    navToggle.setAttribute('aria-expanded', String(expanded));
    navToggle.setAttribute('aria-label', expanded ? 'Collapse Feedback Hub navigation' : 'Expand Feedback Hub navigation');
    navToggle.title = expanded ? 'Collapse navigation' : 'Expand navigation';
  }
  const navObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(syncFeedbackNav) : null;
  navObserver?.observe(windowEl);
  window.addEventListener('resize', syncFeedbackNav, {passive:true});
  window.addEventListener('pagehide', () => {
    navObserver?.disconnect();
    window.clearTimeout(navExitTimer);
  }, {once:true});
  function closeCompactNav() {
    if (!compactNav || !compactNavOpen) return;
    compactNavOpen = false;
    compactNavClosing = true;
    syncFeedbackNav();
    const finish = () => {
      if (!compactNavClosing) return;
      cancelCompactNavExit();
      syncFeedbackNav();
    };
    if (WWCompat.media('(prefers-reduced-motion: reduce)').matches) finish();
    else {
      // An animationend handler avoids holding the drawer longer than needed;
      // the timeout covers browsers that do not dispatch that event.
      navSidebar.addEventListener('animationend', event => {
        if (event.target === navSidebar && event.animationName === 'wwFeedbackNavDrawerOut') finish();
      }, {once:true});
      navExitTimer = window.setTimeout(finish, 320);
    }
  }
  let activePage = 'home';
  const feedbackIndicator = WWCompat.createSidebarIndicator({
    root:windowEl,rail:windowEl.querySelector('.ww-feedback-sidebar-primary'),
    indicator:$('ww10-feedback-active-indicator'),
    getActive:()=>windowEl.querySelector('.ww-feedback-sidebar-primary .ww-feedback-nav-link[aria-current="page"]'),
    scrollParents:[navSidebar]
  });
  function showFeedbackPage(page, focus = true) {
    if (!pages[page]) return;
    closeTypeChoice();
    closeCompactNav();
    const changed = (activePage === 'form' ? 'home' : activePage) !== (page === 'form' ? 'home' : page);
    activePage = page;
    Object.entries(pages).forEach(([name, section]) => { section.hidden = name !== page; });
    homeNav.toggleAttribute('aria-current', page === 'home' || page === 'form');
    if (homeNav.hasAttribute('aria-current')) homeNav.setAttribute('aria-current','page');
    savedNav.toggleAttribute('aria-current', page === 'saved');
    if (savedNav.hasAttribute('aria-current')) savedNav.setAttribute('aria-current','page');
    feedbackIndicator.schedule(changed);
    feedbackScroller.scrollTop = 0;
    if (focus && !windowEl.hidden) {
      const target = page === 'form' ? $('feedback-title') :
        page === 'saved' ? $('feedback-saved-title') : $('feedback-home-title');
      if (target && !target.hasAttribute('tabindex')) target.setAttribute('tabindex','-1');
      target?.focus({preventScroll:true});
    }
  }
  homeNav.addEventListener('click', () => showFeedbackPage('home'));
  savedNav.addEventListener('click', () => showFeedbackPage('saved'));
  $('feedback-form-back').addEventListener('click', () => showFeedbackPage('home'));
  $('feedback-saved-new').addEventListener('click', () => showFeedbackPage('home'));
  $('feedback-nav-settings').addEventListener('click', () => {
    closeCompactNav();
    WWCompat.openSettings();
  });
  navToggle.addEventListener('click', () => {
    if (compactNav) {
      if (compactNavOpen) closeCompactNav();
      else {
        cancelCompactNavExit();
        compactNavOpen = true;
        syncFeedbackNav();
      }
    } else {
      manualNavCollapsed = !manualNavCollapsed;
      syncFeedbackNav();
    }
    closeTypeChoice();
  });
  document.addEventListener('pointerdown', event => {
    if (compactNavOpen && !navSidebar.contains(event.target) && !navToggle.contains(event.target)) closeCompactNav();
  });
  syncFeedbackNav();
  feedbackType.addEventListener('change', () => {
    $('feedback-form-heading').textContent = labels[feedbackType.value] || 'Give feedback';
  });
  showFeedbackPage('home', false);

  let feedback = [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) feedback = saved.filter(entry =>
      entry && typeof entry.id === 'string' && typeof entry.title === 'string' &&
      typeof entry.details === 'string' && ['Suggestion','Problem','Compliment'].includes(entry.type)
    ).slice(0, 100);
  } catch { /* Browsers can deny storage; entries still work until reload. */ }
  const persist = () => {
    try { localStorage.setItem(key, JSON.stringify(feedback)); return true; }
    catch { return false; }
  };
  function render() {
    WWCompat.replaceChildren(list);
    count.textContent = `${feedback.length} ${feedback.length === 1 ? 'entry' : 'entries'}`;
    empty.hidden = feedback.length !== 0;
    list.hidden = feedback.length === 0;
    for (const entry of feedback) {
      const li = document.createElement('li');
      li.className = 'ww-feedback-item';
      const top = document.createElement('div');
      top.className = 'ww-feedback-item-top';
      const kind = document.createElement('span');
      kind.className = 'ww-feedback-item-kind';
      kind.textContent = entry.type;
      const time = document.createElement('time');
      time.className = 'ww-feedback-item-date';
      const date = new Date(entry.timestamp);
      if (!Number.isNaN(date.getTime())) {
        time.dateTime = date.toISOString();
        time.textContent = date.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
      }
      top.append(kind, time);
      const title = document.createElement('h3');
      title.className = 'ww-feedback-item-title';
      title.textContent = entry.title;
      const detail = document.createElement('p');
      detail.className = 'ww-feedback-item-description';
      detail.textContent = entry.details;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'ww-feedback-delete';
      remove.textContent = 'Delete feedback';
      remove.setAttribute('aria-label', `Delete feedback: ${entry.title}`);
      remove.addEventListener('click', () => {
        feedback = feedback.filter(item => item.id !== entry.id);
        const stored = persist();
        render();
        status.textContent = stored ? 'Feedback deleted from this browser.' : 'Deleted for this session. Browser storage is unavailable.';
        $('feedback-saved-status').textContent = status.textContent;
      });
      li.append(top, title, detail, remove);
      list.append(li);
    }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
    const type = $('feedback-type').value;
    const title = $('feedback-title').value.trim();
    const details = $('feedback-details').value.trim();
    if (!['Suggestion','Problem'].includes(type) || title.length < 3 || details.length < 10) {
      status.textContent = 'Enter a title of at least 3 characters and details of at least 10 characters.';
      return;
    }
    feedback.unshift({ id:`${Date.now()}-${Math.random().toString(36).slice(2)}`, type,
      title:title.slice(0,100), details:details.slice(0,2000), timestamp:new Date().toISOString() });
    feedback = feedback.slice(0, 100);
    const stored = persist();
    if (typeof form.reset === 'function') form.reset();
    render();
    status.textContent = stored ? 'Saved in this browser. Your feedback has not been sent to a server.' :
      'Saved for this session only. Your browser did not allow local storage.';
    $('feedback-saved-status').textContent = status.textContent;
    showFeedbackPage('saved');
  });
  render();

  let closeTimer = null;
  let closeListener = null;
  function cancelClose() {
    if (closeTimer != null) clearTimeout(closeTimer);
    closeTimer = null;
    if (closeListener) windowEl.removeEventListener('animationend', closeListener);
    closeListener = null;
    windowEl.classList.remove('is-closing');
  }
  function open() {
    closeTypeChoice();
    const restoring = windowEl.dataset.wwMinimized === 'true';
    cancelClose();
    if (restoring) {
      delete windowEl.dataset.wwMinimized;
      WWCompat.emit('webwindows:app-restored', {taskbarId:'feedback-button'});
    } else if (windowEl.hidden) {
      windowEl.style.left='50%';
      windowEl.style.top='calc((100dvh - var(--taskbar-height)) / 2)';
      windowEl.style.transform='translate(-50%,-50%)';
    }
    windowEl.hidden = false;
    taskbarButton.classList.add('is-open');
    feedbackIndicator.schedule(false);
    homeNav.focus({preventScroll:true});
  }
  function close() {
    closeTypeChoice();
    if (windowEl.dataset.wwMinimized === 'true') {
      delete windowEl.dataset.wwMinimized;
      windowEl.hidden = true;
      taskbarButton.classList.remove('is-open');
      WWCompat.emit('webwindows:app-closed', {taskbarId:'feedback-button'});
      return;
    }
    if (windowEl.hidden || windowEl.classList.contains('is-closing')) return;
    windowEl.classList.add('is-closing');
    const finish = () => {
      if (!windowEl.classList.contains('is-closing')) return;
      cancelClose();
      windowEl.hidden = true;
      taskbarButton.classList.remove('is-open');
      taskbarButton.focus({preventScroll:true});
      WWCompat.emit('webwindows:app-closed', {taskbarId:'feedback-button'});
    };
    if (reducedMotion.matches) {finish();return;}
    closeListener = e => {if (e.target === windowEl) finish();};
    windowEl.addEventListener('animationend', closeListener);
    closeTimer = setTimeout(finish, 280);
  }
  function minimize() {
    if (windowEl.hidden || windowEl.classList.contains('is-closing')) return;
    closeTypeChoice();
    const rect = windowEl.getBoundingClientRect();
    windowEl.dataset.wwPreviewWidth = String(Math.max(200, Math.round(rect.width)));
    windowEl.dataset.wwPreviewHeight = String(Math.max(150, Math.round(rect.height)));
    windowEl.dataset.wwMinimized = 'true';
    windowEl.hidden = true;
    WWCompat.emit('webwindows:app-minimized', {taskbarId:'feedback-button'});
    taskbarButton.focus({preventScroll:true});
  }
  window.addEventListener('webwindows:feedback-requested',open);
  window.addEventListener('webwindows:app-preview-close-requested',e=>{
    if (e.detail?.taskbarId === 'feedback-button') close();
  });
  $('feedback-close').addEventListener('click',close);
  $('feedback-minimize').addEventListener('click',minimize);
  document.addEventListener('keydown',e=>{
    if (e.key === 'Escape' && !windowEl.hidden && windowEl.contains(document.activeElement)) {
      e.preventDefault();
      if (typeMenuOpen) closeTypeChoice(true);
      else close();
    }
  });
  let drag = null;
  titlebar.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('button') || windowEl.classList.contains('ww10-maximized')) return;
    const r = windowEl.getBoundingClientRect();
    windowEl.style.left = `${r.left}px`;
    windowEl.style.top = `${r.top}px`;
    windowEl.style.transform = 'none';
    drag = {id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top};
    if (typeof titlebar.setPointerCapture === 'function') titlebar.setPointerCapture(e.pointerId);
  });
  titlebar.addEventListener('pointermove',e=>{
    if (!drag || drag.id !== e.pointerId) return;
    windowEl.style.left = `${Math.max(0,Math.min(innerWidth-windowEl.offsetWidth,drag.left+e.clientX-drag.x))}px`;
    windowEl.style.top = `${Math.max(0,Math.min(innerHeight-windowEl.offsetHeight,drag.top+e.clientY-drag.y))}px`;
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture'])
    titlebar.addEventListener(type,()=>{drag=null;});
  document.documentElement.dataset.wwFeedbackReady = '1';
});

/* 9H09 taskbar preview: true miniature, shown only for minimized app windows. */
WWCompat.boot('Taskbar previews', () => {
  'use strict';
  const byId=id=>document.getElementById(id);
  const panel=byId('ww10-app-preview'); if(!panel)return;
  const items={
    'settings-button':{name:'Settings',window:'settings-window',icon:'s5NUIabJrb4C',event:'settings-requested'},
    'information-button':{name:'About Windows',window:'information-window',icon:'VQOfeAx5KWTK',event:'information-requested'},
    'defender-button':{name:'Windows Security',window:'ww-security',icon:'oo5voXhXsnEk',event:'defender-requested'},
    'feedback-button':{name:'Feedback hub',window:'feedback-window',icon:'XFOumBmRR5zT',event:'feedback-requested'}
  };
  let active=null,showTimer,hideTimer;
  const reduced=WWCompat.media('(prefers-reduced-motion: reduce)');
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
    clone.style.cssText+=';position:absolute!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;transform:none!important;translate:none!important;scale:1!important;opacity:1!important;animation:none!important;max-width:none!important;max-height:none!important;width:'+width+'px!important;height:'+height+'px!important;display:'+(['settings-window','feedback-window','ww-security'].includes(config.window)?'flex':'block')+'!important;';
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
    WWCompat.replaceChildren(thumb, frame);
    panel.hidden=false;
    if(!reduced.matches){panel.style.animation='none';void panel.offsetWidth;panel.style.animation='';}
    place(button);
  }
  for(const id of Object.keys(items)){
    const button=byId(id);
    if (!button) continue; // A removed app shortcut does not break every preview.
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
    WWCompat.emit('webwindows:'+config.event, {});
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
    WWCompat.emit('webwindows:app-preview-close-requested', {taskbarId});
  });
  document.addEventListener('pointerdown',e=>{if(!panel.contains(e.target)&&!e.target.closest('#taskbar'))hide();});
  window.addEventListener('resize',hide);
  for(const type of ['app-minimized','app-restored','app-closed']){
    window.addEventListener('webwindows:'+type,e=>{
      if(type!=='app-minimized'&&active===e.detail?.taskbarId)hide();
    });
  }
  window.addEventListener('webwindows:settings-requested',()=>{if(active)hide();});
});


/* 10H10 window expansion: maximize/restore and drag-to-resize for the two
   windowed system applications. Existing taskbar/minimize flows are unchanged. */
WWCompat.boot('Window sizing', () => {
  'use strict';
  const definitions = [
    {window:'settings-window', button:'ww-settings-maximize', bar:'ww-settings-titlebar', label:'settings', minW:390, minH:320},
    {window:'information-window', button:'about-maximize', bar:'about-titlebar', label:'About Windows', minW:335, minH:325},
    {window:'feedback-window', button:'feedback-maximize', bar:'feedback-titlebar', label:'Feedback hub', minW:320, minH:300},
    {window:'ww-security', button:'wwdef-maximize', bar:'wwdef-titlebar', label:'Windows Security', minW:320, minH:330}
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
        oldStyle={}; for (const key of fields) oldStyle[key]=win.style[key];
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
      if (typeof grip.setPointerCapture === 'function') grip.setPointerCapture(event.pointerId);
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
    button.dataset.wwSizingReady = '1';
  }
});


/* 10H10 Settings responsive navigation. This observes actual app dimensions,
   including maximize and drag-to-resize, not only browser resize events. */
WWCompat.boot('Responsive Settings navigation', () => {
  'use strict';
  const win=document.getElementById('settings-window');
  const button=document.getElementById('ww10-settings-navigation-toggle');
  const nav=document.getElementById('ww10-settings-navigation');
  const scrim=document.getElementById('ww10-settings-nav-scrim');
  const content=document.getElementById('ww-settings-scroll');
  if(!win||!button||!nav||!scrim||!content)return;
  let narrow=false, manualCollapsed=false, narrowExpanded=false, lastWidth=0;
  function updateState() {
    const expanded=narrow?narrowExpanded:!manualCollapsed;
    const iconsOnly=!expanded;
    win.classList.toggle('ww10-settings-nav-icon-only',iconsOnly);
    win.classList.toggle('ww10-settings-nav-open',narrow&&narrowExpanded);
    button.setAttribute('aria-expanded',String(expanded));
    button.setAttribute('aria-label',expanded?'Collapse Settings navigation':'Expand Settings navigation');
    button.title=expanded?'Collapse navigation':'Expand navigation';
    // Icon-only navigation remains operable, unlike the former hidden drawer.
    nav.inert=false;
    nav.removeAttribute('aria-hidden');
    scrim.setAttribute('aria-hidden','true');
    nav.querySelectorAll('.ww-settings-nav button').forEach(item=>{
      item.title=iconsOnly?(item.textContent||'').trim():'';
    });
    window.dispatchEvent(new Event('resize'));
  }
  function updateLayout() {
    const rect=win.getBoundingClientRect();
    if(!rect.width)return;
    const width=Math.round(rect.width),height=Math.round(rect.height);
    const nextNarrow=width<=720;
    win.classList.toggle('ww10-settings-short',height<510);
    win.classList.toggle('ww10-settings-compact',nextNarrow);
    if(nextNarrow!==narrow){narrow=nextNarrow;narrowExpanded=false;updateState();}
    if(width!==lastWidth){lastWidth=width;win.dispatchEvent(new Event('ww10-settings-layout-change'));}
  }
  button.addEventListener('click',()=>{
    if(narrow)narrowExpanded=!narrowExpanded;
    else manualCollapsed=!manualCollapsed;
    updateState();
  });
  scrim.addEventListener('click',()=>{if(narrowExpanded){narrowExpanded=false;updateState();button.focus({preventScroll:true});}});
  nav.addEventListener('click',event=>{
    if(narrow&&narrowExpanded&&event.target.closest('[data-ww-page]')){narrowExpanded=false;updateState();}
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&win.classList.contains('ww10-settings-nav-open')){
      event.preventDefault();narrowExpanded=false;updateState();button.focus({preventScroll:true});
    }
  });
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(updateLayout):null;
  observer?.observe(win);
  window.addEventListener('resize',updateLayout,{passive:true});
  updateLayout();
  window.addEventListener('pagehide',()=>observer?.disconnect(),{once:true});
});


/* Shared application-icon fallback and running indicator state machine.
   App identities use their own icons first; only missing/failed images fall back
   to the user-selected Icons8 application glyph. Windows can opt in by putting
   data-ww-app-window on a taskbar app button. */
WWCompat.boot('App icons and taskbar indicator motion', () => {
  'use strict';
  const fallback='https://img.icons8.com/?size=100&id=tWYgsDQo4Sq4&format=png&color=000000';
  const reduced=WWCompat.media('(prefers-reduced-motion: reduce)');
  const iconSelector=[
    '#taskbar .app-button > img',
    '#feedback-window .ww-feedback-window-title > img',
    '#settings-window .ww-title-icon > img',
    '#ww10-preview-icon',
    '.search-app-icon',
    'img[data-ww-app-icon]'
  ].join(',');
  const observedIcons=new WeakSet();
  const resolve=url=>(typeof url==='string'&&url.trim())?url.trim():fallback;
  function updateTaskbarIcon(img) {
    const button=img.closest('#taskbar .app-button');
    if(button)button.classList.toggle('image-loaded',img.complete&&img.naturalWidth>0);
  }
  function fallbackIcon(img) {
    if(img.getAttribute('src')===fallback) {
      // Even if the external default becomes unreachable, never loop forever.
      img.hidden=true;
      updateTaskbarIcon(img);
      return;
    }
    img.dataset.wwDefaultIcon='1';
    img.hidden=false;
    img.src=fallback;
    updateTaskbarIcon(img);
  }
  function attachIcon(img) {
    if(!(img instanceof HTMLImageElement)||observedIcons.has(img))return;
    observedIcons.add(img);
    img.addEventListener('error',()=>fallbackIcon(img));
    img.addEventListener('load',()=>{img.hidden=false;updateTaskbarIcon(img);});
    // A missing src is not an error event and must be handled explicitly.
    if(!img.getAttribute('src')?.trim()) fallbackIcon(img);
    else if(img.complete&&img.naturalWidth===0)fallbackIcon(img);
    else updateTaskbarIcon(img);
  }
  function addMissingTaskbarImage(button) {
    // Future pinned apps inherit the icon/name preference without special markup.
    if(!button.querySelector(':scope > .ww-taskbar-app-label')) {
      const label=document.createElement('span');
      label.className='ww-taskbar-app-label';
      label.setAttribute('aria-hidden','true');
      label.textContent=button.dataset.wwAppLabel || button.getAttribute('aria-label') || button.title || 'App';
      button.append(label);
    }
    if(button.querySelector(':scope > img'))return;
    const img=document.createElement('img');
    img.alt='';img.draggable=false;
    button.prepend(img);
    if(!button.querySelector('.app-fallback')) {
      const fallbackText=document.createElement('span');fallbackText.className='app-fallback';
      fallbackText.setAttribute('aria-hidden','true');
      const glyph=document.createElement('i');glyph.className='ph ph-app-window';
      fallbackText.append(glyph);button.append(fallbackText);
    }
    attachIcon(img);
  }
  function scan(node) {
    if(!(node instanceof Element))return;
    if(node.matches('#taskbar .app-button'))addMissingTaskbarImage(node);
    if(node.matches(iconSelector))attachIcon(node);
    node.querySelectorAll('#taskbar .app-button').forEach(addMissingTaskbarImage);
    node.querySelectorAll(iconSelector).forEach(attachIcon);
  }
  scan(document.body);
  document.addEventListener('error',event=>{
    const img=event.target;
    if(img instanceof HTMLImageElement&&img.matches(iconSelector))fallbackIcon(img);
  },true);
  // Public utility for subsequently installed applications. No need to copy
  // the URL into each app: WebWindowsAppIcons.resolve(customIconUrl).
  window.WebWindowsAppIcons=Object.freeze({fallback,resolve,attach:attachIcon});

  const indicators=new Map();
  const timers=new WeakMap();
  function register(button) {
    if(indicators.has(button))return;
    const windowId=button.dataset.wwAppWindow;
    if(!windowId)return;
    const win=document.getElementById(windowId);
    if(!win)return;
    indicators.set(button,win);
    const initial=(win.dataset.wwMinimized==='true')?'minimized':
      (!win.hidden)?'running':'closed';
    button.dataset.wwAppState=initial;
    const observer=new MutationObserver(()=>syncIndicator(button));
    observer.observe(button,{attributes:true,attributeFilter:['class']});
    observer.observe(win,{attributes:true,attributeFilter:['hidden','data-ww-minimized']});
  }
  function stateOf(button,win) {
    if(win.dataset.wwMinimized==='true')return 'minimized';
    return !win.hidden?'running':'closed';
  }
  function syncIndicator(button) {
    const win=indicators.get(button);
    if(!win)return;
    const next=stateOf(button,win);
    const previous=button.dataset.wwAppState||'closed';
    if(previous===next || (previous==='closing'&&next==='closed'))return;
    clearTimeout(timers.get(button));
    button.removeAttribute('data-ww-indicator-motion');
    if(next==='closed'&&previous!=='closed') {
      button.dataset.wwAppState='closing';
      if(!reduced.matches) {
        button.dataset.wwIndicatorMotion='close';
        const timer=setTimeout(()=>{
          if(button.dataset.wwAppState==='closing')button.dataset.wwAppState='closed';
          button.removeAttribute('data-ww-indicator-motion');
          timers.delete(button);
        },270);
        timers.set(button,timer);
      }else button.dataset.wwAppState='closed';
      return;
    }
    button.dataset.wwAppState=next;
    if(reduced.matches)return;
    const motion=next==='minimized'?'minimize':(previous==='minimized'?'restore':'open');
    button.dataset.wwIndicatorMotion=motion;
  }
  for(const button of document.querySelectorAll('#taskbar .app-button[data-ww-app-window]'))register(button);
  window.addEventListener('webwindows:app-minimized',e=>{
    const button=document.getElementById(e.detail?.taskbarId);
    if(button)syncIndicator(button);
  });
  for(const type of ['app-restored','app-closed']){
    window.addEventListener('webwindows:'+type,e=>{
      const button=document.getElementById(e.detail?.taskbarId);
      if(button)queueMicrotask(()=>syncIndicator(button));
    });
  }
  document.addEventListener('animationend',e=>{
    if(e.pseudoElement!=='::after')return;
    const button=e.target;
    if(!(button instanceof Element)||!button.matches('#taskbar .app-button[data-ww-app-state]'))return;
    if(button.dataset.wwIndicatorMotion==='close'&&button.dataset.wwAppState==='closing'){
      clearTimeout(timers.get(button));timers.delete(button);
      button.dataset.wwAppState='closed';
    }
    button.removeAttribute('data-ww-indicator-motion');
  },true);
  // Future apps can add their own button/window; only nodes inserted into
  // the DOM are scanned rather than recomputing the entire interface.
  const additions=new MutationObserver(records=>{
    for(const record of records)for(const node of record.addedNodes){
      if(!(node instanceof Element))continue;
      scan(node);
      if(node.matches('#taskbar .app-button[data-ww-app-window]'))register(node);
      node.querySelectorAll('#taskbar .app-button[data-ww-app-window]').forEach(register);
    }
  });
  additions.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('pagehide',()=>{
    additions.disconnect();
    for(const button of indicators.keys())clearTimeout(timers.get(button));
  },{once:true});
});

/* Windows Security — 9H09 Defender features adapted for WebWindows 10H10.
 * Browser-only checks. This is NOT a Windows antivirus or operating-system security service.
 */
WWCompat.boot('Windows Security (10H10)', () => {
  'use strict';
  const $ = id => document.getElementById(id);
  const win = $('ww-security');
  if (!win) return;
  const taskbar = $('defender-button');
  const STORE = 'webwindows.10h10.security.v1';
  const KEY_STORE = 'webwindows.10h10.security.key.v1';
  const defaults = {updater:{type:false,search:false,major:false},schedule:{enabled:false,start:480,end:1320},mode:'standard'};
  let state = structuredClone(defaults);
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if(saved && typeof saved==='object') {
      const flags=saved.updater || {};
      for(const feature of ['type','search','major']) state.updater[feature]=flags[feature] === true;
      // PIN modes are disabled in 10H10 Defender. Never restore legacy PIN preferences.
    }
  } catch(err){console.warn('[WebWindows] Security preferences unavailable.',err);}
  let keyRecord = null;
  function loadKey(){try {const saved=JSON.parse(localStorage.getItem(KEY_STORE)||'null');return saved?.salt && saved?.digest && saved?.iterations ? saved : null;}catch{return null;}}
  keyRecord=loadKey();
  const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(state));return true;}catch{return false;}};
  let page='home', drag=null, checkBusy=false, verifyAction=null;
  const motionPref=window.matchMedia('(prefers-reduced-motion: reduce)');
  let pageMotionTimer=null,setupMotionTimer=null;
  let automaticScanInterval=null;
  const isCryptoReady=()=>Boolean(globalThis.isSecureContext && globalThis.crypto?.subtle && globalThis.crypto?.getRandomValues);
  function toB64(bytes){let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary);}
  function fromB64(value){return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}
  async function fingerprint(password,salt,iterations=150000){
    const bytes=new TextEncoder().encode(password);
    const base=await crypto.subtle.importKey('raw',bytes,{name:'PBKDF2'},false,['deriveBits']);
    const result=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},base,256);
    return new Uint8Array(result);
  }
  async function createKey(password){
    if(!isCryptoReady())throw Error('Secure browser cryptography is unavailable. Open WebWindows from HTTPS or a trusted local context.');
    const salt=crypto.getRandomValues(new Uint8Array(16));
    const iterations=150000,digest=await fingerprint(password,salt,iterations);
    const record={algorithm:'PBKDF2-SHA256',salt:toB64(salt),digest:toB64(digest),iterations};
    localStorage.setItem(KEY_STORE,JSON.stringify(record));
    keyRecord=record;
  }
  async function checkKey(password){
    if(!keyRecord||!isCryptoReady())return false;
    const expected=fromB64(keyRecord.digest);
    const actual=await fingerprint(password,fromB64(keyRecord.salt),keyRecord.iterations);
    if(expected.length!==actual.length)return false;
    let diff=0;for(let i=0;i<actual.length;i++)diff|=actual[i]^expected[i];return diff===0;
  }
  function showStatus(id,text,kind='info'){const node=$(id);if(node){node.textContent=text;node.dataset.kind=kind;}}
  function writeSummary(){
    const active=Object.values(state.updater).filter(Boolean).length;
    $('wwdef-updater-summary').textContent=active ? `${active} update checks enabled` : 'Review update settings';
    $('wwdef-pin-summary').textContent='Not available';
  }
  // Same physical moving selection bar as Settings and Feedback Hub.
  const defenderIndicator = WWCompat.createSidebarIndicator({
    root:win, rail:win.querySelector('.wwdef-nav-main'),
    indicator:$('wwdef-active-indicator'),
    getActive:()=>win.querySelector(`[data-def-page="${page}"]`),
    scrollParents:[$('wwdef-sidebar')]
  });
  function placeIndicator(_page, animate=true) { defenderIndicator.schedule(animate); }
  function clearPageMotion(){
    if(pageMotionTimer!==null){clearTimeout(pageMotionTimer);pageMotionTimer=null;}
    for(const panel of win.querySelectorAll('[data-def-panel]')){
      panel.classList.remove('wwdef-leaving','wwdef-entering');
      panel.inert=false;
    }
  }
  function setPage(next){
    if(!['home','updater'].includes(next))return;
    const prev=page;
    clearPageMotion();
    const panels=[...win.querySelectorAll('[data-def-panel]')];
    const outgoing=panels.find(panel=>panel.dataset.defPanel===prev);
    const incoming=panels.find(panel=>panel.dataset.defPanel===next);
    const doSwipe=next!==prev&&!motionPref.matches&&!$('wwdef-layout').hidden;
    page=next;
    for(const panel of panels){
      if(panel!==incoming && (!doSwipe||panel!==outgoing)) panel.hidden=true;
    }
    if(incoming)incoming.hidden=false;
    if(doSwipe&&outgoing&&incoming){
      outgoing.hidden=false;outgoing.inert=true;
      outgoing.classList.add('wwdef-leaving');
      incoming.classList.remove('wwdef-entering');
      void incoming.offsetWidth; // re-trigger keyframes on repeated navigation
      incoming.classList.add('wwdef-entering');
      pageMotionTimer=setTimeout(()=>{
        outgoing.hidden=true;
        outgoing.classList.remove('wwdef-leaving');outgoing.inert=false;
        incoming.classList.remove('wwdef-entering');
        pageMotionTimer=null;
      },330);
    } else if(next!==prev&&incoming&&!motionPref.matches){
      incoming.classList.add('wwdef-entering');
      pageMotionTimer=setTimeout(()=>{incoming.classList.remove('wwdef-entering');pageMotionTimer=null;},330);
    }
    for(const button of win.querySelectorAll('[data-def-page]')){
      const active=button.dataset.defPage===next;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    }
    $('wwdef-content-scroll').scrollTop=0;
    if(next==='updater')refreshUpdater();
    // Initial open may complete layout after this tick. Wait for actual dimensions.
    requestAnimationFrame(()=>placeIndicator(next,next!==prev));
  }
  function refreshUpdater(){for(const toggle of win.querySelectorAll('[data-def-update]'))toggle.checked=Boolean(state.updater[toggle.dataset.defUpdate]);writeSummary();}
  function clearSetupMotion(){
    if(setupMotionTimer!==null){clearTimeout(setupMotionTimer);setupMotionTimer=null;}
    $('wwdef-setup').classList.remove('wwdef-setup-exiting');
    $('wwdef-layout').classList.remove('wwdef-layout-arriving');
  }
  function showMain(){
    const setup=$('wwdef-setup'),layout=$('wwdef-layout');
    const swiping=!setup.hidden&&!win.hidden&&!motionPref.matches;
    clearSetupMotion();layout.hidden=false;
    if(swiping){
      setup.classList.add('wwdef-setup-exiting');
      layout.classList.add('wwdef-layout-arriving');
      setupMotionTimer=setTimeout(()=>{setup.hidden=true;clearSetupMotion();},340);
    }else setup.hidden=true;
    setPage(page);writeSummary();

  }
  function showSetup(){
    clearSetupMotion();clearPageMotion();
    $('wwdef-setup').hidden=false;$('wwdef-layout').hidden=true;showStatus('wwdef-setup-status','');
    $('wwdef-new-key').value='';
    $('wwdef-new-key').focus({preventScroll:true});
  }
  function open(){
    const restoring=win.dataset.wwMinimized==='true';
    if(restoring){delete win.dataset.wwMinimized;WWCompat.emit('webwindows:app-restored',{taskbarId:'defender-button'});}
    if(!restoring){win.style.left='50%';win.style.top='calc((100dvh - var(--taskbar-height)) / 2)';win.style.transform='translate(-50%,-50%)';}
    win.hidden=false;taskbar?.classList.add('is-open');
    if(keyRecord)showMain();else showSetup();
    taskbar?.setAttribute('aria-expanded','true');
  }
  function close(minimize=false){
    if(win.hidden && !win.dataset.wwMinimized)return;
    clearPageMotion();clearSetupMotion();
    defenderIndicator.cancel();
    if(verifyAction)cancelVerify();
    if(minimize){
      const rect=win.getBoundingClientRect();
      win.dataset.wwPreviewWidth=String(Math.max(200,Math.round(rect.width)));
      win.dataset.wwPreviewHeight=String(Math.max(150,Math.round(rect.height)));
      win.dataset.wwMinimized='true';
      win.hidden=true; WWCompat.emit('webwindows:app-minimized',{taskbarId:'defender-button'});
    } else {
      delete win.dataset.wwMinimized;win.hidden=true;taskbar?.classList.remove('is-open');
      WWCompat.emit('webwindows:app-closed',{taskbarId:'defender-button'});
    }
    taskbar?.setAttribute('aria-expanded','false');
  }
  window.addEventListener('webwindows:defender-requested',()=>{
    if(!win.hidden && win.dataset.wwMinimized!=='true'){win.focus?.();return;}open();
  });
  $('wwdef-minimize').addEventListener('click',()=>close(true));
  $('wwdef-close').addEventListener('click',()=>close(false));
  $('wwdef-setup-cancel').addEventListener('click',()=>close(false));
  window.addEventListener('webwindows:app-preview-close-requested',e=>{if(e.detail?.taskbarId==='defender-button')close(false);});
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||win.hidden)return;
    if(!$('wwdef-verify').hidden){e.preventDefault();e.stopImmediatePropagation();cancelVerify();}
    else if(document.activeElement?.closest('#ww-security')){e.preventDefault();close(false);}
  },true);
  $('wwdef-setup-form').addEventListener('submit',async e=>{
    e.preventDefault();const first=$('wwdef-new-key').value;
    if(first.length<5){showStatus('wwdef-setup-status','Use at least 5 characters.','error');return;}
    const submit=e.currentTarget.querySelector('[type="submit"]');submit.disabled=true;
    try{await createKey(first);showMain();}
    catch(err){showStatus('wwdef-setup-status',err.message||'Unable to save Defender key.','error');}
    finally{submit.disabled=false;}
  });
  $('wwdef-sidebar-toggle').addEventListener('click',()=>{
    const collapsed=!win.classList.contains('wwdef-collapsed');win.classList.toggle('wwdef-collapsed',collapsed);
    $('wwdef-sidebar-toggle').setAttribute('aria-expanded',String(!collapsed));
    $('wwdef-sidebar-toggle').setAttribute('aria-label',collapsed?'Expand navigation':'Collapse navigation');
    $('wwdef-sidebar-toggle').title=collapsed?'Expand navigation':'Collapse navigation';
    requestAnimationFrame(()=>placeIndicator(page,false));
  });
  $('wwdef-sidebar').addEventListener('transitionend',e=>{if(e.target===$('wwdef-sidebar'))placeIndicator(page,false);});
  win.querySelectorAll('[data-def-page]:not(:disabled)').forEach(btn=>btn.addEventListener('click',()=>setPage(btn.dataset.defPage)));
  win.querySelectorAll('[data-def-open]').forEach(btn=>btn.addEventListener('click',()=>setPage(btn.dataset.defOpen)));
  function cancelVerify(){
    $('wwdef-verify').hidden=true;$('wwdef-verify-key').value='';showStatus('wwdef-verify-status','');
    if(verifyAction){verifyAction.resolve(false);verifyAction=null;}
  }
  function requireKey(description){
    if(!keyRecord)return Promise.resolve(false);
    if(verifyAction)cancelVerify();
    $('wwdef-verify-description').textContent=description;
    $('wwdef-verify').hidden=false;$('wwdef-verify-key').value='';showStatus('wwdef-verify-status','');
    $('wwdef-verify-key').focus({preventScroll:true});
    return new Promise(resolve=>verifyAction={resolve});
  }
  $('wwdef-verify-cancel').addEventListener('click',cancelVerify);
  $('wwdef-verify-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!verifyAction)return;
    const btn=e.currentTarget.querySelector('[type="submit"]');btn.disabled=true;
    try{
      if(!await checkKey($('wwdef-verify-key').value)){
        showStatus('wwdef-verify-status','Incorrect Defender key.','error');$('wwdef-verify-key').select();return;
      }
      const next=verifyAction;verifyAction=null;
      $('wwdef-verify').hidden=true;$('wwdef-verify-key').value='';next.resolve(true);
    }catch(err){showStatus('wwdef-verify-status',String(err?.message||err),'error');}
    finally{btn.disabled=false;}
  });
  win.querySelectorAll('[data-def-update]').forEach(toggle=>toggle.addEventListener('change',()=>{
    const feature=toggle.dataset.defUpdate;
    state.updater[feature]=toggle.checked;
    save();refreshUpdater();
    if(toggle.checked)void runCheck(false);
    if(feature==='search')syncAutomaticScan();
  }));
  // PIN controls and persistence have been intentionally disabled.
  async function readManifest(){
    const response=await fetch('App-Update/Update_type.json',{cache:'no-store'});
    if(!response.ok)throw Error(`Update manifest is unavailable (HTTP ${response.status}).`);
    const manifest=await response.json();
    if(!manifest||typeof manifest.Update_type!=='string'||!Array.isArray(manifest.Updates))throw Error('Update_type.json does not contain Update_type and Updates metadata.');
    return manifest;
  }
  function auditManifest(manifest){
    const results=[];
    for(const [index,record] of manifest.Updates.entries()){
      if(!record||typeof record!=='object')throw Error(`Update entry ${index+1} is not a valid object.`);
      if(typeof record.Update_name!=='string'||!record.Update_name.trim()||!String(record.Build||'').trim())throw Error(`Update entry ${index+1} has no valid name or build.`);
      const name=record.Update_name.trim(),build=String(record.Build).trim();
      if(state.updater.type)results.push(`${name} — Build ${build} (${String(record.Status||manifest.Update_type).trim()||'type unspecified'})`);
      if(state.updater.major){
        const status=String(record.Status||'').toLowerCase().trim();
        results.push(`${name}: ${status==='verified'?'Major / verified':status==='non-verified'?'Regular / non-verified':'Build classification not provided'}`);
      }
    }
    return results;
  }
  function setHealth(status,text){
    const button=$('wwdef-health-check'),icon=$('wwdef-health-icon');
    button.classList.toggle('is-checking',status==='checking');button.classList.toggle('is-attention',status==='attention');
    icon.className='ph '+(status==='checking'?'ph-arrows-clockwise':status==='attention'?'ph-warning-circle':'ph-shield-check');
    $('wwdef-health-label').textContent=text;
  }
  async function runCheck(explicit=true){
    if(checkBusy)return;
    checkBusy=true;setHealth('checking','Checking update protection…');
    try{
      const enabled=Object.values(state.updater).some(Boolean);
      if(!enabled){setHealth('ready','No update checks enabled');return;}
      const manifest=await readManifest();
      auditManifest(manifest);
      setHealth('ready','Update checks completed');
    }catch(err){
      // The web package may be absent in standalone previews; report rather than invent success.
      setHealth('attention','Update check needs attention');
      console.warn('[WebWindows Security] Update protection check incomplete:',err);
    }finally{checkBusy=false;}
  }
  $('wwdef-health-check').addEventListener('click',()=>void runCheck());
  // 9H09 runs Automatic Update Scanning on an interval while enabled.
  function syncAutomaticScan(){
    if(automaticScanInterval!==null){clearInterval(automaticScanInterval);automaticScanInterval=null;}
    if(state.updater.search){
      void runCheck(false);
      automaticScanInterval=setInterval(()=>{if(state.updater.search)void runCheck(false);},60000);
    }
  }
  window.addEventListener('pagehide',()=>{if(automaticScanInterval!==null)clearInterval(automaticScanInterval);},{once:true});
  // Monitor actual 10H10 manual update checks: no interception or fake install prevention.
  const realCheck=$('ww-check-updates');
  realCheck?.addEventListener('click',()=>{
    if(state.updater.search && !checkBusy)window.setTimeout(()=>void runCheck(false),100);
  });
  // Titlebar drag, while maximize / resize remain delegated to the 10H10 sizing module.
  const bar=$('wwdef-titlebar');
  bar.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('button')||win.classList.contains('ww10-maximized'))return;
    const rect=win.getBoundingClientRect();
    win.style.left=`${rect.left}px`;win.style.top=`${rect.top}px`;win.style.transform='none';
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};
    if(bar.setPointerCapture)bar.setPointerCapture(event.pointerId);
  });
  bar.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    win.style.left=`${Math.max(0,Math.min(innerWidth-win.offsetWidth,drag.left+event.clientX-drag.x))}px`;
    win.style.top=`${Math.max(0,Math.min(innerHeight-win.offsetHeight,drag.top+event.clientY-drag.y))}px`;
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])bar.addEventListener(type,()=>{drag=null;});
  window.WebWindowsSecurity=Object.freeze({
    open,close,checkUpdates:()=>runCheck(true),
    getPreferences:()=>JSON.parse(JSON.stringify({updater:state.updater,schedule:{...defaults.schedule},mode:'standard',pinEnabled:false})),
    // Compatibility accessor for the lock screen: a disabled schedule places no restrictions.
    isPinScheduledNow:()=>true
  });
  refreshUpdater();writeSummary();syncAutomaticScan();
  document.documentElement.dataset.wwDefenderReady='1';
});


/* 10H10 Start menu — only actual app controls already present on the taskbar.
 * Profile name/photo are read from the Settings account, never duplicated in storage.
 */
WWCompat.boot('Start Menu', () => {
  'use strict';
  const byId = id => document.getElementById(id);
  const start = byId('start-button');
  const panel = byId('ww10-start-menu');
  const appGrid = byId('ww10-start-app-grid');
  if (!start || !panel || !appGrid) return;

  // These are the actual applications shipped with this 10H10 build.
  // Discover from the existing taskbar rather than inventing app names or actions.
  const installedApps = [...document.querySelectorAll('#taskbar .app-button[data-ww-app-window]')]
    .filter(button => byId(button.dataset.wwAppWindow));
  const appButtons = [];
  // N1.png lives next to Index.html. Keep a clean filename placeholder until
  // the image is added, rather than displaying a broken-image browser icon.
  const newsImage = byId('ww10-start-news-image');
  if (newsImage) {
    const thumbnail = newsImage.closest('.ww10-start-news-thumbnail');
    const syncNewsImage = () => thumbnail?.classList.toggle('is-loaded', newsImage.naturalWidth > 0);
    newsImage.addEventListener('load', syncNewsImage);
    newsImage.addEventListener('error', syncNewsImage);
    if (newsImage.complete) syncNewsImage();
  }
  for (const source of installedApps) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ww10-start-app';
    const name = source.getAttribute('aria-label') || source.title || 'App';
    button.setAttribute('aria-label', `Open ${name}`);
    const icon = document.createElement('span');
    icon.className = 'ww10-start-app-icon';
    icon.setAttribute('aria-hidden', 'true');
    const fallback = document.createElement('span');
    fallback.className = 'ww10-start-app-fallback';
    const existingFallback = source.querySelector('.app-fallback .ph');
    const ph = document.createElement('i');
    ph.className = existingFallback?.className || 'ph ph-app-window';
    fallback.append(ph);
    icon.append(fallback);
    const sourceImg = source.querySelector('img');
    if (sourceImg) {
      const img = document.createElement('img');
      img.src = sourceImg.getAttribute('src') || '';
      img.alt = '';
      img.draggable = false;
      const refresh = () => icon.classList.toggle('is-loaded', img.naturalWidth > 0);
      img.addEventListener('load', refresh);
      img.addEventListener('error', refresh);
      icon.prepend(img);
      if (img.complete) refresh();
    }
    const text = document.createElement('span');
    text.className = 'ww10-start-app-label';
    // Start uses concise captions; keep the full names for accessibility and tooltips.
    const startCaptions = {
      'settings-button': 'Settings',
      'information-button': 'About',
      'defender-button': 'Security',
      'feedback-button': 'Feedback'
    };
    text.textContent = startCaptions[source.id] || name;
    button.title = name;
    button.append(icon, text);
    button.addEventListener('click', () => {
      closeStart(false);
      source.click();  // Use the same event path as the original taskbar button.
    });
    appGrid.append(button);
    appButtons.push(button);
  }

  function syncAccount() {
    const settingsName = byId('ww-profile-sidebar-name');
    const settingsAvatar = byId('ww-profile-sidebar-image');
    const settingsFallback = byId('ww-profile-fallback');
    const name = (settingsName?.textContent || 'Administrator').trim() || 'Administrator';
    byId('ww10-start-account-name').textContent = name;
    const image = byId('ww10-start-account-image');
    const initial = byId('ww10-start-account-initial');
    const imageSource = settingsAvatar && !settingsAvatar.hidden ? settingsAvatar.getAttribute('src') : null;
    if (imageSource) {
      if (image.getAttribute('src') !== imageSource) image.setAttribute('src', imageSource);
      image.hidden = false;
      initial.hidden = true;
    } else {
      image.hidden = true;
      image.removeAttribute('src');
      initial.hidden = false;
      initial.textContent = settingsFallback?.textContent || name.charAt(0).toUpperCase();
    }
  }

  // Profile images are loaded asynchronously from the existing Settings media store.
  // Observe that display, including changes made while Start is already open.
  const settingsProfile = document.querySelector('#settings-window .ww-profile-header');
  let profileObserver;
  if (settingsProfile && typeof MutationObserver !== 'undefined') {
    profileObserver = new MutationObserver(syncAccount);
    profileObserver.observe(settingsProfile, {subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['src','hidden']});
  }

  function setPosition() {
    if (panel.hidden) return;
    // Match Search's height cap and dock spacing; the geometry engine handles
    // Bottom, Top, Left and Right (attached and floating) consistently.
    const cap = window.innerWidth <= 520 ? 520 : 560;
    WWCompat.positionTaskbarPanel(panel, {width:500, height:cap});
  }

  function closeStart(returnFocus = false) {
    if (panel.hidden) return;
    panel.hidden = true;
    start.setAttribute('aria-expanded', 'false');
    if (returnFocus) start.focus({preventScroll:true});
  }
  function openStart() {
    WWCompat.emit('webwindows:start-opening');
    // One shell flyout at a time; app windows remain open behind Start.
    document.querySelectorAll('.ww-flyout').forEach(el => {el.hidden = true;});
    syncAccount();
    panel.hidden = false;
    start.setAttribute('aria-expanded', 'true');
    setPosition();
  }

  start.addEventListener('click', () => panel.hidden ? openStart() : closeStart());
  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && !panel.contains(event.target) && !start.contains(event.target)) closeStart();
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Escape') {
      event.preventDefault();
      panel.hidden ? openStart() : closeStart(true);
    } else if (!panel.hidden && event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeStart(true);
    } else if (!panel.hidden && ['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(event.key)
      && appButtons.includes(document.activeElement)) {
      const index = appButtons.indexOf(document.activeElement);
      const columns = getComputedStyle(appGrid).gridTemplateColumns.split(' ').length;
      const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1
        : event.key === 'ArrowDown' ? columns : -columns;
      event.preventDefault();
      appButtons[(index + delta + appButtons.length) % appButtons.length]?.focus();
    }
  }, true);
  // Reposition after the resized taskbar has completed its own reflow.
  // A synchronous resize callback may otherwise read the previous dock edge.
  let startPositionFrame = 0;
  window.addEventListener('resize', () => {
    if (startPositionFrame) cancelAnimationFrame(startPositionFrame);
    startPositionFrame = requestAnimationFrame(() => {
      startPositionFrame = 0;
      setPosition();
    });
  });
  window.addEventListener('webwindows:taskbar-layout-changed', () => {
    if (panel.hidden) return;
    setPosition();
  });
  byId('taskbar')?.addEventListener('animationend', () => setPosition());
  window.addEventListener('webwindows:settings-requested', () => closeStart());
  window.addEventListener('webwindows:search-opening', () => closeStart());
  window.addEventListener('webwindows:search-input', () => closeStart());
  window.addEventListener('pagehide', () => profileObserver?.disconnect(), {once:true});
  syncAccount();
});
