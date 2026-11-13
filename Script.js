
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
  // Shared geometry for Start, Search and Weather. Read the taskbar's ACTUAL
  // rectangle, so attached and floating docks (and all four sides) agree.
  // An optional anchor keeps Weather near its taskbar control, while Start and
  // Search stay centered in the available region beside the dock.
  function positionTaskbarPanel(panel, {width = 500, height = 560, gap = 9, inset = 8, anchor = null} = {}) {
    if (!panel || panel.hidden) return null;
    const vw = window.innerWidth, vh = window.innerHeight;
    const requestedSide = document.documentElement.dataset.wwTaskbar || 'bottom';
    const side = ['bottom','top','left','right'].includes(requestedSide) ? requestedSide : 'bottom';
    const dock = document.getElementById('taskbar')?.getBoundingClientRect()
      || {left:0,top:vh-45,right:vw,bottom:vh};
    const usable = {left:inset,top:inset,right:Math.max(inset,vw-inset),bottom:Math.max(inset,vh-inset)};
    if (side === 'bottom') usable.bottom = Math.max(usable.top, Math.min(usable.bottom, dock.top-gap));
    else if (side === 'top') usable.top = Math.min(usable.bottom, Math.max(usable.top, dock.bottom+gap));
    else if (side === 'left') usable.left = Math.min(usable.right, Math.max(usable.left, dock.right+gap));
    else usable.right = Math.max(usable.left, Math.min(usable.right, dock.left-gap));

    const availableWidth = Math.max(0,usable.right-usable.left);
    const availableHeight = Math.max(0,usable.bottom-usable.top);
    const w = Math.max(0,Math.min(width,availableWidth));
    const h = Math.max(0,Math.min(height,availableHeight));
    const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
    const target = anchor?.getBoundingClientRect?.();
    let x, y;
    if (side === 'left' || side === 'right') {
      x = side === 'left' ? usable.left : usable.right-w;
      // Start/Search center on the available desktop; Weather follows its icon.
      y = target ? clamp(target.top + target.height/2 - h/2,usable.top,usable.bottom-h)
                 : usable.top+(availableHeight-h)/2;
    } else {
      x = target ? clamp(target.left+target.width/2-w/2,usable.left,usable.right-w)
                 : usable.left+(availableWidth-w)/2;
      y = side === 'top' ? usable.top : usable.bottom-h;
    }
    // Animation origins belong to the dock edge, not always to the bottom.
    const closed = {
      bottom:'inset(70% 0 0 0 round 20px)',
      top:'inset(0 0 70% 0 round 20px)',
      left:'inset(0 70% 0 0 round 20px)',
      right:'inset(0 0 0 70% round 20px)'
    };
    const dismiss = {
      bottom:'inset(32% 0 0 0 round 20px)',
      top:'inset(0 0 32% 0 round 20px)',
      left:'inset(0 32% 0 0 round 20px)',
      right:'inset(0 0 0 32% round 20px)'
    };
    const offset = {bottom:['0px','9px'],top:['0px','-9px'],left:['-9px','0px'],right:['9px','0px']}[side];
    panel.dataset.wwFlyoutSide = side;
    panel.style.setProperty('--ww-flyout-closed-clip',closed[side]);
    panel.style.setProperty('--ww-flyout-dismiss-clip',dismiss[side]);
    panel.style.setProperty('--ww-flyout-shift-x',offset[0]);
    panel.style.setProperty('--ww-flyout-shift-y',offset[1]);
    Object.assign(panel.style,{
      left:`${Math.round(x)}px`,top:`${Math.round(y)}px`,right:'auto',bottom:'auto',translate:'none',
      width:`${Math.floor(w)}px`,maxWidth:`${Math.floor(w)}px`,
      height:`${Math.floor(h)}px`,maxHeight:`${Math.floor(availableHeight)}px`
    });
    return {side,width:w,height:h,availableWidth,availableHeight};
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
    if (control) control.addEventListener('click', () => {
      if (id === 'weather-button' && control.dataset.wwSpotlight === 'news') emit('news-requested');
      else emit(action);
    });
    else console.warn(`[WebWindows] Missing optional taskbar control: ${id}`);
  }

  // Search flyout: real system actions only, no fictitious Windows results.
  const searchShell = byId('search-shell');
  const searchArtwork = searchShell?.querySelector('.search-taskbar-color');
  if (searchArtwork) {
    const refreshSearchArtwork = () => searchArtwork.parentElement.classList.toggle('is-loaded', searchArtwork.naturalWidth > 0);
    searchArtwork.addEventListener('load', refreshSearchArtwork);
    searchArtwork.addEventListener('error', refreshSearchArtwork);
    if (searchArtwork.complete) refreshSearchArtwork();
  }
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
    { id:'settings-desktop-appearance', title:'Desktop appearance', meta:'Settings · Personalization', icon:'display', keywords:'desktop appearances customization personalize taskbar context menu search flyout settings', run: () => emit('settings-requested', {section:'desktop'}) },
    { id:'settings-context-menu', title:'Context menu settings', meta:'Settings · Desktop appearance', icon:'customize', keywords:'right click menu appearance customize desktop context options', run: () => emit('settings-requested', {section:'context-menu'}) },
    { id:'settings-context-glass', title:'Glass surface controls', meta:'Settings · Context menu', icon:'palette', keywords:'show hide glass surface controls right click context menu toggle color transparency', run: () => emit('settings-requested', {section:'context-menu'}) },
    { id:'settings-search-flyout', title:'Search flyout settings', meta:'Settings · Desktop appearance', icon:'search', keywords:'search popup customize placement results flyout configuration', run: () => emit('settings-requested', {section:'search-flyout'}) },
    { id:'settings-search-placement', title:'Search placement', meta:'Settings · Search flyout', icon:'search', keywords:'where search flyout popup appears position to be determined', run: () => emit('settings-requested', {section:'search-placement'}) },
    { id:'settings-search-results', title:'Search results', meta:'Settings · Search flyout', icon:'sliders', keywords:'all results recently opened latest most used frequent most frequent search popup opening display mode', run: () => emit('settings-requested', {section:'search-results'}) },
    { id:'settings-colors', title:'Colors and transparency', meta:'Settings · Personalization', icon:'brush', keywords:'accent glass color transparency shadow HDR personalization', run: () => emit('settings-requested', {section:'colors'}) },
    { id:'settings-time', title:'Language and time', meta:'Settings · System', icon:'settings', keywords:'clock date time zone 24-hour language english', run: () => emit('settings-requested', {section:'time'}) },
    { id:'settings-updates', title:'Windows Update', meta:'Settings · System', icon:'settings', keywords:'windows update check pause update history', run: () => emit('settings-requested', {section:'updates'}) },
    { id:'settings-available-updates', title:'Available updates', meta:'Settings · Windows Update', icon:'settings', keywords:'available pending update list download install updates check new updates', run: () => emit('settings-requested', {section:'available-updates'}) },
    { id:'settings-pause-updates', title:'Pause updates', meta:'Settings · Windows Update', icon:'settings', keywords:'pause update checks until date resume updates', run: () => emit('settings-requested', {section:'pause-updates'}) },
    { id:'settings-update-history', title:'Update history', meta:'Settings · Windows Update', icon:'settings', keywords:'past builds release history version 10h10 9h09 8h08 7h07 6h06', run: () => emit('settings-requested', {section:'update-history'}) },
    { id:'settings-insider', title:'Windows Insider Program', meta:'Settings · Windows Update', icon:'shield', keywords:'insider preview beta experimental release preview channel experience updates', run: () => emit('settings-requested', {section:'insider'}) },
    { id:'settings-login', title:'Login and privacy', meta:'Settings · Account', icon:'shield', keywords:'login privacy profile name PIN account', run: () => emit('settings-requested', {section:'login'}) },
    { id:'security-app', title:'Windows Security', meta:'System · App', icon:'security-app', keywords:'security defender protection app', run: () => emit('defender-requested') },
    { id:'feedback-app', title:'Feedback hub', meta:'System · App', icon:'feedback-app', keywords:'feedback hub bug report suggestion idea problem feature request', run: () => emit('feedback-requested') },
    { id:'build', title:'Windows 12', meta:'Version 10H10 · OS Build 2610140', icon:'windows', keywords:'build system version 10h10 2610140 operating system', run: () => showInformation() },
    { id:'glass', title:'Adjust Glass Color', meta:'Personalization · Glass', icon:'palette', keywords:'adjust custom glass mica color colour picker hex tint appearance surface personalize', run: () => showSearchGlassEditor() },
    { id:'appearance', title:'Open appearance menu', meta:'Desktop · Action', icon:'sliders', keywords:'open right click context menu color theme personalize', run: () => showAppearanceMenu(Math.round(innerWidth/2), Math.round(innerHeight - 155)) },
    { id:'display', title:'Display settings', meta:'Desktop · Action', icon:'display', keywords:'open monitor display settings screen desktop', run: () => { hideAppearanceMenu(); emit('display-settings-requested'); } },
    { id:'personalize', title:'Personalize settings', meta:'Desktop · Action', icon:'brush', keywords:'open personalize settings theme wallpaper colors desktop', run: () => { hideAppearanceMenu(); emit('personalize-settings-requested'); } },
    { id:'customize-menu', title:'Customize context menu', meta:'Desktop · Action', icon:'customize', keywords:'open customize context menu personalize menu options', run: () => { hideAppearanceMenu(); emit('customize-context-menu-requested'); } },
    { id:'weather', title:'Weather', meta:'Weather · Action', icon:'weather', keywords:'forecast weather temperature partly cloudy', run: () => { byId('weather-button').focus(); emit('weather-requested'); } },
    { id:'news', title:'News', meta:'Weather & News · Live headlines', icon:'newspaper', keywords:'news headlines articles world technology science business GDELT', run: () => emit('news-requested') },
    { id:'shortcut', title:'Search', meta:'Search · Action', icon:'search', keywords:'open search find quick keyboard shortcut', run: () => { showSearchPanel(); searchPanelInput.focus({preventScroll:true}); } }
  ];
  let visibleResults = [];
  // Search usage is browser-local, tracks only selected actions (not query text).
  // The display-mode preference lives in the main Settings state.
  const SEARCH_USAGE_KEY = 'webwindows.10h10.searchUsage.v1';
  let searchUsage = {recent:[],counts:{}};
  try {
    const raw=JSON.parse(localStorage.getItem(SEARCH_USAGE_KEY)||'null');
    if (raw && typeof raw==='object') {
      const validIds=new Set(searchable.map(item=>item.id));
      if (Array.isArray(raw.recent)) searchUsage.recent=[...new Set(raw.recent.filter(id=>typeof id==='string' && validIds.has(id)))].slice(0,12);
      if (raw.counts && typeof raw.counts==='object') for (const [id,count] of Object.entries(raw.counts))
        if (validIds.has(id) && Number.isInteger(count) && count>0) searchUsage.counts[id]=Math.min(count,100000000);
    }
  } catch { /* Search remains functional if storage is unavailable. */ }
  const searchResultMode=()=>{
    let mode=window.WebWindowsSettings?.get?.()?.searchResultsMode;
    if (!mode) try {mode=JSON.parse(localStorage.getItem('webwindows.10h10.settings.v1')||'null')?.searchResultsMode;} catch {}
    return ['all','recent','frequent'].includes(mode) ? mode : 'all';
  };
  function recordSearchUse(id) {
    searchUsage.recent=[id,...searchUsage.recent.filter(previous=>previous!==id)].slice(0,12);
    searchUsage.counts[id]=Math.min(100000000,(searchUsage.counts[id]||0)+1);
    try {localStorage.setItem(SEARCH_USAGE_KEY,JSON.stringify(searchUsage));} catch {}
  }

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
    if (q) {
      // Every typed query searches ALL available actions, independent of the
      // preference for the empty-query popup's initial list.
      visibleResults=searchable.filter(item =>
        `${displayTitle(item)} ${item.meta} ${item.keywords}`.toLocaleLowerCase().includes(q) || exactItemMatch(q,item)
      );
    } else if (searchResultMode()==='recent') {
      visibleResults=searchUsage.recent.map(id=>searchable.find(item=>item.id===id)).filter(Boolean).slice(0,8);
    } else if (searchResultMode()==='frequent') {
      visibleResults=searchable.filter(item=>searchUsage.counts[item.id]>0)
        .sort((a,b)=>(searchUsage.counts[b.id]-searchUsage.counts[a.id]) ||
          (searchUsage.recent.indexOf(a.id)===-1?Infinity:searchUsage.recent.indexOf(a.id))-
          (searchUsage.recent.indexOf(b.id)===-1?Infinity:searchUsage.recent.indexOf(b.id)))
        .slice(0,8);
    } else visibleResults=searchable.slice();
    WWCompat.replaceChildren(searchResults);
    searchEmpty.hidden = visibleResults.length > 0;
    searchEmpty.textContent = q ? 'No results found.' :
      (searchResultMode()==='recent' ? 'Results you open from Search will appear here.' :
       searchResultMode()==='frequent' ? 'Your most used Search results will appear here.' : 'No results found.');
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
        const fallback = document.createElement('i');
        fallback.className = `ph ph-${({
          'info-app':'info','settings-app':'gear-six',
          'security-app':'shield-check','feedback-app':'chat-centered-text'
        })[iconName]} search-app-fallback`;
        fallback.setAttribute('aria-hidden', 'true');
        const refresh = () => iconWrap.classList.toggle('icon-loaded', img.naturalWidth > 0);
        img.addEventListener('load', refresh);
        img.addEventListener('error', refresh);
        iconWrap.append(img, fallback);
        if (img.complete) refresh();
      } else if (!iconName || (item.meta.includes('App') && !['weather','info-app','settings-app','security-app','feedback-app'].includes(iconName))) {
        const img = document.createElement('img');
        img.className = 'search-app-icon';
        img.src = window.WebWindowsAppIcons?.resolve('') || 'https://img.icons8.com/?size=100&id=tWYgsDQo4Sq4&format=png&color=000000';
        img.alt = ''; img.draggable = false;
        iconWrap.append(img);
      } else if (iconName === 'weather') {
        const liveIcon=window.WebWindowsWeatherIcons?.current?.();
        if(liveIcon){
          const img=document.createElement('img');
          img.className='search-weather-icon';
          img.src=liveIcon;
          img.alt='';img.draggable=false;
          img.setAttribute('aria-hidden','true');
          iconWrap.append(img);
        }else{
          const ph=document.createElement('i');
          ph.className='ph ph-cloud';
          ph.setAttribute('aria-hidden','true');
          iconWrap.append(ph);
        }
      } else {
        const ph = document.createElement('i');
        ph.className = `ph ph-${({ info:'info', palette:'palette', sliders:'faders-horizontal', cloud:'cloud-sun', search:'magnifying-glass', display:'monitor', brush:'paint-brush', customize:'sliders-horizontal', settings:'gear-six', shield:'shield-check', newspaper:'newspaper' })[iconName]}`;
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
  window.addEventListener('webwindows:search-display-mode-changed', () => {
    if (searchPanel.hidden || !searchGlassEditor.hidden) return;
    renderSearchResults(searchPanelInput.value);
    resizeSearchPanel();
  });
  function showSearchPanel() {
    WWCompat.emit('webwindows:search-opening');
    // Re-entering Search through typing returns from the glass editor to results.
    if (!searchGlassEditor.hidden) hideSearchGlassEditor(false);
    hideAppearanceMenu();
    const wasClosing = searchPanel.classList.contains('is-closing');
    cancelAnimatedClose(searchPanel);
    if (searchPanel.hidden || wasClosing) {
      searchPanel.hidden = false;
      searchPanel.classList.remove('ww10-search-opening');
      if (wasClosing) void searchPanel.offsetWidth; // restart only after interrupted close
      // Reduced-motion users get the full flyout immediately, without leaving
      // a stale staged-animation class after the suppressed animation.
      if (!reducedMotion.matches) searchPanel.classList.add('ww10-search-opening');
    }
    search.setAttribute('aria-expanded','true');
    searchPanelInput.value = search.value;
    renderSearchResults(search.value);
    positionSearchPanel();
  }
  searchPanel.addEventListener('animationend', event => {
    if(event.target===searchPanel && event.animationName==='ww10-search-docked-reveal')
      searchPanel.classList.remove('ww10-search-opening');
  });
  function hideSearchPanel() {
    searchPanel.classList.remove('ww10-search-opening');
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
    recordSearchUse(item.id);
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
  function openSearchComposer() {
    showSearchPanel();
    searchPanelInput.focus({preventScroll:true});
  }
  searchShell.addEventListener('click', event => {
    event.preventDefault(); // do not refocus the read-only label input
    openSearchComposer();
  });
  search.addEventListener('focus',openSearchComposer);
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
      openSearchComposer();
      searchPanelInput.select();
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
  const searchDock = document.getElementById('taskbar');
  searchDock?.addEventListener('animationend', scheduleSearchPosition);
  searchDock?.addEventListener('transitionend', scheduleSearchPosition);
  if (typeof ResizeObserver === 'function' && searchDock) {
    const searchDockResize = new ResizeObserver(scheduleSearchPosition);
    searchDockResize.observe(searchDock);
    window.addEventListener('pagehide', () => searchDockResize.disconnect(),{once:true});
  }
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
  const original = Object.freeze({position:'bottom',align:'center',layout:'attached',searchMode:'box',appLabels:'icon',glass:null,opacity:80,accent:'#0078d4',autoAccent:false,shadows:true,hdr:false,localTime:true,localDate:true,hour24:false,language:'en-US',account:'Administrator',pausedUntil:'',earlyUpdates:true,insiderProduct:'10H10',insiderExperience:'',insiderReleasePreview:false,contextGlassControls:true,searchResultsMode:'all'});
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
    position:['bottom','top','left','right'], align:['center','start'], layout:['attached','floating'], searchMode:['box','icon','hover'], searchResultsMode:['all','recent','frequent'], appLabels:['icon','name'],
    language:['en-US','en-GB','es-ES','fr-FR','de-DE','pt-BR','ja-JP']
  };
  for (const [key, options] of Object.entries(allowed)) if (!options.includes(state[key])) state[key] = original[key];
  for (const name of ['accent']) if (!/^#[a-f\d]{6}$/i.test(state[name])) state[name] = original[name];
  state.opacity = Number.isFinite(Number(state.opacity)) ? Math.max(0,Math.min(100,Math.round(Number(state.opacity)))) : original.opacity;
  state.account = (state.account || 'Administrator').slice(0,48);
  // Migrate the earlier Insider preview selection without resetting the user's choice.
  if (state.insiderProduct === '9H09') state.insiderProduct = '11H11';
  if (!['10H10','11H11'].includes(state.insiderProduct)) state.insiderProduct='10H10';
  if (!['','beta','experimental','release'].includes(state.insiderExperience)) state.insiderExperience='';
  const persist = () => storage.write(KEY, JSON.stringify(state));
  // One preference governs the Glass surface editor in the desktop right-click menu.
  // It does not switch off glass materials or affect taskbar context menus.
  function applyContextGlassControls() {
    root.dataset.wwContextGlassControls = state.contextGlassControls ? 'on' : 'off';
    const toggle = $('ww10-context-glass-controls');
    if (toggle) toggle.checked = state.contextGlassControls;
  }
  $('ww10-context-glass-controls')?.addEventListener('change', event => {
    state.contextGlassControls = event.currentTarget.checked;
    persist();
    applyContextGlassControls();
  });
  applyContextGlassControls();
  const searchResultModeInputs=[...dialog.querySelectorAll('input[name="ww10-search-results-mode"]')];
  function syncSearchResultMode() {
    for (const input of searchResultModeInputs) input.checked=input.value===state.searchResultsMode;
  }
  for (const input of searchResultModeInputs) input.addEventListener('change', () => {
    if (!input.checked || !allowed.searchResultsMode.includes(input.value)) return;
    state.searchResultsMode=input.value;
    persist();
    WWCompat.emit('webwindows:search-display-mode-changed',{mode:state.searchResultsMode});
  });
  syncSearchResultMode();
  // Search Settings reuse the same inline disclosure behavior as the Taskbar
  // and Update history. The three results modes retain their saved state.
  const searchOptionTriggers=[...dialog.querySelectorAll('[data-ww-search-options]')];
  const searchOptionPanels=new Map([...dialog.querySelectorAll('[data-ww-search-panel]')]
    .map(panel=>[panel.dataset.wwSearchPanel,panel]));
  // Independent inline disclosures: opening Search results does not collapse
  // Search placement (and vice versa), as with other Settings sections.
  function closeSearchOptions(restoreFocus=false) {
    const lastOpen=searchOptionTriggers.filter(trigger=>trigger.getAttribute('aria-expanded')==='true').at(-1);
    for (const trigger of searchOptionTriggers) {
      const panel=searchOptionPanels.get(trigger.dataset.wwSearchOptions);
      if (panel) panel.hidden=true;
      trigger.setAttribute('aria-expanded','false');
    }
    if (restoreFocus && lastOpen && !dialog.hidden) lastOpen.focus({preventScroll:true});
  }
  function openSearchOptions(mode,trigger,focus=false) {
    const panel=searchOptionPanels.get(mode);
    if (!trigger || !panel) return;
    panel.hidden=false;
    trigger.setAttribute('aria-expanded','true');
    if (focus) trigger.focus({preventScroll:true});
  }
  for (const trigger of searchOptionTriggers) trigger.addEventListener('click',()=>{
    const mode=trigger.dataset.wwSearchOptions;
    const panel=searchOptionPanels.get(mode);
    if (!panel) return;
    if (!panel.hidden) {
      panel.hidden=true;
      trigger.setAttribute('aria-expanded','false');
    } else openSearchOptions(mode,trigger);
  });
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
    // Preserve deep-links and Settings search, but expand the inline section on this page.
    const searchDisclosure=name==='search-placement'?'placement':name==='search-results'?'results':null;
    const updateDisclosures={
      'available-updates':['ww-available-toggle','ww-available-updates'],
      'pause-updates':['ww-pause-toggle','ww-pause-options'],
      'update-history':['ww-history-toggle','ww-history']
    };
    const updateDisclosure=updateDisclosures[name]||null;
    if (searchDisclosure) name='search-flyout';
    if (updateDisclosure) name='updates';
    if (!pages.some(p => p.dataset.wwView === name)) return;
    closeSearchOptions();
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
    if (['colors','desktop','taskbar','context-menu','search-flyout','search-placement','search-results'].includes(name)) active = 'personalization';
    if (name === 'language') active = 'time';
    if (name === 'pin') active = 'login';
    if (name === 'insider') active = 'updates';
    navItems.forEach(item => item.setAttribute('aria-selected', String(item.dataset.wwPage === active)));
    settingsIndicator.schedule(changingPage);
    $('ww-settings-scroll').scrollTop = 0;
    if (name === 'insider') void checkInsiderPreviewAvailability();
    if (name === 'updates') renderAvailableUpdates();
    if (searchDisclosure) {
      const trigger=searchOptionTriggers.find(button=>button.dataset.wwSearchOptions===searchDisclosure);
      openSearchOptions(searchDisclosure,trigger,true);
    }
    if (updateDisclosure) {
      const [triggerId,panelId]=updateDisclosure;
      const trigger=$(triggerId);
      const panel=$(panelId);
      // Delegate to the existing toggle so pause-date controls and all
      // current update behavior remain synchronized.
      if (trigger && panel && panel.hidden) trigger.click();
      trigger?.scrollIntoView({block:'nearest'});
    }
  }
  // Windows Settings-style search only returns existing, functioning routes.
  const settingsSearch = $('ww11-settings-search');
  const searchResults = $('ww11-search-results');
  const searchablePages = [
    {name:'Home',detail:'Settings overview',page:'home',terms:'start main recommended'},
    {name:'Background',detail:'Personalization',page:'personalization',terms:'wallpaper picture desktop photos'},
    {name:'Colors and transparency',detail:'Personalization',page:'colors',terms:'accent glass mica custom color opacity appearance'},
    {name:'Desktop appearance',detail:'Personalization',page:'desktop',terms:'desktop elements appearance taskbar start menu'},
    {name:'Context menu',detail:'Desktop appearance',page:'context-menu',terms:'right click desktop glass surface controls toggle context menu customization'},
    {name:'Search flyout',detail:'Desktop appearance',page:'search-flyout',terms:'search popup flyout placement results'},
    {name:'Search placement',detail:'Search flyout',page:'search-placement',terms:'where search popup opens position to be determined'},
    {name:'Search results',detail:'Search flyout',page:'search-results',terms:'all recent latest frequently used most used opening popup'},
    {name:'Taskbar',detail:'Desktop appearance',page:'taskbar',terms:'taskbar position alignment search floating app icon name labels'},
    {name:'Date and time',detail:'Time & language',page:'time',terms:'clock zone 12 hour 24 hour'},
    {name:'Language',detail:'Time & language',page:'language',terms:'display language region translation'},
    {name:'Windows Update',detail:'Updates',page:'updates',terms:'check update history pause build'},
    {name:'Available updates',detail:'Windows Update',page:'available-updates',terms:'pending updates check available'},
    {name:'Pause updates',detail:'Windows Update',page:'pause-updates',terms:'pause resume until date'},
    {name:'Update history',detail:'Windows Update',page:'update-history',terms:'past releases current previous builds'},
    {name:'Glass surface controls',detail:'Context menu',page:'context-menu',terms:'show hide right click glass surface color transparency'},
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
    closeSearchOptions();
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
  window.addEventListener('webwindows:customize-context-menu-requested', () => openSettings('context-menu'));
  $('ww-settings-close').addEventListener('click', closeSettings);
  $('ww-settings-minimize').addEventListener('click', () => {
    if(dialog.hidden || closing) return;
    closeChoice();
    closeSearchOptions();
    rememberMinimizedWindow(dialog,'settings-button');
    $('settings-button').classList.add('is-open');
  });
  window.addEventListener('webwindows:app-preview-close-requested',e=>{
    if(e.detail?.taskbarId==='settings-button') closeSettings();
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || dialog.hidden || closing) return;
    e.preventDefault();
    closeSettings();
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
    const rgba = (channels,a) => `rgba(${channels.join(',')},${Math.max(0,Math.min(1,a)).toFixed(4)})`;
    const opacity = Math.max(0,Math.min(1,state.opacity/100));
    // All Mica and interactive surface tints retain the EXACT chosen swatch
    // (including pure white and black). Transparency changes the depth of a
    // tint; no channel shifts toward neutral gray, black, blue, or white.
    const hover = base;
    const control = base;
    const selected = base;
    const soft = base;
    const foreground = deep ? '#f2f3f5' : '#202936';
    const secondary = deep ? '#b6bbc4' : '#526075';
    const rgbBorder = deep ? [255,255,255] : [42,57,79];

    // Every translucent UI tint uses the selected glass RGB, independent from
    // the separate accent applied to functional controls and status indicators.
    root.style.setProperty('--ww-glass-tint-color',state.glass || nativeGlassColor());
    root.style.setProperty('--ww-glass-tint-selected',rgba(selected,Math.min(1,.28+opacity*.62)));
    root.style.setProperty('--ww-glass-tint-soft',rgba(soft,Math.min(1,deep ? .20+opacity*.38 : .30+opacity*.50)));
    root.style.setProperty('--ww-glass-tint-hover',rgba(hover,Math.min(1,.50+opacity*.48)));
    root.style.setProperty('--mica-surface',rgba(base,opacity));
    // Start menu titlebar ONLY: retain the selected glass RGB and blur,
    // but make the titlebar slightly more transparent than the main surface.
    // Keep the titlebar exactly 10 percentage points below main glass opacity
    // (100% -> 90%, 80% -> 70%, 60% -> 50%). Clamp at 0% for low settings.
    // The Start-only background split in Index.html prevents an opaque shell
    // from appearing behind the translucent account header.
    const headerOpacity = Math.max(0, opacity - .10);
    root.style.setProperty('--ww10-start-account-surface',rgba(base,headerOpacity));
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
    // No white/colored sheen or HDR reflection on glass: preserve the exact
    // selected RGB with only its user-selected opacity. Wallpaper HDR remains
    // handled separately by hdrRenderer and is not affected by this choice.
    root.style.setProperty('--mica-sheen','none');
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

  const wwLegacyTranslations = {"en-US":{"accentColor":"Manual accent color","accountName":"Account Name","administrator":"Administrator","appearance":"Appearance","backg":"Background behaviors","bottom":"Bottom","browseFiles":"Browse files","browsePhotos":"Browse","checkUpdates":"Check for updates","chooseLocalImage":"Choose a local image","colorsTheme":"Colors & transparency effects","colorsThemeDesc":"Accent colors, materials, transparency, and visual effects","dynamicLockBg":"Dynamic Lock Screen Background","dynamicLockBgDesc":"Use your current desktop wallpaper on the lock screen","glassColor":"Glass surface color","glassTrans":"Transparency effects","hdrLighting":"HDR Lighting","langDisp":"Windows display language","langTime":"Language & time","language":"Language","left":"Left","localAccount":"Local Account","loginPrivacy":"Login & privacy","moreOptions":"More options","pauseUpdates":"Pause updates","pauseUpdatesDesc":"Pause for up to 1 month","personalization":"Personalization","privacy":"Privacy","profilePic":"Profile picture","recentImages":"Recent images","right":"Right","save":"Save","setDateAuto":"Synchronize clocks automatically","setTimeAuto":"Set time zone automatically","settings":"Settings","taskbar":"Taskbar","taskbarAlign":"Taskbar alignment","taskbarBehaviors":"Taskbar behaviors","taskbarLocation":"Taskbar location on screen","taskbarLocationDesc":"Choose where the taskbar appears","taskbarSubtitle":"Control how your taskbar behaves and appears on screen","top":"Top","twentyFourHour":"Show 24-hour clock","twentyFourHourDesc":"Use a 24-hour format (e.g. 13:00)","unifiedTaskbar":"Unified taskbar layout","update":"Update","updateHistory":"Update history","updates":"Windows Update","v6H06":"Version 6H06 (New-valley)","v7H07":"Version 7H07 (New-land)","v8H08":"Version 8H08 (Fresh-Eyes)","v9H09":"Version 9H09 (Deja vu)","visualEffects":"Visual effects","winUpdate":"Windows Update","windowShadows":"Window drop shadows"},"en-GB":{"accentColor":"Manual accent colour","accountName":"Account Name","administrator":"Administrator","appearance":"Appearance","backg":"Background behaviours","bottom":"Bottom","browseFiles":"Browse files","browsePhotos":"Browse","checkUpdates":"Check for updates","chooseLocalImage":"Choose a local image","colorsTheme":"Colours & transparency effects","colorsThemeDesc":"Accent colours, materials, transparency, and visual effects","dynamicLockBg":"Dynamic Lock Screen Background","dynamicLockBgDesc":"Use your current desktop wallpaper on the lock screen","glassColor":"Glass surface colour","glassTrans":"Transparency effects","hdrLighting":"HDR Lighting","langDisp":"Windows display language","langTime":"Language & time","language":"Language","left":"Left","localAccount":"Local Account","loginPrivacy":"Login & privacy","moreOptions":"More options","pauseUpdates":"Pause updates","pauseUpdatesDesc":"Pause for up to 1 month","personalization":"Personalisation","privacy":"Privacy","profilePic":"Profile picture","recentImages":"Recent images","right":"Right","save":"Save","setDateAuto":"Synchronise clocks automatically","setTimeAuto":"Set time zone automatically","settings":"Settings","taskbar":"Taskbar","taskbarAlign":"Taskbar alignment","taskbarBehaviors":"Taskbar behaviours","taskbarLocation":"Taskbar location on screen","taskbarLocationDesc":"Choose where the taskbar appears","taskbarSubtitle":"Control how your taskbar behaves and appears on screen","top":"Top","twentyFourHour":"Show 24-hour clock","twentyFourHourDesc":"Use a 24-hour format (e.g. 13:00)","unifiedTaskbar":"Unified taskbar layout","update":"Update","updateHistory":"Update history","updates":"Windows Update","v6H06":"Version 6H06 (New-valley)","v7H07":"Version 7H07 (New-land)","v8H08":"Version 8H08 (Fresh-Eyes)","v9H09":"Version 9H09 (Deja vu)","visualEffects":"Visual effects","winUpdate":"Windows Update","windowShadows":"Window drop shadows"},"es-ES":{"accentColor":"Color de énfasis manual","accountName":"Nombre de la cuenta","administrator":"Administrador","appearance":"Apariencia","backg":"Comportamientos del fondo","bottom":"Abajo","browseFiles":"Examinar archivos","browsePhotos":"Examinar","checkUpdates":"Buscar actualizaciones","chooseLocalImage":"Elige una imagen local","colorsTheme":"Colores y efectos de transparencia","colorsThemeDesc":"Color de énfasis, materiales de cristal y controles","dynamicLockBg":"Fondo de pantalla de bloqueo dinámico","dynamicLockBgDesc":"Usar el fondo de escritorio actual en la pantalla de bloqueo","glassColor":"Color de superficie de cristal","glassTrans":"Efectos de transparencia","hdrLighting":"Iluminación HDR","langDisp":"Idioma de visualización de Windows","langTime":"Hora e idioma","language":"Idioma","left":"Izquierda","localAccount":"Cuenta local","loginPrivacy":"Inicio de sesión y privacidad","moreOptions":"Más opciones","pauseUpdates":"Pausar actualizaciones","pauseUpdatesDesc":"Pausar hasta por 1 mes","personalization":"Personalización","privacy":"Privacidad","profilePic":"Foto de perfil","recentImages":"Imágenes recientes","right":"Derecha","save":"Guardar","setDateAuto":"Sincronizar relojes automáticamente","setTimeAuto":"Establecer la zona horaria automáticamente","settings":"Configuración","taskbar":"Barra de tareas","taskbarAlign":"Alineación de la barra de tareas","taskbarBehaviors":"Comportamientos de la barra de tareas","taskbarLocation":"Ubicación de la barra de tareas en la pantalla","taskbarLocationDesc":"Elige dónde aparece la barra de tareas","taskbarSubtitle":"Controla cómo se comporta y aparece la barra de tareas","top":"Arriba","twentyFourHour":"Mostrar reloj de 24 horas","twentyFourHourDesc":"Usar un formato de 24 horas (ej. 13:00)","unifiedTaskbar":"Diseño de barra de tareas unificada","update":"Actualizar","updateHistory":"Historial de actualizaciones","updates":"Windows Update","v6H06":"Versión 6H06 (Nuevo Valle)","v7H07":"Versión 7H07 (Nueva Tierra)","v8H08":"Versión 8H08 (Ojos Frescos)","v9H09":"Versión 9H09 (Déjà vu)","visualEffects":"Efectos visuales","winUpdate":"Windows Update","windowShadows":"Sombras de las ventanas"},"fr-FR":{"accentColor":"Couleur d'accentuation manuelle","accountName":"Nom du compte","administrator":"Administrateur","appearance":"Apparence","backg":"Comportements de l'arrière-plan","bottom":"En bas","browseFiles":"Parcourir les fichiers","browsePhotos":"Parcourir","checkUpdates":"Rechercher des mises à jour","chooseLocalImage":"Choisissez une image locale","colorsTheme":"Couleurs et effets de transparence","colorsThemeDesc":"Couleur d'accentuation, matériaux de verre et curseurs","dynamicLockBg":"Arrière-plan dynamique de verrouillage","dynamicLockBgDesc":"Utiliser le fond d'écran du bureau sur l'écran de verrouillage","glassColor":"Couleur de surface en verre","glassTrans":"Effets de transparence","hdrLighting":"Éclairage HDR","langDisp":"Langue d'affichage de Windows","langTime":"Heure et langue","language":"Langue","left":"À gauche","localAccount":"Compte local","loginPrivacy":"Connexion et confidentialité","moreOptions":"Plus d'options","pauseUpdates":"Suspendre les mises à jour","pauseUpdatesDesc":"Suspendre jusqu'à 1 mois","personalization":"Personnalisation","privacy":"Confidentialité","profilePic":"Photo de profil","recentImages":"Images récentes","right":"À droite","save":"Enregistrer","setDateAuto":"Synchroniser les horloges automatiquement","setTimeAuto":"Définir le fuseau horaire automatiquement","settings":"Paramètres","taskbar":"Barre des tâches","taskbarAlign":"Alignement de la barre des tâches","taskbarBehaviors":"Comportements de la barre des tâches","taskbarLocation":"Emplacement de la barre des tâches","taskbarLocationDesc":"Choisissez où la barre des tâches apparaît","taskbarSubtitle":"Contrôlez le comportement de votre barre des tâches","top":"En haut","twentyFourHour":"Afficher l'horloge sur 24 heures","twentyFourHourDesc":"Utiliser un format de 24 heures (ex: 13:00)","unifiedTaskbar":"Disposition unifiée de la barre des tâches","update":"Mettre à jour","updateHistory":"Historique des mises à jour","updates":"Windows Update","v6H06":"Version 6H06 (Nouvelle Vallée)","v7H07":"Version 7H07 (Nouvelle Terre)","v8H08":"Version 8H08 (Regard Neuf)","v9H09":"Version 9H09 (Déjà vu)","visualEffects":"Effets visuels","winUpdate":"Windows Update","windowShadows":"Ombres des fenêtres"},"de-DE":{"accentColor":"Manuelle Akzentfarbe","accountName":"Kontoname","administrator":"Administrator","appearance":"Darstellung","backg":"Hintergrundverhalten","bottom":"Unten","browseFiles":"Dateien durchsuchen","browsePhotos":"Durchsuchen","checkUpdates":"Nach Updates suchen","chooseLocalImage":"Wählen Sie ein lokales Bild","colorsTheme":"Farben & Transparenzeffekte","colorsThemeDesc":"Akzentfarbe, Glasmaterialien und Schieberegler","dynamicLockBg":"Dynamischer Sperrbildschirmhintergrund","dynamicLockBgDesc":"Aktuelles Desktop-Hintergrundbild auf dem Sperrbildschirm verwenden","glassColor":"Glasoberflächenfarbe","glassTrans":"Transparenzeffekte","hdrLighting":"HDR-Beleuchtung","langDisp":"Windows-Anzeigesprache","langTime":"Zeit und Sprache","language":"Sprache","left":"Links","localAccount":"Lokales Konto","loginPrivacy":"Anmeldung & Datenschutz","moreOptions":"Weitere Optionen","pauseUpdates":"Updates aussetzen","pauseUpdatesDesc":"Für bis zu 1 Monat aussetzen","personalization":"Personalisierung","privacy":"Datenschutz","profilePic":"Profilbild","recentImages":"Zuletzt verwendete Bilder","right":"Rechts","save":"Speichern","setDateAuto":"Uhren automatisch synchronisieren","setTimeAuto":"Zeitzone automatisch festlegen","settings":"Einstellungen","taskbar":"Taskleiste","taskbarAlign":"Taskleistenausrichtung","taskbarBehaviors":"Taskleistenverhalten","taskbarLocation":"Position der Taskleiste auf dem Bildschirm","taskbarLocationDesc":"Wählen Sie, wo die Taskleiste angezeigt wird","taskbarSubtitle":"Steuern Sie das Verhalten Ihrer Taskleiste","top":"Oben","twentyFourHour":"24-Stunden-Format","twentyFourHourDesc":"Ein 24-Stunden-Format verwenden (z.B. 13:00)","unifiedTaskbar":"Einheitliches Taskleisten-Layout","update":"Aktualisieren","updateHistory":"Update-Verlauf","updates":"Windows Update","v6H06":"Version 6H06 (Neues Tal)","v7H07":"Version 7H07 (Neues Land)","v8H08":"Version 8H08 (Frischer Blick)","v9H09":"Version 9H09 (Déjà-vu)","visualEffects":"Visuelle Effekte","winUpdate":"Windows Update","windowShadows":"Fensterschatten"},"ja-JP":{"accentColor":"手動アクセントカラー","accountName":"アカウント名","administrator":"管理者","appearance":"外観","backg":"背景の動作","bottom":"下","browseFiles":"ファイルを参照","browsePhotos":"参照","checkUpdates":"更新プログラムのチェック","chooseLocalImage":"ローカル画像を選択","colorsTheme":"色と透明効果","colorsThemeDesc":"アクセントカラー、ガラス素材、スライダー","dynamicLockBg":"動的ロック画面の背景","dynamicLockBgDesc":"現在のデスクトップの壁紙をロック画面にも使用する","glassColor":"ガラス表面の色","glassTrans":"透明効果","hdrLighting":"HDR ライティング","langDisp":"ウィンドウズ の表示言語","langTime":"時刻と言語","language":"言語","left":"左","localAccount":"ローカル アカウント","loginPrivacy":"ログインとプライバシー","moreOptions":"その他のオプション","pauseUpdates":"更新を一時停止","pauseUpdatesDesc":"最大1ヶ月間一時停止","personalization":"個人用設定","privacy":"プライバシー","profilePic":"プロフィール写真","recentImages":"最近の画像","right":"右","save":"保存","setDateAuto":"時計を自動的に同期する","setTimeAuto":"タイムゾーンを自動的に設定する","settings":"設定","taskbar":"タスクバー","taskbarAlign":"タスクバーの配置","taskbarBehaviors":"タスクバーの動作","taskbarLocation":"画面上のタスクバーの位置","taskbarLocationDesc":"タスクバーの表示位置を選択してください","taskbarSubtitle":"タスクバーの動作と画面上の表示を制御します","top":"上","twentyFourHour":"24時間表示","twentyFourHourDesc":"24時間形式を使用する（例: 13:00）","unifiedTaskbar":"統一されたタスクバーレイアウト","update":"更新","updateHistory":"更新の履歴","updates":"ウィンドウズ アップデート","v6H06":"Version 6H06 (新しい谷)","v7H07":"バージョン 7H07 (新天地)","v8H08":"バージョン 8H08 (フレッシュアイズ)","v9H09":"バージョン 9H09 (デジャヴ)","visualEffects":"視覚効果","winUpdate":"ウィンドウズ アップデート","windowShadows":"ウィンドウの影"}};
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
  // Additional interface translations for existing display languages.
  // Match only authored UI strings and leave user content/news articles untouched.
  const ww10ExtendedTranslations = {"Make this desktop your own.":{"en-US":"Make this desktop your own.","es-ES":"Personaliza este escritorio.","fr-FR":"Personnalisez ce bureau.","de-DE":"Gestalten Sie diesen Desktop nach Ihren Wünschen.","pt-BR":"Personalize sua área de trabalho.","ja-JP":"デスクトップを自分好みに設定します。","en-GB":"Make this desktop your own."},"Select a desktop background (up to 17 saved)":{"en-US":"Select a desktop background (up to 17 saved)","es-ES":"Elige un fondo de escritorio (hasta 17 guardados)","fr-FR":"Choisissez un arrière-plan (jusqu'à 17 enregistrés)","de-DE":"Desktophintergrund auswählen (bis zu 17 gespeichert)","pt-BR":"Escolha um plano de fundo (até 17 salvos)","ja-JP":"デスクトップの背景を選択（最大17個保存）","en-GB":"Select a desktop background (up to 17 saved)"},"Restore default wallpaper":{"en-US":"Restore default wallpaper","es-ES":"Restaurar fondo predeterminado","fr-FR":"Restaurer le fond d'écran par défaut","de-DE":"Standardhintergrund wiederherstellen","pt-BR":"Restaurar papel de parede padrão","ja-JP":"既定の壁紙に戻す","en-GB":"Restore default wallpaper"},"Desktop appearance":{"en-US":"Desktop appearance","es-ES":"Apariencia del escritorio","fr-FR":"Apparence du bureau","de-DE":"Desktopdarstellung","pt-BR":"Aparência da área de trabalho","ja-JP":"デスクトップの外観","en-GB":"Desktop appearance"},"Customize desktop elements and taskbar appearance":{"en-US":"Customize desktop elements and taskbar appearance","es-ES":"Personaliza los elementos del escritorio y la barra de tareas","fr-FR":"Personnalisez le bureau et la barre des tâches","de-DE":"Desktop-Elemente und Taskleiste anpassen","pt-BR":"Personalize a área de trabalho e a barra de tarefas","ja-JP":"デスクトップ要素とタスクバーをカスタマイズ","en-GB":"Customise desktop elements and taskbar appearance"},"Manage how desktop elements appear and behave.":{"en-US":"Manage how desktop elements appear and behave.","es-ES":"Configura la apariencia y el comportamiento del escritorio.","fr-FR":"Gérez l'apparence et le comportement du bureau.","de-DE":"Darstellung und Verhalten der Desktop-Elemente verwalten.","pt-BR":"Gerencie a aparência e o comportamento da área de trabalho.","ja-JP":"デスクトップ要素の表示と動作を設定します。","en-GB":"Manage how desktop elements appear and behave."},"Context menu":{"en-US":"Context menu","es-ES":"Menú contextual","fr-FR":"Menu contextuel","de-DE":"Kontextmenü","pt-BR":"Menu de contexto","ja-JP":"コンテキスト メニュー","en-GB":"Context menu"},"Customize what appears when you right-click the desktop":{"en-US":"Customize what appears when you right-click the desktop","es-ES":"Personaliza las opciones del clic derecho en el escritorio","fr-FR":"Personnalisez le menu du clic droit sur le bureau","de-DE":"Einträge des Desktop-Rechtsklickmenüs anpassen","pt-BR":"Personalize as opções do clique direito na área de trabalho","ja-JP":"デスクトップの右クリック項目をカスタマイズ","en-GB":"Customise what appears when you right-click the desktop"},"Search flyout":{"en-US":"Search flyout","es-ES":"Panel de búsqueda","fr-FR":"Volet de recherche","de-DE":"Suchbereich","pt-BR":"Painel de pesquisa","ja-JP":"検索パネル","en-GB":"Search flyout"},"Choose how Search opens and which results it shows":{"en-US":"Choose how Search opens and which results it shows","es-ES":"Configura cómo se abre Buscar y qué resultados muestra","fr-FR":"Choisissez l'ouverture de Recherche et les résultats affichés","de-DE":"Öffnen der Suche und Suchergebnisse festlegen","pt-BR":"Escolha como a Pesquisa abre e quais resultados mostra","ja-JP":"検索の開き方と結果の表示を設定","en-GB":"Choose how Search opens and which results it shows"},"Customize where Search appears and which results are shown.":{"en-US":"Customize where Search appears and which results are shown.","es-ES":"Personaliza la posición de Buscar y los resultados que se muestran.","fr-FR":"Personnalisez l'emplacement et les résultats de Recherche.","de-DE":"Position und Ergebnisse der Suche anpassen.","pt-BR":"Personalize onde a Pesquisa aparece e quais resultados são mostrados.","ja-JP":"検索の表示位置と結果をカスタマイズします。","en-GB":"Customise where Search appears and which results are shown."},"Search placement":{"en-US":"Search placement","es-ES":"Ubicación de búsqueda","fr-FR":"Emplacement de la recherche","de-DE":"Suchposition","pt-BR":"Posição da pesquisa","ja-JP":"検索の表示位置","en-GB":"Search placement"},"Choose where the Search flyout appears":{"en-US":"Choose where the Search flyout appears","es-ES":"Elige dónde aparece el panel de búsqueda","fr-FR":"Choisissez où s'affiche le volet de recherche","de-DE":"Position des Suchbereichs auswählen","pt-BR":"Escolha onde o painel de pesquisa aparece","ja-JP":"検索パネルの表示位置を選択","en-GB":"Choose where the Search flyout appears"},"To be determined":{"en-US":"To be determined","es-ES":"Por determinar","fr-FR":"À déterminer","de-DE":"Noch festzulegen","pt-BR":"A definir","ja-JP":"未定","en-GB":"To be determined"},"Search placement options have not been decided yet. The current Search flyout placement will remain unchanged.":{"en-US":"Search placement options have not been decided yet. The current Search flyout placement will remain unchanged.","es-ES":"Las opciones de ubicación aún no están decididas. La posición actual se mantendrá.","fr-FR":"Les options de position ne sont pas encore définies. La position actuelle sera conservée.","de-DE":"Suchpositionen sind noch nicht festgelegt. Die bisherige Position bleibt erhalten.","pt-BR":"As opções de posição ainda não foram definidas. A posição atual será mantida.","ja-JP":"検索の表示位置はまだ決まっていません。現在の位置は変更されません。","en-GB":"Search placement options have not been decided yet. The current Search flyout placement will remain unchanged."},"Search results":{"en-US":"Search results","es-ES":"Resultados de búsqueda","fr-FR":"Résultats de recherche","de-DE":"Suchergebnisse","pt-BR":"Resultados da pesquisa","ja-JP":"検索結果","en-GB":"Search results"},"Choose the results shown when Search opens":{"en-US":"Choose the results shown when Search opens","es-ES":"Elige los resultados que aparecen al abrir Buscar","fr-FR":"Choisissez les résultats affichés à l'ouverture de Recherche","de-DE":"Ergebnisse beim Öffnen der Suche festlegen","pt-BR":"Escolha os resultados exibidos ao abrir a Pesquisa","ja-JP":"検索を開いたときに表示する結果を選択","en-GB":"Choose the results shown when Search opens"},"Show on opening Search":{"en-US":"Show on opening Search","es-ES":"Mostrar al abrir Buscar","fr-FR":"Afficher à l'ouverture de Recherche","de-DE":"Beim Öffnen der Suche anzeigen","pt-BR":"Mostrar ao abrir a Pesquisa","ja-JP":"検索開始時に表示","en-GB":"Show on opening Search"},"All results":{"en-US":"All results","es-ES":"Todos los resultados","fr-FR":"Tous les résultats","de-DE":"Alle Ergebnisse","pt-BR":"Todos os resultados","ja-JP":"すべての結果","en-GB":"All results"},"Show every available search result when the flyout opens.":{"en-US":"Show every available search result when the flyout opens.","es-ES":"Mostrar todos los resultados disponibles al abrir el panel.","fr-FR":"Afficher tous les résultats disponibles à l'ouverture du volet.","de-DE":"Alle verfügbaren Ergebnisse beim Öffnen anzeigen.","pt-BR":"Mostrar todos os resultados disponíveis ao abrir o painel.","ja-JP":"パネルを開いたときにすべての結果を表示します。","en-GB":"Show every available search result when the flyout opens."},"Recently opened":{"en-US":"Recently opened","es-ES":"Abiertos recientemente","fr-FR":"Récemment ouverts","de-DE":"Zuletzt geöffnet","pt-BR":"Abertos recentemente","ja-JP":"最近開いた項目","en-GB":"Recently opened"},"Show the results you most recently opened from Search.":{"en-US":"Show the results you most recently opened from Search.","es-ES":"Mostrar los resultados abiertos más recientemente desde Buscar.","fr-FR":"Afficher les résultats récemment ouverts depuis Recherche.","de-DE":"Zuletzt über die Suche geöffnete Ergebnisse anzeigen.","pt-BR":"Mostrar resultados abertos recentemente pela Pesquisa.","ja-JP":"検索から最近開いた結果を表示します。","en-GB":"Show the results you most recently opened from Search."},"Most used":{"en-US":"Most used","es-ES":"Más usados","fr-FR":"Les plus utilisés","de-DE":"Am häufigsten verwendet","pt-BR":"Mais usados","ja-JP":"よく使う項目","en-GB":"Most used"},"Show the results you open most often from Search.":{"en-US":"Show the results you open most often from Search.","es-ES":"Mostrar los resultados que abres con mayor frecuencia.","fr-FR":"Afficher les résultats que vous ouvrez le plus souvent.","de-DE":"Am häufigsten über die Suche geöffnete Ergebnisse anzeigen.","pt-BR":"Mostrar os resultados abertos com mais frequência.","ja-JP":"検索からよく開く結果を表示します。","en-GB":"Show the results you open most often from Search."},"Typing always searches all available actions.":{"en-US":"Typing always searches all available actions.","es-ES":"Al escribir se siguen buscando todas las acciones disponibles.","fr-FR":"La saisie recherche toujours toutes les actions disponibles.","de-DE":"Bei der Eingabe werden weiterhin alle Aktionen durchsucht.","pt-BR":"Ao digitar, todas as ações disponíveis continuam sendo pesquisadas.","ja-JP":"入力すると利用可能なすべての操作が検索されます。","en-GB":"Typing always searches all available actions."},"Context menu items":{"en-US":"Context menu items","es-ES":"Elementos del menú contextual","fr-FR":"Éléments du menu contextuel","de-DE":"Kontextmenüeinträge","pt-BR":"Itens do menu de contexto","ja-JP":"コンテキスト メニューの項目","en-GB":"Context menu items"},"Glass surface controls in context menu":{"en-US":"Glass surface controls in context menu","es-ES":"Controles de superficie de cristal en el menú contextual","fr-FR":"Contrôles de surface vitrée dans le menu contextuel","de-DE":"Glasoberflächen-Steuerung im Kontextmenü","pt-BR":"Controles da superfície de vidro no menu de contexto","ja-JP":"コンテキスト メニューのガラス表面設定","en-GB":"Glass surface controls in context menu"},"Show glass color and transparency controls when right-clicking the desktop":{"en-US":"Show glass color and transparency controls when right-clicking the desktop","es-ES":"Mostrar los controles de color y transparencia al hacer clic derecho","fr-FR":"Afficher les contrôles de couleur et transparence au clic droit","de-DE":"Glasfarbe und Transparenz beim Rechtsklick anzeigen","pt-BR":"Mostrar controles de cor e transparência ao clicar com o botão direito","ja-JP":"右クリック時にガラスの色と透明度を表示","en-GB":"Show glass color and transparency controls when right-clicking the desktop"},"Colors":{"en-US":"Colors","es-ES":"Colores","fr-FR":"Couleurs","de-DE":"Farben","pt-BR":"Cores","ja-JP":"色","en-GB":"Colours"},"Automatic accent color":{"en-US":"Automatic accent color","es-ES":"Color de énfasis automático","fr-FR":"Couleur d'accentuation automatique","de-DE":"Automatische Akzentfarbe","pt-BR":"Cor de destaque automática","ja-JP":"アクセント カラーを自動設定","en-GB":"Automatic accent colour"},"Extract an accent color from the desktop wallpaper":{"en-US":"Extract an accent color from the desktop wallpaper","es-ES":"Extraer un color del fondo de escritorio","fr-FR":"Extraire une couleur du fond d'écran","de-DE":"Akzentfarbe aus dem Hintergrundbild übernehmen","pt-BR":"Extrair a cor de destaque do papel de parede","ja-JP":"壁紙からアクセント カラーを抽出","en-GB":"Extract an accent color from the desktop wallpaper"},"Choose the accent for active controls":{"en-US":"Choose the accent for active controls","es-ES":"Elige el color de los controles activos","fr-FR":"Choisissez la couleur des commandes actives","de-DE":"Akzentfarbe für aktive Steuerelemente wählen","pt-BR":"Escolha a cor de destaque dos controles ativos","ja-JP":"アクティブな操作部品の色を選択","en-GB":"Choose the accent colour for active controls"},"Use the original 10H10 glass or add a color tint without changing the desktop palette":{"en-US":"Use the original 10H10 glass or add a color tint without changing the desktop palette","es-ES":"Usa el cristal original de 10H10 o añade un tinte sin cambiar la paleta","fr-FR":"Conservez le verre 10H10 ou ajoutez une teinte sans changer la palette","de-DE":"10H10-Glas beibehalten oder eine Tönung hinzufügen","pt-BR":"Use o vidro original do 10H10 ou aplique um tom sem alterar a paleta","ja-JP":"デスクトップ配色を変えずにガラスに色を付けられます","en-GB":"Use the original 10H10 glass or add a color tint without changing the desktop palette"},"Use any opacity from 0% to 100%. Lower values make Mica surfaces more transparent.":{"en-US":"Use any opacity from 0% to 100%. Lower values make Mica surfaces more transparent.","es-ES":"Elige una opacidad del 0 % al 100 %. Los valores bajos dan más transparencia.","fr-FR":"Réglez l'opacité de 0 à 100 %. Les valeurs basses augmentent la transparence.","de-DE":"Deckkraft von 0 bis 100 % einstellen. Niedrigere Werte erhöhen die Transparenz.","pt-BR":"Defina opacidade de 0 a 100%. Valores menores aumentam a transparência.","ja-JP":"不透明度を0～100%で設定します。低いほど透明になります。","en-GB":"Use any opacity from 0% to 100%. Lower values make Mica surfaces more transparent."},"Show shadows below windows":{"en-US":"Show shadows below windows","es-ES":"Mostrar sombras bajo las ventanas","fr-FR":"Afficher les ombres sous les fenêtres","de-DE":"Fensterschatten anzeigen","pt-BR":"Mostrar sombras sob as janelas","ja-JP":"ウィンドウの影を表示","en-GB":"Show shadows below windows"},"Enhance color saturation and contrast on the desktop":{"en-US":"Enhance color saturation and contrast on the desktop","es-ES":"Mejorar la saturación y el contraste del escritorio","fr-FR":"Améliorer la saturation et le contraste du bureau","de-DE":"Farbsättigung und Kontrast des Desktops verbessern","pt-BR":"Melhorar a saturação e o contraste da área de trabalho","ja-JP":"デスクトップの彩度とコントラストを強調","en-GB":"Enhance color saturation and contrast on the desktop"},"Reset appearance to 10H10 defaults":{"en-US":"Reset appearance to 10H10 defaults","es-ES":"Restablecer apariencia de 10H10","fr-FR":"Rétablir l'apparence par défaut de 10H10","de-DE":"Darstellung auf 10H10-Standard zurücksetzen","pt-BR":"Restaurar aparência padrão do 10H10","ja-JP":"10H10の外観設定を初期化","en-GB":"Reset appearance to 10H10 defaults"},"Taskbar items":{"en-US":"Taskbar items","es-ES":"Elementos de la barra de tareas","fr-FR":"Éléments de la barre des tâches","de-DE":"Taskleistenelemente","pt-BR":"Itens da barra de tarefas","ja-JP":"タスクバーの項目","en-GB":"Taskbar items"},"Search":{"en-US":"Search","es-ES":"Buscar","fr-FR":"Rechercher","de-DE":"Suche","pt-BR":"Pesquisar","ja-JP":"検索","en-GB":"Search"},"Choose how Search is shown on the taskbar.":{"en-US":"Choose how Search is shown on the taskbar.","es-ES":"Elige cómo se muestra Buscar en la barra de tareas.","fr-FR":"Choisissez l'affichage de Recherche dans la barre des tâches.","de-DE":"Anzeige der Suche auf der Taskleiste auswählen.","pt-BR":"Escolha como a Pesquisa aparece na barra de tarefas.","ja-JP":"タスクバーでの検索の表示方法を選択します。","en-GB":"Choose how Search is shown on the taskbar."},"Icon only":{"en-US":"Icon only","es-ES":"Solo icono","fr-FR":"Icône seule","de-DE":"Nur Symbol","pt-BR":"Somente ícone","ja-JP":"アイコンのみ","en-GB":"Icon only"},"Keep Search compact.":{"en-US":"Keep Search compact.","es-ES":"Mantener Buscar compacto.","fr-FR":"Garder Recherche compacte.","de-DE":"Suche kompakt halten.","pt-BR":"Manter a Pesquisa compacta.","ja-JP":"検索をコンパクトに表示します。","en-GB":"Keep Search compact."},"Icon & search bar":{"en-US":"Icon & search bar","es-ES":"Icono y barra de búsqueda","fr-FR":"Icône et barre de recherche","de-DE":"Symbol und Suchleiste","pt-BR":"Ícone e barra de pesquisa","ja-JP":"アイコンと検索バー","en-GB":"Icon & search bar"},"Always show the search box.":{"en-US":"Always show the search box.","es-ES":"Mostrar siempre el cuadro de búsqueda.","fr-FR":"Toujours afficher le champ de recherche.","de-DE":"Suchfeld immer anzeigen.","pt-BR":"Sempre mostrar a caixa de pesquisa.","ja-JP":"検索ボックスを常に表示します。","en-GB":"Always show the search box."},"Expand on hover":{"en-US":"Expand on hover","es-ES":"Expandir al pasar el cursor","fr-FR":"Développer au survol","de-DE":"Beim Darüberfahren erweitern","pt-BR":"Expandir ao passar o mouse","ja-JP":"ホバーで展開","en-GB":"Expand on hover"},"Show the bar when hovered.":{"en-US":"Show the bar when hovered.","es-ES":"Mostrar la barra al pasar el cursor.","fr-FR":"Afficher la barre au survol.","de-DE":"Leiste beim Darüberfahren anzeigen.","pt-BR":"Mostrar a barra ao passar o mouse.","ja-JP":"ホバー時にバーを表示します。","en-GB":"Show the bar when hovered."},"App icon & name":{"en-US":"App icon & name","es-ES":"Icono y nombre de la aplicación","fr-FR":"Icône et nom de l'application","de-DE":"App-Symbol und Name","pt-BR":"Ícone e nome do aplicativo","ja-JP":"アプリアイコンと名前","en-GB":"App icon & name"},"Keep app buttons compact.":{"en-US":"Keep app buttons compact.","es-ES":"Mantener compactos los botones de las aplicaciones.","fr-FR":"Garder les boutons d'applications compacts.","de-DE":"App-Schaltflächen kompakt halten.","pt-BR":"Manter os botões dos aplicativos compactos.","ja-JP":"アプリボタンをコンパクトにします。","en-GB":"Keep app buttons compact."},"Icon & app name":{"en-US":"Icon & app name","es-ES":"Icono y nombre","fr-FR":"Icône et nom","de-DE":"Symbol und App-Name","pt-BR":"Ícone e nome","ja-JP":"アイコンとアプリ名","en-GB":"Icon & app name"},"Show each name beside its icon.":{"en-US":"Show each name beside its icon.","es-ES":"Mostrar cada nombre junto al icono.","fr-FR":"Afficher chaque nom à côté de l'icône.","de-DE":"App-Namen neben Symbolen anzeigen.","pt-BR":"Mostrar cada nome ao lado do ícone.","ja-JP":"各アイコンの横にアプリ名を表示します。","en-GB":"Show each name beside its icon."},"Taskbar icon alignment":{"en-US":"Taskbar icon alignment","es-ES":"Alineación de iconos de la barra de tareas","fr-FR":"Alignement des icônes de la barre des tâches","de-DE":"Ausrichtung der Taskleistensymbole","pt-BR":"Alinhamento dos ícones da barra de tarefas","ja-JP":"タスクバーアイコンの配置","en-GB":"Taskbar icon alignment"},"Taskbar style":{"en-US":"Taskbar style","es-ES":"Estilo de barra de tareas","fr-FR":"Style de la barre des tâches","de-DE":"Taskleistenstil","pt-BR":"Estilo da barra de tarefas","ja-JP":"タスクバーのスタイル","en-GB":"Taskbar style"},"Attached":{"en-US":"Attached","es-ES":"Acoplada","fr-FR":"Attachée","de-DE":"Angedockt","pt-BR":"Acoplada","ja-JP":"固定","en-GB":"Attached"},"Floating":{"en-US":"Floating","es-ES":"Flotante","fr-FR":"Flottante","de-DE":"Schwebend","pt-BR":"Flutuante","ja-JP":"フローティング","en-GB":"Floating"},"Edge-to-edge · No gap":{"en-US":"Edge-to-edge · No gap","es-ES":"De borde a borde · Sin separación","fr-FR":"Bord à bord · Sans espace","de-DE":"Randlos · Ohne Abstand","pt-BR":"De ponta a ponta · Sem espaço","ja-JP":"画面端まで・隙間なし","en-GB":"Edge-to-edge · No gap"},"One rounded, seamless bar":{"en-US":"One rounded, seamless bar","es-ES":"Una barra redondeada y continua","fr-FR":"Une barre arrondie sans interruption","de-DE":"Eine durchgehende abgerundete Leiste","pt-BR":"Uma barra arredondada e contínua","ja-JP":"一体型の丸みのあるバー","en-GB":"One rounded, seamless bar"},"Configure the clock, time format, and Windows display language.":{"en-US":"Configure the clock, time format, and Windows display language.","es-ES":"Configura el reloj, el formato de hora y el idioma de Windows.","fr-FR":"Configurez l'horloge, le format et la langue de Windows.","de-DE":"Uhrzeit, Zeitformat und Windows-Anzeigesprache konfigurieren.","pt-BR":"Configure o relógio, o formato de hora e o idioma do Windows.","ja-JP":"時計、時刻の形式、Windowsの表示言語を設定します。","en-GB":"Configure the clock, time format, and Windows display language."},"Use the device's local time zone (off: UTC)":{"en-US":"Use the device's local time zone (off: UTC)","es-ES":"Usar la zona horaria local (desactivado: UTC)","fr-FR":"Utiliser le fuseau horaire local (désactivé : UTC)","de-DE":"Lokale Zeitzone verwenden (aus: UTC)","pt-BR":"Usar o fuso horário local (desativado: UTC)","ja-JP":"現地のタイムゾーンを使用（オフの場合はUTC）","en-GB":"Use the device's local time zone (off: UTC)"},"Use the local calendar date (off: UTC)":{"en-US":"Use the local calendar date (off: UTC)","es-ES":"Usar la fecha local (desactivado: UTC)","fr-FR":"Utiliser la date locale (désactivé : UTC)","de-DE":"Lokales Datum verwenden (aus: UTC)","pt-BR":"Usar a data local (desativado: UTC)","ja-JP":"現地の日付を使用（オフの場合はUTC）","en-GB":"Use the local calendar date (off: UTC)"},"Choose the display language for the desktop and Settings.":{"en-US":"Choose the display language for the desktop and Settings.","es-ES":"Elige el idioma del escritorio y de Configuración.","fr-FR":"Choisissez la langue du bureau et des Paramètres.","de-DE":"Anzeigesprache für Desktop und Einstellungen wählen.","pt-BR":"Escolha o idioma da área de trabalho e das Configurações.","ja-JP":"デスクトップと設定の表示言語を選択します。","en-GB":"Choose the display language for the desktop and Settings."},"Changing the display language restarts WebWindows.":{"en-US":"Changing the display language restarts WebWindows.","es-ES":"Al cambiar el idioma, WebWindows se reiniciará.","fr-FR":"Changer la langue redémarre WebWindows.","de-DE":"Beim Ändern der Anzeigesprache wird WebWindows neu gestartet.","pt-BR":"Alterar o idioma reinicia o WebWindows.","ja-JP":"表示言語を変更するとWebWindowsが再起動します。","en-GB":"Changing the display language restarts WebWindows."},"Available updates":{"en-US":"Available updates","es-ES":"Actualizaciones disponibles","fr-FR":"Mises à jour disponibles","de-DE":"Verfügbare Updates","pt-BR":"Atualizações disponíveis","ja-JP":"利用可能な更新プログラム","en-GB":"Available updates"},"Learn more":{"en-US":"Learn more","es-ES":"Más información","fr-FR":"En savoir plus","de-DE":"Weitere Informationen","pt-BR":"Saiba mais","ja-JP":"詳細情報","en-GB":"Learn more"},"Pending restart":{"en-US":"Pending restart","es-ES":"Reinicio pendiente","fr-FR":"Redémarrage en attente","de-DE":"Neustart ausstehend","pt-BR":"Reinicialização pendente","ja-JP":"再起動待ち","en-GB":"Pending restart"},"Get the latest updates as soon as they're available":{"en-US":"Get the latest updates as soon as they're available","es-ES":"Obtener las actualizaciones en cuanto estén disponibles","fr-FR":"Recevoir les dernières mises à jour dès leur disponibilité","de-DE":"Neueste Updates sofort nach Verfügbarkeit erhalten","pt-BR":"Obter as atualizações assim que estiverem disponíveis","ja-JP":"最新の更新プログラムを入手する","en-GB":"Get the latest updates as soon as they're available"},"Windows Insider Program":{"en-US":"Windows Insider Program","es-ES":"Programa Windows Insider","fr-FR":"Programme Windows Insider","de-DE":"Windows-Insider-Programm","pt-BR":"Programa Windows Insider","ja-JP":"Windows Insider Program","en-GB":"Windows Insider Program"},"Get preview builds of Windows to share feedback on new features and updates":{"en-US":"Get preview builds of Windows to share feedback on new features and updates","es-ES":"Obtén compilaciones de prueba para compartir comentarios","fr-FR":"Obtenez des versions d'essai pour donner votre avis","de-DE":"Vorabversionen testen und Feedback geben","pt-BR":"Receba versões de teste e compartilhe comentários","ja-JP":"プレビュービルドを入手してフィードバックを送信","en-GB":"Get preview builds of Windows to share feedback on new features and updates"},"Pause update checks for up to one month.":{"en-US":"Pause update checks for up to one month.","es-ES":"Pausa las comprobaciones durante un mes como máximo.","fr-FR":"Suspendre les recherches de mises à jour pendant un mois.","de-DE":"Updateprüfungen bis zu einem Monat aussetzen.","pt-BR":"Pause verificações de atualização por até um mês.","ja-JP":"更新の確認を最大1か月停止します。","en-GB":"Pause update checks for up to one month."},"Select pause end date (1 day to 1 month):":{"en-US":"Select pause end date (1 day to 1 month):","es-ES":"Elige la fecha de reanudación (1 día a 1 mes):","fr-FR":"Choisissez la date de reprise (1 jour à 1 mois) :","de-DE":"Enddatum der Pause (1 Tag bis 1 Monat):","pt-BR":"Selecione a data final (1 dia a 1 mês):","ja-JP":"一時停止の終了日（1日～1か月）:","en-GB":"Select pause end date (1 day to 1 month):"},"Resume updates":{"en-US":"Resume updates","es-ES":"Reanudar actualizaciones","fr-FR":"Reprendre les mises à jour","de-DE":"Updates fortsetzen","pt-BR":"Retomar atualizações","ja-JP":"更新を再開","en-GB":"Resume updates"},"Current":{"en-US":"Current","es-ES":"Actual","fr-FR":"Actuel","de-DE":"Aktuell","pt-BR":"Atual","ja-JP":"現在","en-GB":"Current"},"System Info":{"en-US":"System Info","es-ES":"Información del sistema","fr-FR":"Informations système","de-DE":"Systeminformationen","pt-BR":"Informações do sistema","ja-JP":"システム情報","en-GB":"System Info"},"Windows specifications":{"en-US":"Windows specifications","es-ES":"Especificaciones de Windows","fr-FR":"Spécifications de Windows","de-DE":"Windows-Spezifikationen","pt-BR":"Especificações do Windows","ja-JP":"Windowsの仕様","en-GB":"Windows specifications"},"Copy":{"en-US":"Copy","es-ES":"Copiar","fr-FR":"Copier","de-DE":"Kopieren","pt-BR":"Copiar","ja-JP":"コピー","en-GB":"Copy"},"Edition":{"en-US":"Edition","es-ES":"Edición","fr-FR":"Édition","de-DE":"Edition","pt-BR":"Edição","ja-JP":"エディション","en-GB":"Edition"},"Version":{"en-US":"Version","es-ES":"Versión","fr-FR":"Version","de-DE":"Version","pt-BR":"Versão","ja-JP":"バージョン","en-GB":"Version"},"Channel":{"en-US":"Channel","es-ES":"Canal","fr-FR":"Canal","de-DE":"Kanal","pt-BR":"Canal","ja-JP":"チャネル","en-GB":"Channel"},"OS build":{"en-US":"OS build","es-ES":"Compilación del SO","fr-FR":"Build du système","de-DE":"Betriebssystembuild","pt-BR":"Compilação do SO","ja-JP":"OS ビルド","en-GB":"OS build"},"Choose preview experiences and the Windows release you'd like to explore.":{"en-US":"Choose preview experiences and the Windows release you'd like to explore.","es-ES":"Elige las experiencias de prueba y la versión de Windows.","fr-FR":"Choisissez les expériences d'aperçu et la version de Windows.","de-DE":"Vorschauoptionen und Windows-Version auswählen.","pt-BR":"Escolha experiências de prévia e a versão do Windows.","ja-JP":"プレビューの種類とWindowsのリリースを選択します。","en-GB":"Choose preview experiences and the Windows release you'd like to explore."},"Select your experience":{"en-US":"Select your experience","es-ES":"Selecciona tu experiencia","fr-FR":"Sélectionnez votre expérience","de-DE":"Vorschauerfahrung auswählen","pt-BR":"Selecione sua experiência","ja-JP":"エクスペリエンスを選択","en-GB":"Select your experience"},"Experimental":{"en-US":"Experimental","es-ES":"Experimental","fr-FR":"Expérimental","de-DE":"Experimentell","pt-BR":"Experimental","ja-JP":"試験的","en-GB":"Experimental"},"Beta":{"en-US":"Beta","es-ES":"Beta","fr-FR":"Bêta","de-DE":"Beta","pt-BR":"Beta","ja-JP":"ベータ","en-GB":"Beta"},"Release Preview":{"en-US":"Release Preview","es-ES":"Vista previa de versión","fr-FR":"Préversion de version","de-DE":"Release Preview","pt-BR":"Prévia da versão","ja-JP":"リリース プレビュー","en-GB":"Release Preview"},"Checking preview availability.":{"en-US":"Checking preview availability.","es-ES":"Comprobando disponibilidad de versiones de prueba.","fr-FR":"Vérification des versions disponibles.","de-DE":"Verfügbarkeit von Vorabversionen wird geprüft.","pt-BR":"Verificando disponibilidade de prévias.","ja-JP":"プレビューの提供状況を確認しています。","en-GB":"Checking preview availability."},"Advanced options":{"en-US":"Advanced options","es-ES":"Opciones avanzadas","fr-FR":"Options avancées","de-DE":"Erweiterte Optionen","pt-BR":"Opções avançadas","ja-JP":"詳細オプション","en-GB":"Advanced options"},"You can also select the product you would like to flight from the list below":{"en-US":"You can also select the product you would like to flight from the list below","es-ES":"También puedes seleccionar la versión que quieres probar","fr-FR":"Vous pouvez aussi sélectionner la version à tester","de-DE":"Sie können auch die gewünschte Vorschauversion auswählen","pt-BR":"Você também pode selecionar a versão que deseja testar","ja-JP":"テストする製品を以下から選択できます","en-GB":"You can also select the product you would like to flight from the list below"},"Preview changes targeting the 10H10 release":{"en-US":"Preview changes targeting the 10H10 release","es-ES":"Prueba los cambios de la versión 10H10","fr-FR":"Essayez les changements destinés à 10H10","de-DE":"Änderungen für Version 10H10 testen","pt-BR":"Teste as alterações previstas para o 10H10","ja-JP":"10H10向けの変更をプレビュー","en-GB":"Preview changes targeting the 10H10 release"},"Preview changes targeting the 11H11 release":{"en-US":"Preview changes targeting the 11H11 release","es-ES":"Prueba los cambios de la versión 11H11","fr-FR":"Essayez les changements destinés à 11H11","de-DE":"Änderungen für Version 11H11 testen","pt-BR":"Teste as alterações previstas para o 11H11","ja-JP":"11H11向けの変更をプレビュー","en-GB":"Preview changes targeting the 11H11 release"},"Future Platforms":{"en-US":"Future Platforms","es-ES":"Plataformas futuras","fr-FR":"Plateformes futures","de-DE":"Zukünftige Plattformen","pt-BR":"Plataformas futuras","ja-JP":"将来のプラットフォーム","en-GB":"Future Platforms"},"Show Release Preview":{"en-US":"Show Release Preview","es-ES":"Mostrar vista previa de versión","fr-FR":"Afficher la préversion de version","de-DE":"Release Preview anzeigen","pt-BR":"Mostrar prévia de versão","ja-JP":"リリース プレビューを表示","en-GB":"Show Release Preview"},"Manage account details and sign-in preferences.":{"en-US":"Manage account details and sign-in preferences.","es-ES":"Administra los datos de la cuenta y las opciones de inicio de sesión.","fr-FR":"Gérez les informations du compte et les options de connexion.","de-DE":"Kontodaten und Anmeldeeinstellungen verwalten.","pt-BR":"Gerencie os dados da conta e as preferências de login.","ja-JP":"アカウント情報とサインイン設定を管理します。","en-GB":"Manage account details and sign-in preferences."},"Set the displayed name in Settings":{"en-US":"Set the displayed name in Settings","es-ES":"Configura el nombre mostrado en Configuración","fr-FR":"Définissez le nom affiché dans les Paramètres","de-DE":"Anzeigenamen in den Einstellungen festlegen","pt-BR":"Defina o nome exibido nas Configurações","ja-JP":"設定に表示する名前を指定","en-GB":"Set the displayed name in Settings"},"PIN options":{"en-US":"PIN options","es-ES":"Opciones de PIN","fr-FR":"Options du code PIN","de-DE":"PIN-Optionen","pt-BR":"Opções de PIN","ja-JP":"PIN オプション","en-GB":"PIN options"},"Morse code sign-in and bootup PIN behavior":{"en-US":"Morse code sign-in and bootup PIN behavior","es-ES":"Inicio de sesión Morse y comportamiento del PIN al arrancar","fr-FR":"Connexion en Morse et comportement du PIN au démarrage","de-DE":"Morsecode-Anmeldung und PIN-Verhalten beim Start","pt-BR":"Login em Morse e comportamento do PIN na inicialização","ja-JP":"モールス信号PINと起動時のPIN動作","en-GB":"Morse code sign-in and bootup PIN behavior"},"User password":{"en-US":"User password","es-ES":"Contraseña del usuario","fr-FR":"Mot de passe utilisateur","de-DE":"Benutzerkennwort","pt-BR":"Senha do usuário","ja-JP":"ユーザーパスワード","en-GB":"User password"},"Create or change an optional WebWindows login password":{"en-US":"Create or change an optional WebWindows login password","es-ES":"Crea o cambia una contraseña de inicio de sesión opcional","fr-FR":"Créez ou modifiez un mot de passe de connexion facultatif","de-DE":"Optionales Anmeldekennwort erstellen oder ändern","pt-BR":"Crie ou altere uma senha de login opcional","ja-JP":"任意のサインインパスワードを作成・変更","en-GB":"Create or change an optional WebWindows login password"},"Manage password":{"en-US":"Manage password","es-ES":"Administrar contraseña","fr-FR":"Gérer le mot de passe","de-DE":"Kennwort verwalten","pt-BR":"Gerenciar senha","ja-JP":"パスワードを管理","en-GB":"Manage password"},"Configure additional PIN sign-in behavior":{"en-US":"Configure additional PIN sign-in behavior","es-ES":"Configura opciones adicionales de inicio de sesión con PIN","fr-FR":"Configurez les options de connexion par PIN","de-DE":"Zusätzliche PIN-Anmeldeoptionen konfigurieren","pt-BR":"Configure opções adicionais de login por PIN","ja-JP":"追加のPINサインイン動作を設定","en-GB":"Configure additional PIN sign-in behavior"},"Additional PIN Settings":{"en-US":"Additional PIN Settings","es-ES":"Configuración adicional de PIN","fr-FR":"Paramètres PIN supplémentaires","de-DE":"Zusätzliche PIN-Einstellungen","pt-BR":"Configurações adicionais de PIN","ja-JP":"追加のPIN設定","en-GB":"Additional PIN Settings"},"Enable Morse code PIN entry":{"en-US":"Enable Morse code PIN entry","es-ES":"Permitir introducir el PIN en código Morse","fr-FR":"Activer la saisie du PIN en morse","de-DE":"PIN-Eingabe als Morsecode aktivieren","pt-BR":"Ativar entrada de PIN em código Morse","ja-JP":"モールス信号でのPIN入力を有効にする","en-GB":"Enable Morse code PIN entry"},"Enable bootup key only":{"en-US":"Enable bootup key only","es-ES":"Activar clave solo al iniciar","fr-FR":"Activer la clé au démarrage uniquement","de-DE":"Schlüssel nur beim Start aktivieren","pt-BR":"Ativar chave apenas na inicialização","ja-JP":"起動時のみキーを有効にする","en-GB":"Enable bootup key only"},"Sign-in":{"en-US":"Sign-in","es-ES":"Inicio de sesión","fr-FR":"Connexion","de-DE":"Anmeldung","pt-BR":"Entrada","ja-JP":"サインイン","en-GB":"Sign-in"},"Lock this desktop":{"en-US":"Lock this desktop","es-ES":"Bloquear este escritorio","fr-FR":"Verrouiller ce bureau","de-DE":"Diesen Desktop sperren","pt-BR":"Bloquear esta área de trabalho","ja-JP":"このデスクトップをロック","en-GB":"Lock this desktop"},"Open the lock screen now (Win+L is also supported)":{"en-US":"Open the lock screen now (Win+L is also supported)","es-ES":"Abrir la pantalla de bloqueo (también Win+L)","fr-FR":"Ouvrir l'écran de verrouillage (ou Win+L)","de-DE":"Sperrbildschirm öffnen (auch Win+L)","pt-BR":"Abrir tela de bloqueio (também Win+L)","ja-JP":"ロック画面を開く（Win+Lにも対応）","en-GB":"Open the lock screen now (Win+L is also supported)"},"Lock now":{"en-US":"Lock now","es-ES":"Bloquear ahora","fr-FR":"Verrouiller maintenant","de-DE":"Jetzt sperren","pt-BR":"Bloquear agora","ja-JP":"今すぐロック","en-GB":"Lock now"},"Apps":{"en-US":"Apps","es-ES":"Aplicaciones","fr-FR":"Applications","de-DE":"Apps","pt-BR":"Aplicativos","ja-JP":"アプリ","en-GB":"Apps"},"Pinned":{"en-US":"Pinned","es-ES":"Ancladas","fr-FR":"Épinglées","de-DE":"Angeheftet","pt-BR":"Fixados","ja-JP":"ピン留め済み","en-GB":"Pinned"},"News":{"en-US":"News","es-ES":"Noticias","fr-FR":"Actualités","de-DE":"Nachrichten","pt-BR":"Notícias","ja-JP":"ニュース","en-GB":"News"},"Local account":{"en-US":"Local account","es-ES":"Cuenta local","fr-FR":"Compte local","de-DE":"Lokales Konto","pt-BR":"Conta local","ja-JP":"ローカル アカウント","en-GB":"Local account"},"About":{"en-US":"About","es-ES":"Acerca de","fr-FR":"À propos","de-DE":"Info","pt-BR":"Sobre","ja-JP":"バージョン情報","en-GB":"About"},"Security":{"en-US":"Security","es-ES":"Seguridad","fr-FR":"Sécurité","de-DE":"Sicherheit","pt-BR":"Segurança","ja-JP":"セキュリティ","en-GB":"Security"},"Feedback":{"en-US":"Feedback","es-ES":"Comentarios","fr-FR":"Commentaires","de-DE":"Feedback","pt-BR":"Comentários","ja-JP":"フィードバック","en-GB":"Feedback"},"Local weather":{"en-US":"Local weather","es-ES":"Tiempo local","fr-FR":"Météo locale","de-DE":"Lokales Wetter","pt-BR":"Clima local","ja-JP":"地域の天気","en-GB":"Local weather"},"Local forecast":{"en-US":"Local forecast","es-ES":"Pronóstico local","fr-FR":"Prévisions locales","de-DE":"Lokale Wettervorhersage","pt-BR":"Previsão local","ja-JP":"地域の予報","en-GB":"Local forecast"},"Current conditions":{"en-US":"Current conditions","es-ES":"Condiciones actuales","fr-FR":"Conditions actuelles","de-DE":"Aktuelle Bedingungen","pt-BR":"Condições atuais","ja-JP":"現在の天気","en-GB":"Current conditions"},"Feels like":{"en-US":"Feels like","es-ES":"Sensación térmica","fr-FR":"Ressenti","de-DE":"Gefühlt","pt-BR":"Sensação térmica","ja-JP":"体感温度","en-GB":"Feels like"},"Hourly forecast":{"en-US":"Hourly forecast","es-ES":"Pronóstico por horas","fr-FR":"Prévisions horaires","de-DE":"Stündliche Vorhersage","pt-BR":"Previsão por hora","ja-JP":"時間別予報","en-GB":"Hourly forecast"},"Next 5 hours":{"en-US":"Next 5 hours","es-ES":"Próximas 5 horas","fr-FR":"5 prochaines heures","de-DE":"Nächste 5 Stunden","pt-BR":"Próximas 5 horas","ja-JP":"今後5時間","en-GB":"Next 5 hours"},"Daily forecast":{"en-US":"Daily forecast","es-ES":"Pronóstico diario","fr-FR":"Prévisions quotidiennes","de-DE":"Tagesvorhersage","pt-BR":"Previsão diária","ja-JP":"日別予報","en-GB":"Daily forecast"},"5-day outlook":{"en-US":"5-day outlook","es-ES":"Pronóstico de 5 días","fr-FR":"Prévisions à 5 jours","de-DE":"5-Tage-Ausblick","pt-BR":"Previsão para 5 dias","ja-JP":"5日間の見通し","en-GB":"5-day outlook"},"Humidity":{"en-US":"Humidity","es-ES":"Humedad","fr-FR":"Humidité","de-DE":"Luftfeuchtigkeit","pt-BR":"Umidade","ja-JP":"湿度","en-GB":"Humidity"},"Wind":{"en-US":"Wind","es-ES":"Viento","fr-FR":"Vent","de-DE":"Wind","pt-BR":"Vento","ja-JP":"風","en-GB":"Wind"},"Live headlines":{"en-US":"Live headlines","es-ES":"Titulares en directo","fr-FR":"Titres en direct","de-DE":"Aktuelle Schlagzeilen","pt-BR":"Manchetes ao vivo","ja-JP":"最新の見出し","en-GB":"Live headlines"},"News data sources":{"en-US":"News data sources","es-ES":"Fuentes de noticias","fr-FR":"Sources des actualités","de-DE":"Nachrichtenquellen","pt-BR":"Fontes de notícias","ja-JP":"ニュースの情報源","en-GB":"News data sources"},"Weather data sources":{"en-US":"Weather data sources","es-ES":"Fuentes meteorológicas","fr-FR":"Sources météo","de-DE":"Wetterdatenquellen","pt-BR":"Fontes de dados meteorológicos","ja-JP":"天気データの情報源","en-GB":"Weather data sources"},"Refresh headlines":{"en-US":"Refresh headlines","es-ES":"Actualizar titulares","fr-FR":"Actualiser les titres","de-DE":"Schlagzeilen aktualisieren","pt-BR":"Atualizar manchetes","ja-JP":"見出しを更新","en-GB":"Refresh headlines"},"Connecting…":{"en-US":"Connecting…","es-ES":"Conectando…","fr-FR":"Connexion…","de-DE":"Verbindung wird hergestellt…","pt-BR":"Conectando…","ja-JP":"接続中…","en-GB":"Connecting…"},"Loading headlines…":{"en-US":"Loading headlines…","es-ES":"Cargando titulares…","fr-FR":"Chargement des titres…","de-DE":"Schlagzeilen werden geladen…","pt-BR":"Carregando manchetes…","ja-JP":"見出しを読み込み中…","en-GB":"Loading headlines…"},"Night light":{"en-US":"Night light","es-ES":"Luz nocturna","fr-FR":"Éclairage nocturne","de-DE":"Nachtmodus","pt-BR":"Luz noturna","ja-JP":"夜間モード","en-GB":"Night light"},"Today":{"en-US":"Today","es-ES":"Hoy","fr-FR":"Aujourd'hui","de-DE":"Heute","pt-BR":"Hoje","ja-JP":"今日","en-GB":"Today"},"Restarting":{"en-US":"Restarting","es-ES":"Reiniciando","fr-FR":"Redémarrage en cours","de-DE":"Wird neu gestartet","pt-BR":"Reiniciando","ja-JP":"再起動しています","en-GB":"Restarting"}};
  const ww10LocalizedOriginals = new WeakMap();
  const ww10LocalizationRoots = ['settings-window','ww10-start-menu','ww-weather','ww-lock-widgets','ww-quick','ww-calendar','appearance-menu','search-panel','ww-security','ww10-taskbar-menu'];
  function applyExtendedLanguage() {
    const lang = state.language;
    for (const id of ww10LocalizationRoots) {
      const region = $(id);
      if (!region) continue;
      const walker = document.createTreeWalker(region, NodeFilter.SHOW_TEXT);
      let node;
      while ((node=walker.nextNode())) {
        if (!node.parentElement || node.parentElement.closest('script,style,textarea,option,[contenteditable="true"]')) continue;
        const original = ww10LocalizedOriginals.get(node) ?? node.nodeValue;
        const exact = original.trim();
        const translation = ww10ExtendedTranslations[exact]?.[lang];
        if (!translation) continue;
        if (!ww10LocalizedOriginals.has(node)) ww10LocalizedOriginals.set(node,original);
        node.nodeValue = original.replace(exact,translation);
      }
      // Controls carrying instructions as attributes are translated without
      // modifying their values, callbacks or other functional attributes.
      region.querySelectorAll('[title],[aria-label],[placeholder]').forEach(element => {
        for (const attr of ['title','aria-label','placeholder']) {
          const value=element.getAttribute(attr);
          if (!value) continue;
          const cacheKey='ww10Original'+attr.replace('-','');
          const original=element.dataset[cacheKey]||value;
          const localized=ww10ExtendedTranslations[original]?.[lang];
          if (!localized) continue;
          if (!element.dataset[cacheKey]) element.dataset[cacheKey]=original;
          element.setAttribute(attr,localized);
        }
      });
    }
  }

  function applyLanguage() {
    $('ww-language-select').value=state.language;
    $('ww-language-summary').textContent=timeLangs[state.language];
    const displayLanguage = $('ww10-language-current');
    if (displayLanguage) displayLanguage.textContent = timeLangs[state.language];
    dialog.querySelectorAll('input[name="ww10-language-option"]').forEach(input=>{
      input.checked = input.value === state.language;
    });
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
    applyExtendedLanguage();
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
  let ww10LanguageRestarting=false;
  function restartForDisplayLanguage(nextLanguage) {
    if (ww10LanguageRestarting) return;
    ww10LanguageRestarting=true;
    const screen=$('ww10-language-restart');
    const message=$('ww10-language-restart-message');
    const translated=ww10ExtendedTranslations['Restarting']?.[nextLanguage] || 'Restarting';
    if (message) message.textContent=translated;
    if (screen) {
      screen.setAttribute('aria-label',translated);
      screen.hidden=false;
    }
    // The saved language is read on startup. Reloading only the app avoids
    // interfering with the device's operating system.
    window.setTimeout(()=>window.location.reload(),2300);
  }
  // The Language page now uses the same inline Settings disclosure as
  // Taskbar and Search; changing its radio still uses the existing select's
  // persistence, localized restart screen, and page reload implementation.
  const languageDisclosure=$('ww10-language-display-toggle');
  const languagePanel=$('ww10-language-display-panel');
  languageDisclosure?.addEventListener('click',()=>{
    const expanded=languageDisclosure.getAttribute('aria-expanded')!=='true';
    languageDisclosure.setAttribute('aria-expanded',String(expanded));
    languagePanel.hidden=!expanded;
  });
  languagePanel?.addEventListener('change',event=>{
    const radio=event.target.closest('input[name="ww10-language-option"]');
    if(!radio || !radio.checked || ww10LanguageRestarting)return;
    const languageSelect=$('ww-language-select');
    if(languageSelect.value === radio.value)return;
    languageSelect.value=radio.value;
    languageSelect.dispatchEvent(new Event('change',{bubbles:true}));
  });

  $('ww-language-select').addEventListener('change',e=>{
    const next=e.target.value;
    if (next===state.language || !allowed.language.includes(next) || ww10LanguageRestarting) return;
    const previous=state.language;
    state.language=next;
    if (!persist()) {
      // When storage is denied, keep the language change usable instead of
      // showing a restart that cannot retain the new preference.
      applyLanguage();applyTime();
      return;
    }
    restartForDisplayLanguage(next);
  });
  window.addEventListener('webwindows:start-opening',applyExtendedLanguage);
  window.addEventListener('webwindows:news-updated',applyExtendedLanguage);
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
  // Available updates and Insider use the same validated, same-origin manifests.
  // Verification is publisher-supplied metadata, NOT a cryptographic signature.
  const insiderExperienceChoices=[...dialog.querySelectorAll('input[name="ww10-insider-experience"]')];
  const insiderReleaseChoice=$('ww10-insider-release-choice');
  const insiderProductChoices=[...dialog.querySelectorAll('input[name="ww10-insider-product"]')];
  const insiderReleaseInput=$('ww10-insider-release-preview');
  const insiderReleaseLabel=$('ww10-insider-release-state');
  const insiderAdvancedTrigger=$('ww10-insider-advanced-trigger');
  const insiderAdvancedContent=$('ww10-insider-advanced-content');
  const MANIFEST_SOURCES=Object.freeze({
    experimental:['Build-update/Experimental/Experimental_2610140_1.json'],
    beta:['Build-update/Beta/Beta_2610140_5.json'],
    release:['Build-update/Release-preview/Release-Preview_2610140_10.json','Build-update/Release-preview/Release-preview_2610140_10.json'],
    stable:['Build-update/Release/Release_2610140_15.json']
  });
  const INSTALLER_PATH='Update/index.html';
  const CHANNEL_DIRS=Object.freeze({
    experimental:'Build-update/Experimental/',
    beta:'Build-update/Beta/',
    release:'Build-update/Release-preview/',
    stable:'Build-update/Release/'
  });
  const CHANNEL_FILE_PREFIX=Object.freeze({
    experimental:/^Experimental_\d{5,10}_\d{1,6}\.json$/i,
    beta:/^Beta_\d{5,10}_\d{1,6}\.json$/i,
    release:/^Release[-_]Preview_\d{5,10}_\d{1,6}\.json$/i,
    stable:/^Release_\d{5,10}_\d{1,6}\.json$/i
  });
  const INSIDER_CHANNEL_PATHS=Object.freeze(Object.fromEntries(Object.entries(CHANNEL_DIRS).map(([k,path])=>[k,path+'index.html'])));
  const UPDATE_RECORDS_KEY='webwindows.10h10.applied-updates.v1';
  const UPDATE_SKIPPED_KEY='webwindows.10h10.declined-updates.v1';
  const readLocalJson=(key,fallback)=>{try{const val=JSON.parse(localStorage.getItem(key)||'null');return val && typeof val==='object'?val:fallback;}catch{return fallback;}};
  const appliedUpdateRecords=readLocalJson(UPDATE_RECORDS_KEY,{});
  const skippedUpdateRecords=readLocalJson(UPDATE_SKIPPED_KEY,{});
  const saveLocal=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
  const manifestCache=new Map();
  let latestUpdateScan=null;
  let scanInFlight=null;
  let updateScanCounter=0;
  let insiderProbe=null;
  let insiderLastProbe=0;
  const insiderChannelAvailable={experimental:null,beta:null,release:null};
  const strictDate=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)===value;
  function checkManifestFields(raw,channel,path,indexPath){
    if (!raw || Array.isArray(raw) || typeof raw!=='object') throw Error('Expected an update object');
    const {version,description,build,update_date}=raw;
    if(typeof version!=='string' || !/^[A-Za-z0-9][A-Za-z0-9 .-]{0,29}$/.test(version))throw Error('Invalid version');
    if(typeof description!=='string' || !description.trim() || description.length>180 || /[<>]/.test(description))throw Error('Invalid description');
    if(typeof build!=='string' || !/^\d{5,10}(?:\.\d{1,6})?$/.test(build))throw Error('Invalid build');
    if(!strictDate(update_date))throw Error('Invalid update_date');
    for(const name of ['Verification','Feature-Update','Major-Update']) if(typeof raw[name]!=='boolean')throw Error(`Missing or invalid ${name}`);
    if(raw['Feature-Update'] && raw['Major-Update'])throw Error('Feature and Major cannot both be true');
    const kind=raw['Major-Update']?'major':raw['Feature-Update']?'feature':'regular';
    const descriptionClean=description.trim().replace(/\s+/g,' ');
    const record={channel,version,description:descriptionClean,build,update_date,verified:raw.Verification,featureUpdate:raw['Feature-Update'],majorUpdate:raw['Major-Update'],kind,path,indexPath};
    record.key=`${channel}:${version}:${build}`;
    // Some manifests already begin the description with the version.
    // Display a clean Windows Update title without duplicating it.
    const displayDescription=descriptionClean.toLowerCase().startsWith(version.toLowerCase()+' ')
      ? descriptionClean.slice(version.length).trim() : descriptionClean;
    record.title=`${version} ${displayDescription.replace(/[.\s]+$/,'')} ${update_date} (${build})`;
    return Object.freeze(record);
  }
  function compareBuild(a,b){
    const xs=String(a).split('.').map(Number),ys=String(b).split('.').map(Number);
    return (xs[0]||0)-(ys[0]||0) || (xs[1]||0)-(ys[1]||0);
  }
  // A folder's real index.html is a hard prerequisite. Many hosts serve
  // Index.html for missing URLs; matching the final pathname guards against
  // accidentally interpreting that fallback as an update page.
  function strictSameOriginUrl(path){
    const url=new URL(path,document.baseURI);
    if(url.origin!==location.origin)throw Error('Outside the update origin');
    return url;
  }
  async function checkedFile(path,signal){
    const url=strictSameOriginUrl(path);
    const response=await fetch(url.href,{cache:'no-store',signal,redirect:'follow'});
    const finalUrl=new URL(response.url||url.href,location.href);
    // A 200 response alone is not proof that a static file exists. The final
    // URL must match the requested file, not a host's error/redirect route.
    if(!response.ok || response.redirected || finalUrl.origin!==url.origin || finalUrl.pathname!==url.pathname)
      throw Error('Missing or redirected file');
    return response;
  }
  function validInstallerDocument(source){
    if(typeof source!=='string' || !/^\s*(?:<!doctype\s+html\b|<html\b)/i.test(source.slice(0,2048)))return false;
    // Static SPA hosts sometimes answer missing Build-update/.../index.html
    // with HTTP 200 and the root WebWindows Index.html *at the same URL*.
    // Reject that shell even when the HTTP status and URL look correct.
    const rootShellIds=/(?:id\s*=\s*["'](?:ww-lock-preview|ww10-start-menu|ww-settings-dialog)["'])/gi;
    const matches=source.match(rootShellIds)||[];
    if(matches.length>=2)return false;
    if(/<meta\s+name=["']description["']\s+content=["']Windows 12 desktop experience/i.test(source))return false;
    return true;
  }
  async function checkedInstallerPage(path,signal){
    const response=await checkedFile(path,signal);
    const source=await response.text();
    if(source.length>2*1024*1024 || !validInstallerDocument(source))
      throw Error('Missing installer page or main-app fallback');
    return source;
  }
  async function discoverChannelManifests(channel,signal){
    const folder=CHANNEL_DIRS[channel];
    const indexPath=folder+'index.html';
    const source=await checkedInstallerPage(indexPath,signal);
    const page=new DOMParser().parseFromString(source.slice(0,1024*1024),'text/html');
    const directoryUrl=strictSameOriginUrl(folder);
    const names=new Set(MANIFEST_SOURCES[channel]);
    // Static hosting cannot enumerate folder contents. Every additional
    // manifest is linked from the folder index.html, either with an href or
    // data-update-manifest attribute. Only appropriately named same-folder
    // JSON files are accepted; links to other directories are ignored.
    for(const element of page.querySelectorAll('[href],[data-update-manifest]')){
      const value=element.getAttribute('data-update-manifest') || element.getAttribute('href');
      if(!value)continue;
      try{
        const candidate=new URL(value,directoryUrl);
        if(candidate.origin!==directoryUrl.origin || !candidate.pathname.startsWith(directoryUrl.pathname))continue;
        const name=decodeURIComponent(candidate.pathname.slice(directoryUrl.pathname.length));
        if(!name || name.includes('/') || !CHANNEL_FILE_PREFIX[channel].test(name))continue;
        names.add(folder+name);
      }catch{}
      if(names.size>=36)break;
    }
    return {indexPath,paths:[...names].slice(0,36)};
  }
  async function fetchManifestEntries(channel,force=false,signal){
    const cached=manifestCache.get(channel);
    if(!force && cached && Date.now()-cached.time<45000)return cached.records;
    let index;
    try{index=await discoverChannelManifests(channel,signal);}
    catch(error){
      if(error?.name==='AbortError')throw error;
      manifestCache.set(channel,{records:[],time:Date.now()});
      return [];
    }
    const fetched=await Promise.all(index.paths.map(async path=>{
      try{
        const response=await checkedFile(path,signal);
        const text=await response.text();
        if(text.length>32768)throw Error('Manifest too large');
        const payload=JSON.parse(text);
        // A manifest can describe one update or several in an array/updates
        // collection. Files linked from the folder index add further tiles.
        const rawEntries=Array.isArray(payload)?payload:(Array.isArray(payload?.updates)?payload.updates:[payload]);
        return rawEntries.slice(0,32).flatMap(raw=>{
          try{return [checkManifestFields(raw,channel,path,index.indexPath)];}
          catch(error){console.warn(`[WebWindows Update] Ignoring invalid record in ${path}:`,error.message);return [];}
        });
      }catch(error){
        if(error?.name==='AbortError')throw error;
        console.warn(`[WebWindows Update] Skipping invalid or missing ${path}:`,error?.message||error);
        return [];
      }
    }));
    const unique=new Map();
    for(const record of fetched.flat())if(!unique.has(record.key))unique.set(record.key,record);
    const records=[...unique.values()].sort((a,b)=>b.update_date.localeCompare(a.update_date)||compareBuild(b.build,a.build)).slice(0,40);
    manifestCache.set(channel,{records,time:Date.now()});
    return records;
  }
  async function probe11H11(signal){
    try{
      await checkedInstallerPage(INSTALLER_PATH,signal);
      return true;
    }catch{return false;}
  }
  function syncInsiderExperienceChoices(){
    const chosen=insiderExperienceChoices.find(input=>input.value===state.insiderExperience);
    const missing=chosen && ((chosen.value==='release'&&!state.insiderReleasePreview)||insiderChannelAvailable[chosen.value]===false);
    if(missing){state.insiderExperience='';persist();}
    for(const input of insiderExperienceChoices){
      const available=insiderChannelAvailable[input.value]===true && (input.value!=='release'||state.insiderReleasePreview);
      input.disabled=!available;
      input.checked=available && state.insiderExperience===input.value;
      const row=input.closest('.ww10-insider-radio-row');
      row?.classList.toggle('is-unavailable',!available);
      if(row)row.title=available?'':`Requires ${INSIDER_CHANNEL_PATHS[input.value]}`;
    }
  }
  function reflectAvailableChannels(items){
    for(const channel of ['experimental','beta','release'])insiderChannelAvailable[channel]=items[channel].length>0;
    syncInsiderExperienceChoices();
    const notice=$('ww10-insider-availability-status');
    if(notice)notice.textContent=['experimental','beta','release'].map(channel=>
      items[channel].length?`${channel} updates available.`:`${channel} requires ${INSIDER_CHANNEL_PATHS[channel]} and a valid update manifest.`).join(' ');
  }
  async function scanUpdateSources(force=false){
    if(scanInFlight && !force)return scanInFlight;
    const controller=new AbortController();
    if(insiderProbe)insiderProbe.abort();
    insiderProbe=controller;
    const generation=++updateScanCounter;
    const timeout=setTimeout(()=>controller.abort(),10000);
    const promise=(async()=>{
      try{
        const names=['experimental','beta','release','stable'];
        const values=await Promise.all(names.map(name=>fetchManifestEntries(name,force,controller.signal)));
        const items=Object.fromEntries(names.map((name,i)=>[name,values[i]]));
        const has11H11=await probe11H11(controller.signal);
        if(generation!==updateScanCounter)return latestUpdateScan;
        latestUpdateScan={items,has11H11,checkedAt:Date.now()};
        reflectAvailableChannels(items);
        renderAvailableUpdates();
        WWCompat.emit('webwindows:update-manifests-scanned',{channels:Object.keys(items).filter(k=>items[k].length),has11H11});
        return latestUpdateScan;
      }catch(error){
        if(error?.name!=='AbortError'){
          console.warn('[WebWindows Update] Scan failed:',error);
          if(!latestUpdateScan){
            const host=$('ww10-live-update-list');
            if(host){
              const notice=document.createElement('p');notice.className='ww10-update-empty';
              notice.textContent='Could not check for updates. Try again.';
              host.replaceChildren(notice);
            }
          }
        }
        return latestUpdateScan;
      }finally{
        clearTimeout(timeout);
        if(insiderProbe===controller)insiderProbe=null;
      }
    })();
    scanInFlight=promise;
    try{return await promise;}finally{if(scanInFlight===promise)scanInFlight=null;}
  }
  async function checkInsiderPreviewAvailability(){
    if(currentPage!=='insider' || document.hidden)return;
    if(insiderProbe || Date.now()-insiderLastProbe<8000)return;
    insiderLastProbe=Date.now();
    await scanUpdateSources(false);
  }
  syncInsiderExperienceChoices();
  insiderProductChoices.forEach(input=>{
    input.checked=state.insiderProduct===input.value;
    input.addEventListener('change',()=>{
      if(!input.checked)return;
      state.insiderProduct=input.value;
      persist();renderAvailableUpdates();
      void scanUpdateSources();
    });
  });
  insiderExperienceChoices.forEach(input=>input.addEventListener('change',()=>{
    if(input.disabled||!input.checked)return;
    if(insiderChannelAvailable[input.value]!==true ||
      (input.value==='release' && !state.insiderReleasePreview))return;
    state.insiderExperience=input.value;
    persist();renderAvailableUpdates();
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
      persist();renderAvailableUpdates();
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
  function lockNewsMeta(entry){
    const domain = entry?.domain || 'Publisher';
    if(!entry?.published) return domain;
    const diff = Math.max(0, Date.now() - entry.published);
    const hours = Math.floor(diff / 3600000);
    return `${domain} · ${hours < 1 ? 'Recently' : (hours < 24 ? `${hours}h ago` : `${Math.floor(hours/24)}d ago`)}`;
  }
  function renderLockNewsStory(entry,status={}){
    const source=$('ww-lock-news-source');
    const headline=$('ww-lock-news-headline');
    const summary=$('ww-lock-news-summary');
    const story=$('ww-lock-news-story');
    if(!source||!headline||!summary||!story)return;
    if(entry){
      source.textContent = lockNewsMeta(entry);
      headline.textContent = entry.title || 'Top story';
      summary.textContent = entry.description || `Read more from ${entry.domain || 'the source'}.`;
      story.classList.remove('ww-lock-news-empty');
      return;
    }
    const count = Number(status?.count)||0;
    const waiting = status?.inFlight || (!status?.reason && count===0);
    source.textContent = waiting ? 'Loading headlines…' : 'News unavailable';
    headline.textContent = waiting ? 'Loading headlines…' : 'Headlines are temporarily unavailable';
    summary.textContent = waiting ? 'A top story will appear here when the news feed responds.' : 'Weather remains available. Headlines will return when the news service responds.';
    story.classList.add('ww-lock-news-empty');
  }
  function refreshLockNewsStory(){
    const api = window.WebWindowsNews;
    if(!api || typeof api.get!=='function'){
      renderLockNewsStory(null,{inFlight:true,count:0,reason:''});
      return;
    }
    const items = api.get();
    const status = typeof api.status==='function' ? api.status() : {};
    renderLockNewsStory(items[0] || null,status);
  }
  window.addEventListener('webwindows:news-updated',refreshLockNewsStory);
  window.addEventListener('webwindows:news-error',refreshLockNewsStory);
  window.addEventListener('webwindows:start-opening',refreshLockNewsStory);
  setTimeout(refreshLockNewsStory,0);

  window.addEventListener('pagehide',()=>{
    clearInterval(insiderCheckTimer);
    insiderProbe?.abort();
  },{once:true});

  // Early Updates only controls automatic Release-channel surfacing. 11H11
  // Update/index.html detection is independent and belongs to the 11H11 choice.
  const earlyUpdatesInput=$('ww10-early-updates');
  const earlyUpdatesState=$('ww10-early-updates-state');
  let showReleaseOnManualCheck=false;
  let automaticUpdateTimer=null;
  function manageAutomaticUpdateChecks(){
    if(automaticUpdateTimer!==null){clearInterval(automaticUpdateTimer);automaticUpdateTimer=null;}
    if(!earlyUpdatesInput || !earlyUpdatesState)return;
    earlyUpdatesInput.checked=state.earlyUpdates;
    earlyUpdatesState.textContent=state.earlyUpdates?'On':'Off';
    renderAvailableUpdates();
    // Insider files are checked on page-open/explicit checks regardless of this toggle.
    if(state.earlyUpdates&&!state.pausedUntil)automaticUpdateTimer=setInterval(()=>{
      if(!document.hidden && !state.pausedUntil)void scanUpdateSources(true);
    },5*60*1000);
  }
  if(earlyUpdatesInput)earlyUpdatesInput.addEventListener('change',()=>{
    state.earlyUpdates=earlyUpdatesInput.checked;
    showReleaseOnManualCheck=false;
    persist();manageAutomaticUpdateChecks();
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden && state.earlyUpdates && !state.pausedUntil)void scanUpdateSources(true);
  });
  window.addEventListener('pagehide',()=>{
    if(automaticUpdateTimer!==null)clearInterval(automaticUpdateTimer);
  },{once:true});
  manageAutomaticUpdateChecks();
  function getVisibleUpdates(){
    if(!latestUpdateScan)return [];
    const {items,has11H11}=latestUpdateScan;
    const list=[];
    if(state.insiderProduct==='11H11'){
      if(has11H11)list.push(Object.freeze({
        key:'11H11:Update/index.html',channel:'11h11',version:'11H11',
        build:'',title:'Windows 12 — Version 11H11',description:'A new Windows version is available.',
        update_date:'',kind:'major',verified:true,path:INSTALLER_PATH,majorUpdate:true,featureUpdate:false,installer:true
      }));
    } else {
      const channel=state.insiderExperience;
      if(channel && items[channel]?.length)list.push(...items[channel]);
      // Release updates are independent of the selected preview channel.
      if((state.earlyUpdates||showReleaseOnManualCheck) && items.stable?.length)list.push(...items.stable);
    }
    return list.filter(item=>!appliedUpdateRecords[item.key] && (!skippedUpdateRecords[item.key] || showReleaseOnManualCheck))
      .sort((a,b)=>b.update_date.localeCompare(a.update_date)||compareBuild(b.build,a.build));
  }
  function installedBuild(item){
    const history=$('ww-history')?.querySelector('.ww10-history-list');
    if(!history || history.querySelector(`[data-ww-applied="${CSS.escape(item.key)}"]`))return;
    const row=document.createElement('div');row.className='ww10-history-item';row.setAttribute('role','listitem');row.dataset.wwApplied=item.key;
    const detail=document.createElement('div');detail.className='ww10-history-details';
    const name=document.createElement('b');name.className='ww10-history-title';name.textContent=item.title;
    const status=document.createElement('span');status.className='ww10-history-status';status.textContent='Applied';
    detail.append(name);row.append(detail,status);history.prepend(row);
  }
  function refreshAppliedHistory(){
    const history=$('ww-history')?.querySelector('.ww10-history-list');
    if(!history)return;
    for(const record of Object.values(appliedUpdateRecords))if(record && typeof record.key==='string' && record.title)installedBuild(record);
  }
  function updateRunningBuild(record){
    if(!record || !record.build)return;
    const header=$('ww-update-status');
    // Retain the prior local build display for previously applied records.
    const spec=[...dialog.querySelectorAll('.ww9-update-system-row')].find(row=>row.firstElementChild?.textContent?.trim()==='OS build');
    if(spec)spec.querySelector('b')?.replaceChildren(document.createTextNode(record.build));
  }
  const appliedVersions=Object.values(appliedUpdateRecords).filter(item=>item?.build).sort((a,b)=>compareBuild(b.build,a.build));
  if(appliedVersions.length)updateRunningBuild(appliedVersions[0]);
  refreshAppliedHistory();
  function showUpdaterStatus(message,error=false){
    const node=$('ww-update-status');if(node){node.dataset.error=String(error);node.textContent=message;}
  }
  async function activateUpdate(item){
    if(state.pausedUntil){showUpdaterStatus(`Updates are paused until ${state.pausedUntil}.`,true);return;}
    // Every offered update points to a real folder index.html. Navigate to
    // that updater instead of pretending a JSON document installs app code.
    const path=item.installer?INSTALLER_PATH:item.indexPath;
    if(!path){showUpdaterStatus('Update page is unavailable.',true);return;}
    const requestController=new AbortController();
    const requestTimeout=setTimeout(()=>requestController.abort(),12000);
    try{
      const destination=strictSameOriginUrl(path);
      // Check again in case the page was removed after the last scan.
      // Revalidate immediately before activation; a missing installer must not
      // redirect into the main desktop or record a pending update.
      await checkedInstallerPage(path,requestController.signal);
      if(!item.installer){
        // Each tile identifies its own update even when several builds share
        // the same folder's installer entry point.
        const selected={channel:item.channel,version:item.version,build:item.build,manifest:item.path};
        try{sessionStorage.setItem('webwindows.10h10.pending-update.v1',JSON.stringify(selected));}catch{}
        for(const [key,value] of Object.entries(selected))destination.searchParams.set(key,value);
      }
      window.location.assign(destination.href);
    }catch{
      showUpdaterStatus('Update page is unavailable. Check for updates again.',true);
    }finally{
      clearTimeout(requestTimeout);
    }
  }
  function renderAvailableUpdates(){
    const host=$('ww10-live-update-list');if(!host)return;
    host.replaceChildren();
    if(!latestUpdateScan){
      const empty=document.createElement('p');empty.className='ww10-update-empty';empty.textContent='Checking available updates…';host.append(empty);return;
    }
    const items=getVisibleUpdates();
    const caption=$('ww10-available-summary');
    if(caption)caption.textContent=items.length ? `${items.length} update${items.length===1?'':'s'} available` : 'No updates available';
    if(!items.length){
      const empty=document.createElement('p');empty.className='ww10-update-empty';
      empty.textContent='No updates available.';
      host.append(empty);return;
    }
    for(const item of items){
      const row=document.createElement('div');row.className='ww9-available-item';row.setAttribute('role','listitem');
      const copy=document.createElement('div');copy.className='ww10-live-update-copy';
      const title=document.createElement('div');title.className='ww9-available-item-title';title.textContent=item.title;
      copy.append(title);
      const actions=document.createElement('div');actions.className='ww10-update-actions';
      const update=document.createElement('button');update.type='button';update.className='ww-settings-btn primary';
      update.textContent='Update';
      update.addEventListener('click',()=>void activateUpdate(item));
      actions.append(update);
      if(!item.verified){
        const skip=document.createElement('button');skip.type='button';skip.className='ww-settings-btn';skip.textContent='Not now';
        skip.addEventListener('click',()=>{
          skippedUpdateRecords[item.key]=Date.now();saveLocal(UPDATE_SKIPPED_KEY,skippedUpdateRecords);
          showReleaseOnManualCheck=false;renderAvailableUpdates();
          showUpdaterStatus('Optional update postponed. Check for updates to view it again.');
        });
        actions.append(skip);
      }
      row.append(copy,actions);host.append(row);
    }
  }
  // Share the same manifest parsing and type classification with Windows Security.
  window.WebWindowsUpdater=Object.freeze({
    scan:()=>scanUpdateSources(true),
    get:()=>latestUpdateScan ? {items:Object.fromEntries(Object.entries(latestUpdateScan.items).map(([channel,records])=>[channel,records.slice()])),has11H11:latestUpdateScan.has11H11,checkedAt:latestUpdateScan.checkedAt} : null,
    types:()=>Object.entries(latestUpdateScan?.items||{}).flatMap(([channel,records])=>records.map(item=>({channel,build:item.build,feature:item.featureUpdate,major:item.majorUpdate,verified:item.verified})))
  });
  // Refresh on page open, keeping the existing independent Settings disclosures.
  window.addEventListener('webwindows:settings-requested',()=>{if(!state.pausedUntil)void scanUpdateSources();});
  if(!state.pausedUntil)void scanUpdateSources();

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
      'Edition: Windows 12',
      'Version: 10H10',
      'Channel: Release',
      'OS build: 2610140',
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
  $('ww-check-updates').addEventListener('click',async()=>{
    if(state.pausedUntil){$('ww-update-status').textContent=`Checks are paused until ${state.pausedUntil}.`;return;}
    const button=$('ww-check-updates'),status=$('ww-update-status');
    button.disabled=true;button.textContent='Checking…';status.dataset.error='false';status.textContent='Checking available updates…';
    try{
      const checked=await scanUpdateSources(true);
      if(!checked)throw Error('Unable to read update manifests');
      showReleaseOnManualCheck=true;
      renderAvailableUpdates();
      const count=getVisibleUpdates().length;
      status.textContent=count?`${count} update${count===1?'':'s'} available.`:'You’re up to date. No matching update was found.';
    }catch(error){status.dataset.error='true';status.textContent='Could not check for updates. Try again.';}
    finally{button.disabled=false;button.textContent=wwLegacyTranslations[state.language]?.checkUpdates||'Check for updates';$('ww-last-checked').textContent='Last checked: '+new Date().toLocaleString(state.language);}
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
  // A self-contained fallback preserves a polished desktop if a host deploys
  // the JS/HTML without the optional Background directory. A provided wallpaper
  // still renders above this gradient with no change to its appearance.
  const FALLBACK_WALLPAPER='linear-gradient(130deg,#0b2e69 0%,#1e52a0 42%,#28216e 76%,#100f42 100%)';

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
  // Personalization remembers up to 17 imported wallpapers; lock screen follows the active choice.
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
    const paintedWallpaper=wallpaperAsset ? `url("${wallpaper}")` : `url("${DEFAULT_WALLPAPER}"), ${FALLBACK_WALLPAPER}`;
    $('desktop').style.backgroundImage=paintedWallpaper;
    WWCompat.emit('webwindows:wallpaper-changed');
    hdrRenderer.setSource(wallpaper);
    $('ww-wallpaper-preview').style.backgroundImage=paintedWallpaper;
    dialog.style.setProperty('--ww9-wallpaper',paintedWallpaper);
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
      button.style.backgroundImage=asset ? `url("${source}")` : `url("${DEFAULT_WALLPAPER}"), ${FALLBACK_WALLPAPER}`;
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
      recent=[asset,...recent].slice(0,17);
      recentIds=[id,...recentIds].slice(0,17);
      wallpaperId=id;
      newImage={id,blob:asset};
    } else if(asset) {
      const index=recent.indexOf(asset);
      wallpaperId=index>=0?recentIds[index]:null;
      if(!wallpaperId){
        const id=makeWallpaperId();
        recent=[asset,...recent].slice(0,17);
        recentIds=[id,...recentIds].slice(0,17);
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
        'Wallpaper applied for this session. Unable to save it permanently.';
    }
  }
  $('ww-wallpaper-browse').addEventListener('click',()=>$('ww-wallpaper-file').click());
  $('ww-wallpaper-reset').addEventListener('click',()=>setWallpaper(null,false));
  $('ww-wallpaper-file').addEventListener('change',async e=>{
    const selected=Array.from(e.target.files||[]);e.target.value='';if(!selected.length)return;
    if(selected.some(file=>!validImageBlob(file))){
      $('ww-wallpaper-status').textContent='Choose PNG, JPEG, WebP, GIF or AVIF images.';
      return;
    }
    const files=selected.slice(0,17);
    if(files.length===1){await setWallpaper(files[0],true);return;}
    // Save a batch together, rather than repainting and writing the database
    // once for every file. The first selected wallpaper becomes active.
    const operation=++wallpaperOperation;
    const entries=files.map(blob=>({id:makeWallpaperId(),blob}));
    recent=[...files,...recent].slice(0,17);
    recentIds=[...entries.map(item=>item.id),...recentIds].slice(0,17);
    wallpaperId=entries[0].id;
    paintWallpaper(files[0]);
    const status=$('ww-wallpaper-status');
    status.textContent=`Importing ${files.length} wallpapers…`;
    let ok=await saveWallpaperState(wallpaperId,recentIds,entries);
    if(!ok){
      // Browsers can reject large collections due to storage quotas. Preserve
      // the active wallpaper rather than silently losing the new selection.
      ok=await saveWallpaperState(wallpaperId,[wallpaperId],[entries[0]]);
      if(ok && operation===wallpaperOperation){recent=[files[0]];recentIds=[wallpaperId];renderRecent();}
    }
    if(operation===wallpaperOperation)status.textContent=ok
      ?(recent.length===1?'Wallpaper saved; storage space prevented saving the other imported images.':`${files.length} wallpapers imported. ${recent.length} recent images saved.`)
      :'Wallpaper applied for this session only. Not enough storage to save the imported images.';
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
        const ids=savedState.recentIds.filter(id=>typeof id==='string').slice(0,17);
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
        const oldEntries=Array.isArray(oldRecent)?oldRecent.slice(0,17):[];
        recent=(await Promise.all(oldEntries.map(migrateImage))).filter(Boolean).slice(0,17);
        if(current && !recent.includes(current))recent=[current,...recent].slice(0,17);
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
    setSearchResultsMode(mode) {
      if (!allowed.searchResultsMode.includes(mode)) return;
      state.searchResultsMode=mode;persist();syncSearchResultMode();
      WWCompat.emit('webwindows:search-display-mode-changed',{mode});
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
        status.textContent = stored ? 'Feedback deleted.' : 'Deleted for this session. Unable to save changes permanently.';
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
    status.textContent = stored ? 'Feedback saved locally. It has not been submitted.' :
      'Saved for this session only. Unable to save permanently.';
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
  const defaults = {updater:{type:false,search:false,feature:false,major:false},schedule:{enabled:false,start:480,end:1320},mode:'standard'};
  let state = structuredClone(defaults);
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if(saved && typeof saved==='object') {
      const flags=saved.updater || {};
      for(const feature of ['type','search','feature','major']) state.updater[feature]=flags[feature] === true;
      const schedule=saved.schedule||{};
      state.schedule={enabled:schedule.enabled===true,start:Number.isInteger(schedule.start)?Math.max(0,Math.min(1425,schedule.start)):480,end:Number.isInteger(schedule.end)?Math.max(0,Math.min(1425,schedule.end)):1320};
      state.mode=['standard','pin-key','defender-only','adaptive'].includes(saved.mode)?saved.mode:'standard';
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
    $('wwdef-pin-summary').textContent=state.mode==='standard'?(window.WebWindowsLogin?.hasPin()?'PIN configured':'Not configured'):({'pin-key':'PIN + key','defender-only':'Defender key','adaptive':'Adaptive sign-in'}[state.mode]||'PIN configured');
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
    if(!['home','updater','pin'].includes(next))return;
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
    if(next==='pin')syncPinEditor();
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
  // Schedule controls and sign-in protection modes are adapted from 9H09.
  // Every saved change is confirmed with the existing, hashed Defender key.
  let pinScheduleDraft={...state.schedule};
  let pinModeDraft=state.mode;
  const timeLabel=minutes=>{
    const hours=Math.floor(minutes/60),part=minutes%60;
    return `${hours%12||12}:${String(part).padStart(2,'0')} ${hours<12?'AM':'PM'}`;
  };
  const isScheduleActive=()=>{
    if(!state.schedule.enabled)return true;
    const now=new Date(),minute=now.getHours()*60+now.getMinutes();
    const {start,end}=state.schedule;
    return start<end ? minute>=start&&minute<end : minute>=start||minute<end;
  };
  const availablePin=()=>Boolean(window.WebWindowsLogin?.hasPin());
  function syncPinEditor(){
    $('wwdef-pin-schedule-enabled').checked=pinScheduleDraft.enabled;
    $('wwdef-pin-schedule-editor').hidden=!pinScheduleDraft.enabled;
    $('wwdef-pin-start-display').textContent=timeLabel(pinScheduleDraft.start);
    $('wwdef-pin-end-display').textContent=timeLabel(pinScheduleDraft.end);
    for(const radio of win.querySelectorAll('input[name="wwdef-pin-mode"]')){
      radio.checked=radio.value===pinModeDraft;
      radio.disabled=!availablePin()&&(radio.value==='pin-key'||radio.value==='adaptive');
    }
    writeSummary();
  }
  $('wwdef-pin-schedule-enabled').addEventListener('change',e=>{
    pinScheduleDraft.enabled=e.target.checked;
    syncPinEditor();
    showStatus('wwdef-pin-schedule-status','');
  });
  for(const button of win.querySelectorAll('[data-wwdef-time]'))button.addEventListener('click',()=>{
    const field=button.dataset.wwdefTime;
    pinScheduleDraft[field]=(pinScheduleDraft[field]+Number(button.dataset.step)+1440)%1440;
    syncPinEditor();showStatus('wwdef-pin-schedule-status','');
  });
  for(const radio of win.querySelectorAll('input[name="wwdef-pin-mode"]'))radio.addEventListener('change',e=>{
    if(e.target.checked){pinModeDraft=e.target.value;showStatus('wwdef-pin-mode-status','');}
  });
  $('wwdef-pin-schedule-save').addEventListener('click',async()=>{
    if(pinScheduleDraft.start===pinScheduleDraft.end){showStatus('wwdef-pin-schedule-status','Start and end times must differ.','error');return;}
    if(pinScheduleDraft.enabled&&!availablePin()){
      showStatus('wwdef-pin-schedule-status','Create a sign-in PIN before enabling a PIN schedule.','error');return;
    }
    if(!await requireKey('Enter your Defender key to save the PIN schedule.'))return;
    state.schedule={...pinScheduleDraft};
    if(!save()){showStatus('wwdef-pin-schedule-status','Unable to save settings.','error');return;}
    showStatus('wwdef-pin-schedule-status','PIN schedule saved.','success');writeSummary();
    window.dispatchEvent(new Event('webwindows:security-updated'));
  });
  $('wwdef-pin-mode-save').addEventListener('click',async()=>{
    if(['pin-key','adaptive'].includes(pinModeDraft)&&!availablePin()){
      showStatus('wwdef-pin-mode-status','Create a sign-in PIN before selecting this mode.','error');return;
    }
    if(pinModeDraft==='adaptive'&&!state.schedule.enabled){
      showStatus('wwdef-pin-mode-status','Enable and save a PIN schedule before using adaptive sign-in.','error');return;
    }
    if(!await requireKey('Enter your Defender key to save sign-in protection.'))return;
    state.mode=pinModeDraft;
    if(!save()){showStatus('wwdef-pin-mode-status','Unable to save settings.','error');return;}
    showStatus('wwdef-pin-mode-status','Sign-in protection updated.','success');writeSummary();
    window.dispatchEvent(new Event('webwindows:security-updated'));
  });
  window.addEventListener('webwindows:pin-updated',syncPinEditor);
  syncPinEditor();
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
      // Metadata is always schema-checked by the updater, before type and
      // Verification values are displayed. A true flag is not a digital signature.
      if(window.WebWindowsUpdater){
        const result=await window.WebWindowsUpdater.scan();
        const items=Object.values(result?.items||{}).flatMap(records=>Array.isArray(records)?records:[]);
        const detected=[];
        if(state.updater.feature)detected.push(`${items.filter(x=>x.featureUpdate).length} feature update${items.filter(x=>x.featureUpdate).length===1?'':'s'}`);
        if(state.updater.major)detected.push(`${items.filter(x=>x.majorUpdate).length} major update${items.filter(x=>x.majorUpdate).length===1?'':'s'}`);
        if(state.updater.type)detected.push(`${items.length} classified manifest${items.length===1?'':'s'}`);
        const report=$('wwdef-update-detections');
        if(report)report.textContent=detected.length?`Detected: ${detected.join(' · ')}.`:'Update checks completed.';
        setHealth('ready','Update checks completed');
      }else{
        const manifest=await readManifest();auditManifest(manifest);
        setHealth('ready','Update checks completed');
      }
    }catch(err){
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
    getPreferences:()=>JSON.parse(JSON.stringify({...state,pinEnabled:availablePin()})),
    isPinScheduledNow:isScheduleActive,
    getLoginRequirement:()=>{
      // A configured schedule permits PIN during its window and the key outside it.
      if(state.mode==='defender-only')return 'key';
      if(state.mode==='adaptive')return isScheduleActive()?'pin':'key';
      if(state.schedule.enabled&&!isScheduleActive())return 'key';
      return state.mode==='pin-key'?'pin-key':'pin';
    },
    verifyKey:checkKey
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
    const cap = 655;
    WWCompat.positionTaskbarPanel(panel, {width:560, height:cap});
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

  byId('ww10-start-settings')?.addEventListener('click', () => {
    closeStart(false);
    byId('settings-button')?.click(); // Reuse the native Settings window action.
  });
  start.addEventListener('click', () => panel.hidden ? openStart() : closeStart());
  // Start keeps its pinned news section. Taskbar News and search News now
  // open the shared Weather/News flyout instead of redirecting to Start.
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
    // Dataset-driven layout may not have completed until the next frame.
    if (startPositionFrame) cancelAnimationFrame(startPositionFrame);
    startPositionFrame = requestAnimationFrame(() => {startPositionFrame=0;setPosition();});
  });
  const startDock = byId('taskbar');
  startDock?.addEventListener('animationend', () => setPosition());
  startDock?.addEventListener('transitionend', () => setPosition());
  if (typeof ResizeObserver === 'function' && startDock) {
    const startDockResize = new ResizeObserver(() => { if (!panel.hidden) setPosition(); });
    startDockResize.observe(startDock);
    window.addEventListener('pagehide',()=>startDockResize.disconnect(),{once:true});
  }
  window.addEventListener('webwindows:settings-requested', () => closeStart());
  window.addEventListener('webwindows:search-opening', () => closeStart());
  window.addEventListener('webwindows:search-input', () => closeStart());
  window.addEventListener('pagehide', () => profileObserver?.disconnect(), {once:true});
  syncAccount();
});

/* Build 2610140.Release-preview — Windows 11-style lock and sign-in.
   Reuses 10H10 Personalization, account profile, Defender PIN and Icons8 weather. */
WWCompat.boot('Release Preview lock screen', () => {
  'use strict';
  const $ = id => document.getElementById(id);
  const root = $('ww-login');
  if (!root) return;
  const PIN_KEY='webwindows.10h10.login.pin.v1';
  const PASSWORD_KEY='webwindows.10h10.login.password.v1';
  const DYNAMIC_KEY='webwindows.10h10.login.dynamic.v1';
  const MORSE_KEY='webwindows.10h10.login.morse.v1';
  const BOOT_KEY='webwindows.10h10.login.bootup-only.v1';
  const boolPref=key=>{try{return localStorage.getItem(key)==='true';}catch{return false;}};
  let morseEnabled=boolPref(MORSE_KEY),bootupOnly=boolPref(BOOT_KEY),sessionAuthenticated=false;
  const input=$('ww-login-pin'), status=$('ww-login-hint'), dialog=$('ww-pin-dialog');
  const readJSON=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
  const loadCredential=key=>{const value=readJSON(key);return value?.digest&&value?.salt&&Number.isInteger(value.iterations)?value:null;};
  let pinRecord=loadCredential(PIN_KEY),passwordRecord=loadCredential(PASSWORD_KEY);
  const hasPin=()=>Boolean(pinRecord),hasPassword=()=>Boolean(passwordRecord);
  let credentialMode=hasPin()?'pin':(hasPassword()?'password':'pin');
  let editMode='pin',busy=false,failedAttempts=0,lockedOutUntil=0,awaitingDefenderKey=false;
  const encode=bytes=>btoa(String.fromCharCode(...bytes));
  const decode=str=>Uint8Array.from(atob(str),c=>c.charCodeAt(0));
  const canHash=()=>Boolean(window.isSecureContext&&window.crypto?.subtle&&window.crypto?.getRandomValues);
  async function hash(value,salt,iterations){
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(value),{name:'PBKDF2'},false,['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256));
  }
  async function verifyRecord(value,record){
    if(!record||!canHash())return false;
    const actual=await hash(value,decode(record.salt),record.iterations);
    const expected=decode(record.digest);
    if(actual.length!==expected.length)return false;
    let difference=0;
    for(let i=0;i<actual.length;i++)difference|=actual[i]^expected[i];
    return difference===0;
  }
  const MORSE_DIGITS={ '-----':'0','.----':'1','..---':'2','...--':'3','....-':'4','.....':'5','-....':'6','--...':'7','---..':'8','----.':'9' };
  function decodeMorsePin(value){
    const entry=String(value).trim();
    if(!entry||!/^[-.\s]+$/.test(entry))return null;
    const groups=entry.split(/\s+/);
    if(groups.length<4||groups.length>32||groups.some(c=>!Object.prototype.hasOwnProperty.call(MORSE_DIGITS,c)))return null;
    return groups.map(c=>MORSE_DIGITS[c]).join('');
  }
  async function verifyPin(value){
    if(!hasPin())return false;
    if(await verifyRecord(value,pinRecord))return true;
    const decoded=morseEnabled?decodeMorsePin(value):null;
    return Boolean(decoded && await verifyRecord(decoded,pinRecord));
  }
  async function savePin(current,next){
    if(hasPin())throw new Error('A sign-in PIN is already configured. PIN changes are unavailable.');
    if(!/^\d{4,32}$/.test(next))throw new Error('Use at least 4 digits (maximum 32) for the PIN.');
    if(!canHash())throw new Error('Secure PIN setup requires HTTPS or localhost.');
    const salt=crypto.getRandomValues(new Uint8Array(16));
    const record={algorithm:'PBKDF2-SHA256',iterations:210000,salt:encode(salt),digest:encode(await hash(next,salt,210000))};
    localStorage.setItem(PIN_KEY,JSON.stringify(record));
    pinRecord=record;credentialMode='pin';syncPinState();
    window.dispatchEvent(new Event('webwindows:pin-updated'));
  }
  function setPreference(key,enabled){try{localStorage.setItem(key,String(Boolean(enabled)));}catch{}}
  function syncOptionSettings(){
    if($('ww10-pin-morse'))$('ww10-pin-morse').checked=morseEnabled;
    if($('ww10-pin-bootup'))$('ww10-pin-bootup').checked=bootupOnly;
  }

  const clearStatus=()=>status.textContent='';
  function syncPinState(){
    const requirement=window.WebWindowsSecurity?.getLoginRequirement?.()||'pin';
    const keyRequired=awaitingDefenderKey||requirement==='key';
    if(requirement==='pin-key'||(requirement==='pin'&&window.WebWindowsSecurity?.getPreferences?.().mode==='adaptive'))credentialMode='pin';
    const password=!keyRequired&&credentialMode==='password'&&hasPassword();
    // Native field only; users submit by pressing Enter, not by clicking a PIN button.
    input.type='password';input.inputMode=keyRequired||password||morseEnabled?'text':'numeric';
    input.placeholder=keyRequired?'Defender key':password?'Password':(bootupOnly&&sessionAuthenticated&&requirement==='pin'?'Press Enter to resume':(morseEnabled?'PIN or Morse code':'PIN'));
    input.setAttribute('aria-label',keyRequired?'Defender key':password?'Password':'PIN');
    input.maxLength=keyRequired||password?128:(morseEnabled?192:32);input.value='';input.disabled=false;
    $('ww-login-prompt').textContent=keyRequired?'Enter your Defender key':password?'Enter your password':(bootupOnly&&sessionAuthenticated&&requirement==='pin'?'Press Enter to resume':'Enter your PIN');
    input.hidden=false;
    $('ww-signin-method-mark').hidden=false;
    $('ww-signin-method-icon').className=keyRequired?'ph ph-shield-key':password?'ph ph-lock-key':'ph ph-numpad';
    if($('wwdef-pin-state'))$('wwdef-pin-state').textContent=hasPin()?'PIN configured':'No PIN configured';
    // A PIN may be created once; no UI route can change an existing PIN.
    if($('wwdef-pin-manage'))$('wwdef-pin-manage').hidden=hasPin();
  }
  function manageCredential(mode='pin'){
    if(mode==='pin'&&hasPin())return;
    editMode=mode;
    const password=mode==='password',exists=password?hasPassword():hasPin(),noun=password?'password':'PIN';
    $('ww-pin-form').reset();$('ww-pin-status').textContent='';
    $('ww-pin-title').textContent=(exists?'Change ':'Create ')+'sign-in '+noun;
    $('ww-pin-explanation').textContent=password?'Create or change your WebWindows account password.':'The sign-in PIN is shared with Windows Security > PIN Security.';
    $('ww-pin-form').querySelector('[type=submit]').textContent='Save '+noun;
    $('ww-pin-current-caption').textContent='Current '+noun;
    $('ww-pin-new-caption').textContent='New '+noun;
    $('ww-pin-confirm-caption').textContent='Confirm new '+noun;
    $('ww-pin-current-row').hidden=!exists;
    for(const id of ['ww-pin-current','ww-pin-new','ww-pin-confirm']){
      const element=$(id);element.inputMode=password?'text':'numeric';
      element.placeholder=password?'At least 8 characters':'4 digits minimum';
    }
    $('ww-pin-new').minLength=password?8:4;
    $('ww-pin-new').maxLength=password?128:32;
    $('ww-pin-confirm').maxLength=password?128:32;
    dialog.hidden=false;
    (exists?$('ww-pin-current'):$('ww-pin-new')).focus();
  }
  function closeDialog(){dialog.hidden=true;$('ww-pin-form').reset();}
  $('ww-pin-cancel').addEventListener('click',closeDialog);
  $('ww-pin-close').addEventListener('click',closeDialog);
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();closeDialog();}});
  $('ww-pin-form').addEventListener('submit',async event=>{
    event.preventDefault();const next=$('ww-pin-new').value,confirm=$('ww-pin-confirm').value;
    const password=editMode==='password';
    if(!(password?next.length>=8&&next.length<=128:/^\d{4,32}$/.test(next))){
      $('ww-pin-status').textContent=password?'Use 8–128 characters.':'PINs start at 4 digits (up to 32).';return;
    }
    if(next!==confirm){$('ww-pin-status').textContent='The confirmation does not match.';return;}
    if(!canHash()){$('ww-pin-status').textContent='Secure credential setup requires HTTPS or localhost.';return;}
    try{
      const old=password?passwordRecord:pinRecord;
      if(old&&!await verifyRecord($('ww-pin-current').value,old)){
        $('ww-pin-status').textContent='The current '+(password?'password':'PIN')+' is incorrect.';return;
      }
      if(password){
        const salt=crypto.getRandomValues(new Uint8Array(16));
        const record={algorithm:'PBKDF2-SHA256',iterations:210000,salt:encode(salt),digest:encode(await hash(next,salt,210000))};
        localStorage.setItem(PASSWORD_KEY,JSON.stringify(record));
        passwordRecord=record;credentialMode='password';
        window.dispatchEvent(new Event('webwindows:pin-updated'));
      }else await savePin($('ww-pin-current').value,next);
      closeDialog();syncPinState();status.textContent='Sign-in credential updated.';
    }catch(error){$('ww-pin-status').textContent='Could not save the credential: '+error.message;}
  });
  const extraToggle=$('ww10-pin-expand');
  if(extraToggle)extraToggle.addEventListener('click',()=>{
    const open=extraToggle.getAttribute('aria-expanded')!=='true';
    extraToggle.setAttribute('aria-expanded',String(open));
    $('ww10-pin-extra-content').hidden=!open;
  });
  $('ww10-pin-morse')?.addEventListener('change',event=>{
    morseEnabled=event.target.checked;setPreference(MORSE_KEY,morseEnabled);syncPinState();
    $('ww10-pin-extra-status').textContent=morseEnabled?'Morse-code entries are now accepted alongside your regular numeric PIN.':'Morse-code entry disabled.';
  });
  $('ww10-pin-bootup')?.addEventListener('change',event=>{
    if(event.target.checked&&!hasPin()){
      event.target.checked=false;
      $('ww10-pin-extra-status').textContent='Create a sign-in PIN before enabling bootup-only mode.';
      return;
    }
    bootupOnly=event.target.checked;setPreference(BOOT_KEY,bootupOnly);syncPinState();
    $('ww10-pin-extra-status').textContent=bootupOnly?'The first unlock after page load requires your PIN. Later locks can resume without it.':'Every lock requires the configured sign-in credential.';
  });
  syncOptionSettings();
  window.addEventListener('webwindows:pin-updated',syncOptionSettings);
  for(const id of ['ww-lock-manage-pin','wwdef-pin-manage'])$(id)?.addEventListener('click',()=>manageCredential('pin'));
  for(const id of ['ww-login-settings','ww-login-password-manage'])$(id)?.addEventListener('click',()=>manageCredential('password'));
  input.addEventListener('input',()=>{
    if(credentialMode==='pin'&&!morseEnabled&&!awaitingDefenderKey&&(window.WebWindowsSecurity?.getLoginRequirement?.()||'pin')!=='key')input.value=input.value.replace(/\D/g,'');
    clearStatus();
  });
  window.addEventListener('webwindows:security-updated',()=>{awaitingDefenderKey=false;syncPinState();});

  const desktopIcon=$('weather-button')?.querySelector('img.weather-icon');
  const weatherIcon=$('ww-lock-weather-icon');
  if(weatherIcon){
    if(desktopIcon)weatherIcon.src=desktopIcon.src;
    const ready=()=>$('ww-lock-weather').classList.toggle('ww-icon-loaded',weatherIcon.complete&&weatherIcon.naturalWidth>0);
    weatherIcon.addEventListener('load',ready);weatherIcon.addEventListener('error',ready);ready();
  }

  // ON: always follow the current Personalization wallpaper (including imported blobs).
  // OFF: use a numbered image from Login-wallpapers/ (1–17; png/jpg/jpeg).
  // Browsers cannot enumerate local folders, so check these explicit filenames.
  let dynamicPreference=true;
  try{
    const saved=localStorage.getItem(DYNAMIC_KEY);
    dynamicPreference=saved===null?true:saved==='true';
    if(saved===null)localStorage.setItem(DYNAMIC_KEY,'true');
  }catch{}
  const dynamic=$('ww-lock-dynamic');dynamic.checked=dynamicPreference;
  const FOLDER_WALLPAPER_COUNT=17;
  const FOLDER_EXTENSIONS=['png','jpg','jpeg','PNG','JPG','JPEG'];
  const folderCache=new Map(); // number -> working path, or null when unavailable
  let selectedFolderWallpaper=null,backgroundRequest=0;
  const defaultBackground='url("Background/Background.png")';
  function desktopBackground(){
    const value=getComputedStyle($('desktop')).backgroundImage;
    return value&&value!=='none'?value:defaultBackground;
  }
  function shuffledWallpaperNumbers(){
    const numbers=Array.from({length:FOLDER_WALLPAPER_COUNT},(_,i)=>i+1);
    for(let i=numbers.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [numbers[i],numbers[j]]=[numbers[j],numbers[i]];
    }
    return numbers;
  }
  function imageExists(path){
    return new Promise(resolve=>{
      const probe=new Image();
      let complete=false;
      const settle=ok=>{
        if(complete)return;
        complete=true;clearTimeout(timeout);probe.onload=null;probe.onerror=null;
        resolve(ok);
      };
      const timeout=setTimeout(()=>settle(false),1800);
      probe.onload=()=>settle(probe.naturalWidth>0);
      probe.onerror=()=>settle(false);
      probe.src=path;
    });
  }
  async function pickFolderWallpaper(request){
    for(const number of shuffledWallpaperNumbers()){
      if(request!==backgroundRequest||dynamicPreference)return;
      let url=folderCache.get(number);
      if(url===null)continue;
      if(url===undefined){
        for(const ext of FOLDER_EXTENSIONS){
          const candidate=`Login-wallpapers/${number}.${ext}`;
          if(await imageExists(candidate)){
            url=candidate;break;
          }
          if(request!==backgroundRequest||dynamicPreference)return;
        }
        folderCache.set(number,url||null);
      }
      if(url){
        if(request!==backgroundRequest||dynamicPreference)return;
        selectedFolderWallpaper=url;
        root.style.backgroundImage=`url("${url}")`;
        return;
      }
    }
    // Preserve a usable lock screen if the optional folder was not deployed.
    if(request===backgroundRequest&&!dynamicPreference){
      selectedFolderWallpaper=null;
      root.style.backgroundImage=defaultBackground;
      console.warn('[WebWindows] Login-wallpapers/ has no accessible numbered images (1–17).');
    }
  }
  function applyBackground(selectNew=false){
    // Invalidate any asynchronous folder scan before switching modes or images.
    const request=++backgroundRequest;
    if(dynamicPreference){root.style.backgroundImage=desktopBackground();return;}
    if(!selectNew&&selectedFolderWallpaper){
      root.style.backgroundImage=`url("${selectedFolderWallpaper}")`;
      return;
    }
    selectedFolderWallpaper=null;
    root.style.backgroundImage=defaultBackground; // until the numbered image loads
    void pickFolderWallpaper(request);
  }
  dynamic.addEventListener('change',()=>{
    dynamicPreference=dynamic.checked;
    try{localStorage.setItem(DYNAMIC_KEY,String(dynamicPreference));}catch{}
    applyBackground(!dynamicPreference);
  });
  window.addEventListener('webwindows:wallpaper-changed',()=>applyBackground());
  const wallpaperObserver=new MutationObserver(()=>{if(dynamicPreference)applyBackground();});
  wallpaperObserver.observe($('desktop'),{attributes:true,attributeFilter:['style']});
  function syncAccount(){
    const prefs=window.WebWindowsSettings?.get?.();
    $('ww-login-user').textContent=prefs?.account||$('ww10-start-account-name')?.textContent||'Administrator';
    const source=$('ww-profile-sidebar-image'),photo=$('ww-login-photo');
    const url=source&&!source.hidden?source.getAttribute('src'):'';
    if(url && (/^data:image\/(?:png|jpeg|webp|gif|avif);base64,/i.test(url)||url.startsWith('blob:'))){
      photo.src=url;photo.hidden=false;
    }else{photo.hidden=true;photo.removeAttribute('src');}
  }
  const profile=$('ww-profile-sidebar-image');
  if(profile)new MutationObserver(syncAccount).observe(profile,{attributes:true,attributeFilter:['src','hidden']});
  const accountName=$('ww10-start-account-name');
  if(accountName)new MutationObserver(syncAccount).observe(accountName,{childList:true,characterData:true,subtree:true});
  function clock(){
    const now=new Date(),p=window.wwTimeFormat||{},locale=p.language||'en-US';
    $('ww-lock-time').textContent=now.toLocaleTimeString(locale,{hour:'numeric',minute:'2-digit',hour12:p.hour24!==true,...(p.localTime===false?{timeZone:'UTC'}:{})});
    $('ww-lock-date').textContent=now.toLocaleDateString(locale,{weekday:'long',month:'long',day:'numeric',...(p.localDate===false?{timeZone:'UTC'}:{})});
  }
  const clockTimer=setInterval(clock,1000);clock();
  function showSignin(){
    if(!dialog.hidden)return;
    root.classList.add('ww-signin');root.classList.remove('ww-authenticating');
    syncAccount();syncPinState();clearStatus();input.focus();
  }
  async function unlock(){
    if(busy)return;busy=true;input.disabled=true;
    root.classList.add('ww-authenticating');
    $('ww-login-loader').hidden=false;$('ww-login-welcome').hidden=false;
    await new Promise(resolve=>setTimeout(resolve,1180));
    root.hidden=true;root.classList.remove('ww-signin','ww-authenticating');input.value='';input.disabled=false;
    $('ww-login-loader').hidden=true;$('ww-login-welcome').hidden=true;
    busy=false;failedAttempts=0;awaitingDefenderKey=false;sessionAuthenticated=true;WWCompat.emit('webwindows:unlocked');
  }
  $('ww-login-form').addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    if(Date.now()<lockedOutUntil){status.textContent='Too many attempts. Try again shortly.';return;}
    const requirement=window.WebWindowsSecurity?.getLoginRequirement?.()||'pin';
    const keyStep=awaitingDefenderKey||requirement==='key';
    const hasCredential=hasPin()||hasPassword();
    if(hasCredential||keyStep){
      const password=!keyStep&&requirement==='pin'&&credentialMode==='password'&&hasPassword()&&window.WebWindowsSecurity?.getPreferences?.().mode!=='adaptive';
      const record=password?passwordRecord:pinRecord;
      if(!keyStep&&!record){status.textContent='Select a configured sign-in method.';return;}
      if(!canHash()){status.textContent='Signing in requires HTTPS or localhost.';return;}
      busy=true;input.disabled=true;
      let correct=false;
      try{
        if(keyStep)correct=Boolean(await window.WebWindowsSecurity?.verifyKey?.(input.value));
        else correct=(bootupOnly&&sessionAuthenticated&&requirement==='pin'&&!password)||await(password?verifyRecord(input.value,record):verifyPin(input.value));
      }catch{correct=false;}
      busy=false;input.disabled=false;
      if(!correct){
        failedAttempts++;input.value='';status.textContent=keyStep?'Incorrect Defender key. Try again.':password?'Incorrect password. Try again.':'Incorrect PIN. Try again.';
        if(failedAttempts>=5){
          lockedOutUntil=Date.now()+30000;status.textContent='Too many attempts. Try again in 30 seconds.';
          input.disabled=true;
          setTimeout(()=>{if(Date.now()>=lockedOutUntil){failedAttempts=0;input.disabled=false;clearStatus();}},30500);
        }
        return;
      }
      if(requirement==='pin-key'&&!keyStep){
        awaitingDefenderKey=true;
        syncPinState();status.textContent='PIN accepted. Enter your Defender key to continue.';
        input.focus({preventScroll:true});return;
      }
    }
    awaitingDefenderKey=false;
    await unlock();
  });
  $('ww-lock-preview').addEventListener('click',showSignin);
  $('ww-lock-preview').addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();showSignin();}
  });
  root.addEventListener('keydown',event=>{
    if(root.classList.contains('ww-signin')&&event.key==='Escape'&&dialog.hidden){
      root.classList.remove('ww-signin');return;
    }
    if(!root.classList.contains('ww-signin')&&(event.key==='Enter'||event.key===' ')){
      event.preventDefault();showSignin();
    }
  });
  function lock(){
    awaitingDefenderKey=false;syncAccount();clock();if(bootupOnly&&!sessionAuthenticated&&hasPin())credentialMode='pin';syncPinState();clearStatus();
    root.classList.remove('ww-signin','ww-authenticating');
    $('ww-login-loader').hidden=true;$('ww-login-welcome').hidden=true;
    root.hidden=false;applyBackground(!dynamicPreference);WWCompat.emit('webwindows:locked');
  }
  $('ww-lock-now')?.addEventListener('click',lock);
  document.addEventListener('keydown',event=>{
    if(event.metaKey&&event.key.toLowerCase()==='l'){event.preventDefault();lock();}
  });
  window.WebWindowsLogin=Object.freeze({lock,hasPin,managePin:()=>manageCredential('pin'),verifyPin,savePin,refreshWallpaper:applyBackground,getPinOptions:()=>({morse:morseEnabled,bootupOnly})});
  window.dispatchEvent(new Event('webwindows:pin-updated'));
  lock();

  // Icons8 Windows 11 Color / Fluency IDs verified against its weather collection.
  // A single WMO-to-icon resolver provides consistent assets throughout 10H10.
  const WEATHER_ICON_IDS=Object.freeze({
    clear:'8EUmYhfLPTCF',moon:'3dxwW3xZfAj4',night:'VT8HlhlnhUwL',partly:'zIVmoh4T8wh7',cloudy:'W8fUZZSmXssu',
    overcast:'W8fUZZSmXssu',fog:'qHIFUjYhnsFU',haze:'IL2szZWdo0Bo',smoke:'BncPMNznpkES',
    drizzle:'QZJFPE7TNi5Q',rain:'HWPdQMFoVy95',heavyRain:'7Dcax1eBasEf',showers:'PIXtKMDAXCzo',
    rainyNight:'wBPV56Uje50D',sleet:'fyJ8mNcBHced',icePellets:'4dVnvFFjJIRs',
    lightSnow:'JBQOSn7KOSuD',snow:'cyZConbteZk9',heavySnow:'Mi2BdbZQWNYQ',
    blizzard:'qlJRoffslNg7',hail:'jws4rTJ5EmwZ',thunder:'DlsFhDMp4rhs',
    thunderRain:'6AAyqKfBlzoB',thunderSnow:'pvDsNpV5YTxC',stormNight:'PwHEPRMlRd4a',
    windyNight:'3RZmbgKAmbsY',wind:'3RZmbgKAmbsY',tornado:'tEqjiPMXL4U5',
    cloudLightning:'c0Otgmp74zQX',rainCloud:'MVj2tmasj0Pp',
    icy:'JPFoI922p1gw',dust:'NjsqgHjrCASE',dry:'svnLDdcfYlch',torrential:'uzabNvAfhNNr'
  });
  // Weather condition icons are resolved from Open-Meteo's WMO weather code,
  // not selected randomly or inferred from the clock. is_day comes from the API.
  // Codes 0/1 show only sun or moon; code 2 shows sun/cloud or moon/cloud.
  // Do not use Icons8's 'Evening' landscape for the nighttime sky.
  // Snow showers are NOT called a blizzard without wind data.
  const WEATHER_BY_CODE=Object.freeze({
    0:  ['Clear skies','clear','moon','sun','moon'],
    1:  ['Mainly clear','clear','moon','sun','moon'],
    2:  ['Partly cloudy','partly','night','cloud-sun','cloud-moon'],
    3:  ['Overcast','overcast','overcast','clouds','clouds'],
    45: ['Fog','fog','fog','cloud','cloud'],
    48: ['Freezing fog','fog','fog','cloud','cloud'],
    51: ['Light drizzle','drizzle','drizzle','cloud-rain','cloud-rain'],
    53: ['Moderate drizzle','drizzle','drizzle','cloud-rain','cloud-rain'],
    55: ['Dense drizzle','drizzle','drizzle','cloud-rain','cloud-rain'],
    56: ['Light freezing drizzle','sleet','sleet','cloud-snow','cloud-snow'],
    57: ['Dense freezing drizzle','sleet','sleet','cloud-snow','cloud-snow'],
    61: ['Light rain','rain','rainyNight','cloud-rain','cloud-rain'],
    63: ['Rain','rain','rainyNight','cloud-rain','cloud-rain'],
    65: ['Heavy rain','heavyRain','heavyRain','cloud-rain','cloud-rain'],
    66: ['Light freezing rain','sleet','sleet','cloud-snow','cloud-snow'],
    67: ['Heavy freezing rain','sleet','sleet','cloud-snow','cloud-snow'],
    71: ['Light snow','lightSnow','lightSnow','cloud-snow','cloud-snow'],
    73: ['Snow','snow','snow','cloud-snow','cloud-snow'],
    75: ['Heavy snow','heavySnow','heavySnow','cloud-snow','cloud-snow'],
    77: ['Snow grains','lightSnow','lightSnow','cloud-snow','cloud-snow'],
    80: ['Light rain showers','showers','showers','cloud-rain','cloud-rain'],
    81: ['Rain showers','showers','showers','cloud-rain','cloud-rain'],
    82: ['Violent rain showers','torrential','torrential','cloud-rain','cloud-rain'],
    85: ['Light snow showers','lightSnow','lightSnow','cloud-snow','cloud-snow'],
    86: ['Heavy snow showers','heavySnow','heavySnow','cloud-snow','cloud-snow'],
    95: ['Thunderstorm','thunder','stormNight','cloud-lightning','cloud-lightning'],
    96: ['Thunderstorm with hail','thunderRain','thunderRain','cloud-lightning','cloud-lightning'],
    97: ['Heavy thunderstorm','thunderRain','stormNight','cloud-lightning','cloud-lightning'],
    99: ['Thunderstorm with heavy hail','thunderRain','thunderRain','cloud-lightning','cloud-lightning']
  });
  // Both cloud-only conditions use the light, white-gray cloud artwork.
  // This is the exact Icons8 image requested for 10H10, including its shading.
  const WHITE_CLOUD_URL='https://img.icons8.com/?size=100&id=W8fUZZSmXssu&format=png&color=000000';
  const iconURL=(key,size=100)=>{
    const sourceSize=size>=200?200:100;
    if(key==='cloudy'||key==='overcast')return WHITE_CLOUD_URL.replace('size=100',`size=${sourceSize}`);
    return key&&WEATHER_ICON_IDS[key]
      ?`https://img.icons8.com/?size=${sourceSize}&id=${WEATHER_ICON_IDS[key]}&format=png`
      :null;
  };
  function weatherCondition(code,isDay=true){
    const item=Number.isInteger(code)?WEATHER_BY_CODE[code]:null;
    if(!item)return {description:'Weather unavailable',key:null,glyph:'cloud'};
    const daytime=isDay===true||isDay===1;
    return {description:item[0],key:daytime?item[1]:item[2],glyph:daytime?item[3]:item[4]};
  }
  const weatherImages=[$('weather-button')?.querySelector('.weather-icon'),$('ww-lock-weather-icon'),$('ww-weather-flyout-icon')];
  let activeWeatherIconURL=null;
  function syncWeatherIcons(code,isDay){
    const {description,key,glyph}=weatherCondition(code,isDay);
    const url=iconURL(key);
    activeWeatherIconURL=url;
    for(const image of weatherImages)if(image){
      const imageURL=image.id==='ww-weather-flyout-icon'?iconURL(key,200):url;
      if(!imageURL){image.removeAttribute('src');image.hidden=true;}
      else{image.hidden=false;if(image.getAttribute('src')!==imageURL)image.src=imageURL;}
      image.alt=description;
    }
    for(const fallback of document.querySelectorAll('.weather-fallback,.ww-lock-weather-fallback,#ww-weather-flyout-fallback')){
      fallback.className=fallback.className.replace(/\bph-(?:sun|moon|cloud[-a-z]*|question)\b/g,'').replace(/\s+/g,' ').trim();
      fallback.classList.add('ph-'+glyph);
    }
    // When a remote icon fails, the corresponding Phosphor weather symbol
    // remains visible rather than a stale partly-cloudy sun.
    if(!url){$('weather-button')?.classList.remove('image-loaded');$('ww-lock-weather')?.classList.remove('ww-icon-loaded');}
    const flyoutFallback=$('ww-weather-flyout-fallback');
    const flyoutImage=$('ww-weather-flyout-icon');
    if(flyoutImage){
      const update=()=>{
        const ready=!!url&&flyoutImage.complete&&flyoutImage.naturalWidth>0;
        flyoutImage.hidden=!ready;
        if(flyoutFallback)flyoutFallback.hidden=ready;
      };
      flyoutImage.addEventListener('load',update,{once:true});
      flyoutImage.addEventListener('error',update,{once:true});
      update();
    }
    // Search results, when open, reflect the same actual current conditions.
    const searchWrap=document.querySelector('#search-results [data-search-action="weather"] .search-result-icon');
    if(searchWrap){
      searchWrap.replaceChildren();
      const symbol=url?document.createElement('img'):document.createElement('i');
      if(url){symbol.className='search-weather-icon';symbol.src=url;symbol.alt='';symbol.draggable=false;}
      else symbol.className='ph ph-cloud';
      symbol.setAttribute('aria-hidden','true');searchWrap.append(symbol);
    }
    return description;
  }
  // Icons8 Color weather-stats artwork with a deterministic offline fallback.
  // The same source family is used for current conditions and forecasts.
  const lockHumidityIcon=$('ww-lock-humidity-icon');
  if(lockHumidityIcon){
    const host=lockHumidityIcon.closest('.ww-lock-humidity-symbol');
    const check=()=>host?.classList.toggle('is-unavailable',lockHumidityIcon.complete&&lockHumidityIcon.naturalWidth===0);
    lockHumidityIcon.addEventListener('load',check);
    lockHumidityIcon.addEventListener('error',()=>host?.classList.add('is-unavailable'));
    if(lockHumidityIcon.complete)check();
  }
  for(const picture of document.querySelectorAll('#ww-weather .ww10-weather-stat-image')){
    const host=picture.closest('.ww10-weather-stat-icon');
    const sync=()=>host?.classList.toggle('is-unavailable',picture.complete&&picture.naturalWidth===0);
    picture.addEventListener('load',sync);
    picture.addEventListener('error',()=>host?.classList.add('is-unavailable'));
    if(picture.complete)sync();
  }
  window.WebWindowsWeatherIcons=Object.freeze({
    ids:WEATHER_ICON_IDS,
    forCode:(code,isDay=true)=>iconURL(weatherCondition(code,isDay).key),
    describe:(code,isDay=true)=>weatherCondition(code,isDay).description,
    current:()=>activeWeatherIconURL
  });
  let currentWeatherLocation=null;
  let weatherBusy=false;
  let weatherLastUpdated=0;
  const weatherFlyout=$('ww-weather');
  const weatherView=$('ww-weather-view');
  const newsView=$('ww-news-view');
  const viewSwitch=$('ww-weather-news-switch');
  const viewSwitchIcon=$('ww-weather-news-switch-icon');
  const viewSwitchLabel=$('ww-weather-news-switch-label');
  const weatherFooterActions=$('ww-weather-footer-actions');
  const newsFooterActions=$('ww-news-footer-actions');
  let currentFlyoutView='weather';
  function switchWeatherNewsView(view) {
    const next=view==='news'?'news':'weather';
    const destination=next==='weather'?'news':'weather';
    currentFlyoutView=next;
    if (weatherFlyout) {
      weatherFlyout.dataset.wwView=next;
      weatherFlyout.setAttribute('aria-label',next==='news'?'News headlines':'Weather forecast');
    }
    if (weatherView) weatherView.hidden=next!=='weather';
    if (newsView) newsView.hidden=next!=='news';
    // One switch button moves beside the active view's info control, without
    // duplicating its ID or changing the existing data-source panels.
    const activeActions=next==='news'?newsFooterActions:weatherFooterActions;
    if (viewSwitch && activeActions && viewSwitch.parentElement!==activeActions)
      activeActions.prepend(viewSwitch);
    // Always label the button with the destination it opens.
    if (viewSwitch) {
      viewSwitch.setAttribute('aria-label',`Switch to ${destination==='news'?'News':'Weather'}`);
      viewSwitch.setAttribute('aria-controls',destination==='news'?'ww-news-view':'ww-weather-view');
      viewSwitch.title=`Switch to ${destination==='news'?'News':'Weather'}`;
    }
    if (viewSwitchIcon) viewSwitchIcon.className=destination==='news'?'ph ph-newspaper':'ph ph-cloud-sun';
    if (viewSwitchLabel) viewSwitchLabel.textContent=destination==='news'?'News':'Weather';
    // Each view has its own scroll region and preserves its scroll position.
    if (!weatherFlyout?.hidden) requestAnimationFrame(positionWeatherFlyout);
  }
  viewSwitch?.addEventListener('click',()=>{
    const target=currentFlyoutView==='weather'?'news':'weather';
    switchWeatherNewsView(target);
    if (target==='news') WWCompat.emit('webwindows:news-opened');
    else void weatherUpdate();
  });
  let weatherOpenAnimationTimer=null;
  function animateWeatherOpen(){
    clearTimeout(weatherOpenAnimationTimer);
    weatherFlyout.classList.remove('ww10-weather-opening');
    weatherFlyout.classList.add('ww10-weather-opening');
    weatherOpenAnimationTimer=setTimeout(()=>{
      weatherFlyout.classList.remove('ww10-weather-opening');
      weatherOpenAnimationTimer=null;
    },790);
  }

  const weatherTaskbarButton=$('weather-button');
  const weatherVisibilityObserver=new MutationObserver(()=>{
    weatherTaskbarButton?.setAttribute('aria-expanded',String(!weatherFlyout?.hidden));
  });
  if(weatherFlyout)weatherVisibilityObserver.observe(weatherFlyout,{attributes:true,attributeFilter:['hidden']});
  const weatherStatus=$('ww-weather-status');
  const setWeatherStatus=(message='')=>{
    if(!weatherStatus)return;
    weatherStatus.textContent=message;
    weatherStatus.hidden=!message;
    if(!weatherFlyout?.hidden)requestAnimationFrame(positionWeatherFlyout);
  };
  const weatherNumber=(value,unit='°')=>Number.isFinite(value)?Math.round(value)+unit:'—';
  const weatherHourLabel=iso=>{
    if(typeof iso!=='string')return '—';
    const hour=Number(iso.slice(11,13));
    if(!Number.isInteger(hour))return '—';
    return (hour%12||12)+(hour<12?' AM':' PM');
  };
  const weatherDayLabel=iso=>{
    if(typeof iso!=='string')return '—';
    const date=new Date(iso.slice(0,10)+'T12:00:00Z');
    return Number.isNaN(date.valueOf())?'—':new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'UTC'}).format(date);
  };
  function makeWeatherForecastIcon(code,isDay){
    const {key,glyph}=weatherCondition(code,isDay);
    const wrap=document.createElement('span');
    wrap.className='ww10-weather-hour-icon';
    wrap.setAttribute('aria-hidden','true');
    const fallback=document.createElement('i');
    fallback.className='ph ph-'+glyph;
    wrap.append(fallback);
    const url=iconURL(key);
    if(url){
      const picture=document.createElement('img');
      picture.alt='';picture.loading='eager';picture.decoding='async';picture.draggable=false;
      // Hidden/lazy images were deferred indefinitely on closed flyouts and
      // off-screen lock screens. Keep the request active, but reveal the image
      // only after its pixels have loaded successfully.
      const sync=()=>wrap.classList.toggle('is-loaded',picture.complete&&picture.naturalWidth>0);
      picture.addEventListener('load',sync);
      picture.addEventListener('error',()=>wrap.classList.remove('is-loaded'));
      wrap.prepend(picture);
      picture.src=url;
      if(picture.complete)sync();
    }
    return wrap;
  }
  function renderWeatherForecast(result){
    const current=result.current||{};
    const daily=result.daily||{};
    const hourly=result.hourly||{};
    const todayMax=Number(daily.temperature_2m_max?.[0]);
    const todayMin=Number(daily.temperature_2m_min?.[0]);
    if($('ww-weather-feels'))$('ww-weather-feels').textContent=weatherNumber(current.apparent_temperature);
    if($('ww-weather-hi'))$('ww-weather-hi').textContent=weatherNumber(Number.isFinite(todayMax)?todayMax:NaN);
    if($('ww-weather-lo'))$('ww-weather-lo').textContent=weatherNumber(Number.isFinite(todayMin)?todayMin:NaN);
    if($('ww-weather-humidity'))$('ww-weather-humidity').textContent=weatherNumber(current.relative_humidity_2m,'%');
    if($('ww-weather-wind'))$('ww-weather-wind').textContent=weatherNumber(current.wind_speed_10m,' mph');
    if($('ww-lock-humidity'))$('ww-lock-humidity').textContent=weatherNumber(current.relative_humidity_2m,'%');

    const hourHost=$('ww-weather-hours');
    if(hourHost){
      hourHost.replaceChildren();
      const times=Array.isArray(hourly.time)?hourly.time:[];
      const currentTime=typeof current.time==='string'?current.time:times[0];
      let from=times.findIndex(time=>time>=String(currentTime||'').slice(0,13)+':00');
      if(from<0)from=0;
      const count=Math.min(5,Math.max(0,times.length-from));
      for(let j=0;j<count;j++){
        const idx=from+j,code=hourly.weather_code?.[idx],isDay=hourly.is_day?.[idx]!==0;
        const slot=document.createElement('div');slot.className='ww10-hour';
        const time=document.createElement('span');time.className='ww10-hour-label';time.textContent=j===0?'Now':weatherHourLabel(times[idx]);
        const degree=document.createElement('strong');degree.className='ww10-hour-temp';degree.textContent=weatherNumber(hourly.temperature_2m?.[idx]);
        slot.append(time,makeWeatherForecastIcon(code,isDay),degree);hourHost.append(slot);
      }
      if(!count){
        const empty=document.createElement('p');empty.className='ww10-weather-placeholder';
        empty.textContent='Hourly forecast unavailable';hourHost.append(empty);
      }
    }
    const dailyHost=$('ww-weather-days');
    if(dailyHost){
      dailyHost.replaceChildren();
      const days=Array.isArray(daily.time)?daily.time:[];
      for(let idx=0;idx<Math.min(5,days.length);idx++){
        const row=document.createElement('div');row.className='ww10-day';
        const name=document.createElement('span');name.className='ww10-day-name';name.textContent=idx===0?'Today':weatherDayLabel(days[idx]);
        const high=document.createElement('span');high.className='ww10-day-high';high.textContent=weatherNumber(daily.temperature_2m_max?.[idx]);
        const low=document.createElement('span');low.className='ww10-day-low';low.textContent=weatherNumber(daily.temperature_2m_min?.[idx]);
        const temps=document.createElement('span');temps.className='ww10-day-temps';
        temps.append(high,low);
        row.append(name,makeWeatherForecastIcon(daily.weather_code?.[idx],true),temps);
        row.setAttribute('aria-label',`${name.textContent}: ${weatherCondition(daily.weather_code?.[idx],true).description}, high ${high.textContent}, low ${low.textContent}`);
        dailyHost.append(row);
      }
      if(!days.length){
        const empty=document.createElement('p');empty.className='ww10-weather-placeholder';
        empty.textContent='Daily forecast unavailable';dailyHost.append(empty);
      }
    }
  }
  async function fetchWeather(latitude,longitude,place='Local weather'){
    if(weatherBusy)return;
    weatherBusy=true;
    weatherFlyout?.classList.add('ww10-weather-refreshing');
    // Keep routine refreshes unobtrusive; only display loading before the first forecast.
    if(!weatherLastUpdated)setWeatherStatus('Updating weather…');
    const requestController=new AbortController();
    const requestTimeout=setTimeout(()=>requestController.abort(),12000);
    try{
      const query=new URLSearchParams({
        latitude:String(latitude),longitude:String(longitude),
        current:'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
        hourly:'temperature_2m,weather_code,is_day',
        daily:'weather_code,temperature_2m_max,temperature_2m_min',
        forecast_days:'5',temperature_unit:'fahrenheit',wind_speed_unit:'mph',timezone:'auto'
      });
      const response=await fetch('https://api.open-meteo.com/v1/forecast?'+query.toString(),{cache:'no-store',signal:requestController.signal});
      if(!response.ok)throw Error('Weather API unavailable');
      const result=await response.json();
      const temp=result?.current?.temperature_2m,code=result?.current?.weather_code,isDay=result?.current?.is_day;
      if(!Number.isFinite(temp)||!Number.isInteger(code)||![0,1].includes(isDay))throw Error('Invalid weather data');
      const condition=syncWeatherIcons(code,isDay!==0),value=weatherNumber(temp,'°F');
      if($('ww-lock-location'))$('ww-lock-location').textContent=place;
      if($('ww-lock-temp'))$('ww-lock-temp').textContent=value;
      if($('ww-lock-condition'))$('ww-lock-condition').textContent=condition;
      const taskTemp=weatherTaskbarButton?.querySelector('.weather-temperature');
      const taskCondition=weatherTaskbarButton?.querySelector('.weather-text');
      if(taskTemp)taskTemp.textContent=value;
      if(taskCondition)taskCondition.textContent=condition;
      if($('ww-weather-location'))$('ww-weather-location').textContent=place;
      if($('ww-weather-temp'))$('ww-weather-temp').textContent=value;
      if($('ww-weather-description'))$('ww-weather-description').textContent=condition;
      renderWeatherForecast(result);
      if(!weatherFlyout?.hidden)requestAnimationFrame(positionWeatherFlyout);
      currentWeatherLocation={latitude,longitude,place};
      weatherLastUpdated=Date.now();
      const updateLabel=$('ww-weather-updated');
      if(updateLabel)updateLabel.textContent='Updated '+new Date(weatherLastUpdated).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
      setWeatherStatus();
    }catch(error){
      setWeatherStatus('Weather is temporarily unavailable. Retrying automatically.');
      if($('ww-lock-condition'))$('ww-lock-condition').textContent='Weather unavailable';
      if($('ww-lock-humidity'))$('ww-lock-humidity').textContent='—';
      console.warn('[WebWindows] Live weather error:',error);
    }finally{
      clearTimeout(requestTimeout);
      weatherBusy=false;
      weatherFlyout?.classList.remove('ww10-weather-refreshing');
      }
  }
  async function useCurrentLocation(){
    if(!navigator.geolocation){setWeatherStatus('Location services are unavailable.');return;}
    try{
      const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:1800000}));
      // Persist the approved location before fetching, so a temporary network
      // failure can be retried by the automatic timer without reopening the flyout.
      currentWeatherLocation={latitude:position.coords.latitude,longitude:position.coords.longitude,place:'Local weather'};
      await fetchWeather(currentWeatherLocation.latitude,currentWeatherLocation.longitude,currentWeatherLocation.place);
    }catch(error){
      setWeatherStatus(error?.code===1?'Enable location access to show local weather.':'Could not determine your location.');
      if($('ww-lock-condition'))$('ww-lock-condition').textContent='Weather unavailable';
      if($('ww-lock-humidity'))$('ww-lock-humidity').textContent='—';
    }
  }
  async function weatherUpdate(force=false){
    if(weatherBusy)return;
    if(!force && weatherLastUpdated && Date.now()-weatherLastUpdated<10*60*1000)return;
    return currentWeatherLocation
      ?fetchWeather(currentWeatherLocation.latitude,currentWeatherLocation.longitude,currentWeatherLocation.place)
      :useCurrentLocation();
  }
  function positionWeatherFlyout(){
    if(!weatherFlyout || weatherFlyout.hidden || !weatherTaskbarButton)return;
    // Use exactly the same dock-aware bounds as Start and Search. A narrow
    // viewport beside a vertical taskbar reduces the WIDTH, not just the height.
    // The inner forecast scroll area keeps its original readable tile heights.
    WWCompat.positionTaskbarPanel(weatherFlyout,{
      width:450,height:535,gap:12,inset:10,anchor:weatherTaskbarButton
    });
  }
  function closeWeatherFlyout(returnFocus=false){
    if(!weatherFlyout || weatherFlyout.hidden)return;
    weatherFlyout.hidden=true;
    clearTimeout(weatherOpenAnimationTimer);
    weatherOpenAnimationTimer=null;
    weatherFlyout.classList.remove('ww10-weather-opening');
    const sourcesPanel=$('ww-weather-sources');
    if(sourcesPanel)sourcesPanel.hidden=true;
    $('ww-weather-sources-toggle')?.setAttribute('aria-expanded','false');
    const newsSources=$('ww-news-flyout-sources');
    if(newsSources)newsSources.hidden=true;
    $('ww-news-flyout-sources-toggle')?.setAttribute('aria-expanded','false');
    weatherTaskbarButton?.setAttribute('aria-expanded','false');
    if(returnFocus)weatherTaskbarButton?.focus({preventScroll:true});
  }
  function openWeatherNewsFlyout(view) {
    if (!weatherFlyout) return;
    const next=view==='news'?'news':'weather';
    // Clicking the same active taskbar state closes the panel; clicking the
    // other taskbar state switches views without unexpectedly dismissing it.
    if (!weatherFlyout.hidden && currentFlyoutView===next) {
      closeWeatherFlyout();
      return;
    }
    switchWeatherNewsView(next);
    if (weatherFlyout.hidden) {
      for (const panel of document.querySelectorAll('.ww-flyout'))
        if (panel!==weatherFlyout) panel.hidden=true;
      weatherFlyout.hidden=false;
      animateWeatherOpen();
    }
    weatherTaskbarButton?.setAttribute('aria-expanded','true');
    positionWeatherFlyout();
    requestAnimationFrame(positionWeatherFlyout);
    if (next==='weather') void weatherUpdate();
    else WWCompat.emit('webwindows:news-opened');
  }
  window.addEventListener('webwindows:weather-requested',()=>openWeatherNewsFlyout('weather'));
  window.addEventListener('webwindows:news-requested',()=>openWeatherNewsFlyout('news'));
  // A compact info glyph reveals the license/source details only on demand.
  const sourcesToggle=$('ww-weather-sources-toggle');
  const sourcesPanel=$('ww-weather-sources');
  sourcesToggle?.addEventListener('click',()=>{
    if(!sourcesPanel)return;
    const expanded=sourcesPanel.hidden;
    sourcesPanel.hidden=!expanded;
    sourcesToggle.setAttribute('aria-expanded',String(expanded));
    requestAnimationFrame(positionWeatherFlyout);
  });
  const newsSourcesToggle=$('ww-news-flyout-sources-toggle');
  const newsSourcesPanel=$('ww-news-flyout-sources');
  newsSourcesToggle?.addEventListener('click',()=>{
    if (!newsSourcesPanel) return;
    newsSourcesPanel.hidden=!newsSourcesPanel.hidden;
    newsSourcesToggle.setAttribute('aria-expanded',String(!newsSourcesPanel.hidden));
    requestAnimationFrame(positionWeatherFlyout);
  });
  document.addEventListener('pointerdown',event=>{
    if(!weatherFlyout?.hidden && !weatherFlyout.contains(event.target) && !weatherTaskbarButton?.contains(event.target))closeWeatherFlyout();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!weatherFlyout?.hidden){event.preventDefault();closeWeatherFlyout(true);}
  });
  for(const eventName of ['webwindows:start-opening','webwindows:search-opening','webwindows:settings-requested','webwindows:information-requested','webwindows:defender-requested','webwindows:feedback-requested','webwindows:quick-settings-requested','webwindows:date-time-requested','webwindows:locked'])window.addEventListener(eventName,()=>closeWeatherFlyout());
  window.addEventListener('resize',()=>positionWeatherFlyout(),{passive:true});
  window.addEventListener('webwindows:taskbar-layout-changed',()=>{
    if(!weatherFlyout?.hidden)requestAnimationFrame(positionWeatherFlyout);
  });
  document.getElementById('taskbar')?.addEventListener('animationend',positionWeatherFlyout);
  document.getElementById('taskbar')?.addEventListener('transitionend',positionWeatherFlyout);
  document.documentElement.addEventListener('transitionend',event=>{if(event.target===document.documentElement)positionWeatherFlyout();});
  const weatherDockObserver=new MutationObserver(()=>{if(!weatherFlyout?.hidden)requestAnimationFrame(positionWeatherFlyout);});
  weatherDockObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-ww-taskbar','data-ww-layout','data-ww-align']});
  const weatherResizeObserver=typeof ResizeObserver!=='undefined'?new ResizeObserver(()=>{if(!weatherFlyout?.hidden)requestAnimationFrame(positionWeatherFlyout);}):null;
  if(weatherResizeObserver && weatherTaskbarButton)weatherResizeObserver.observe(weatherTaskbarButton);
  if(weatherResizeObserver && document.getElementById('taskbar'))weatherResizeObserver.observe(document.getElementById('taskbar'));
  if(navigator.permissions?.query){
    navigator.permissions.query({name:'geolocation'}).then(permission=>{
      if(permission.state==='granted')void useCurrentLocation();
    }).catch(()=>{});
  }
  // Refresh every ten minutes while active; catch up when returning to a tab
  // or recovering the network. Existing weatherUpdate() guards prevent overlap.
  const weatherTimer=setInterval(()=>{
    if(!document.hidden && currentWeatherLocation)void weatherUpdate();
  },10*60*1000);
  const refreshWeatherOnReturn=()=>{
    if(!document.hidden && currentWeatherLocation)void weatherUpdate();
  };
  document.addEventListener('visibilitychange',refreshWeatherOnReturn);
  window.addEventListener('online',refreshWeatherOnReturn);
  window.addEventListener('pagehide',()=>{
    clearInterval(clockTimer);clearInterval(weatherTimer);
    document.removeEventListener('visibilitychange',refreshWeatherOnReturn);
    window.removeEventListener('online',refreshWeatherOnReturn);
    wallpaperObserver.disconnect();weatherVisibilityObserver.disconnect();weatherDockObserver.disconnect();weatherResizeObserver?.disconnect();
  },{once:true});
});


/* WebWindows 10H10 · GDELT DOC 2.0 live news, failure-tolerant edition.
 * A local cache protects the Start/news widget during rate limits and outages.
 * The optional news endpoint meta tag can point to a shared caching proxy.
 * No fabricated articles are inserted on an upstream failure.
 */
WWCompat.boot('GDELT News', () => {
  'use strict';
  const $ = id => document.getElementById(id);
  const button = $('weather-button');
  const spotlightText = $('ww10-taskbar-news-headline');
  const regionImage = $('ww10-taskbar-news-region-icon');
  const regionWrap = $('ww10-taskbar-news-icon-wrap');
  const regionMask = $('ww10-taskbar-news-region-mask');
  const REGION_IMAGES = Object.freeze({
    usa: 'https://img.icons8.com/?size=100&id=zCE7AHTV6k2v&format=png&color=000000',
    uk: 'https://img.icons8.com/?size=100&id=WFZQs6Wt34rh&format=png&color=000000',
    eu: 'https://img.icons8.com/?size=100&id=p5QymWEfpBVl&format=png&color=000000'
  });
  let activeRegion = null;
  // Only replace the default newspaper icon after the specific Icons8 asset
  // loads successfully. Failed or unknown-country stories keep the fallback.
  regionImage?.addEventListener('load', () => {
    if (regionWrap && regionImage.naturalWidth > 0)
      regionWrap.dataset.wwIconLoaded = 'true';
  });
  regionImage?.addEventListener('error', () => {
    if (regionWrap) regionWrap.dataset.wwIconLoaded = 'false';
  });

  const newsGrid = $('ww10-start-news-grid');
  const feedStatus = $('ww10-news-update-status');
  const infoToggle = $('ww10-news-sources-toggle');
  const infoPanel = $('ww10-news-sources');
  if (!button || !spotlightText || !newsGrid) return;

  const DIRECT_ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';
  // Optional caching endpoint, e.g. https://your-worker.workers.dev/news.
  // Use an empty meta tag for the built-in keyless GDELT DOC endpoint.
  const endpointSetting = document.querySelector('meta[name="webwindows-news-endpoint"]')?.content?.trim() || '';
  const configuredEndpoint = (() => {
    if (!endpointSetting) return '';
    try {
      const url = new URL(endpointSetting,location.href);
      if (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))) return url.href;
    } catch {}
    console.warn('[WebWindows] Ignoring invalid news endpoint configuration.');
    return '';
  })();
  const ENDPOINT = configuredEndpoint || DIRECT_ENDPOINT;
  const usingProxy = Boolean(configuredEndpoint);
  const CACHE_KEY = 'webwindows.10h10.news.headlines.v3';
  const PREVIOUS_CACHE_KEYS = ['webwindows.10h10.gdelt.headlines.v2','webwindows.10h10.gdelt.headlines.v1'];
  // New version intentionally clears old GDELT-only retry cooldowns, so the
  // browser can immediately try the independent publisher fallback.
  const COOLDOWN_KEY = 'webwindows.10h10.news.retry.v3';
  const LEASE_KEY = 'webwindows.10h10.news.request-lease.v3';
  const REFRESH_MS = 30 * 60 * 1000;
  const ROTATION_MS = 12000;
  const REQUEST_TIMEOUT_MS = 18000;
  const CACHE_MAX_AGE_MS = 48 * 60 * 60 * 1000;
  const ARTICLE_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;
  const RETRY_BASE_MS = 2 * 60 * 1000;
  const RETRY_MAX_MS = 60 * 60 * 1000;
  const leaseOwner = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const motion = WWCompat.media('(prefers-reduced-motion: reduce)');
  let articles = [];
  let newsIndex = 0;
  let lastSuccess = 0;
  let nextAttempt = 0;
  let inFlight = false;
  let holdSpotlight = false;
  let errorCount = 0;
  let disposed = false;
  let activeAbort = null;
  let lastFailureType = '';
  let feedSource = 'none';
  let upstreamNotice = '';

  const safeStorageGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const safeStorageSet = (key,value) => { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { return false; } };
  const safeStorageRemove = key => { try { localStorage.removeItem(key); } catch {} };
  const parseStored = key => { try { return JSON.parse(safeStorageGet(key) || 'null'); } catch { return null; } };
  const safeSource = raw => {
    try {
      const url = new URL(String(raw));
      return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : null;
    } catch { return null; }
  };
  const publisher = entry => {
    if (typeof entry.domain === 'string' && /^[a-z0-9.-]+$/i.test(entry.domain))
      return entry.domain.replace(/^www\./i, '');
    try { return new URL(entry.url).hostname.replace(/^www\./i, ''); }
    catch { return 'Publisher'; }
  };
  const parseDate = raw => {
    if (typeof raw === 'number') return raw > 1e11 ? raw : raw * 1000;
    if (typeof raw !== 'string') return NaN;
    if (/^\d{14}$/.test(raw))
      return Date.parse(`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}T${raw.slice(8,10)}:${raw.slice(10,12)}:${raw.slice(12,14)}Z`);
    const value=Date.parse(raw);
    return Number.isFinite(value)?value:NaN;
  };
  // Publisher-provided preview text and images only; never invent a news summary.
  const previewText = raw => {
    if (typeof raw !== 'string') return '';
    const doc = new DOMParser().parseFromString(raw,'text/html');
    const clean=(doc.body.textContent || '').replace(/\s+/g,' ').trim();
    if(clean.length<=240)return clean;
    const chunk=clean.slice(0,239).replace(/\s+\S*$/,'').trimEnd();
    return `${chunk || clean.slice(0,239).trimEnd()}…`;
  };
  function normalize(feed) {
    if (!Array.isArray(feed)) return [];
    const seen = new Set();
    return feed.flatMap(record => {
      const url = safeSource(record?.url);
      const title = typeof record?.title === 'string' ? record.title.trim().replace(/\s+/g,' ') : '';
      if (!url || title.length < 12 || title.length > 320) return [];
      const domain = publisher({...record,url});
      const unique = url.split(/[?#]/)[0].replace(/\/$/,'').toLowerCase();
      if (seen.has(unique)) return [];
      seen.add(unique);
      const published = parseDate(record?.published ?? record?.seendate ?? record?.seen_date);
      if (Number.isFinite(published) && (published > Date.now()+5*60*1000 || Date.now()-published>ARTICLE_MAX_AGE_MS)) return [];
      const description = previewText(record?.description || record?.summary || record?.snippet || '');
      const imageCandidates = [...new Set([
        record?.image,record?.socialimage,record?.thumbnail,
        ...(Array.isArray(record?.images) ? record.images : [])
      ].map(safeSource).filter(Boolean))];
      const image = imageCandidates[0] || null;
      const sourceCountry = String(record?.sourceCountry || record?.sourcecountry || record?.source_country || record?.country || '').trim();
      return [{title,url,domain,sourceCountry,published:Number.isFinite(published)?published:null,description,image,images:imageCandidates}];
    }).slice(0,12);
  }
  // Use source-country metadata when GDELT provides it. A headline's subject
  // is not evidence of the publisher's origin. EU and UN icons are reserved
  // for official institutional sources or explicit source-country metadata.
  function newsOrigin(entry) {
    const country = String(entry?.sourceCountry || '').trim().toLowerCase();
    const domain = String(entry?.domain || '').trim().toLowerCase().replace(/^www\./, '');
    if (/^(un|united nations)$/.test(country) || /(^|\.)un\.org$/.test(domain) || /(^|\.)unnews\.org$/.test(domain)) return 'un';
    if (/^(eu|european union)$/.test(country) || /(^|\.)europa\.eu$/.test(domain) || /(^|\.)europarl\.europa\.eu$/.test(domain) || /(^|\.)consilium\.europa\.eu$/.test(domain) || /(^|\.)ecb\.europa\.eu$/.test(domain) || /(^|\.)eeas\.europa\.eu$/.test(domain)) return 'eu';
    if (/^(us|usa|united states|united states of america)$/.test(country)) return 'usa';
    if (/^(uk|gb|gbr|united kingdom|great britain|england|scotland|wales|northern ireland)$/.test(country)) return 'uk';
    // Some feeds omit source country; a small set of unmistakable publisher
    // domains can still be identified without guessing.
    if (/^(nytimes\.com|washingtonpost\.com|apnews\.com|cnn\.com|npr\.org|usatoday\.com)$/.test(domain)) return 'usa';
    if (/^(bbc\.com|bbc\.co\.uk|theguardian\.com|independent\.co\.uk|telegraph\.co\.uk|ft\.com|sky\.com)$/.test(domain)) return 'uk';
    return null;
  }
  function updateNewsRegionIcon(entry) {
    if (!regionImage || !regionWrap) return;
    const region = newsOrigin(entry);
    if (region === activeRegion) return;
    activeRegion = region;
    regionWrap.dataset.wwIconLoaded = 'false';
    if (regionWrap) regionWrap.dataset.wwRegion = region || '';
    if (regionMask) regionMask.hidden = region !== 'un';
    if (!region) {
      regionImage.removeAttribute('src');
      return;
    }
    if (region === 'un') {
      regionImage.removeAttribute('src');
      regionWrap.dataset.wwIconLoaded = 'true';
      return;
    }
    regionImage.src = REGION_IMAGES[region];
  }
  function headlineTime(entry) {
    if (!entry?.published) return entry?.domain || 'Publisher';
    const diff=Math.max(0,Date.now()-entry.published);
    const hours=Math.floor(diff/3600000);
    return entry.domain+' · '+(hours<1?'Recently':(hours<24?hours+'h ago':Math.floor(hours/24)+'d ago'));
  }
  function isStale() { return !lastSuccess || Date.now()-lastSuccess>REFRESH_MS; }
  // Failed images may recover after a temporary publisher outage. Give each
  // failure a short cooldown rather than blacklisting the URL permanently.
  const failedNewsImages = new Map();
  const IMAGE_RETRY_MS = 10 * 60 * 1000;
  let newsImageRecoveryQueued = false;
  const availableArticleImages = entry => [...new Set([
    entry?.image,...(Array.isArray(entry?.images)?entry.images:[])
  ].filter(Boolean))].filter(url=>Date.now()-(failedNewsImages.get(url)||0)>IMAGE_RETRY_MS);
  function queueNewsImageRecovery() {
    if (newsImageRecoveryQueued || disposed) return;
    newsImageRecoveryQueued = true;
    requestAnimationFrame(()=>{
      newsImageRecoveryQueued = false;
      if (!disposed) renderStart();
    });
  }
  function makeNewsCard(entry, index) {
    const card = document.createElement('article');
    card.className = 'ww10-news-card' + (entry ? '' : ' ww10-news-card-empty');
    const bar = document.createElement('div');
    bar.className = 'ww10-news-card-bar';
    const mark = document.createElement('i');
    mark.className = 'ph ph-newspaper';
    mark.setAttribute('aria-hidden','true');
    const label = document.createElement('span');
    label.textContent = 'News';
    const source = document.createElement('span');
    source.className = 'ww10-news-card-source';
    source.textContent = entry ? headlineTime(entry) : '';
    bar.append(mark,label,source);

    const body = document.createElement(entry ? 'a' : 'div');
    body.className = 'ww10-news-card-link';
    if (entry) {
      body.href = entry.url;
      body.target = '_blank';
      body.rel = 'noopener noreferrer';
      body.setAttribute('aria-label',`Read news: ${entry.title}`);
    }
    const headline = document.createElement('h3');
    headline.className = 'ww10-news-card-headline';
    headline.textContent = entry?.title || (inFlight ? 'Loading headlines…' : (index ? 'Headline unavailable' : 'News is temporarily unavailable'));
    const art = document.createElement('span');
    art.className = 'ww10-news-card-image';
    art.setAttribute('aria-hidden','true');
    const candidates=entry ? availableArticleImages(entry) : [];
    if (candidates.length) {
      const img = document.createElement('img');
      img.alt = '';
      // At most four cards are drawn; eager images are important inside the
      // independently scrolling Start news grid.
      img.loading = 'eager';
      img.decoding = 'async';
      let candidateIndex = 0;
      const nextPublisherImage = () => {
        if (candidateIndex >= candidates.length) {
          img.remove();
          art.remove();
          card.classList.add('ww10-news-card-text-only');
          scheduleFitNewsSummaries();
          // Prefer another genuine, illustrated article if the feed has one.
          queueNewsImageRecovery();
          return;
        }
        img.src = candidates[candidateIndex++];
      };
      img.addEventListener('load',()=>{
        if (img.naturalWidth > 1 && img.naturalHeight > 1) img.classList.add('is-loaded');
        else {
          failedNewsImages.set(img.src,Date.now());
          nextPublisherImage();
        }
      });
      img.addEventListener('error',()=>{
        failedNewsImages.set(img.src,Date.now());
        nextPublisherImage();
      });
      art.append(img);
      nextPublisherImage();
    } else {
      card.classList.add('ww10-news-card-text-only');
    }
    const summary = document.createElement('p');
    summary.className = 'ww10-news-card-summary';
    summary.textContent = entry ? (entry.description || `Read the complete report from ${entry.domain}.`) : (inFlight ? 'Connecting to news sources.' : 'No article available from the news sources right now.');
    // Retain the entire publisher preview so it can be refitted after a resize.
    summary.dataset.wwFullDescription = summary.textContent;
    body.append(headline,...(candidates.length ? [art] : []),summary);
    card.append(bar,body);
    return card;
  }
  // Browsers can omit the visual ellipsis for multi-line WebKit clamps,
  // especially with flex children and words wrapping mid-line. Fit the
  // description at actual rendered width and append a real ellipsis only
  // when some of the publisher's text must be hidden.
  let fitNewsFrame = 0;
  function fitNewsSummaries() {
    fitNewsFrame = 0;
    if (disposed || !newsGrid.getClientRects().length) return;
    for (const node of newsGrid.querySelectorAll('.ww10-news-card-summary')) {
      if (node.getBoundingClientRect().width < 10) continue;
      const full = node.dataset.wwFullDescription || node.textContent || '';
      const maxLines = node.closest('.ww10-news-card-text-only') ? 9 : 4;
      const originalStyle = node.getAttribute('style');
      // Unclamp for measurement. Restore all authored styles afterward.
      node.style.display = 'block';
      node.style.webkitLineClamp = 'unset';
      node.style.setProperty('line-clamp','unset');
      node.style.overflow = 'visible';
      node.style.maxHeight = 'none';
      const lineHeight = parseFloat(getComputedStyle(node).lineHeight) || 15;
      const allowed = maxLines * lineHeight + 0.75;
      const fits = value => {
        node.textContent = value;
        return node.getBoundingClientRect().height <= allowed;
      };
      if (!fits(full)) {
        const words = full.trim().split(/\s+/).filter(Boolean);
        let lo = 0, hi = words.length;
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2);
          const candidate = words.slice(0,mid).join(' ') + '…';
          if (fits(candidate)) lo = mid;
          else hi = mid - 1;
        }
        if (lo > 0) node.textContent = words.slice(0,lo).join(' ') + '…';
        else {
          // Single unbroken words still need a reliable suffix.
          let low=0, high=full.length;
          while(low<high){
            const mid=Math.ceil((low+high)/2);
            if(fits(full.slice(0,mid)+'…')) low=mid;
            else high=mid-1;
          }
          node.textContent=full.slice(0,low)+'…';
        }
      }
      if (originalStyle === null) node.removeAttribute('style');
      else node.setAttribute('style',originalStyle);
    }
  }
  function scheduleFitNewsSummaries() {
    if (fitNewsFrame || disposed) return;
    fitNewsFrame = requestAnimationFrame(fitNewsSummaries);
  }
  window.addEventListener('webwindows:start-opening',scheduleFitNewsSummaries);
  window.addEventListener('resize',scheduleFitNewsSummaries,{passive:true});
  window.addEventListener('webwindows:taskbar-layout-changed',scheduleFitNewsSummaries);
  document.fonts?.ready?.then(scheduleFitNewsSummaries).catch(()=>{});
  const flyoutList=$('ww-news-flyout-list');
  const flyoutStatus=$('ww-news-flyout-status');
  function makeFlyoutNewsArticle(entry) {
    const link=document.createElement('a');
    link.className='ww10-news-flyout-article';
    link.href=entry.url;
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.title=entry.title;
    const copy=document.createElement('span');
    copy.className='ww10-news-flyout-article-copy';
    const meta=document.createElement('span');
    meta.className='ww10-news-flyout-article-meta';
    meta.textContent=headlineTime(entry);
    const title=document.createElement('strong');
    title.className='ww10-news-flyout-article-title';
    title.textContent=entry.title;
    copy.append(meta,title);
    if (entry.description) {
      const summary=document.createElement('span');
      summary.className='ww10-news-flyout-article-summary';
      summary.textContent=entry.description;
      copy.append(summary);
    }
    link.append(copy);
    const picture=document.createElement('span');
    picture.className='ww10-news-flyout-article-image';
    const fallback=document.createElement('i');
    fallback.className='ph ph-newspaper';
    fallback.setAttribute('aria-hidden','true');
    picture.append(fallback);
    const imageUrl=availableArticleImages(entry)[0];
    if (imageUrl) {
      const img=document.createElement('img');
      img.alt='';
      img.loading='lazy';
      img.decoding='async';
      img.draggable=false;
      img.addEventListener('load',()=>{if(img.naturalWidth>0) fallback.hidden=true;});
      img.addEventListener('error',()=>{
        img.hidden=true;
        fallback.hidden=false;
        failedNewsImages.set(imageUrl,Date.now());
      });
      picture.append(img);
      img.src=imageUrl;
      if(img.complete&&img.naturalWidth>0)fallback.hidden=true;
      link.append(picture);
    }
    // A publisher without a preview image receives a full-width text card,
    // not an empty image placeholder or unrelated stock photograph.
    return link;
  }
  function renderFlyoutNews() {
    if (!flyoutList) return;
    const latest=articles.slice(0,8);
    const scrollPosition=flyoutList.scrollTop;
    if (!latest.length) {
      const message=document.createElement('p');
      message.className='ww10-news-flyout-empty';
      message.textContent=inFlight
        ? 'Checking for current headlines…'
        : 'Live headlines are unavailable right now. Use Refresh to try again.';
      flyoutList.replaceChildren(message);
    } else {
      flyoutList.replaceChildren(...latest.map(makeFlyoutNewsArticle));
    }
    flyoutList.scrollTop=scrollPosition;
    if (flyoutStatus) flyoutStatus.textContent=!latest.length
      ? (inFlight?'Updating headlines…':'Headlines unavailable')
      : (isStale()?'Saved headlines':'Latest headlines');
  }
  $('ww-news-flyout-refresh')?.addEventListener('click',()=>{void updateNews(true);});
  function renderStart() {
    // Keep news current within each group, but favor records that contain
    // publisher-associated imagery. Never borrow an unrelated article's photo.
    const withImage=articles.filter(entry=>availableArticleImages(entry).length);
    const withoutImage=articles.filter(entry=>!availableArticleImages(entry).length);
    const topFour=[...withImage,...withoutImage].slice(0,4);
    const cards=Array.from({length:4},(_,i)=>makeNewsCard(topFour[i] || null,i));
    newsGrid.replaceChildren(...cards);
    renderFlyoutNews();
    scheduleFitNewsSummaries();
    if (feedStatus) feedStatus.textContent = !topFour.length
      ? (inFlight?'Updating…':'Unavailable')
      : (isStale()?'Saved headlines':'Updated');
  }
  function renderSpotlight() {
    if (!articles.length) {
      button.dataset.wwSpotlight='weather';
      updateNewsRegionIcon(null);
      return;
    }
    const entry=articles[newsIndex%articles.length];
    updateNewsRegionIcon(entry);
    spotlightText.textContent=entry.title;
    spotlightText.title=entry.title;
    button.title=button.dataset.wwSpotlight==='news'?`${entry.title} — ${entry.domain}`:'Weather';
    button.setAttribute('aria-label',button.dataset.wwSpotlight==='news'?`News: ${entry.title}. Open News flyout.`:'Weather. Open Weather flyout.');
  }
  function setSpotlight(value) {
    const next=value==='news'&&articles.length?'news':'weather';
    if (button.dataset.wwSpotlight===next) return;
    button.dataset.wwSpotlight=next;
    button.setAttribute('aria-controls','ww-weather');
    button.setAttribute('aria-expanded',String(!$('ww-weather')?.hidden));
    renderSpotlight();
  }
  function tickSpotlight() {
    if (disposed||!articles.length||document.hidden||holdSpotlight||button.matches(':hover,:focus-visible')) return;
    if (!$('ww-weather')?.hidden||!$('ww10-start-menu')?.hidden) return;
    if (button.dataset.wwSpotlight==='weather') setSpotlight('news');
    else {setSpotlight('weather');newsIndex=(newsIndex+1)%articles.length;}
  }
  function setArticles(next,fetchedAt,source='gdelt') {
    articles=next;
    newsIndex=0;
    lastSuccess=fetchedAt;
    feedSource=source;
    renderStart();
    renderSpotlight();
    WWCompat.emit('webwindows:news-updated',{count:articles.length});
  }
  function restoreCache() {
    // Persistent across reloads/tabs. Stale-but-recent real headlines survive
    // temporary upstream outages and are accurately marked "Saved headlines".
    for (const key of [CACHE_KEY,...PREVIOUS_CACHE_KEYS]) {
      const cached=parseStored(key) || (()=>{
        if (!PREVIOUS_CACHE_KEYS.includes(key)) return null;
        try {return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}
      })();
      if (!cached||!Array.isArray(cached.articles)||!Number.isFinite(cached.fetchedAt)) continue;
      if (cached.fetchedAt>Date.now()+60000||Date.now()-cached.fetchedAt>CACHE_MAX_AGE_MS) continue;
      const restored=normalize(cached.articles);
      if (restored.length) {setArticles(restored,cached.fetchedAt,cached.source||'gdelt');return;}
    }
  }
  function restoreCooldown() {
    const state=parseStored(COOLDOWN_KEY);
    if (!state||!Number.isFinite(state.until)) return;
    if (state.until>Date.now() && state.until<Date.now()+3*60*60*1000) {
      nextAttempt=state.until;
      errorCount=Math.min(6,Number(state.errors)||0);
    }
  }
  function getLease() {const lease=parseStored(LEASE_KEY);return lease&&Number.isFinite(lease.until)&&lease.until>Date.now()?lease:null;}
  function tryClaimLease() {
    const lease=getLease();
    if (lease && lease.owner!==leaseOwner) return false;
    const newLease={owner:leaseOwner,until:Date.now()+REQUEST_TIMEOUT_MS+5000};
    if (!safeStorageSet(LEASE_KEY,newLease)) return true; // Storage-disabled pages still work.
    return getLease()?.owner===leaseOwner;
  }
  function releaseLease() {if(getLease()?.owner===leaseOwner) safeStorageRemove(LEASE_KEY);}
  function onFailure(type,error,retryAfterMs=0) {
    errorCount=Math.min(6,errorCount+1);
    lastFailureType=type;
    const backoff=Math.min(RETRY_MAX_MS,RETRY_BASE_MS*2**Math.min(errorCount-1,5));
    nextAttempt=Date.now()+Math.max(backoff,retryAfterMs);
    safeStorageSet(COOLDOWN_KEY,{until:nextAttempt,errors:errorCount});
    // A blocked CORS response, HTTP-200 text error and rate limit are distinct
    // from an application exception. Record useful diagnostics only once per cycle.
    console.warn(`[WebWindows] News feed ${type}; retry paused.`,error?.message||error);
    WWCompat.emit('webwindows:news-error',{reason:type,retryAt:nextAttempt,hasSavedArticles:articles.length>0});
    if (!articles.length) setSpotlight('weather');
    renderStart();
  }
  const queryParams = new URLSearchParams({
    query:'(technology OR science OR business) sourcelang:english',
    mode:'artlist',format:'json',sort:'datedesc',timespan:'48h',maxrecords:'20'
  });
  const directUrl=DIRECT_ENDPOINT+'?'+queryParams.toString();
  function sourceUrl() {return usingProxy?ENDPOINT:directUrl;}

  // These two publishers publish real RSS feeds which support direct browser
  // requests (no proxy or API key). When GDELT is slow, blocked by CORS, or
  // throttled, display genuine publisher headlines rather than an empty card.
  // Credit is provided by the existing news information button.
  const RSS_FEEDS = [
    {source:'dw',url:'https://rss.dw.com/xml/rss-en-all',publisher:'Deutsche Welle'},
    {source:'nytimes',url:'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',publisher:'The New York Times'}
  ];
  const FALLBACK_START_DELAY_MS = 750;
  const RSS_TIMEOUT_MS = 8500;
  const GDELT_TIMEOUT_MS = 12000;
  const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));

  async function fetchGdelt(signal) {
    const response=await fetch(sourceUrl(),{
      signal,cache:'no-store',mode:'cors',headers:{Accept:'application/json'}
    });
    const raw=await response.text();
    if (!response.ok) {
      let retryAfterMs=0;
      const retry=response.headers.get('Retry-After');
      if (retry) {
        const seconds=Number(retry);
        retryAfterMs=Number.isFinite(seconds)?Math.max(0,seconds*1000):Math.max(0,Date.parse(retry)-Date.now()||0);
      }
      const error=new Error(`HTTP ${response.status}: ${raw.slice(0,120).replace(/\s+/g,' ')}`);
      error.failureType=response.status===429?'rate-limited':`HTTP-${response.status}`;
      error.retryAfterMs=retryAfterMs;
      throw error;
    }
    let payload;
    try {payload=JSON.parse(raw);} catch {
      const error=new Error('GDELT returned non-JSON data.');
      error.failureType=/limit|thrott|quota|too many/i.test(raw)?'rate-limited':'invalid-response';
      throw error;
    }
    const result=normalize(Array.isArray(payload)?payload:payload?.articles);
    if (!result.length) {
      const error=new Error('GDELT returned no usable recent articles.');
      error.failureType='empty-response';
      throw error;
    }
    return result;
  }

  async function fetchRssFeed(feed,signal) {
    const response=await fetch(feed.url, {signal,mode:'cors',cache:'no-store',headers:{Accept:'application/rss+xml, application/xml, text/xml, */*'}});
    if (!response.ok) throw new Error(`${feed.publisher}: HTTP ${response.status}`);
    const raw=await response.text();
    const xml=new DOMParser().parseFromString(raw,'application/xml');
    if (xml.querySelector('parsererror')) throw new Error(`${feed.publisher}: invalid XML`);
    const items=Array.from(xml.getElementsByTagName('item'));
    // Read tags by localName too, for RSS 2.0 and RDF/RSS feeds with namespaces.
    const field=(item,name) => Array.from(item.children).find(n=>n.localName?.toLowerCase()===name.toLowerCase())?.textContent?.trim()||'';
    const parsed=items.map(item=>{
      const description=field(item,'description');
      const encoded=Array.from(item.children).find(n=>n.localName?.toLowerCase()==='encoded')?.textContent||'';
      // Image belongs to this particular RSS <item>. Prefer that item's
      // media:thumbnail/content or image enclosure, then its own HTML preview.
      // Do not substitute stock images or images from other article entries.
      const mediaNodes=Array.from(item.querySelectorAll('*')).filter(n=>{
        const name=n.localName?.toLowerCase();
        if (name==='thumbnail') return true;
        if (name==='enclosure') return (n.getAttribute('type')||'').toLowerCase().startsWith('image/');
        return name==='content' && (/media/i.test(n.prefix||'') || /search\.yahoo\.com\/mrss/i.test(n.namespaceURI||'')) && (!(n.getAttribute('type')) || n.getAttribute('type').toLowerCase().startsWith('image/'));
      });
      const mediaUrls = mediaNodes
        .sort((a,b)=>(Number(b.getAttribute('width'))||0)-(Number(a.getAttribute('width'))||0))
        .map(n=>n.getAttribute('url')).filter(Boolean);
      const previewUrls=[];
      for (const rawHtml of [encoded,description]) {
        if (!rawHtml) continue;
        const previewDoc=new DOMParser().parseFromString(rawHtml,'text/html');
        for (const photo of previewDoc.querySelectorAll('img')) {
          const srcSet=photo.getAttribute('srcset') || photo.getAttribute('data-srcset') || '';
          const highRes=srcSet.split(',').map(part=>part.trim().split(/\s+/)[0]).filter(Boolean).pop();
          previewUrls.push(highRes,photo.getAttribute('src'),photo.getAttribute('data-src'),photo.getAttribute('data-original'));
        }
      }
      const images=[...new Set([...mediaUrls,...previewUrls].filter(Boolean).map(candidate=>{
        try {return safeSource(new URL(candidate,field(item,'link')||feed.url).href);} catch {return null;}
      }).filter(Boolean))].slice(0,6);
      return {
        title:field(item,'title'), url:field(item,'link'),
        domain:feed.source==='dw'?'dw.com':'nytimes.com',
        published:field(item,'pubDate')||field(item,'date'),
        description:description||encoded,
        image:images[0]||'',images
      };
    });
    const normalized=normalize(parsed);
    if (!normalized.length) throw new Error(`${feed.publisher}: no usable articles`);
    return {source:feed.source,articles:normalized};
  }

  function saveFresh(results,source) {
    if (disposed) return;
    const fetchedAt=Date.now();
    setArticles(results,fetchedAt,source);
    safeStorageSet(CACHE_KEY,{articles:results,fetchedAt,source});
    errorCount=0;
    lastFailureType='';
    nextAttempt=0;
    safeStorageRemove(COOLDOWN_KEY);
  }

  async function updateNews(force=false) {
    if (disposed||inFlight||document.hidden||navigator.onLine===false) return;
    const now=Date.now();
    if (now<nextAttempt || (!force&&lastSuccess&&now-lastSuccess<REFRESH_MS)) return;
    if (!tryClaimLease()) return;
    inFlight=true;
    if (!articles.length) renderStart();
    const gdeltAbort=new AbortController();
    const rssAbort=new AbortController();
    activeAbort={abort:()=>{gdeltAbort.abort();rssAbort.abort();}};
    const gdeltTimer=setTimeout(()=>gdeltAbort.abort(),GDELT_TIMEOUT_MS);
    const rssTimer=setTimeout(()=>rssAbort.abort(),RSS_TIMEOUT_MS+FALLBACK_START_DELAY_MS);
    let gotGdelt=false;
    let gotRss=false;
    let gdeltError=null;
    let rssError=null;
    let firstRssSource=null;
    try {
      // The fallback races the GDELT request but waits 750ms to avoid needless
      // RSS requests when GDELT responds quickly. A late GDELT success upgrades
      // the visible feed while retaining normal taskbar/Start interaction.
      const primary=fetchGdelt(gdeltAbort.signal).then(items=>{
        gotGdelt=true;
        saveFresh(items,'gdelt');
        rssAbort.abort();
      }).catch(error=>{gdeltError=error;});
      const fallback=(async()=>{
        await delay(FALLBACK_START_DELAY_MS);
        if (disposed||gotGdelt) return;
        const candidates=RSS_FEEDS.map(feed=>fetchRssFeed(feed,rssAbort.signal));
        try {
          const answer=await Promise.any(candidates);
          gotRss=true;
          firstRssSource=answer.source;
          if (!gotGdelt) saveFresh(answer.articles,answer.source);
        } catch(error) {rssError=error;}
      })();
      await Promise.all([primary,fallback]);
      if (!gotGdelt&&!gotRss) {
        const failure=gdeltError||rssError||new Error('All news sources were unavailable.');
        onFailure(failure.failureType||(failure.name==='AbortError'?'timeout':'network-or-CORS'),failure,failure.retryAfterMs||0);
      } else if (!gotGdelt) {
        // RSS was successful: this is normal fallback operation, not a blank
        // feed. Log GDELT's failure only as a diagnostic.
        upstreamNotice=gdeltError?.failureType||gdeltError?.name||'gdelt-unavailable';
        console.info('[WebWindows] GDELT unavailable; showing live publisher RSS headlines.');
      } else upstreamNotice='';
    } finally {
      clearTimeout(gdeltTimer);clearTimeout(rssTimer);
      activeAbort=null;
      inFlight=false;
      releaseLease();
      if (!disposed) renderStart();
    }
  }
  infoToggle?.addEventListener('click',()=>{
    if (!infoPanel) return;
    infoPanel.hidden=!infoPanel.hidden;
    infoToggle.setAttribute('aria-expanded',String(!infoPanel.hidden));
  });
  document.addEventListener('pointerdown',event=>{
    if (!infoPanel?.hidden&&!infoPanel.contains(event.target)&&!infoToggle?.contains(event.target)) {
      infoPanel.hidden=true;
      infoToggle?.setAttribute('aria-expanded','false');
    }
  });
  document.addEventListener('keydown',event=>{
    if (event.key==='Escape'&&!infoPanel?.hidden) {
      infoPanel.hidden=true;
      infoToggle?.setAttribute('aria-expanded','false');
    }
  });
  button.addEventListener('pointerenter',()=>{holdSpotlight=true;});
  button.addEventListener('pointerleave',()=>{holdSpotlight=false;});
  button.addEventListener('focusin',()=>{holdSpotlight=true;});
  button.addEventListener('focusout',()=>{holdSpotlight=false;});
  window.addEventListener('webwindows:news-opened',()=>{renderStart();void updateNews();});
  window.addEventListener('webwindows:start-opening',()=>{renderStart();void updateNews();});
  window.addEventListener('webwindows:weather-requested',()=>setSpotlight('weather'));
  const resume=()=>{if(!document.hidden) void updateNews();};
  document.addEventListener('visibilitychange',resume);
  window.addEventListener('online',resume);
  window.addEventListener('storage',event=>{
    if (event.key===CACHE_KEY) {restoreCache();renderStart();}
    if (event.key===COOLDOWN_KEY) restoreCooldown();
  });
  const refreshTimer=setInterval(()=>{
    if (!document.hidden) void updateNews();
  },60*1000);
  const rotateTimer=setInterval(tickSpotlight,ROTATION_MS);
  restoreCache();
  restoreCooldown();
  renderStart();
  renderSpotlight();
  void updateNews();
  window.addEventListener('pagehide',()=>{
    disposed=true;
    activeAbort?.abort();
    clearInterval(refreshTimer);
    clearInterval(rotateTimer);
    document.removeEventListener('visibilitychange',resume);
    window.removeEventListener('online',resume);
    releaseLease();
  },{once:true});
  window.WebWindowsNews=Object.freeze({
    refresh:()=>updateNews(true),
    get:()=>articles.slice(),
    status:()=>({count:articles.length,source:feedSource,stale:isStale(),inFlight,reason:lastFailureType,gdeltNote:upstreamNotice,nextRetryAt:nextAttempt,usingProxy}),
    show:()=>WWCompat.emit('webwindows:news-requested')
  });
  window.dispatchEvent(new Event('webwindows:news-updated'));
});
