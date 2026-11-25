/* WebWindows 11H11: one JavaScript entrypoint for desktop, Start, News, Search, and Settings. */


/* Embedded Phosphor vectors. Icons inherit currentColor from the active glass theme. */
const WW11_REGULAR_GEAR_PATH = 'M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z';
const WW11_REGULAR_GEAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" focusable="false" aria-hidden="true"><path d="${WW11_REGULAR_GEAR_PATH}"/></svg>`;
window.WebWindows11Icons = Object.freeze({
  resolve(name) {
    const requested = String(name || 'app-window').replace(/[^a-z0-9-]/gi, '');
    const symbol = document.getElementById(`ww-ph-${requested}`);
    return symbol?.tagName?.toLowerCase() === 'symbol' ? requested : 'app-window';
  },
  viewBox(name) {
    const symbol = document.getElementById(`ww-ph-${this.resolve(name)}`);
    return symbol?.getAttribute('viewBox') || '0 0 24 24';
  },
  make(name, className='') {
    // The requested regular Phosphor Gear is a locally rendered <i> icon.
    if(name === 'gear' || name === 'gear-six') {
      const icon=document.createElement('i');
      icon.classList.add('ph','ph-gear');
      if(className)icon.classList.add(...String(className).split(/\s+/).filter(Boolean));
      icon.setAttribute('aria-hidden','true');
      const vector=document.createElementNS('http://www.w3.org/2000/svg','svg');
      vector.setAttribute('viewBox','0 0 256 256');
      vector.setAttribute('aria-hidden','true');
      vector.setAttribute('focusable','false');
      vector.setAttribute('fill','currentColor');
      const outline=document.createElementNS('http://www.w3.org/2000/svg','path');
      outline.setAttribute('d',WW11_REGULAR_GEAR_PATH);
      vector.append(outline);
      icon.append(vector);
      return icon;
    }
    const safeName=this.resolve(name);
    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
    icon.classList.add('ww-ph-icon');
    if(className)icon.classList.add(...String(className).split(/\s+/).filter(Boolean));
    icon.setAttribute('viewBox',this.viewBox(safeName));
    icon.setAttribute('aria-hidden','true');
    icon.setAttribute('focusable','false');
    const use=document.createElementNS('http://www.w3.org/2000/svg','use');
    use.setAttribute('href',`#ww-ph-${safeName}`);
    icon.append(use);
    return icon;
  },
  html(name,className='') {
    if(name === 'gear' || name === 'gear-six') {
      const classes=['ph','ph-gear',...String(className).split(/\s+/).filter(Boolean)].join(' ');
      return `<i class="${classes}" aria-hidden="true">${WW11_REGULAR_GEAR_SVG}</i>`;
    }
    const safeName=this.resolve(name);
    // All incoming names are resolved against bundled sprite IDs.
    return `<svg class="${className} ww-ph-icon" viewBox="${this.viewBox(safeName)}" aria-hidden="true" focusable="false"><use href="#ww-ph-${safeName}"></use></svg>`;
  }
});

/* Desktop image recovery + taskbar clock. The missing or intermittent CDN
   icons always have a bundled, immediately available SVG fallback. */
(() => {
  'use strict';
  const wallpaper = document.getElementById('wallpaper');
  if (wallpaper) {
    const updateWallpaper = () => wallpaper.classList.toggle('is-missing',wallpaper.naturalWidth === 0);
    wallpaper.addEventListener('load',updateWallpaper);
    wallpaper.addEventListener('error',updateWallpaper);
    if (wallpaper.complete) updateWallpaper();
  }

  // Handle Start icons as well as taskbar icons: before this fix, Start's
  // remote bitmaps never received the class which makes them visible.
  const remoteIcons = [...document.querySelectorAll('img.remote-icon,img.start-remote')];
  for (const img of remoteIcons) {
    let retries = 0;
    let timer = null;
    const status = () => {
      const loaded=img.naturalWidth > 0;
      // A newer local icon can be dropped into Assets/ww11/MSN.png at any time.
      // Earlier builds do not include it, so keep the original asset as fallback.
      if(!loaded && img.dataset.wwFallbackSrc && img.dataset.wwFallbackAttempted!=='true') {
        img.dataset.wwFallbackAttempted='true';
        img.src=img.dataset.wwFallbackSrc;
        return;
      }
      img.classList.toggle('is-loaded',loaded);
      const taskbarButton=img.closest('.taskbar-button');
      taskbarButton?.classList.toggle('icon-error',!loaded);
      if (loaded) {clearTimeout(timer);timer=null;}
      else if (retries < 2 && navigator.onLine !== false) {
        clearTimeout(timer);
        timer=setTimeout(()=>{
          retries++;
          try {
            const url=new URL(img.src,location.href);
            if (url.hostname !== 'img.icons8.com') return; // local originals are not retried with remote query params
            url.searchParams.set('ww-retry',String(retries));
            img.src=url.href;
          } catch { /* fallback remains visible */ }
        },retries===0?1300:4200);
      }
    };
    img.addEventListener('load',status);
    img.addEventListener('error',status);
    if (img.complete) status();
    window.addEventListener('online',()=>{
      if (img.classList.contains('is-loaded') || !img.src.startsWith('https://img.icons8.com/')) return;
      retries=0;
      const url=new URL(img.src);
      url.searchParams.set('ww-retry','online');
      img.src=url.href;
    });
    window.addEventListener('pagehide',()=>clearTimeout(timer),{once:true});
  }

  // 10H10's small Icons8 star overlays the magnifier in all three Search
  // locations. Only show the remote artwork/mask once its exact URL loads;
  // otherwise keep a small offline star fallback visible.
  for (const img of document.querySelectorAll('.ww-search-star-color')) {
    const mark=img.closest('.ww-search-graphic');
    if (!mark) continue;
    const update=()=>mark.classList.toggle('star-loaded',img.naturalWidth > 0);
    img.addEventListener('load',update);
    img.addEventListener('error',update);
    if (img.complete) update();
    window.addEventListener('online',()=>{
      if (mark.classList.contains('star-loaded')) return;
      const url=new URL(img.src,location.href);
      if (url.hostname==='img.icons8.com') {
        url.searchParams.set('ww-retry','online');
        img.src=url.href;
      }
    });
  }

  // Show Icons8 navigation assets only after they successfully decode.
  // Otherwise the semantic Phosphor regular icon remains available.
  for (const img of document.querySelectorAll('.ww-nav-icons8')) {
    const mark = () => img.classList.toggle('is-loaded',img.naturalWidth > 0);
    img.addEventListener('load',mark);
    img.addEventListener('error',mark);
    if (img.complete) mark();
  }

  // Phosphor uses embedded SVG symbols; no icon-font detection is needed.
  const clock=document.getElementById('taskbar-clock');
  const timeEl=document.getElementById('taskbar-time');
  const dateEl=document.getElementById('taskbar-date');
  const pad=n=>String(n).padStart(2,'0');
  function updateClock() {
    if (!clock||!timeEl||!dateEl) return;
    const now=new Date();
    const time=now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    const date=now.toLocaleDateString('en-US');
    const full=now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    timeEl.textContent=time;
    timeEl.dateTime=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    dateEl.textContent=date;
    clock.title=full;
    clock.setAttribute('aria-label',`${time}, ${full}`);
  }
  updateClock();
  setInterval(updateClock,1000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateClock();});
  window.addEventListener('focus',updateClock);
})();



/* === 11H11 shared running-app indicators === */
(() => {
  'use strict';
  const buttons=new Map([...document.querySelectorAll('#taskbar-dock .taskbar-button[data-ww11-app]')]
    .map(button=>[button.dataset.ww11App,button]));
  const states=new Map();
  function setState(id,{running=false,focused=false,minimized=false,instances=1}={}) {
    const button=buttons.get(id);
    if(!button)return false;
    const count=Math.max(0,Math.floor(Number(instances)||0));
    const live=!!running && count>0;
    const state=!live?'closed':minimized?'minimized':focused?'active':'running';
    const record={running:live,focused:state==='active',minimized:state==='minimized',instances:live?count:0,state};
    states.set(id,record);
    button.dataset.ww11AppState=state;
    button.dataset.ww11AppInstances=live&&count>1?'multiple':'single';
    button.setAttribute('aria-pressed',String(state==='active'));
    button.title=button.getAttribute('aria-label')?.replace(/ \(.*?\)$/,'') || id;
    return true;
  }
  for(const id of buttons.keys())setState(id);
  window.WebWindows11TaskbarApps={setState,getState:id=>states.get(id)?{...states.get(id)}:null};
})();

/* === Start menu === */
/* 11H11 Start. Settings is the active app; unfinished app shortcuts remain disabled. */
(() => {
  'use strict';
  const menu = document.getElementById('start-menu');
  const toggle = document.getElementById('start-toggle');
  const pinnedApps = document.getElementById('start-pinned-list');
  // Keep every launcher panel exactly 2 × 2. Reuse the existing app nodes so
  // app actions, keyboard access and Mica hover tooltips continue to work.
  function arrangePinnedApps() {
    if (!pinnedApps) return;
    const apps = Array.from(pinnedApps.querySelectorAll('.start-app-row[data-app-name]'));
    const grouped = document.createDocumentFragment();
    for (let start = 0; start < apps.length; start += 4) {
      const panel = document.createElement('div');
      const count = Math.min(4, apps.length - start);
      panel.className = 'ww11-start-app-panel';
      panel.setAttribute('role', 'group');
      panel.setAttribute('aria-label', `Apps ${start + 1}–${start + count}`);
      panel.append(...apps.slice(start, start + 4));
      grouped.appendChild(panel);
    }
    pinnedApps.replaceChildren(grouped);
  }
  arrangePinnedApps();
  window.addEventListener('webwindows:start-apps-changed', arrangePinnedApps);
  const ACCOUNT_KEY = 'webwindows.11h11.account';
  function loadAccountIdentity() {
    let saved=null;
    try {saved=JSON.parse(localStorage.getItem(ACCOUNT_KEY) || 'null');} catch {}
    const name=typeof saved?.name==='string' && saved.name.trim() ? saved.name.trim().slice(0,48) : 'Russel John';
    const nameNode=document.getElementById('start-account-name');
    nameNode.textContent=name;
    nameNode.title=name;
    document.getElementById('start-account-initial').textContent=name.charAt(0).toUpperCase();
    const photo=document.getElementById('start-account-photo');
    const initial=document.getElementById('start-account-initial');
    const defaultAvatar='Assets/account-avatar.png';
    const customAvatar=(typeof saved?.image==='string' &&
      (saved.image.startsWith('data:image/') || /^\.\/?[\w./-]+$/.test(saved.image))) ? saved.image : '';
    photo.onload=()=>{ photo.hidden=false; initial.hidden=true; };
    photo.onerror=()=>{
      if (photo.getAttribute('src') !== defaultAvatar) {
        photo.src=defaultAvatar;
      } else {
        photo.hidden=true; initial.hidden=false;
      }
    };
    photo.src=customAvatar || defaultAvatar;
    if (photo.complete && photo.naturalWidth > 0) { photo.hidden=false; initial.hidden=true; }
    // Keep the rail compact: the account name is now below the floating avatar.
    menu.style.setProperty('--start-rail-width','62px');
  }
  loadAccountIdentity();
  let isOpen=false;
  const timers=[];
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  function show(){
    if(isOpen)return;
    hideTimers();isOpen=true;
    window.dispatchEvent(new Event('webwindows:taskbar-context-changed'));
    // Close Search before Start appears; news refresh uses the later opening event.
    window.dispatchEvent(new Event('webwindows:start-preopening'));
    menu.classList.add('is-open');menu.setAttribute('aria-hidden','false');toggle.setAttribute('aria-expanded','true');
    requestAnimationFrame(()=>{
      if(!isOpen)return;
      menu.classList.add('stage-one');
      timers.push(setTimeout(()=>{if(isOpen)menu.classList.add('stage-two')},reduceMotion.matches?0:105));
      timers.push(setTimeout(()=>{
        if(!isOpen)return;
        menu.classList.add('stage-three');window.dispatchEvent(new Event('webwindows:start-opening'));
      },reduceMotion.matches?0:215));
    });
  }
  function hideTimers(){timers.splice(0).forEach(clearTimeout)}
  function hide(){
    if(!isOpen)return;
    isOpen=false;hideTimers();menu.classList.remove('stage-three','stage-two','stage-one','is-open');
    window.dispatchEvent(new Event('webwindows:taskbar-context-changed'));
    menu.setAttribute('aria-hidden','true');toggle.setAttribute('aria-expanded','false');
  }
  toggle.addEventListener('click',()=>isOpen?hide():show());
  window.addEventListener('webwindows:search-opening',hide);
  document.addEventListener('pointerdown',e=>{if(isOpen&&!menu.contains(e.target)&&!toggle.contains(e.target))hide()});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&isOpen){e.preventDefault();e.stopImmediatePropagation();hide()}
    if(e.ctrlKey&&e.key==='Escape'){e.preventDefault();isOpen?hide():show()}
  });
  const settingsApp=menu.querySelector('[data-app-name="settings"]');
  const launchSettings=()=>{hide();window.WebWindows11Settings?.open('home')};
  settingsApp?.addEventListener('click',launchSettings);
  settingsApp?.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();launchSettings()}
  });

  window.WebWindows11Start={show,hide,isOpen:()=>isOpen,refreshAccount:loadAccountIdentity,regroupApps:arrangePinnedApps};
})();


/* === Shared publisher news for Start and Discover (not in Search) === */
/* WebWindows 11H11 · Reused GDELT DOC 2.0 from the 10H10 news implementation.
 * A local cache protects the Start/news widget during rate limits and outages.
 * The optional news endpoint meta tag can point to a shared caching proxy.
 * No fabricated articles are inserted on an upstream failure.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const newsGrid = $('ww10-start-news-grid');
  const infoToggle = $('ww10-news-sources-toggle');
  const infoPanel = $('ww10-news-sources');
  if (!newsGrid) return;

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
  const CACHE_KEY = 'webwindows.11h11.news.headlines.v1';
  const PREVIOUS_CACHE_KEYS = ['webwindows.10h10.news.headlines.v3','webwindows.10h10.gdelt.headlines.v2','webwindows.10h10.gdelt.headlines.v1'];
  // New version intentionally clears old GDELT-only retry cooldowns, so the
  // browser can immediately try the independent publisher fallback.
  const COOLDOWN_KEY = 'webwindows.11h11.news.retry.v1';
  const LEASE_KEY = 'webwindows.11h11.news.request-lease.v1';
  const REFRESH_MS = 30 * 60 * 1000;
  const REQUEST_TIMEOUT_MS = 18000;
  const CACHE_MAX_AGE_MS = 48 * 60 * 60 * 1000;
  const ARTICLE_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;
  const RETRY_BASE_MS = 2 * 60 * 1000;
  const RETRY_MAX_MS = 60 * 60 * 1000;
  const leaseOwner = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let articles = [];
  let lastSuccess = 0;
  let nextAttempt = 0;
  let inFlight = false;
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
      return [{title,url,domain,published:Number.isFinite(published)?published:null,description,image,images:imageCandidates}];
    }).slice(0,12);
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
    const mark = window.WebWindows11Icons.make('newspaper-light','ph-fallback');
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
      // Some publishers block hotlinks or leave requests pending. Keep images
      // hidden until decoded, then try actual alternate images from the same
      // article. Never substitute an unrelated article's image.
      img.referrerPolicy = 'no-referrer';
      let candidateIndex = 0;
      let imageTimer = null;
      const nextPublisherImage = () => {
        clearTimeout(imageTimer);
        img.classList.remove('is-loaded');
        if (candidateIndex >= candidates.length) {
          img.remove();
          art.remove();
          card.classList.add('ww10-news-card-text-only');
          queueNewsImageRecovery();
          return;
        }
        img.src = candidates[candidateIndex++];
        imageTimer = setTimeout(() => {
          if (!img.classList.contains('is-loaded') && img.isConnected) {
            failedNewsImages.set(img.src,Date.now());
            nextPublisherImage();
          }
        }, 12000);
      };
      img.addEventListener('load',()=>{
        clearTimeout(imageTimer);
        if (img.naturalWidth > 1 && img.naturalHeight > 1) img.classList.add('is-loaded');
        else {
          failedNewsImages.set(img.src,Date.now());
          nextPublisherImage();
        }
      });
      img.addEventListener('error',()=>{
        clearTimeout(imageTimer);
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
    body.append(headline,...(candidates.length ? [art] : []),summary);
    card.append(bar,body);
    return card;
  }
  // News summaries and headlines keep their full content. Their cards size
  // naturally; the independent news-region scroller handles overflow.
  function renderStart() {
    // Keep news current within each group, but favor records that contain
    // publisher-associated imagery. Never borrow an unrelated article's photo.
    const withImage=articles.filter(entry=>availableArticleImages(entry).length);
    const withoutImage=articles.filter(entry=>!availableArticleImages(entry).length);
    const topFour=[...withImage,...withoutImage].slice(0,4);
    const cards=Array.from({length:4},(_,i)=>makeNewsCard(topFour[i] || null,i));
    newsGrid.replaceChildren(...cards);
  }
  function setArticles(next,fetchedAt,source='gdelt') {
    articles=next;
    lastSuccess=fetchedAt;
    feedSource=source;
    renderStart();
    window.dispatchEvent(new CustomEvent('webwindows:news-updated',{detail:{count:articles.length}}));
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
    window.dispatchEvent(new CustomEvent('webwindows:news-error',{detail:{reason:type,retryAt:nextAttempt,hasSavedArticles:articles.length>0}}));
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
  window.addEventListener('webwindows:start-opening',()=>{renderStart();void updateNews();});
  window.addEventListener('webwindows:discover-opening',()=>{void updateNews();});
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
  restoreCache();
  restoreCooldown();
  renderStart();
  void updateNews();
  window.addEventListener('pagehide',()=>{
    disposed=true;
    activeAbort?.abort();
    clearInterval(refreshTimer);
    document.removeEventListener('visibilitychange',resume);
    window.removeEventListener('online',resume);
    releaseLease();
  },{once:true});
  window.WebWindows11News=Object.freeze({
    refresh:()=>updateNews(true),
    get:()=>articles.slice(),
    status:()=>({count:articles.length,source:feedSource,stale:isStale(),inFlight,reason:lastFailureType,gdeltNote:upstreamNotice,nextRetryAt:nextAttempt,usingProxy}),
    show:()=>document.getElementById('start-toggle')?.click()
  });
})();


/* 10H10 Desktop Appearance functionality, adapted to 11H11's taskbar and Mica. */
(() => {
  'use strict';
  const KEY='webwindows.11h11.desktop.appearance.v1';
  const defaults=Object.freeze({position:'bottom',align:'center',layout:'attached',searchMode:'box',appLabels:'icon',searchResultsMode:'all',contextGlassControls:false,size:45});
  const options={position:['bottom','top','left','right'],align:['center','start'],layout:['attached','floating','separated'],searchMode:['box','icon','hover'],appLabels:['icon','name'],searchResultsMode:['all','recent','frequent']};
  let stored={};
  try{stored=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{}
  const state={...defaults};
  for(const [key,value] of Object.entries(stored)){
    if(options[key]?.includes(value))state[key]=value;
    if(key==='contextGlassControls'&&typeof value==='boolean')state[key]=value;
    if(key==='size'&&Number.isFinite(Number(value)))state.size=Math.max(40,Math.min(64,Math.round(Number(value))));
  }
  const root=document.documentElement;
  const dock=document.getElementById('taskbar-dock');
  if(dock){
    dock.querySelectorAll('.taskbar__center .taskbar-button').forEach(btn=>{
      if(btn.querySelector('.ww11-taskbar-app-label'))return;
      const span=document.createElement('span');span.className='ww11-taskbar-app-label';
      span.textContent=(btn.getAttribute('title')||btn.getAttribute('aria-label')||'App').replace(/ \(not yet available\)$/,'');
      span.setAttribute('aria-hidden','true');btn.append(span);
    });
  }
  function apply(){
    root.dataset.ww11Taskbar=state.position;
    root.dataset.ww11TaskbarAlign=state.align;
    root.dataset.ww11TaskbarStyle=state.layout;
    root.style.setProperty('--taskbar-height',state.size+'px');
    root.style.setProperty('--ww11-taskbar-thickness',(state.size+9)+'px');
    root.style.setProperty('--icon-size',Math.round(state.size*.6)+'px');
    root.style.setProperty('--tray-icon-size',(state.size===45?19:Math.round(state.size*19/45))+'px');
    root.dataset.ww11AppLabels=state.appLabels;
    root.dataset.wwSearch=state.searchMode;
    root.dataset.ww11ContextGlass=state.contextGlassControls?'on':'off';
    // Flyouts recalculate placement on the next frame after a layout change.
    requestAnimationFrame(()=>window.dispatchEvent(new Event('webwindows:taskbar-context-changed')));
    window.dispatchEvent(new CustomEvent('webwindows:desktop-appearance-changed',{detail:{...state}}));
  }
  const prefs={
    get:()=>({...state}),
    set:(name,value)=>{
      if(name==='size'){
        const parsed=Number(value);
        if(!Number.isFinite(parsed))return false;
        value=Math.max(40,Math.min(64,Math.round(parsed)));
      } else if(name==='contextGlassControls')value=!!value;
      else if(!options[name]?.includes(value))return false;
      if(state[name]===value)return true;
      state[name]=value;
      try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}
      apply();return true;
    },
    reset:()=>{Object.assign(state,defaults);try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}apply();}
  };
  for(const key of Object.keys(defaults))Object.defineProperty(prefs,key,{get:()=>state[key],enumerable:true});
  window.WebWindows11Preferences=prefs;
  apply();
})();

/* === Search === */
/* 11H11 Search using 10H10's result rows, composer, material and reveal.
 * The list represents local apps, saved searches and functioning Settings shortcuts.
 * Apps without windows are not represented as implemented launch targets. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const panel = $('search-panel');
  const taskbarTrigger = $('taskbar-search-toggle');
  const taskbarQuery = $('taskbar-search-query');
  const taskbarShell = $('taskbar-search-shell');
  const input = $('search-panel-input');
  const results = $('search-results');
  const empty = $('search-empty');
  const openButton = $('search-panel-open');
  if (!panel || !taskbarTrigger || !input || !results || !empty || !openButton) return;

  const SEARCH_KEY = 'webwindows.11h11.start.search.v1';
  const SEARCH_ACTIONS_KEY = 'webwindows.11h11.search.actions.v2';
  const APP_ICONS = [
    {name:'Settings',sourceSelector:'#taskbar-dock [data-ww11-app="settings"] img.remote-icon',id:'s5NUIabJrb4C',svg:'gear.svg',keywords:'preferences configure options system',run:()=>window.WebWindows11Settings?.open('home')},
    {name:'Get Started',sourceSelector:'#taskbar-dock [data-ww11-app="get-started"] img.remote-icon',id:'4aFn3qEdMNQO',svg:'app-window.svg',keywords:'introduction welcome guide tour setup',run:()=>window.WebWindows11GetStarted?.open()},
    {name:'Clock',sourceSelector:'#taskbar-dock [data-ww11-placeholder="clock"] img.remote-icon',id:'RQGrXdtQw2CT',svg:'clock-app.svg',keywords:'clock time alarm timer stopwatch',inactive:true},
    {name:'Languages',sourceSelector:'#taskbar-dock [data-ww11-placeholder="languages"] img.remote-icon',id:'3ZVHr47ogpJp',svg:'languages.svg',keywords:'languages translate translation language multilingual',inactive:true},
    {name:'Start menu',sourceSelector:'#start-toggle img.ww-start-original-icon',svg:'windows-logo.svg',keywords:'start pinned launch open apps home',run:()=>window.WebWindows11Start?.show()},
  ];
  const clean = value => String(value || '').trim().toLocaleLowerCase();
  const tokens = value=>clean(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(Boolean);
  const matches = (haystack,needle)=>tokens(needle).every(word=>tokens(haystack).some(term=>term.startsWith(word))||clean(haystack).includes(word));
  let opened = false;
  let history = [];
  let matching = [];
  let exactMatch = null;
  let closingTimer = null;
  let revealTimer = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function loadHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(SEARCH_KEY) || '[]');
      history = Array.isArray(saved) ? saved.filter(q => typeof q === 'string').slice(0,20) : [];
    } catch { history = []; }
  }
  function remember(value) {
    const query = value.trim().replace(/\s+/g,' ').slice(0,180);
    if (!query) return;
    loadHistory();
    history = [query,...history.filter(h => clean(h) !== clean(query))].slice(0,20);
    try { localStorage.setItem(SEARCH_KEY,JSON.stringify(history)); } catch {}
    window.dispatchEvent(new Event('webwindows:search-history-changed'));
  }
  function usage(){
    try{
      const value=JSON.parse(localStorage.getItem(SEARCH_ACTIONS_KEY)||'{}');
      return {recent:Array.isArray(value.recent)?value.recent.filter(v=>typeof v==='string').slice(0,16):[],counts:value.counts&&typeof value.counts==='object'?value.counts:{}};
    }catch{return {recent:[],counts:{}}}
  }
  function recordSelection(id){
    const saved=usage();
    saved.recent=[id,...saved.recent.filter(value=>value!==id)].slice(0,16);
    saved.counts[id]=Math.min(999999,(Number(saved.counts[id])||0)+1);
    try{localStorage.setItem(SEARCH_ACTIONS_KEY,JSON.stringify(saved))}catch{}
  }
  function iconFor(data) {
    const wrap = document.createElement('span');
    wrap.className = 'search-result-icon';
    wrap.setAttribute('aria-hidden','true');

    // Search result artwork follows the existing taskbar, Start, or Settings image.
    // A local image fallback comes next, then the bundled vector if networking fails.
    const urls=[];
    const addSource=src=>{
      if(typeof src==='string'&&src.trim()&&!urls.includes(src))urls.push(src);
    };
    if(data.sourceSelector){
      let existing;
      try{existing=document.querySelector(data.sourceSelector);}catch{}
      if(existing instanceof HTMLImageElement){
        addSource(existing.getAttribute('src')||existing.src);
        const fallback=existing.parentElement?.querySelector('img.ww-nav-fallback');
        if(fallback && fallback!==existing)addSource(fallback.getAttribute('src')||fallback.src);
      }
    }
    if(data.iconUrl)addSource(data.iconUrl);
    else if(data.id)addSource(`https://img.icons8.com/?size=100&id=${encodeURIComponent(data.id)}&format=png&color=000000`);
    if(data.fallbackAsset)addSource(data.fallbackAsset);

    const fallbackName=String(data.svg||'magnifying-glass.svg').split('/').pop().replace(/\.svg$/i,'');
    const fallback=window.WebWindows11Icons.make(fallbackName,'search-icon-fallback');
    wrap.append(fallback);
    const images=[];
    const updateActive=()=>{
      const selected=images.find(img=>img.classList.contains('is-loaded'));
      images.forEach(img=>img.classList.toggle('is-active',img===selected));
      fallback.classList.toggle('is-hidden',!!selected);
    };
    urls.forEach(src=>{
      const image=document.createElement('img');
      image.className='search-icon-asset';
      image.alt='';image.draggable=false;image.decoding='async';
      images.push(image);
      image.addEventListener('load',async()=>{
        if(!image.naturalWidth||!image.naturalHeight)return;
        try{await image.decode();}catch{return;}
        if(!image.isConnected)return;
        image.classList.add('is-loaded');updateActive();
      });
      image.addEventListener('error',()=>{image.classList.remove('is-loaded');updateActive();});
      wrap.append(image);
      image.src=src;
      if(image.complete&&image.naturalWidth){
        image.decode().then(()=>{
          if(image.isConnected){image.classList.add('is-loaded');updateActive();}
        }).catch(()=>{});
      }
    });
    return wrap;
  }
  function addRow({title,meta,icon,go,inactive=false}) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'search-result';
    row.setAttribute('role','listitem');
    if (inactive) { row.dataset.inactive = 'true'; row.setAttribute('aria-disabled','true'); row.dataset.ww11MicaTooltip=title; }
    const text = document.createElement('span');
    text.className = 'search-result-text';
    const heading = document.createElement('span');
    heading.className = 'search-result-title';
    heading.textContent = title;
    const detail = document.createElement('span');
    detail.className = 'search-result-meta';
    detail.textContent = meta;
    text.append(heading,detail);
    const hover = window.WebWindows11Icons.make('arrow-square-out','search-result-hover-icon');
    row.append(iconFor(icon),text,hover);
    if(!inactive)row.addEventListener('click',go);
    results.append(row);
    matching.push(row);
    return row;
  }
  function availableActions(){
    const apps=APP_ICONS.map(app=>({
      id:'app:'+app.name, title:app.name,meta:'Apps · System',icon:app,
      keywords:app.keywords,run:app.run,inactive:!!app.inactive
    }));
    const settings=window.WebWindows11Settings?.searchIndex?.()||[];
    const shortcuts=settings.map(item=>({
      id:'settings:'+item.title,title:item.title,
      meta:item.detail.includes('·')?'Settings · '+item.detail.split('·').slice(-1)[0].trim():'Settings · '+item.detail,
      icon:{
        svg:(item.icon||'gear')+'.svg',
        // All nested Colors controls share their parent Personalization artwork.
        // The current image URL is resolved from Settings navigation on every render.
        sourceSelector:item.title==='Profile picture'?'#ww-settings-avatar':
          `[data-ww-settings-nav="${item.route==='colors'?'personalization':item.route}"] .ww-settings-nav-icon img:first-child`
      },
      keywords:`${item.terms||''} ${item.detail||''} settings windows preferences`,
      run:()=>window.WebWindows11Settings?.openSearchResult?.(item)
    }));
    return [...apps,...shortcuts];
  }
  function render() {
    results.replaceChildren();matching=[];exactMatch=null;
    const query=clean(input.value);
    const actions=availableActions();
    const mode=window.WebWindows11Preferences?.searchResultsMode||'all';
    const saved=usage();
    // The selected result source applies both when Search first opens and as the
    // user types. Search never silently switches back to the whole action catalog.
    let candidates=actions;
    if(mode==='recent'){
      const byId=new Map(actions.map(action=>[action.id,action]));
      candidates=saved.recent.map(id=>byId.get(id)).filter(Boolean);
    }else if(mode==='frequent'){
      candidates=actions.filter(item=>Number(saved.counts[item.id])>0)
        .sort((a,b)=>Number(saved.counts[b.id])-Number(saved.counts[a.id]));
    }
    const matchesList=candidates
      .filter(item=>!query||matches(`${item.title} ${item.keywords}`,query))
      .slice(0,query?24:mode==='all'?actions.length:8);
    matchesList.forEach(action=>{
      const go=()=>{recordSelection(action.id);close();action.run?.()};
      addRow({title:action.title,meta:action.inactive?'Apps · Not yet available':action.meta,icon:action.icon,go,inactive:!!action.inactive});
      if(!action.inactive&&query===clean(action.title))exactMatch=go;
    });
    empty.hidden=matching.length>0;
    empty.textContent=mode==='recent'
      ? (query?'No recently opened results match your search.':'No recently opened results yet.')
      : mode==='frequent'
        ? (query?'No most-used results match your search.':'No frequently used results yet.')
        : 'No results found in apps or settings.';
    openButton.hidden=!exactMatch;openButton.disabled=!exactMatch;
    if(opened)resize();
  }
  // Match 10H10's compact content-dependent Search height, up to 560px.
  function resize() {
    if (!opened) return;
    const style = getComputedStyle(panel);
    const padding = (parseFloat(style.paddingTop)||0)+(parseFloat(style.paddingBottom)||0);
    const gap = parseFloat(style.rowGap) || 0;
    const composer = panel.querySelector('.search-panel-composer')?.offsetHeight || 82;
    const content = matching.length ? results.scrollHeight : empty.scrollHeight;
    const area=window.WebWindows11DockGeometry?.getWorkArea?.();
    const maxHeight = Math.max(120,Math.min(innerWidth<=520 ? 520 : 560,
      (area?.height ?? (innerHeight-parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height'))))-22));
    panel.style.height = `${Math.max(0,Math.min(Math.ceil(content+composer+padding+gap),maxHeight))}px`;
  }
  function open(initial='') {
    if (typeof initial !== 'string') initial = '';
    window.dispatchEvent(new Event('webwindows:search-opening'));
    clearTimeout(closingTimer);
    clearTimeout(revealTimer);
    const wasOpen = opened;
    opened = true;
    window.dispatchEvent(new Event('webwindows:taskbar-context-changed'));
    panel.classList.remove('is-closing');
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden','false');
    input.value = initial;
    if(taskbarQuery)taskbarQuery.value='';
    taskbarTrigger.setAttribute('aria-expanded','true');
    if (!wasOpen && !reducedMotion.matches) {
      panel.classList.remove('ww10-search-opening');
      void panel.offsetWidth;
      panel.classList.add('ww10-search-opening');
      revealTimer = setTimeout(()=>panel.classList.remove('ww10-search-opening'),730);
    }
    render();
    input.focus({preventScroll:true});
  }
  function close({restoreFocus=false}={}) {
    if (!opened) return;
    opened = false;
    window.dispatchEvent(new Event('webwindows:taskbar-context-changed'));
    clearTimeout(revealTimer);
    panel.classList.remove('ww10-search-opening');
    taskbarTrigger.setAttribute('aria-expanded','false');
    if (reducedMotion.matches) {
      panel.classList.remove('is-open','is-closing');
      panel.setAttribute('aria-hidden','true');
    } else {
      panel.classList.remove('is-open');
      panel.classList.add('is-closing');
      closingTimer = setTimeout(()=>{
        panel.classList.remove('is-closing');
        panel.setAttribute('aria-hidden','true');
      },190);
    }
    if (restoreFocus) taskbarTrigger.focus({preventScroll:true});
    else if (panel.contains(document.activeElement)) document.activeElement.blur();
  }
  taskbarTrigger.addEventListener('click',()=>opened?close():open(taskbarQuery?.value||''));
  taskbarQuery?.addEventListener('focus',()=>open(taskbarQuery.value||''));
  taskbarQuery?.addEventListener('input',()=>open(taskbarQuery.value||''));
  taskbarShell?.addEventListener('pointerdown',e=>{
    if(e.target!==taskbarTrigger && !taskbarTrigger.contains(e.target) && e.target!==taskbarQuery)open();
  });
  input.addEventListener('input',render);
  openButton.addEventListener('click',()=>exactMatch?.());
  input.addEventListener('keydown',event=>{
    if (event.key==='Escape') {event.preventDefault();event.stopPropagation();close({restoreFocus:true});return;}
    if (event.key==='ArrowDown') {
      const first=results.querySelector('button.search-result');
      if (first) {event.preventDefault();first.focus({preventScroll:true});}
    }
    if (event.key==='Enter') {
      event.preventDefault();
      const query=input.value.trim();
      if (!query) return;
      remember(query);
      if (exactMatch) exactMatch();
      else render();
    }
  });
  results.addEventListener('keydown',event=>{
    if (event.key==='Escape') {event.preventDefault();close({restoreFocus:true});return;}
    if (!['ArrowDown','ArrowUp'].includes(event.key)) return;
    const rows = [...results.querySelectorAll('button.search-result')];
    if (!rows.length) return;
    event.preventDefault();
    const index=rows.indexOf(document.activeElement);
    rows[(index+(event.key==='ArrowDown'?1:-1)+rows.length)%rows.length].focus({preventScroll:true});
  });
  document.addEventListener('pointerdown',event=>{
    if (opened&&!panel.contains(event.target)&&!taskbarTrigger.contains(event.target)&&!taskbarShell?.contains(event.target)) close();
  });
  document.addEventListener('keydown',event=>{
    if (event.key==='Escape'&&opened) {event.preventDefault();event.stopImmediatePropagation();close({restoreFocus:true});}
    if ((event.ctrlKey||event.metaKey)&&clean(event.key)==='k') {
      event.preventDefault();open(input.value);input.select();
    }
  });
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('webwindows:start-preopening',()=>close());
  window.addEventListener('webwindows:search-history-changed',()=>{if(opened)render();});
  window.addEventListener('webwindows:desktop-appearance-changed',()=>{if(opened)render();});
  window.WebWindows11Search={open,close,isOpen:()=>opened};
})();



/* === 11H11 Settings: six categories, System, Personalization, Accounts and IndexedDB wallpapers === */
(() => {
  'use strict';
  const overlay = document.getElementById('settings-overlay');
  const win = document.getElementById('ww-settings-window');
  const heading = document.getElementById('ww-settings-heading');
  const section = document.getElementById('ww-settings-section');
  const nav = [...document.querySelectorAll('[data-ww-settings-nav]')];
  const search = document.getElementById('ww-settings-search');
  const searchResults = document.getElementById('ww-settings-search-results');
  // Put search results above the Settings page, outside the titlebar's
  // backdrop root. Nested backdrop-filters were blurring the titlebar itself
  // instead of the content behind the results panel.
  const searchBox=search?.closest('.ww-settings-searchbox');
  if(searchResults && searchResults.parentElement!==win)win.appendChild(searchResults);
  function alignSettingsSearchResults(){
    if(!searchBox || !searchResults)return;
    const box=searchBox.getBoundingClientRect();
    const frame=win.getBoundingClientRect();
    const available=Math.max(0,frame.width-16);
    const popupWidth=Math.min(410,available);
    const rawCenter=box.left+box.width/2-frame.left;
    const center=Math.max(popupWidth/2+8,Math.min(frame.width-popupWidth/2-8,rawCenter));
    searchResults.style.setProperty('--ww-settings-search-left',`${center}px`);
    searchResults.style.setProperty('--ww-settings-search-top',`${box.bottom-frame.top+6}px`);
  }
  if(typeof ResizeObserver!=='undefined' && searchBox){
    const searchPositionObserver=new ResizeObserver(alignSettingsSearchResults);
    searchPositionObserver.observe(searchBox);
    searchPositionObserver.observe(win);
  }
  const back = document.getElementById('ww-settings-back');
  const wallpaper = document.getElementById('wallpaper');
  if (!overlay || !win || !section || !wallpaper) return;

  const DEFAULT_WALLPAPER='Backgrounds/B1.webp';
  const WALLPAPER_KEY='webwindows.11h11.wallpaper.active';
  const DB_NAME='webwindows.11h11.personalization';
  const STORE='wallpapers';
  const LIMIT=6;
  const MAX_IMAGE_BYTES=15*1024*1024;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let opened=false, minimized=false, focused=false, current='home', custom=[], activeId='default', dbPromise=null;
  function refreshTaskbarAppState(){
    const popup=!!(window.WebWindows11Start?.isOpen?.() || window.WebWindows11Search?.isOpen?.());
    window.WebWindows11TaskbarApps?.setState('settings',{
      running:opened||minimized,
      focused:opened&&focused&&!popup,
      minimized,
      instances:1
    });
  }
  window.addEventListener('webwindows:taskbar-context-changed',refreshTaskbarAppState);
  window.addEventListener('webwindows:getstarted-focused',()=>{focused=false;refreshTaskbarAppState();});
  refreshTaskbarAppState();
  let pendingUploadSlot=null;
  let previewNode=null, galleryNode=null, uploadNode=null;
  let currentWallpaper=DEFAULT_WALLPAPER;
  const objectURLs=new Map();
  const ACCENT_KEY='webwindows.11h11.wallpaper.accent';
  const AUTO_ACCENT_KEY='webwindows.11h11.colors.autoAccent';
  const GLASS_KEY='webwindows.11h11.colors.material';
  const GLASS_PRESETS={
    original:{label:'Original',rgb:[255,255,255]},
    white:{label:'White',rgb:[255,255,255]},
    silver:{label:'Silver',rgb:[226,226,226]},
    warm:{label:'Warm',rgb:[250,237,218]},
    sky:{label:'Light blue',rgb:[223,239,251]},
    black:{label:'Black',rgb:[27,27,27]},
    pearl:{label:'Pearl',rgb:[243,243,245]},
    ash:{label:'Ash',rgb:[200,201,204]},
    smoke:{label:'Smoke',rgb:[168,170,174]},
    steel:{label:'Steel',rgb:[129,132,137]},
    graphite:{label:'Graphite',rgb:[79,82,87]}
  };
  // Removed per-surface color and contrast overrides. The main glass color now
  // determines all glass and control hues; the remaining advanced settings only
  // affect the secondary alpha difference and control tint intensity.
  const DEFAULT_GLASS={
    color:'original',customColor:'#222831',opacity:90,secondaryGap:10,
    controlTint:42,shadows:true,hdr:false,hdrIntensity:68,hdrBloom:38
  };
  const readLocal=(key,fallback)=>{try{return localStorage.getItem(key)??fallback}catch{return fallback}};
  const isHex=value=>/^#[0-9a-f]{6}$/i.test(value||'');
  const normalizedHex=(value,fallback)=>isHex(value)?value.toLowerCase():fallback;
  const toRGB=value=>[1,3,5].map(i=>parseInt(value.slice(i,i+2),16));
  const clampGlass=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.min(max,Math.max(min,Number(value))):fallback;
  const calcLuminance=rgb=>{
    const channels=rgb.map(n=>{const c=n/255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)});
    return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  };
  let autoAccent=readLocal(AUTO_ACCENT_KEY,'false')==='true';
  let glassState=(()=>{
    try{
      const saved=JSON.parse(readLocal(GLASS_KEY,'null'));
      if(!saved||typeof saved!=='object'||Array.isArray(saved))return {...DEFAULT_GLASS};
      return {
        color:saved.color==='custom'||Object.hasOwn(GLASS_PRESETS,saved.color)?saved.color:'original',
        customColor:normalizedHex(saved.customColor,DEFAULT_GLASS.customColor),
        opacity:clampGlass(saved.opacity,0,100,90),
        secondaryGap:clampGlass(saved.secondaryGap,0,35,10),
        controlTint:clampGlass(saved.controlTint,0,100,42),
        shadows:saved.shadows!==false,hdr:saved.hdr===true,
        hdrIntensity:clampGlass(saved.hdrIntensity,0,100,68),
        hdrBloom:clampGlass(saved.hdrBloom,0,100,38)
      };
    }catch{return {...DEFAULT_GLASS}}
  })();
  function applyGlassState(save=true){
    const base=glassState.color==='custom'?toRGB(glassState.customColor):GLASS_PRESETS[glassState.color].rgb;
    const secondary=base;
    const controls=base;
    const opacity=glassState.opacity/100;
    const rgba=(rgb,alpha)=>`rgba(${rgb.join(',')},${Math.max(0,Math.min(1,alpha)).toFixed(3)})`;
    const style=document.documentElement.style;
    // Base material, less opaque secondary material, and independent control overlay.
    style.setProperty('--mica',rgba(base,opacity));
    style.setProperty('--mica-sub',rgba(secondary,Math.max(0,opacity-glassState.secondaryGap/100)));
    style.setProperty('--ww11-material-rgb',base.join(','));
    style.setProperty('--ww11-glass-rgb',base.join(','));
    style.setProperty('--ww11-secondary-rgb',secondary.join(','));
    // Subtle Mica highlights derived from the current material, not a
    // hardcoded white/gray hover fill; follow glass opacity and custom RGB.
    const glintAlpha=Math.min(.20,opacity*.16);
    style.setProperty('--ww11-settings-mica-glint',rgba(base,glintAlpha));
    style.setProperty('--ww11-settings-mica-shadow',rgba(base,Math.min(.09,opacity*.055)));
    style.setProperty('--ww11-settings-mica-edge',rgba(base.map(v=>Math.round(v*.46)),Math.min(.19,opacity*.16)));
    const controlAlpha=(glassState.controlTint/100)*Math.max(.2,opacity);
    style.setProperty('--control-surface',rgba(controls,controlAlpha));
    style.setProperty('--ww11-control-surface',rgba(controls,controlAlpha));
    // Hover is a modest increase in the selected MATERIAL opacity. Do not
    // flood dark-glass controls with white; Settings shares this same token.
    const hoverSurface=rgba(controls,Math.min(.88,controlAlpha+.065));
    style.setProperty('--control-hover',hoverSurface);
    style.setProperty('--ww11-hover-surface',hoverSurface);
    // The titlebar navigation and search share the selected glass material.
    // Hover is a slightly darker shade of the SAME RGB, never a preset gray;
    // this also works for custom glass, opacity and control tint changes.
    const titlebarAlpha=Math.max(.18,Math.min(.76,controlAlpha));
    const titlebarHoverRgb=base.map(value=>Math.max(0,Math.round(value*.86)));
    const titlebarHoverAlpha=Math.min(.82,Math.max(.40,titlebarAlpha+.12));
    style.setProperty('--ww11-titlebar-control-bg',rgba(base,titlebarAlpha));
    style.setProperty('--ww11-titlebar-control-hover',rgba(titlebarHoverRgb,titlebarHoverAlpha));
    style.setProperty('--ww11-control-solid',`rgb(${controls.join(',')})`);
    style.setProperty('--ww11-search-surface',rgba(secondary,opacity));
    style.setProperty('--ww10-search-control-surface',rgba(controls,controlAlpha));
    style.setProperty('--ww10-search-control-hover',rgba(controls,Math.min(.90,controlAlpha+.20)));
    // Contrast follows the selected MATERIAL (rather than the wallpaper or preset name).
    const dark=calcLuminance(base)<.23;
    const text=dark?'#f4f7fb':'#21323e';
    const muted=dark?'#c4d0dc':'#576a79';
    const subtle=dark?'#a7bacb':'#617889';
    const border=dark?'rgba(225,239,255,.17)':'rgba(39,60,80,.16)';
    const contrastHover=dark?'rgba(244,248,255,.10)':'rgba(19,42,60,.075)';
    style.setProperty('--ww11-text',text);
    style.setProperty('--ww11-muted',muted);
    style.setProperty('--ww11-subtle',subtle);
    style.setProperty('--ww11-border',border);
    style.setProperty('--ww11-contrast-hover',contrastHover);
    style.setProperty('--ww11-glass-contrast',dark?'light':'dark');
    document.documentElement.dataset.ww11Contrast=dark?'light':'dark';
    document.documentElement.classList.toggle('ww11-dark-glass',dark);
    document.documentElement.classList.toggle('ww11-no-window-shadows',!glassState.shadows);
    document.documentElement.classList.toggle('ww11-hdr-lighting',glassState.hdr);
    style.setProperty('--ww-hdr-bloom-near-opacity',(glassState.hdrBloom/100*.66).toFixed(3));
    style.setProperty('--ww-hdr-bloom-far-opacity',(glassState.hdrBloom/100*.39).toFixed(3));
    document.documentElement.style.colorScheme=dark?'dark':'light';
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=glassState.color==='custom'?glassState.customColor:'#'+base.map(n=>n.toString(16).padStart(2,'0')).join('');
    if(save){try{localStorage.setItem(GLASS_KEY,JSON.stringify(glassState))}catch{}}
    syncColorsForm();
    window.dispatchEvent(new CustomEvent('webwindows:glass-changed',{detail:{...glassState,dark}}));
    window.dispatchEvent(new CustomEvent('webwindows:hdr-changed',{detail:{enabled:glassState.hdr,intensity:glassState.hdrIntensity,bloom:glassState.hdrBloom}}));
  }
  function syncColorsForm(){
    document.querySelectorAll('[data-ww11-accent-color]').forEach(button=>{
      button.setAttribute('aria-pressed',String(!autoAccent&&button.dataset.ww11AccentColor.toLowerCase()===activeAccent.toLowerCase()));
    });
    document.querySelectorAll('[data-ww11-glass-color]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.ww11GlassColor===glassState.color));
    });
    const checkbox=(id,checked)=>{const node=document.getElementById(id);if(node)node.checked=checked};
    const picker=(id,value)=>{const node=document.getElementById(id);if(node)node.value=value};
    const range=(id,val,output)=>{
      const node=document.getElementById(id);
      if(node){
        node.value=String(val);
        const min=Number(node.min||0),max=Number(node.max||100);
        node.style.setProperty('--range-progress',`${Math.max(0,Math.min(100,(Number(val)-min)/(max-min||1)*100))}%`);
      }
      const label=document.getElementById(output);if(label)label.textContent=val+'%';
    };
    const accentMode=document.getElementById('ww11-accent-mode');
    if(accentMode){
      const activeMode=autoAccent?'automatic':'manual';
      const selectedLabel=accentMode.querySelector('#ww11-accent-current');
      if(selectedLabel)selectedLabel.textContent=autoAccent?'Automatic':'Manual';
      accentMode.querySelectorAll('[data-ww11-accent-mode]').forEach(option=>{
        const selected=option.dataset.ww11AccentMode===activeMode;
        option.setAttribute('aria-selected',String(selected));
        option.classList.toggle('is-selected',selected);
      });
    }
    const indicator=document.querySelector('.ww11-accent-indicator');
    if(indicator)indicator.style.backgroundColor=activeAccent;
    const preview=document.querySelector('.ww11-colors-live-preview');
    if(preview){
      const material=glassState.color==='custom'?glassState.customColor:`rgb(${GLASS_PRESETS[glassState.color].rgb.join(',')})`;
      preview.style.setProperty('--ww11-preview-accent',activeAccent);
      preview.style.setProperty('--ww11-preview-material',material);
      const surfaceRGB=glassState.color==='custom'?toRGB(glassState.customColor):GLASS_PRESETS[glassState.color].rgb;
      preview.style.setProperty('--ww11-preview-rgb',surfaceRGB.join(','));
      preview.style.setProperty('--ww11-preview-opacity',(glassState.opacity/100).toFixed(2));
      preview.classList.toggle('is-automatic',autoAccent);
    }
    checkbox('ww11-shadows',glassState.shadows);
    checkbox('ww11-hdr',glassState.hdr);
    document.querySelectorAll('[data-ww11-hdr-adjustment]').forEach(node=>{node.disabled=!glassState.hdr});
    picker('ww11-custom-accent',activeAccent);
    picker('ww11-custom-glass',glassState.customColor);
    const label=document.getElementById('ww11-custom-glass-value');
    if(label)label.textContent='Custom color';
    const accentCustom=document.getElementById('ww11-custom-accent')?.closest('.ww11-custom-color-control');
    if(accentCustom)accentCustom.classList.toggle('is-selected',!autoAccent&&!document.querySelector('[data-ww11-accent-color][aria-pressed="true"]'));
    const glassCustom=document.getElementById('ww11-custom-glass')?.closest('.ww11-custom-color-control');
    if(glassCustom)glassCustom.classList.toggle('is-selected',glassState.color==='custom');
    range('ww11-opacity',glassState.opacity,'ww11-opacity-value');
    range('ww11-secondary-gap',glassState.secondaryGap,'ww11-secondary-gap-value');
    range('ww11-control-tint',glassState.controlTint,'ww11-control-tint-value');
    range('ww11-hdr-intensity',glassState.hdrIntensity,'ww11-hdr-intensity-value');
    range('ww11-hdr-bloom',glassState.hdrBloom,'ww11-hdr-bloom-value');
  }
  function setAutomaticAccent(enabled){
    autoAccent=!!enabled;
    try{localStorage.setItem(AUTO_ACCENT_KEY,String(autoAccent))}catch{}
    if(autoAccent){
      const selected=custom.find(record=>record.id===activeId);
      setAccent(selected?.accent||'#0078d4');
    }
    syncColorsForm();
  }
  let activeAccent=(()=>{try{return localStorage.getItem(ACCENT_KEY)||'#0078d4'}catch{return '#0078d4'}})();
  const accentIsHex=value=>/^#[0-9a-fA-F]{6}$/.test(value||'');
  function setAccent(accent,save=true){
    if(!accentIsHex(accent))return;
    activeAccent=accent;
    document.documentElement.style.setProperty('--ww11-accent',accent);
    document.documentElement.style.setProperty('--ww-settings-accent',accent);
    overlay.style.setProperty('--ww-settings-accent',accent);
    document.querySelectorAll('.ww-theme-window-swatch').forEach(button=>{
      const selected=button.dataset.accent?.toLowerCase()===accent.toLowerCase();
      button.classList.toggle('is-accent-active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
    if(save){try{localStorage.setItem(ACCENT_KEY,accent)}catch{}}
    syncColorsForm();
  }
  setAccent(activeAccent,false);
  applyGlassState(false);
  // Uploaded wallpaper accents use a dominant chromatic color sampled locally.
  // No pixel data or user images leave this browser.
  async function sampleAccent(blob){
    const url=URL.createObjectURL(blob);
    try{
      const image=await new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>resolve(img);
        img.onerror=()=>reject(new Error('Could not sample the image accent.'));
        img.src=url;
      });
      const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      if(!ctx)return '#0078d4';
      ctx.drawImage(image,0,0,32,32);
      const bytes=ctx.getImageData(0,0,32,32).data;
      const colors=new Map();
      for(let i=0;i<bytes.length;i+=4){
        if(bytes[i+3]<190)continue;
        const r=bytes[i],g=bytes[i+1],b=bytes[i+2];
        const hi=Math.max(r,g,b),lo=Math.min(r,g,b),delta=hi-lo;
        if(hi<55||hi>240||delta<35)continue;
        const bucket=[r,g,b].map(v=>Math.min(239,Math.round(v/24)*24));
        const key=bucket.join(',');
        const weight=1+delta/255;
        colors.set(key,(colors.get(key)||0)+weight);
      }
      const best=[...colors].sort((a,b)=>b[1]-a[1])[0];
      if(!best)return '#0078d4';
      const [r,g,b]=best[0].split(',').map(Number);
      return '#'+[r,g,b].map(n=>n.toString(16).padStart(2,'0')).join('');
    }catch{return '#0078d4'}finally{URL.revokeObjectURL(url)}
  }
  const ph=name=>window.WebWindows11Icons.html(({x:'x',house:'house-regular','paint-brush':'paint-brush-regular'}[name]||'user'),'ww-settings-inline-svg');

  function getActiveRecord(id) {return custom.find(item=>item.id===id);}
  // Keep diagnostics internal; wallpaper changes do not produce app notifications.
  function setMessage(message,type=''){
    if(type==='error' && message)console.warn('[WebWindows wallpaper]',message);
  }
  function syncWallpaper(src,id,save=true){
    if (typeof src!=='string'|| !src) return;
    currentWallpaper=src;
    activeId=id;
    wallpaper.src=src;
    if(autoAccent){
      const selected=getActiveRecord(id);
      setAccent(selected?.accent||'#0078d4');
    }
    // JSON.stringify safely quotes blob and local paths in a CSS url().
    document.documentElement.style.setProperty('--ww-active-wallpaper',`url(${JSON.stringify(src)})`);
    if(previewNode)previewNode.style.backgroundImage=`url(${JSON.stringify(src)})`;
    document.dispatchEvent(new CustomEvent('webwindows:wallpaper-changed',{detail:{source:src,id}}));
    if(save){try{localStorage.setItem(WALLPAPER_KEY,id)}catch{}}
    if(galleryNode){
      galleryNode.querySelectorAll('[data-wallpaper-id]').forEach(btn=>{
        const chosen=btn.dataset.wallpaperId===id;
        btn.classList.toggle('is-selected',chosen);
        btn.setAttribute('aria-pressed',String(chosen));
      });
    }
  }
  const savedId=(()=>{try{return localStorage.getItem(WALLPAPER_KEY)||'default'}catch{return'default'}})();
  // Bundled wallpaper is the desktop fallback, not an extra gallery theme.
  syncWallpaper(DEFAULT_WALLPAPER,'default',false);

  function openDb(){
    if(!('indexedDB' in window))return Promise.reject(new Error('IndexedDB is unavailable in this browser.'));
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB_NAME,1);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('Unable to open wallpaper storage.'));
      request.onblocked=()=>reject(new Error('Wallpaper storage is blocked by another tab.'));
    }).catch(error=>{dbPromise=null;throw error});
    return dbPromise;
  }
  async function readAll(){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly');
      const request=tx.objectStore(STORE).getAll();
      request.onsuccess=()=>resolve(request.result||[]);
      request.onerror=()=>reject(request.error||new Error('Stored images could not be read.'));
    });
  }
  async function writeRecord(record,replaceId=null){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      const store=tx.objectStore(STORE);
      store.put(record);
      if(replaceId)store.delete(replaceId);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('Image could not be saved.'));
      tx.onabort=()=>reject(tx.error||new Error('Image storage was cancelled.'));
    });
  }
  async function deleteRecord(id){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('Unable to delete stored wallpaper.'));
    });
  }
  async function validateImage(file){
    if(!file||!file.type.startsWith('image/'))throw new Error('Choose an image file.');
    if(file.size>MAX_IMAGE_BYTES)throw new Error('Images must be 15 MB or smaller.');
    if(file.size===0)throw new Error('The selected image is empty.');
    const temp=URL.createObjectURL(file);
    try{
      await new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>img.naturalWidth>0&&img.naturalHeight>0?resolve():reject(new Error('Invalid image dimensions.'));
        img.onerror=()=>reject(new Error('This image could not be decoded by the browser.'));
        img.src=temp;
      });
    }finally{URL.revokeObjectURL(temp)}
  }
  function restoreSelection(){
    const item=getActiveRecord(savedId);
    if(item)syncWallpaper(item.url,item.id,false);
    else syncWallpaper(DEFAULT_WALLPAPER,'default',true);
  }
  async function restoreCustom(){
    try{
      const records=(await readAll()).filter(r=>r&&r.blob instanceof Blob && typeof r.id==='string')
        .sort((a,b)=>(a.created||0)-(b.created||0)).slice(-LIMIT);
      // Old 11H11 records had no slot field. Keep all six, assigning free slots in
      // creation order. New records retain their numbered position on restart.
      const used=new Set();
      const assigned=records.map(r=>{
        const preference=Number(r.slot);
        const slot=Number.isInteger(preference)&&preference>=1&&preference<=LIMIT&&!used.has(preference)
          ? preference : Array.from({length:LIMIT},(_,i)=>i+1).find(n=>!used.has(n));
        used.add(slot);
        return {...r,slot};
      });
      custom=await Promise.all(assigned.map(async r=>{
        const url=URL.createObjectURL(r.blob);
        objectURLs.set(r.id,url);
        return {id:r.id,slot:r.slot,title:r.name||'Custom wallpaper',url,
          accent:accentIsHex(r.accent)?r.accent:await sampleAccent(r.blob),created:r.created};
      }));
      restoreSelection();
    }catch(error){
      console.warn('[11H11 Personalization]',error);
      restoreSelection();
      setMessage(error.message||'Uploaded wallpapers are unavailable.','error');
    }
    if(galleryNode)renderGallery();
  }
  function openFilePicker(slot=null){
    // The fourth tile always owns the primary uploader. At full capacity its
    // action replaces image 4 without ever disabling the uploader.
    pendingUploadSlot=slot;
    uploadNode?.click();
  }
  function makeUploadControl(){
    const add=document.createElement('button');
    add.id='ww-theme-upload-trigger';add.type='button';add.className='ww-theme-add-inner';
    // Permanent uploader remains recognizable whether slot 4 is occupied or empty.
    add.innerHTML='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.65" stroke-linecap="round"/></svg><span>Add image</span>';
    add.title=custom.length===LIMIT?'Replace image in slot 4':'Upload a wallpaper image';
    add.setAttribute('aria-label',custom.length===LIMIT?'Replace image in slot 4':'Add wallpaper image');
    add.addEventListener('click',()=>openFilePicker(custom.length===LIMIT?4:null));
    return add;
  }
  function makeSlot(item,slot,isNew=false){
    const wrap=document.createElement('div');
    wrap.className='ww-theme-card-wrap';wrap.dataset.slot=String(slot);
    if(isNew)wrap.classList.add('ww-theme-card-arrive');
    const card=document.createElement('button');
    card.type='button';card.className='ww-theme-slot';card.dataset.wallpaperId=item.id;
    card.setAttribute('aria-label',`Apply ${item.title} wallpaper in slot ${slot}`);
    card.setAttribute('aria-pressed',String(activeId===item.id));
    card.title=item.title;
    card.style.backgroundImage=`url(${JSON.stringify(item.url)})`;
    wrap.style.setProperty('--theme-accent',item.accent);
    if(activeId===item.id)card.classList.add('is-selected');
    card.addEventListener('click',()=>syncWallpaper(item.url,item.id));
    wrap.append(card);
    if(slot===4){
      // Slot four deliberately keeps the uploader instead of the accent chip,
      // including when an image occupies the slot or all six are full.
      wrap.classList.add('ww-theme-slot-four');
      wrap.append(makeUploadControl());
    }else{
      const swatch=document.createElement('button');
      swatch.type='button';swatch.className='ww-theme-window-swatch';
      swatch.title=`Apply ${item.title} image accent`;
      swatch.setAttribute('aria-label',`Apply ${item.title} image accent`);
      swatch.setAttribute('aria-pressed',String(activeAccent.toLowerCase()===item.accent.toLowerCase()));
      swatch.dataset.accent=item.accent;
      if(activeAccent.toLowerCase()===item.accent.toLowerCase())swatch.classList.add('is-accent-active');
      const chip=document.createElement('span');chip.className='ww-theme-accent-chip';
      chip.setAttribute('aria-hidden','true');swatch.append(chip);
      swatch.addEventListener('click',()=>{setAutomaticAccent(false);setAccent(item.accent);setMessage(`${item.title} image accent applied.`,'success')});
      wrap.append(swatch);
    }
    const remove=document.createElement('button');
    remove.className='ww-theme-remove';remove.type='button';remove.title=`Remove ${item.title}`;
    remove.setAttribute('aria-label',`Remove ${item.title}`);remove.innerHTML=ph('x');
    remove.addEventListener('click',async()=>{
      remove.disabled=true;
      try{
        await deleteRecord(item.id);
        const wasActive=activeId===item.id;
        custom=custom.filter(other=>other.id!==item.id);
        if(wasActive)syncWallpaper(DEFAULT_WALLPAPER,'default');
        renderGallery();
        setMessage('Uploaded wallpaper removed.','success');
        const url=objectURLs.get(item.id);if(url)URL.revokeObjectURL(url);objectURLs.delete(item.id);
      }catch(error){remove.disabled=false;setMessage(error.message||'Unable to remove wallpaper.','error')}
    });
    wrap.append(remove);
    return wrap;
  }
  function makeEmptySlot(slot){
    const wrap=document.createElement('div');
    wrap.className='ww-theme-card-wrap ww-theme-placeholder';
    wrap.dataset.slot=String(slot);
    if(slot===4){
      wrap.classList.add('ww-theme-slot-four','ww-theme-add-wrap');
      const tile=document.createElement('div');tile.className='ww-theme-slot ww-theme-add-tile';
      tile.setAttribute('aria-hidden','true');
      wrap.append(tile,makeUploadControl());
    }else{
      // Blank positions are placeholders, not interactive upload targets.
      // Only slot 4 exposes a file input trigger.
      const tile=document.createElement('div');
      tile.className='ww-theme-slot ww-theme-empty';
      tile.setAttribute('aria-hidden','true');
      wrap.append(tile);
    }
    return wrap;
  }
  function renderGallery(newId=''){
    if(!galleryNode)return;
    galleryNode.replaceChildren();
    // Exactly six numbered image positions. No bundled theme appears here.
    for(let slot=1;slot<=LIMIT;slot++){
      const item=custom.find(r=>r.slot===slot);
      galleryNode.append(item?makeSlot(item,slot,item.id===newId):makeEmptySlot(slot));
    }
    uploadNode.disabled=false;
  }
  async function uploadFiles(list){
    const files=Array.from(list||[]);
    if(!files.length)return;
    let preferredSlot=pendingUploadSlot;
    pendingUploadSlot=null;
    try{
      for(const file of files){
        const available=Array.from({length:LIMIT},(_,i)=>i+1)
          .filter(slot=>!custom.some(r=>r.slot===slot));
        // When all six are filled, only image 4 can be replaced from its
        // permanently accessible upload control.
        if(!available.length && preferredSlot!==4){
          setMessage('All six slots are full. Use Add image in slot 4 to replace that image.','error');
          break;
        }
        const slot=preferredSlot && (available.includes(preferredSlot)||preferredSlot===4)
          ? preferredSlot : available[0];
        if(!slot)break;
        const replaced=custom.find(r=>r.slot===slot);
        await validateImage(file);
        const id='custom-'+(crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`);
        const accent=await sampleAccent(file);
        const record={id,slot,name:file.name.slice(0,100),blob:file,accent,created:Date.now()};
        // Save and replace within a single IndexedDB transaction.
        await writeRecord(record,replaced?.id);
        const url=URL.createObjectURL(file);
        objectURLs.set(id,url);
        if(replaced){
          custom=custom.filter(r=>r.id!==replaced.id);
        }
        custom.push({id,slot,title:file.name,url,accent,created:record.created});
        custom.sort((a,b)=>a.slot-b.slot);
        renderGallery(id);
        syncWallpaper(url,id);
        setMessage(`${file.name} saved in slot ${slot}.`,'success');
        if(replaced){
          const oldURL=objectURLs.get(replaced.id);
          if(oldURL)URL.revokeObjectURL(oldURL);
          objectURLs.delete(replaced.id);
        }
        preferredSlot=null;
      }
    }catch(error){setMessage(error.message||'The wallpaper could not be saved.','error');}
    finally{if(uploadNode)uploadNode.value='';}
  }
  function renderPersonalization(){
    heading.textContent='Personalization';
    section.innerHTML=`
      <div class="ww-personalization-layout">
        <div class="ww-personalization-preview-pane">
          <div class="ww-desktop-live-preview" id="ww-desktop-live-preview" aria-label="Live desktop wallpaper preview" role="img">
            <div class="ww-preview-window"><div class="ww-preview-lines"><span></span><span></span><span></span><span></span></div><div class="ww-preview-button"></div></div>
          </div>
        </div>
        <div class="ww-personalization-controller">
          <h2 class="ww-theme-grid-heading">Select an image to apply</h2>
          <div class="ww-theme-gallery" id="ww-theme-gallery" aria-label="Six custom wallpaper slots"></div>
          <input type="file" id="ww-theme-file-input" accept="image/*" multiple hidden>
        </div>
      </div>
      <div class="ww11-personalization-options" aria-label="Additional Personalization options">
        <button class="ww11-personalization-option ww11-colors-link" id="ww11-open-colors" type="button" aria-label="Open Colors settings">
          <svg class="ph ph-palette ww-ph-icon" focusable="false" aria-hidden="true"><use href="#ww-ph-palette"></use></svg>
          <span class="ww11-personalization-option-label"><strong>Colors</strong><small>Customize accent colors, glass transparency, and visual effects</small></span>
          <svg class="ww11-option-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="ww11-personalization-option ww11-desktop-link" id="ww11-open-desktop" type="button" aria-label="Open Desktop appearance settings">
          <svg class="ph ph-desktop ww-ph-icon" focusable="false" aria-hidden="true"><use href="#ww-ph-desktop"></use></svg>
          <span class="ww11-personalization-option-label"><strong>Desktop appearance</strong><small>Taskbar, desktop context menu, and Search flyout</small></span>
          <svg class="ww11-option-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>`;
    previewNode=document.getElementById('ww-desktop-live-preview');
    galleryNode=document.getElementById('ww-theme-gallery');
    uploadNode=document.getElementById('ww-theme-file-input');
    previewNode.style.backgroundImage=`url(${JSON.stringify(currentWallpaper)})`;
    uploadNode.addEventListener('change',()=>uploadFiles(uploadNode.files));
    renderGallery();
    document.getElementById('ww11-open-colors').addEventListener('click',()=>navigate('colors'));
    document.getElementById('ww11-open-desktop').addEventListener('click',()=>navigate('desktop'));
  }
  const homeBanner=document.getElementById('ww-settings-home-banner');
  let accentOutsideListener=null;
  function renderColors(){
    if(accentOutsideListener){document.removeEventListener('pointerdown',accentOutsideListener,true);accentOutsideListener=null;}
    heading.textContent='Colors';
    previewNode=null;galleryNode=null;uploadNode=null;
    const accentOptions=[
      ['#0078d4','Windows blue'],['#df0034','Crimson'],['#0aa83c','Green'],['#ff5722','Orange'],
      ['#ffa22b','Amber'],['#18d5c8','Teal'],['#b52dcf','Violet'],['#06bfe7','Cyan']
    ];
    const glassDisplayIds=['original','pearl','silver','ash','smoke','steel','graphite','black'];
    const arrow='<svg class="ww11-colors-disclosure-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const accentChips=accentOptions.map(([color,name])=>`<button type="button" class="ww11-color-choice" data-ww11-accent-color="${color}" style="--choice:${color}" aria-label="${name} accent" aria-pressed="false"><span aria-hidden="true">✓</span></button>`).join('');
    const glassChips=glassDisplayIds.map(id=>{const info=GLASS_PRESETS[id];return`<button type="button" class="ww11-color-choice ww11-glass-choice" data-ww11-glass-color="${id}" title="${info.label}" aria-label="${info.label} glass color" aria-pressed="false" style="--choice:rgb(${info.rgb.join(',')})"><span aria-hidden="true">✓</span></button>`}).join('');
    section.innerHTML=`
      <div class="ww11-colors-page">
        <button type="button" class="ww11-colors-back" id="ww11-colors-back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 5-7 7 7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Personalization</span></button>
        <div class="ww11-colors-flyouts">
          <div class="ww11-colors-accordion ww11-colors-primary" id="ww11-colors-accordion">
            <button type="button" class="ww11-colors-disclosure" id="ww11-colors-disclosure" aria-expanded="false" aria-controls="ww11-colors-panel"><span><strong>Colors &amp; transparency effects</strong><small>Accent color, Mica material, and transparency</small></span>${arrow}</button>
            <div id="ww11-colors-panel" class="ww11-colors-panel" role="region" aria-label="Colors and transparency effects" hidden>
              <div class="ww11-colors-live-preview" aria-label="Live preview of desktop colors and transparency">
                <span class="ww11-colors-preview-art" aria-hidden="true"><i class="ww11-preview-back"></i><i class="ww11-preview-front"></i><i class="ww11-preview-marker"></i></span>
                <span class="ww11-colors-preview-copy"><strong>Your desktop colors</strong><small>Accent and Mica update as you make changes.</small></span>
              </div>
              <div class="ww11-colors-section-heading">Accent colors and glass</div>
              <div class="ww11-color-palettes">
                <div class="ww11-colors-card ww11-colors-palette-row">
                  <div class="ww11-colors-card-text"><strong>Windows colors</strong><small>Choose an accent preset, or pick an exact color.</small></div>
                  <div class="ww11-choice-row ww11-color-matrix" role="group" aria-label="Windows accent color presets">${accentChips}</div>
                  <div class="ww11-color-palette-footer">
                    <div class="ww11-accent-mode-control" id="ww11-accent-mode">
                      <button type="button" class="ww11-accent-mode-trigger" id="ww11-accent-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="ww11-accent-options" aria-label="Accent color mode">
                        <span class="ww11-accent-indicator" aria-hidden="true"></span>
                        <span id="ww11-accent-current">Automatic</span>
                        <svg class="ww11-accent-chevron" viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                      <div class="ww11-accent-options" id="ww11-accent-options" role="listbox" aria-label="Accent color mode" hidden>
                        <div class="ww11-accent-option" id="ww11-accent-option-automatic" role="option" tabindex="-1" aria-selected="true" data-ww11-accent-mode="automatic"><span>Automatic</span><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="m3 8.5 3 3 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                        <div class="ww11-accent-option" id="ww11-accent-option-manual" role="option" tabindex="-1" aria-selected="false" data-ww11-accent-mode="manual"><span>Manual</span><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="m3 8.5 3 3 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                      </div>
                    </div>
                    <label class="ww11-color-edit ww11-custom-color-control" title="Choose a custom accent color"><input id="ww11-custom-accent" type="color" aria-label="Custom accent color"/><span>Custom color</span></label>
                  </div>
                </div>
                <div class="ww11-colors-card ww11-glass-setting">
                  <div class="ww11-colors-card-text"><strong>Glass surface color</strong><small>Set the Mica tint used across windows and desktop surfaces.</small></div>
                  <div class="ww11-choice-row ww11-color-matrix" role="group" aria-label="Mica glass surface color presets">${glassChips}</div>
                  <div class="ww11-color-palette-footer ww11-glass-palette-footer">
                    <label class="ww11-color-edit ww11-custom-color-control" title="Choose a custom glass color"><input id="ww11-custom-glass" type="color" aria-label="Custom glass color"/><span id="ww11-custom-glass-value">Custom color</span></label>
                  </div>
                </div>
              </div>
              <div class="ww11-colors-card ww11-opacity-row"><label class="ww11-colors-card-text" for="ww11-opacity"><strong>Glass opacity</strong><small>Adjust the strength of Mica glass throughout the interface.</small></label><div class="ww11-opacity-controls"><input type="range" id="ww11-opacity" min="0" max="100" step="1" aria-label="Glass opacity" /><output id="ww11-opacity-value" for="ww11-opacity">90%</output></div></div>
            </div>
          </div>
          <div class="ww11-colors-accordion" id="ww11-advanced-tint-accordion">
            <button type="button" class="ww11-colors-disclosure" id="ww11-advanced-tint-disclosure" aria-expanded="false" aria-controls="ww11-advanced-tint-panel"><span><strong>Advanced tint editing</strong><small>Secondary transparency difference and control tint strength</small></span>${arrow}</button>
            <div id="ww11-advanced-tint-panel" class="ww11-colors-panel" role="region" aria-label="Advanced tint editing" hidden>
              <div class="ww11-colors-card ww11-opacity-row"><label class="ww11-colors-card-text" for="ww11-secondary-gap"><strong>Secondary transparency difference</strong><small>Reduce secondary-surface opacity relative to the main glass</small></label><div class="ww11-opacity-controls"><input id="ww11-secondary-gap" type="range" min="0" max="35" step="1"/><output id="ww11-secondary-gap-value" for="ww11-secondary-gap">10%</output></div></div>
              <div class="ww11-colors-card ww11-opacity-row"><label class="ww11-colors-card-text" for="ww11-control-tint"><strong>Control tint strength</strong><small>Amount of tint in buttons, cards, and input surfaces</small></label><div class="ww11-opacity-controls"><input id="ww11-control-tint" type="range" min="0" max="100" step="1"/><output id="ww11-control-tint-value" for="ww11-control-tint">42%</output></div></div>
            </div>
          </div>
          <div class="ww11-colors-accordion" id="ww11-visual-effects-accordion">
            <button type="button" class="ww11-colors-disclosure" id="ww11-visual-effects-disclosure" aria-expanded="false" aria-controls="ww11-visual-effects-panel"><span><strong>Visual effects</strong><small>Window shadows and adaptive HDR-style wallpaper lighting</small></span>${arrow}</button>
            <div id="ww11-visual-effects-panel" class="ww11-colors-panel" role="region" aria-label="Visual effects" hidden>
              <label class="ww11-colors-card ww11-colors-toggle-row" for="ww11-shadows"><span><strong>Window drop shadows</strong><small>Show shadows beneath Settings and Get Started windows</small></span><input id="ww11-shadows" type="checkbox" class="ww11-switch" /></label>
              <label class="ww11-colors-card ww11-colors-toggle-row" for="ww11-hdr"><span><strong>HDR lighting</strong><small>Selective highlight detail, realistic bloom, and wallpaper-aware lighting</small></span><input id="ww11-hdr" type="checkbox" class="ww11-switch" /></label>
              <div class="ww11-colors-card ww11-opacity-row"><label class="ww11-colors-card-text" for="ww11-hdr-intensity"><strong>HDR intensity</strong><small>Increase bright-area depth without washing out shadows</small></label><div class="ww11-opacity-controls"><input id="ww11-hdr-intensity" type="range" min="0" max="100" step="1" data-ww11-hdr-adjustment aria-label="HDR intensity"/><output id="ww11-hdr-intensity-value" for="ww11-hdr-intensity">68%</output></div></div>
              <div class="ww11-colors-card ww11-opacity-row"><label class="ww11-colors-card-text" for="ww11-hdr-bloom"><strong>Highlight bloom</strong><small>Soft glow around naturally bright wallpaper details</small></label><div class="ww11-opacity-controls"><input id="ww11-hdr-bloom" type="range" min="0" max="100" step="1" data-ww11-hdr-adjustment aria-label="Highlight bloom"/><output id="ww11-hdr-bloom-value" for="ww11-hdr-bloom">38%</output></div></div>
            </div>
          </div>
        </div>
        <button type="button" class="ww11-colors-reset" id="ww11-colors-reset">Restore default colors and effects</button>
      </div>`;
    document.getElementById('ww11-colors-back').addEventListener('click',()=>navigate('personalization'));
    // Independent disclosures: opening a flyout never closes another one.
    section.querySelectorAll('.ww11-colors-accordion').forEach(accordion=>{
      const trigger=accordion.querySelector('.ww11-colors-disclosure');
      const panel=accordion.querySelector('.ww11-colors-panel');
      if(!trigger||!panel)return;
      trigger.addEventListener('click',()=>{
        const expanding=trigger.getAttribute('aria-expanded')!=='true';
        trigger.setAttribute('aria-expanded',String(expanding));
        panel.hidden=!expanding;
        if(!expanding&&panel.id==='ww11-colors-panel')closeAccentPopup();
        panel.classList.remove('ww11-colors-reveal');
        if(expanding&&!reducedMotion.matches){void panel.offsetWidth;panel.classList.add('ww11-colors-reveal')}
      });
    });
    // Custom 11H11 Mica dropdown; keep the existing accent state and persistence.
    const accentControl=document.getElementById('ww11-accent-mode');
    const accentTrigger=accentControl.querySelector('#ww11-accent-trigger');
    const accentPopup=accentControl.querySelector('#ww11-accent-options');
    const accentItems=Array.from(accentPopup.querySelectorAll('[role="option"]'));
    const closeAccentPopup=(returnFocus=false)=>{
      accentPopup.hidden=true;
      accentPopup.classList.remove('is-opening');
      accentTrigger.setAttribute('aria-expanded','false');
      accentControl.classList.remove('is-open');
      accentControl.closest('.ww11-colors-accordion')?.classList.remove('is-accent-menu-open');
      if(returnFocus)accentTrigger.focus();
    };
    const openAccentPopup=(focusSelected=false)=>{
      // Re-trigger the actual three-stage shell/rows/details reveal on every open.
      accentPopup.classList.remove('is-opening');
      accentPopup.hidden=false;
      if(!reducedMotion.matches){void accentPopup.offsetWidth;accentPopup.classList.add('is-opening');}
      accentTrigger.setAttribute('aria-expanded','true');
      accentControl.classList.add('is-open');
      accentControl.closest('.ww11-colors-accordion')?.classList.add('is-accent-menu-open');
      if(focusSelected){
        (accentItems.find(item=>item.getAttribute('aria-selected')==='true')||accentItems[0]).focus();
      }
    };
    const applyAccentOption=item=>{
      setAutomaticAccent(item.dataset.ww11AccentMode==='automatic');
      closeAccentPopup(true);
    };
    accentTrigger.addEventListener('click',()=>{
      if(accentPopup.hidden)openAccentPopup();else closeAccentPopup();
    });
    accentTrigger.addEventListener('keydown',event=>{
      if(['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){
        event.preventDefault();
        openAccentPopup(true);
        if(event.key==='ArrowUp')accentItems.at(-1).focus();
      }else if(event.key==='Escape'&&!accentPopup.hidden){
        event.preventDefault();event.stopPropagation();closeAccentPopup(true);
      }
    });
    accentItems.forEach((item,index)=>{
      item.addEventListener('click',()=>applyAccentOption(item));
      item.addEventListener('keydown',event=>{
        if(event.key==='ArrowDown'||event.key==='ArrowUp'){
          event.preventDefault();accentItems[(index+(event.key==='ArrowDown'?1:-1)+accentItems.length)%accentItems.length].focus();
        }else if(event.key==='Home'||event.key==='End'){
          event.preventDefault();accentItems[event.key==='Home'?0:accentItems.length-1].focus();
        }else if(event.key==='Enter'||event.key===' '){
          event.preventDefault();applyAccentOption(item);
        }else if(event.key==='Escape'){
          event.preventDefault();event.stopPropagation();closeAccentPopup(true);
        }
      });
    });
    // Clicking outside or tabbing away dismisses the floating menu.
    accentControl.addEventListener('focusout',event=>{
      if(!accentControl.contains(event.relatedTarget))closeAccentPopup();
    });
    // Keep the outside handler attached only for this rendering of the Colors page.
    // The handler removes itself automatically when the generated control is replaced.
    const dismissAccentOnOutside=event=>{
      if(!accentControl.isConnected){document.removeEventListener('pointerdown',dismissAccentOnOutside,true);if(accentOutsideListener===dismissAccentOnOutside)accentOutsideListener=null;return;}
      if(!accentControl.contains(event.target))closeAccentPopup();
    };
    accentOutsideListener=dismissAccentOnOutside;
    document.addEventListener('pointerdown',accentOutsideListener,true);
    section.querySelectorAll('[data-ww11-accent-color]').forEach(button=>button.addEventListener('click',()=>{
      setAutomaticAccent(false);
      setAccent(button.dataset.ww11AccentColor);
      syncColorsForm();
    }));
    section.querySelectorAll('[data-ww11-glass-color]').forEach(button=>button.addEventListener('click',()=>{
      glassState.color=button.dataset.ww11GlassColor;applyGlassState();
    }));
    document.getElementById('ww11-custom-accent').addEventListener('input',e=>{
      // Save the chosen value before the mode switch synchronizes the form.
      const chosenColor=e.currentTarget.value;
      setAutomaticAccent(false);setAccent(chosenColor);syncColorsForm();
    });
    document.getElementById('ww11-custom-glass').addEventListener('input',e=>{
      glassState.color='custom';glassState.customColor=e.currentTarget.value;applyGlassState();
    });
    document.getElementById('ww11-secondary-gap').addEventListener('input',e=>{
      glassState.secondaryGap=Number(e.currentTarget.value);applyGlassState();
    });
    document.getElementById('ww11-control-tint').addEventListener('input',e=>{
      glassState.controlTint=Number(e.currentTarget.value);applyGlassState();
    });
    document.getElementById('ww11-colors-reset').addEventListener('click',()=>{
      glassState={...DEFAULT_GLASS};setAutomaticAccent(false);setAccent('#0078d4');applyGlassState();
    });
    document.getElementById('ww11-opacity').addEventListener('input',e=>{
      glassState.opacity=Number(e.currentTarget.value);applyGlassState();
    });
    document.getElementById('ww11-shadows').addEventListener('change',e=>{
      glassState.shadows=e.currentTarget.checked;applyGlassState();
    });
    document.getElementById('ww11-hdr').addEventListener('change',e=>{
      glassState.hdr=e.currentTarget.checked;applyGlassState();
    });
    document.getElementById('ww11-hdr-intensity').addEventListener('input',e=>{
      glassState.hdrIntensity=Number(e.currentTarget.value);applyGlassState();
    });
    document.getElementById('ww11-hdr-bloom').addEventListener('input',e=>{
      glassState.hdrBloom=Number(e.currentTarget.value);applyGlassState();
    });
    syncColorsForm();
  }
  function renderHome(){
    heading.textContent='System';
    previewNode=null;galleryNode=null;uploadNode=null;
    homeBanner.hidden=false;
    homeBanner.innerHTML=`
      <div class="ww11-home-monitor" role="img" aria-label="Current Windows 12 wallpaper"></div>
      <div class="ww11-home-device-info">
        <strong id="ww11-device-name"></strong>
      </div>`;
    // System always reflects the locally saved account name. No separate device
    // name, manufacturer/model string, or Rename control exists in 11H11.
    document.getElementById('ww11-device-name').textContent=profileName();
    section.innerHTML='<div class="ww11-home-version">Windows 12 · Version 11H11</div>';
  }
  /* Accounts shares the same persistent identity as the Start menu.
     This is a local browser profile: changing it does not rename an OS account. */
  const PROFILE_STORAGE_KEY='webwindows.11h11.account';
  function savedProfile(){
    try{
      const saved=JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY)||'null');
      if(!saved||typeof saved!=='object'||Array.isArray(saved))return {};
      // Migrate earlier profiles away from email fields without disturbing name/photo.
      if(Object.prototype.hasOwnProperty.call(saved,'email')){
        delete saved.email;
        localStorage.setItem(PROFILE_STORAGE_KEY,JSON.stringify(saved));
      }
      return saved;
    }catch{return {}}
  }
  function profileName(profile=savedProfile()){
    return typeof profile.name==='string'&&profile.name.trim()
      ?profile.name.trim().slice(0,48):'Russel John';
  }
  function profilePhoto(profile=savedProfile()){
    const image=profile.image;
    return typeof image==='string' &&
      (image.startsWith('data:image/')||/^\.?\/?[\w./-]+$/.test(image))
      ? image:'Assets/account-avatar.png';
  }
  function saveProfile(patch){
    const next={...savedProfile(),...patch};
    delete next.email;
    localStorage.setItem(PROFILE_STORAGE_KEY,JSON.stringify(next));
    window.WebWindows11Start?.refreshAccount?.();
    syncAccount();
    window.dispatchEvent(new CustomEvent('webwindows:account-changed',{detail:{name:profileName(next)}}));
    return next;
  }
  function renderAccounts(){
    heading.textContent='Accounts';
    previewNode=null;galleryNode=null;uploadNode=null;
    const profile=savedProfile();
    section.innerHTML=`
      <div class="ww11-accounts-page">
        <div class="ww11-account-hero">
          <div class="ww11-account-picture"><img id="ww11-account-picture" src="Assets/account-avatar.png" alt="Current profile picture"></div>
          <div class="ww11-account-identity">
            <strong id="ww11-account-display-name"></strong>
            <span>Administrator</span>
          </div>
        </div>
        <h2 class="ww11-accounts-subheading">Adjust your profile</h2>
        <form id="ww11-account-name-form" class="ww11-account-row ww11-name-form">
          <svg class="ww11-account-row-icon ww-ph-icon"  focusable="false" aria-hidden="true"><use href="#ww-ph-user"></use></svg>
          <label for="ww11-account-name-input">Account name</label>
          <div class="ww11-account-name-actions">
            <input id="ww11-account-name-input" type="text" autocomplete="nickname" maxlength="48" required aria-label="Account name" spellcheck="false">
            <button type="submit" id="ww11-account-name-save">Save</button>
          </div>
        </form>
        <div class="ww11-account-row">
          <svg class="ww11-account-row-icon ww-ph-icon"  focusable="false" aria-hidden="true"><use href="#ww-ph-folder"></use></svg>
          <span>Choose a file</span>
          <button type="button" id="ww11-account-file-button">Browse files</button>
          <input id="ww11-account-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
        </div>
      </div>`;
    const name=document.getElementById('ww11-account-display-name');
    const input=document.getElementById('ww11-account-name-input');
    const picture=document.getElementById('ww11-account-picture');
    const form=document.getElementById('ww11-account-name-form');
    const chooser=document.getElementById('ww11-account-file');
    // Avoid app-level messages while preserving console diagnostics on errors.
    const showFeedback=(message,isError=false)=>{
      if(isError)console.warn('[WebWindows account]',message);
    };
    name.textContent=profileName(profile);
    input.value=profileName(profile);
    picture.src=profilePhoto(profile);
    picture.onerror=()=>{if(!picture.src.endsWith('/Assets/account-avatar.png'))picture.src='Assets/account-avatar.png';};
    form.addEventListener('submit',event=>{
      event.preventDefault();const nextName=input.value.trim().replace(/\s+/g,' ').slice(0,48);
      if(!nextName){input.focus();showFeedback('Enter an account name.',true);return;}
      try{saveProfile({name:nextName});name.textContent=nextName;input.value=nextName;}
      catch{showFeedback('Could not save the account name in this browser.',true)}
    });
    document.getElementById('ww11-account-file-button').addEventListener('click',()=>chooser.click());
    chooser.addEventListener('change',async()=>{
      const file=chooser.files?.[0];if(!file)return;
      try{
        if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))throw Error('Choose a PNG, JPEG, WebP or GIF image.');
        if(file.size>12*1024*1024)throw Error('Choose a picture smaller than 12 MB.');
        const url=URL.createObjectURL(file);
        let image;
        try{
          image=await new Promise((resolve,reject)=>{
            const el=new Image();
            el.onload=()=>resolve(el);
            el.onerror=()=>reject(Error('That image could not be opened.'));
            el.src=url;
          });
        }finally{URL.revokeObjectURL(url)}
        if(!image.naturalWidth||!image.naturalHeight)throw Error('The selected image is empty.');
        const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
        const ctx=canvas.getContext('2d');if(!ctx)throw Error('This browser cannot process images.');
        const side=Math.min(image.naturalWidth,image.naturalHeight);
        ctx.fillStyle='#f5f6f9';ctx.fillRect(0,0,256,256);
        ctx.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,256,256);
        const result=canvas.toDataURL('image/jpeg',.82);
        saveProfile({image:result});picture.src=result;
        showFeedback('Profile picture updated.');
      }catch(error){showFeedback(error?.message||'Could not update the picture.',true)}
      finally{chooser.value='';}
    });
  }

  // Desktop Appearance pages preserve 10H10's choices, but share 11H11's card,
  // page navigation, accordion animation, and material tokens.
  const desktopPrefs=window.WebWindows11Preferences;
  const desktopPanels=new Set();
  const chevron='<svg class="ww11-desktop-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function desktopBack(to='desktop'){
    return `<button type="button" class="ww11-colors-back" data-ww11-desktop-route="${to}"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 5-7 7 7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${to==='desktop'?'Desktop appearance':'Personalization'}</span></button>`;
  }
  function desktopLink(label,description,route,icon){
    return `<button type="button" class="ww11-personalization-option ww11-desktop-subpage-link" data-ww11-desktop-route="${route}"><span class="ww11-personalization-option-label"><strong>${label}</strong><small>${description}</small></span>${chevron}</button>`;
  }
  function desktopIntro(description){return `<p class="ww11-colors-description">${description}</p>`;}
  function desktopDisclosure(id,title,description,icon,body){
    const expanded=desktopPanels.has(id);
    return `<div class="ww11-desktop-accordion"><button class="ww11-desktop-disclosure" type="button" data-ww11-desktop-expand="${id}" aria-expanded="${expanded}" aria-controls="ww11-desktop-panel-${id}"><svg class="ww11-desktop-disclosure-icon ww-ph-icon" viewBox="${window.WebWindows11Icons.viewBox(icon)}" aria-hidden="true"><use href="#ww-ph-${icon}"></use></svg><span><strong>${title}</strong><small>${description}</small></span><svg class="ww11-desktop-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="ww11-desktop-disclosure-body" id="ww11-desktop-panel-${id}" ${expanded?'':'hidden'}>${body}</div></div>`;
  }
  function desktopChoice(group,value,label,description,preview=''){
    const on=desktopPrefs?.get()[group]===value;
    const miniBar=preview==='ww11-preview-separated'
      ? '<span class="ww11-desktop-preview-taskbar"><span class="ww11-mini-section ww11-mini-section-left"><i></i></span><span class="ww11-mini-section ww11-mini-section-center"><i></i><i></i><i></i></span><span class="ww11-mini-section ww11-mini-section-right"><i></i></span></span>'
      : '<span class="ww11-desktop-preview-taskbar"><i></i><i></i><i></i><i></i><i></i></span>';
    return `<button class="ww11-desktop-choice" type="button" role="radio" data-ww11-desktop-setting="${group}" data-ww11-desktop-value="${value}" aria-checked="${on}"><span class="ww11-desktop-choice-preview ${preview}" aria-hidden="true"><span class="ww11-desktop-preview-screen">${miniBar}</span></span><strong>${label}</strong><small>${description}</small></button>`;
  }
  function renderDesktop(){
    heading.textContent='Desktop appearance';
    section.innerHTML=`<div class="ww11-desktop-page">${desktopBack('personalization')}${desktopIntro('Manage the taskbar, desktop context menu, and Search flyout.')}
      <div class="ww11-desktop-route-list">${desktopLink('Taskbar','Position, alignment, Search, app labels, and taskbar style','taskbar','desktop')}${desktopLink('Context menu','Glass surface controls in the desktop right-click menu','context-menu','sliders-horizontal-light')}${desktopLink('Search flyout','Result ordering and Search placement','search-flyout','magnifying-glass')}</div></div>`;
  }
  function renderTaskbar(){
    heading.textContent='Taskbar';
    section.innerHTML=`<div class="ww11-desktop-page">${desktopBack()}${desktopIntro('Choose how taskbar items look and where the taskbar is positioned.')}
      ${desktopDisclosure('taskbar-search','Search','Choose the appearance of Search on the taskbar.','magnifying-glass',`<div class="ww11-desktop-options" role="radiogroup" aria-label="Taskbar Search appearance">${desktopChoice('searchMode','icon','Icon only','Compact Search icon.','ww11-preview-search-icon')}${desktopChoice('searchMode','box','Icon & search bar','Keep the search bar visible.','ww11-preview-search-box')}${desktopChoice('searchMode','hover','Expand on hover','Show Search when hovered.','ww11-preview-search-hover')}</div>`)}
      ${desktopDisclosure('taskbar-labels','App icon & name','Choose whether app names appear beside their icons.','app-window',`<div class="ww11-desktop-options" role="radiogroup" aria-label="Taskbar app labels">${desktopChoice('appLabels','icon','Icon only','Compact taskbar buttons.','ww11-preview-app-icon')}${desktopChoice('appLabels','name','Icon & app name','Show app names beside icons.','ww11-preview-app-name')}</div>`)}
      ${desktopDisclosure('taskbar-location','Taskbar location & alignment','Move the taskbar to any screen edge and align its apps.','desktop',`<div class="ww11-desktop-setting-title">Taskbar location on screen</div><div class="ww11-desktop-options ww11-desktop-position-options" role="radiogroup" aria-label="Taskbar location">${desktopChoice('position','bottom','Bottom','Bottom of screen.','ww11-preview-bottom')}${desktopChoice('position','top','Top','Top of screen.','ww11-preview-top')}${desktopChoice('position','left','Left','Left edge.','ww11-preview-left')}${desktopChoice('position','right','Right','Right edge.','ww11-preview-right')}</div><div class="ww11-desktop-setting-title">Taskbar alignment</div><div class="ww11-colors-card ww11-desktop-inline-row ww11-desktop-align-row"><span class="ww11-colors-card-text" id="ww11-desktop-align-label"><strong>App icon alignment</strong><small>Center pinned apps, or place them beside Start and Search.</small></span><div class="ww11-desktop-alignment-selector" id="ww11-desktop-align-control"><button type="button" class="ww11-accent-mode-trigger" id="ww11-desktop-align-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="ww11-desktop-align-options" aria-labelledby="ww11-desktop-align-label ww11-desktop-align-current"><span id="ww11-desktop-align-current">${desktopPrefs.align==='start'?'Left / Top':'Center'}</span><svg class="ww11-accent-chevron" viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true"><path d="m3.5 6 4.5 4.5L12.5 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="ww11-accent-options" id="ww11-desktop-align-options" popover="manual" role="listbox" aria-label="Taskbar alignment" hidden><div class="ww11-accent-option" role="option" tabindex="-1" data-ww11-align-value="center" aria-selected="${desktopPrefs.align==='center'}"><span>Center</span><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="m3 8.5 3 3 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="ww11-accent-option" role="option" tabindex="-1" data-ww11-align-value="start" aria-selected="${desktopPrefs.align==='start'}"><span>Left / Top</span><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="m3 8.5 3 3 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div></div></div>`)}
      ${desktopDisclosure('taskbar-style','Taskbar style','Choose an attached, floating, or separated taskbar.','sliders-horizontal-light',`<div class="ww11-desktop-options" role="radiogroup" aria-label="Taskbar style">${desktopChoice('layout','attached','Attached','Edge-to-edge, no desktop gap.','ww11-preview-attached')}${desktopChoice('layout','floating','Floating','Rounded bar with a desktop gap.','ww11-preview-floating')}${desktopChoice('layout','separated','Separated','Three separate Mica sections for controls, apps, and tray.','ww11-preview-separated')}</div><div class="ww11-taskbar-size-card ww11-colors-card"><div class="ww11-taskbar-size-header"><span class="ww11-taskbar-size-copy"><strong>Taskbar size</strong><small>Adjust the height and spacing of taskbar controls.</small></span><output class="ww11-taskbar-size-value" id="ww11-taskbar-size-value" for="ww11-taskbar-size">${desktopPrefs.size} px</output></div><div class="ww11-taskbar-size-slider-area"><input id="ww11-taskbar-size" class="ww11-taskbar-size-slider" type="range" min="40" max="64" step="1" value="${desktopPrefs.size}" style="--range-progress:${100*(Number(desktopPrefs.size)-40)/24}%" aria-label="Taskbar size in pixels"/><div class="ww11-taskbar-size-markers"><span>Compact</span><span>Default</span><span>Spacious</span></div></div><div class="ww11-taskbar-size-footer"><span id="ww11-taskbar-size-descriptor">${desktopPrefs.size<45?'Compact':desktopPrefs.size>53?'Spacious':'Balanced'} · 40–64 px</span><button type="button" class="ww11-taskbar-size-reset" id="ww11-taskbar-size-reset">Reset</button></div></div>`)}
      </div>`;
    // Alignment is rendered from the persisted desktop appearance preference.
  }
  function renderContextMenu(){
    heading.textContent='Context menu';
    section.innerHTML=`<div class="ww11-desktop-page">${desktopBack()}${desktopIntro('Customize what appears when you right-click an empty area of the desktop.')}
      <div class="ww11-desktop-setting-title">Context menu items</div>
      <label class="ww11-colors-card ww11-colors-toggle-row ww11-desktop-switch-row"><span><strong>Glass surface controls in context menu</strong><small>Show glass color, custom HEX, and opacity controls above the three existing desktop commands.</small></span><input type="checkbox" id="ww11-desktop-context-glass" class="ww11-switch" ${desktopPrefs.contextGlassControls?'checked':''}/></label>
      </div>`;
  }
  function renderSearchFlyout(){
    heading.textContent='Search flyout';
    section.innerHTML=`<div class="ww11-desktop-page">${desktopBack()}${desktopIntro('Customize Search placement and which results appear when Search opens.')}
      ${desktopDisclosure('search-placement','Search placement','Position Search relative to your taskbar.','desktop',`<div class="ww11-desktop-info">Determining option</div>`)}
      ${desktopDisclosure('search-results','Search results','Choose which results appear when Search opens and while typing.','magnifying-glass',`<div class="ww11-desktop-result-options" role="radiogroup" aria-label="Search results filter">${[['all','All results','Search all available apps and Settings actions.'],['recent','Recently opened','Search only items you opened recently.'],['frequent','Most used','Search only items you use most often.']].map(([value,label,description])=>`<label class="ww11-desktop-result-option"><span><strong>${label}</strong><small>${description}</small></span><input type="radio" name="ww11-search-results-mode" value="${value}" ${desktopPrefs.searchResultsMode===value?'checked':''}/><span class="ww11-desktop-radio" aria-hidden="true"></span></label>`).join('')}</div>`)}
      </div>`;
  }
  function closeDesktopAlignment(restoreFocus=false){
    const control=section.querySelector('#ww11-desktop-align-control');
    if(!control)return;
    const popup=control.querySelector('#ww11-desktop-align-options');
    if(popup.matches(':popover-open'))popup.hidePopover();
    popup.hidden=true;
    popup.classList.remove('is-opening');
    control.classList.remove('is-open','is-dropup');
    const trigger=control.querySelector('#ww11-desktop-align-trigger');
    trigger.setAttribute('aria-expanded','false');
    if(restoreFocus)trigger.focus({preventScroll:true});
  }
  function positionDesktopAlignment(){
    const control=section.querySelector('#ww11-desktop-align-control');
    if(!control)return;
    const popup=control.querySelector('#ww11-desktop-align-options');
    if(popup.hidden)return;
    const rect=control.getBoundingClientRect();
    const width=Math.min(Math.max(170,rect.width),innerWidth-16);
    const height=Math.max(86,popup.offsetHeight||90);
    const roomBelow=innerHeight-rect.bottom-8;
    const roomAbove=rect.top-8;
    const dropup=roomBelow<height+8&&roomAbove>roomBelow;
    control.classList.toggle('is-dropup',dropup);
    const top=dropup?rect.top-height-7:rect.bottom+7;
    popup.style.setProperty('--ww11-align-popover-top',Math.round(Math.max(8,Math.min(top,innerHeight-height-8)))+'px');
    popup.style.setProperty('--ww11-align-popover-left',Math.round(Math.max(8,Math.min(rect.left,innerWidth-width-8)))+'px');
    popup.style.setProperty('--ww11-align-popover-width',Math.round(width)+'px');
  }
  function openDesktopAlignment(focusSelected=false){
    const control=section.querySelector('#ww11-desktop-align-control');
    if(!control)return;
    const popup=control.querySelector('#ww11-desktop-align-options');
    popup.hidden=false;
    positionDesktopAlignment();
    if(!popup.matches(':popover-open'))popup.showPopover();
    popup.classList.remove('is-opening');
    if(!reducedMotion.matches){void popup.offsetWidth;popup.classList.add('is-opening');}
    control.classList.add('is-open');
    control.querySelector('#ww11-desktop-align-trigger').setAttribute('aria-expanded','true');
    if(focusSelected)(popup.querySelector('[aria-selected="true"]')||popup.querySelector('[role="option"]')).focus({preventScroll:true});
  }
  function chooseDesktopAlignment(option){
    if(!option||!desktopPrefs?.set('align',option.dataset.ww11AlignValue))return;
    const control=section.querySelector('#ww11-desktop-align-control');
    control.querySelector('#ww11-desktop-align-current').textContent=option.dataset.ww11AlignValue==='start'?'Left / Top':'Center';
    control.querySelectorAll('[data-ww11-align-value]').forEach(item=>item.setAttribute('aria-selected',String(item===option)));
    closeDesktopAlignment(true);
  }
  section.addEventListener('click',event=>{
    const alignTrigger=event.target.closest('#ww11-desktop-align-trigger');
    if(alignTrigger){
      const popup=section.querySelector('#ww11-desktop-align-options');
      if(popup.hidden)openDesktopAlignment();else closeDesktopAlignment();
      return;
    }
    const alignment=event.target.closest('[data-ww11-align-value]');
    if(alignment){chooseDesktopAlignment(alignment);return;}
    const routeButton=event.target.closest('[data-ww11-desktop-route]');
    if(routeButton){navigate(routeButton.dataset.ww11DesktopRoute);return;}
    const expander=event.target.closest('[data-ww11-desktop-expand]');
    if(expander){
      const name=expander.dataset.ww11DesktopExpand;
      const panel=document.getElementById('ww11-desktop-panel-'+name);
      if(!panel)return;
      const opening=panel.hidden;
      panel.hidden=!opening;expander.setAttribute('aria-expanded',String(opening));
      opening?desktopPanels.add(name):desktopPanels.delete(name);
      if(opening&&!reducedMotion.matches){panel.classList.remove('ww11-colors-reveal');void panel.offsetWidth;panel.classList.add('ww11-colors-reveal');}
      return;
    }
    const choice=event.target.closest('[data-ww11-desktop-setting]');
    if(event.target.closest('#ww11-taskbar-size-reset')){
      desktopPrefs?.set('size',45);
      const slider=section.querySelector('#ww11-taskbar-size');
      const value=section.querySelector('#ww11-taskbar-size-value');
      if(slider){slider.value='45';slider.style.setProperty('--range-progress',`${100*(45-40)/24}%`);}
      if(value)value.textContent='45 px';
      const descriptor=section.querySelector('#ww11-taskbar-size-descriptor');
      if(descriptor)descriptor.textContent='Balanced · 40–64 px';
      return;
    }
    if(choice && desktopPrefs?.set(choice.dataset.ww11DesktopSetting,choice.dataset.ww11DesktopValue)){ 
      const group=choice.dataset.ww11DesktopSetting;
      section.querySelectorAll('[data-ww11-desktop-setting="'+group+'"]').forEach(button=>button.setAttribute('aria-checked',String(button===choice)));
    }
  });
  section.addEventListener('keydown',event=>{
    const control=event.target.closest?.('#ww11-desktop-align-control');
    if(!control)return;
    const popup=control.querySelector('#ww11-desktop-align-options');
    const options=Array.from(popup.querySelectorAll('[role="option"]'));
    const index=options.indexOf(event.target);
    if(event.key==='Escape'&&!popup.hidden){event.preventDefault();event.stopPropagation();closeDesktopAlignment(true);return;}
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();
      if(popup.hidden)openDesktopAlignment();
      const target=event.key==='Home'?0:event.key==='End'?options.length-1:
        index===-1?(event.key==='ArrowUp'?options.length-1:0):
        (index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;
      options[target].focus({preventScroll:true});
    }else if((event.key==='Enter'||event.key===' ')&&index>=0){
      event.preventDefault();chooseDesktopAlignment(options[index]);
    }
  });
  window.addEventListener('resize',positionDesktopAlignment,{passive:true});
  section.addEventListener('scroll',positionDesktopAlignment,true);
  section.addEventListener('focusout',event=>{
    const control=event.target.closest?.('#ww11-desktop-align-control');
    if(control&&!control.contains(event.relatedTarget))closeDesktopAlignment();
  });
  document.addEventListener('pointerdown',event=>{
    const control=section.querySelector('#ww11-desktop-align-control');
    if(control&&!control.contains(event.target))closeDesktopAlignment();
  },true);
  section.addEventListener('input',event=>{
    if(event.target.id==='ww11-taskbar-size'){
      desktopPrefs?.set('size',event.target.value);
      const output=section.querySelector('#ww11-taskbar-size-value');
      if(output)output.textContent=desktopPrefs.size+' px';
      const descriptor=section.querySelector('#ww11-taskbar-size-descriptor');
      if(descriptor)descriptor.textContent=(desktopPrefs.size<45?'Compact':desktopPrefs.size>53?'Spacious':'Balanced')+' · 40–64 px';
      event.target.style.setProperty('--range-progress',`${100*(Number(event.target.value)-40)/24}%`);
    }
  });
  section.addEventListener('change',event=>{
    const node=event.target;
    if(node.id==='ww11-desktop-context-glass')desktopPrefs?.set('contextGlassControls',node.checked);
    if(node.name==='ww11-search-results-mode')desktopPrefs?.set('searchResultsMode',node.value);
  });

  // Titlebar history navigates only pages that 11H11 already implements.
  // Do not change global browser history or introduce disabled categories.
  const routeBack=document.getElementById('ww-settings-nav-back');
  const routeForward=document.getElementById('ww-settings-nav-forward');
  const routeHistory=['home'];
  let routeHistoryIndex=0;
  let routeHistoryTraversal=false;
  function syncRouteHistory(){
    if(routeBack)routeBack.disabled=routeHistoryIndex===0;
    if(routeForward)routeForward.disabled=routeHistoryIndex>=routeHistory.length-1;
  }
  function travelRoute(direction){
    const next=routeHistoryIndex+direction;
    if(next<0||next>=routeHistory.length)return;
    routeHistoryIndex=next;
    routeHistoryTraversal=true;
    try{navigate(routeHistory[next]);}finally{routeHistoryTraversal=false;}
    syncRouteHistory();
  }
  routeBack?.addEventListener('click',()=>travelRoute(-1));
  routeForward?.addEventListener('click',()=>travelRoute(1));
  syncRouteHistory();
  function navigate(route='home'){
    if(!['home','personalization','colors','accounts','desktop','taskbar','context-menu','search-flyout'].includes(route))return;
    const previousRoute=current;
    if(route!==current && !routeHistoryTraversal){
      routeHistory.splice(routeHistoryIndex+1);
      routeHistory.push(route);
      routeHistoryIndex=routeHistory.length-1;
    }
    syncRouteHistory();
    const routeIndex={home:0,personalization:1,colors:2,desktop:2,taskbar:3,'context-menu':3,'search-flyout':3,accounts:1};
    win.dataset.wuaRouteMotion=routeIndex[route]<routeIndex[previousRoute]?'back':'forward';
    current=route;
    nav.forEach(btn=>{
      const active=btn.dataset.wwSettingsNav===(['colors','desktop','taskbar','context-menu','search-flyout'].includes(route)?'personalization':route);
      btn.classList.toggle('is-active',active);
      if(active)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
    });
    if(route==='home')renderHome();
    else {homeBanner.hidden=true;if(route==='accounts')renderAccounts();else if(route==='colors')renderColors();else if(route==='desktop')renderDesktop();else if(route==='taskbar')renderTaskbar();else if(route==='context-menu')renderContextMenu();else if(route==='search-flyout')renderSearchFlyout();else renderPersonalization();}
    refreshSidebarIndicator(true);
    if(!reducedMotion.matches){
      for(const target of [section,homeBanner]){
        if(target.hidden)continue;
        target.classList.remove('ww11-native-page-enter');
        void target.offsetWidth;
        target.classList.add('ww11-native-page-enter');
      }
    }
    document.getElementById('ww-settings-main').scrollTop=0;
    closeSearchResults();
    window.dispatchEvent(new CustomEvent('webwindows:settings-route',{detail:{route,previous:previousRoute}}));
  }
  function syncAccount(){
    const label=document.getElementById('start-account-name')?.textContent?.trim()||'Russel John';
    document.getElementById('ww-settings-account-name').textContent=label;
    const avatar=document.getElementById('ww-settings-avatar');
    const source=document.getElementById('start-account-photo')?.src || 'Assets/account-avatar.png';
    if(avatar.src!==source)avatar.src=source;
    avatar.onerror=()=>{avatar.hidden=true;document.getElementById('ww-settings-avatar-fallback').hidden=false;};
    avatar.onload=()=>{avatar.hidden=false;document.getElementById('ww-settings-avatar-fallback').hidden=true;};
  }
  function closeSearchResults(){
    searchResults.hidden=true;
    searchResults.classList.remove('is-opening');
    search.setAttribute('aria-expanded','false');
    search.removeAttribute('aria-activedescendant');
    activeSearchIndex=-1;
  }
  function hideWindow(){
    overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
    document.querySelectorAll('[data-ww11-open-settings]').forEach(node=>node.setAttribute('aria-expanded','false'));
    closeSearchResults();
    previewNode=null;galleryNode=null;uploadNode=null;
  }
  function close(){
    if(!opened&&!minimized)return;
    opened=false;minimized=false;focused=false;
    hideWindow();
    refreshTaskbarAppState();
  }
  function minimize(){
    if(!opened)return;
    opened=false;minimized=true;focused=false;
    hideWindow();
    refreshTaskbarAppState();
  }
  function open(route='home'){
    // Reopen the current page when restoring a minimized window, and focus
    // without resetting the page when activating from the taskbar.
    if(typeof route!=='string')route=(opened||minimized)?current:'home';
    window.WebWindows11Start?.hide?.();
    window.WebWindows11Search?.close?.();
    syncAccount();
    const wasOpen=opened;
    overlay.hidden=false;overlay.setAttribute('aria-hidden','false');
    opened=true;minimized=false;focused=true;
    window.dispatchEvent(new Event('webwindows:settings-focused'));
    document.querySelectorAll('[data-ww11-open-settings]').forEach(node=>node.setAttribute('aria-expanded','true'));
    if(!wasOpen || route!==current)navigate(['home','personalization','colors','accounts','desktop','taskbar','context-menu','search-flyout'].includes(route)?route:'home');
    refreshTaskbarAppState();
  }
  const navHost=document.getElementById('ww-settings-navigation');
  const marker=document.createElement('span');
  marker.className='ww-settings-indicator';marker.setAttribute('aria-hidden','true');
  navHost?.append(marker);
  let lastMarkerY=null;
  let markerMotion=null;
  function refreshSidebarIndicator(animate=true){
    if(!navHost||!marker)return;
    const selected=navHost.querySelector('.ww-settings-nav-row.is-active');
    if(!selected)return;
    const bounds=selected.getBoundingClientRect();
    const parentBounds=navHost.getBoundingClientRect();
    // The sidebar switches from expanded to icon rail when its own window narrows.
    const y=bounds.top-parentBounds.top+(bounds.height-16)/2;
    const from=lastMarkerY;
    lastMarkerY=y;
    markerMotion?.cancel();
    marker.style.transition='none';
    marker.style.top=`${y}px`;
    marker.style.height='16px';
    if(from===null||!animate||reducedMotion.matches||Math.abs(y-from)<.5)return;
    // FLIP: retain the old visual position while the new nav row is selected.
    // No timeout or layout thrash; intermediate route changes cancel cleanly.
    const travel=from-y;
    markerMotion=marker.animate([
      {transform:`translateY(${travel}px) scaleY(1)`},
      {transform:`translateY(${travel*.30}px) scaleY(${Math.min(2,1+Math.abs(travel)/96)})`,offset:.57},
      {transform:'translateY(0) scaleY(1)'}
    ],{duration:340,easing:'cubic-bezier(.18,.81,.2,1)'});
    markerMotion.addEventListener('finish',()=>{markerMotion=null;},{once:true});
  }
  window.addEventListener('resize',()=>refreshSidebarIndicator(false));
  // Layout refreshes never replay the indicator animation.
  if('ResizeObserver' in window)new ResizeObserver(()=>refreshSidebarIndicator(false)).observe(navHost);
  nav.forEach(btn=>btn.addEventListener('click',()=>{
    if(btn.dataset.wwSettingsNav==='personalization')navigate('personalization');
    if(btn.dataset.wwSettingsNav==='home')navigate('home');
    if(btn.dataset.wwSettingsNav==='accounts')navigate('accounts');
    // Time & Language, Privacy, and Windows Update remain inert.
  }));
  // Only index controls and pages that 11H11 actually implements.
  // A result may reveal an existing Colors accordion and focus the real control.
  const settingsSearchItems=[
    {title:'System',detail:'Settings home',route:'home',icon:'house-regular',terms:'home device computer version system'},
    {title:'Personalization',detail:'Wallpapers and appearance',route:'personalization',icon:'paint-brush-regular',terms:'personalize customize desktop'},
    {title:'Desktop background',detail:'Personalization · Choose a wallpaper',route:'personalization',target:'#ww-theme-gallery',icon:'desktop',terms:'wallpaper images picture backgrounds gallery'},
    {title:'Desktop appearance',detail:'Personalization · Taskbar, Context menu, and Search',route:'desktop',icon:'desktop',terms:'appearance desktop layout taskbar customization'},
    {title:'Taskbar',detail:'Desktop appearance · Taskbar position and style',route:'taskbar',icon:'desktop',terms:'taskbar position alignment attached floating'},
    {title:'Taskbar Search appearance',detail:'Taskbar · Icon only, Search bar, expand on hover',route:'taskbar',panel:'ww11-desktop-panel-taskbar-search',icon:'magnifying-glass',terms:'search mode taskbar icon box hover'},
    {title:'App icon and name',detail:'Taskbar · Show labels next to icons',route:'taskbar',panel:'ww11-desktop-panel-taskbar-labels',icon:'app-window',terms:'taskbar names labels icon'},
    {title:'Taskbar location',detail:'Taskbar · Top, bottom, left, or right',route:'taskbar',panel:'ww11-desktop-panel-taskbar-location',icon:'desktop',terms:'taskbar position location align'},
    {title:'Taskbar style',detail:'Taskbar · Attached, Floating, or Separated',route:'taskbar',panel:'ww11-desktop-panel-taskbar-style',icon:'desktop',terms:'taskbar floating attached separated sections'},
    {title:'Context menu',detail:'Desktop appearance · Right-click menu',route:'context-menu',icon:'sliders-horizontal-light',terms:'desktop context menu glass right click'},
    {title:'Context menu glass controls',detail:'Context menu · Glass surface controls',route:'context-menu',target:'#ww11-desktop-context-glass',icon:'sliders-horizontal-light',terms:'show glass color opacity context menu'},
    {title:'Search flyout',detail:'Desktop appearance · Search results',route:'search-flyout',icon:'magnifying-glass',terms:'search pop-up flyout placement results'},
    {title:'Search results',detail:'Search flyout · All, Recent, Most used',route:'search-flyout',panel:'ww11-desktop-panel-search-results',icon:'magnifying-glass',terms:'recent frequent search results preferences'},

    {title:'Add a wallpaper',detail:'Personalization · Upload an image',route:'personalization',target:'#ww-theme-gallery',icon:'desktop',terms:'upload file custom wallpaper add image'},
    {title:'Colors',detail:'Personalization · Colors and transparency',route:'colors',icon:'palette',terms:'appearance theme color glass'},
    {title:'Choose your accent color',detail:'Colors · Automatic or Manual',route:'colors',panel:'ww11-colors-panel',target:'#ww11-accent-trigger',icon:'palette',terms:'wallpaper accent color auto choose mode select manual'},
    {title:'Automatic accent color',detail:'Colors · Colors & transparency effects',route:'colors',panel:'ww11-colors-panel',target:'#ww11-accent-trigger',icon:'palette',terms:'wallpaper automatic accent auto color'},
    {title:'Manual accent color',detail:'Colors · Colors & transparency effects',route:'colors',panel:'ww11-colors-panel',target:'.ww11-choice-row[aria-label="Windows accent color presets"]',icon:'palette',terms:'custom accent color preset choose'},
    {title:'Glass surface color',detail:'Colors · Colors & transparency effects',route:'colors',panel:'ww11-colors-panel',target:'.ww11-choice-row[aria-label="Mica glass surface color presets"]',icon:'palette',terms:'mica acrylic frost tint glass custom'},
    {title:'Glass opacity',detail:'Colors · Colors & transparency effects',route:'colors',panel:'ww11-colors-panel',target:'#ww11-opacity',icon:'sliders-horizontal-light',terms:'mica transparency transparency percentage opacity'},
    {title:'Advanced tint editing',detail:'Colors · Secondary transparency and tint',route:'colors',panel:'ww11-advanced-tint-panel',icon:'sliders-horizontal-light',terms:'advanced surface material mica'},
    {title:'Secondary transparency difference',detail:'Colors · Advanced tint editing',route:'colors',panel:'ww11-advanced-tint-panel',target:'#ww11-secondary-gap',icon:'sliders-horizontal-light',terms:'sidebar titlebar secondary difference transparency opacity'},
    {title:'Control tint strength',detail:'Colors · Advanced tint editing',route:'colors',panel:'ww11-advanced-tint-panel',target:'#ww11-control-tint',icon:'sliders-horizontal-light',terms:'buttons controls tint mica intensity'},
    {title:'Visual effects',detail:'Colors · Lighting and shadows',route:'colors',panel:'ww11-visual-effects-panel',icon:'sliders-horizontal-light',terms:'graphics wallpaper rendering'},
    {title:'Window drop shadows',detail:'Colors · Visual effects',route:'colors',panel:'ww11-visual-effects-panel',target:'#ww11-shadows',icon:'sliders-horizontal-light',terms:'shadow elevation windows'},
    {title:'HDR lighting',detail:'Colors · Visual effects',route:'colors',panel:'ww11-visual-effects-panel',target:'#ww11-hdr',icon:'sliders-horizontal-light',terms:'hdr highlights bright wallpaper lighting'},
    {title:'HDR intensity',detail:'Colors · Visual effects',route:'colors',panel:'ww11-visual-effects-panel',target:'#ww11-hdr-intensity',icon:'sliders-horizontal-light',terms:'brightness hdr highlight lighting strength'},
    {title:'Highlight bloom',detail:'Colors · Visual effects',route:'colors',panel:'ww11-visual-effects-panel',target:'#ww11-hdr-bloom',icon:'sliders-horizontal-light',terms:'glow hdr lighting bloom'},
    {title:'Restore default colors and effects',detail:'Colors · Reset appearance',route:'colors',target:'#ww11-colors-reset',icon:'palette',terms:'reset restore defaults'},
    {title:'Accounts',detail:'Profile name and picture',route:'accounts',icon:'user',terms:'account user profile personal name avatar'},
    {title:'Account name',detail:'Accounts · Adjust your profile',route:'accounts',target:'#ww11-account-name-input',icon:'user',terms:'rename username edit display name'},
    {title:'Profile picture',detail:'Accounts · Choose an image',route:'accounts',target:'#ww11-account-file-button',icon:'user',terms:'avatar photo image profile browse file'}
  ];
  const searchSuggestions=['Personalization','Colors','Glass opacity','HDR lighting','Account name','Profile picture'];
  let activeSearchIndex=-1;
  let visibleSearchItems=[];
  const normalized=text=>String(text||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const searchIcon=name=>`<svg class="ww-ph-icon ww11-title-search-item-icon" viewBox="${window.WebWindows11Icons.viewBox(name)}" aria-hidden="true" focusable="false"><use href="#ww-ph-${window.WebWindows11Icons.resolve(name)}"></use></svg>`;
  function revealSearchDestination(item){
    search.value='';closeSearchResults();navigate(item.route);
    if(item.panel){
      const panel=document.getElementById(item.panel);
      if(panel?.hidden){const disclosure=section.querySelector(`[aria-controls="${item.panel}"]`);disclosure?.click();}
    }
    let target=item.target?section.querySelector(item.target):null;
    if(!target&&item.panel)target=section.querySelector(`[aria-controls="${item.panel}"]`);
    if(target){
      target.scrollIntoView({block:'nearest',behavior:reducedMotion.matches?'instant':'smooth'});
      if(target.matches('input:not([type="file"]),button,select'))target.focus({preventScroll:true});
      else if(item.target==='#ww-theme-gallery')section.querySelector('.ww-theme-gallery button')?.focus({preventScroll:true});
    }
  }
  function selectSearchResult(index,{focusButton=false}={}){
    const buttons=[...searchResults.querySelectorAll('button[data-settings-result]')];
    if(!buttons.length){activeSearchIndex=-1;search.removeAttribute('aria-activedescendant');return;}
    activeSearchIndex=(index+buttons.length)%buttons.length;
    buttons.forEach((button,i)=>{button.classList.toggle('is-highlighted',i===activeSearchIndex);button.setAttribute('aria-selected',String(i===activeSearchIndex));});
    search.setAttribute('aria-activedescendant',buttons[activeSearchIndex].id);
    buttons[activeSearchIndex].scrollIntoView({block:'nearest'});
    if(focusButton)buttons[activeSearchIndex].focus({preventScroll:true});
  }
  function renderSettingsSearch(){
    const term=normalized(search.value);
    const words=term.split(' ').filter(Boolean);
    const wasClosed=searchResults.hidden;
    alignSettingsSearchResults();
    searchResults.replaceChildren();
    searchResults.hidden=false;search.setAttribute('aria-expanded','true');
    if(wasClosed){
      searchResults.classList.remove('is-opening');
      // Restart the flyout-like reveal each time search opens.
      void searchResults.offsetWidth;
      searchResults.classList.add('is-opening');
    }
    activeSearchIndex=-1;search.removeAttribute('aria-activedescendant');
    if(!term){
      visibleSearchItems=searchSuggestions.map(title=>settingsSearchItems.find(item=>item.title===title)).filter(Boolean);
    }else{
      visibleSearchItems=settingsSearchItems.map((item,order)=>{
        const title=normalized(item.title),details=normalized(item.detail),terms=normalized(item.terms);
        const combined=`${title} ${details} ${terms}`;
        if(!words.every(word=>combined.includes(word)))return null;
        const score=(title===term?140:0)+(title.startsWith(term)?70:0)+(title.includes(term)?35:0)+words.filter(word=>title.includes(word)).length*15+(details.includes(term)?8:0)-order*.01;
        return {...item,score};
      }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,12);
    }
    const headingNode=document.createElement('div');headingNode.className='ww11-title-search-heading';
    headingNode.textContent=term?`${visibleSearchItems.length} matching ${visibleSearchItems.length===1?'setting':'settings'}`:'Suggested settings';
    searchResults.append(headingNode);
    if(!visibleSearchItems.length){
      const empty=document.createElement('div');empty.className='ww11-title-search-empty';
      const title=document.createElement('strong');title.textContent='No matching settings';
      const note=document.createElement('span');note.textContent='Try “glass”, “wallpaper”, “HDR”, or “account”.';
      empty.append(title,note);searchResults.append(empty);
      return;
    }
    const fragment=document.createDocumentFragment();
    visibleSearchItems.forEach((item,index)=>{
      const button=document.createElement('button');button.type='button';button.id=`ww11-settings-search-option-${index}`;
      button.dataset.settingsResult=String(index);button.setAttribute('role','option');button.setAttribute('aria-selected','false');
      button.innerHTML=`${searchIcon(item.icon)}<span class="ww11-title-search-item-text"><strong></strong><small></small></span><svg class="ww11-title-search-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      button.querySelector('strong').textContent=item.title;
      button.querySelector('small').textContent=item.detail;
      button.addEventListener('click',()=>revealSearchDestination(item));
      button.addEventListener('mouseenter',()=>selectSearchResult(index));
      fragment.append(button);
    });
    searchResults.append(fragment);
  }
  searchResults.addEventListener('animationend',event=>{
    if(event.target===searchResults)searchResults.classList.remove('is-opening');
  });
  search.addEventListener('focus',renderSettingsSearch);
  search.addEventListener('click',()=>{if(searchResults.hidden)renderSettingsSearch();});
  search.addEventListener('input',renderSettingsSearch);
  search.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      if(!searchResults.hidden){event.preventDefault();event.stopPropagation();closeSearchResults();}
      else search.blur();
      return;
    }
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();if(searchResults.hidden)renderSettingsSearch();
      const delta=event.key==='ArrowDown'?1:-1;
      selectSearchResult(activeSearchIndex<0?(delta===1?0:visibleSearchItems.length-1):activeSearchIndex+delta);
    }
    if(event.key==='Enter'){
      const selected=searchResults.querySelectorAll('button[data-settings-result]')[activeSearchIndex<0?0:activeSearchIndex];
      if(selected&&!searchResults.hidden){event.preventDefault();selected.click();}
    }
  });
  searchResults.addEventListener('keydown',event=>{
    if(event.key==='Escape'){closeSearchResults();search.focus();event.stopPropagation();}
  });
  document.addEventListener('pointerdown',event=>{
    if(!event.target.closest('.ww-settings-search-wrap') && !searchResults.contains(event.target))closeSearchResults();
  });
  back.addEventListener('click',()=>{
    const collapsed=win.classList.toggle('ww-settings-rail-collapsed');
    back.setAttribute('aria-expanded',String(!collapsed));
    refreshSidebarIndicator(false);
  });
  document.getElementById('ww-settings-close').addEventListener('click',close);
  document.getElementById('ww-settings-minimize').addEventListener('click',minimize);
  // Standard window geometry: double-click title bar or use the maximize button.
  // A maximized window shows Restore (two overlapping squares); a movable window
  // shows Maximize (one square). The old 11H11 implementation swapped these.
  const titlebar=document.getElementById('ww-settings-titlebar');
  const maxButton=document.getElementById('ww-settings-maximize');
  // Share exactly the same geometry and control material as Get Started.
  const maximizedGlyph='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.3" y="5.3" width="13.4" height="13.4" rx=".7"/></svg>';
  const restoreGlyph='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7V5.4h9.6v10h-2.2M5.4 9h11.2v10H5.4Z"/></svg>';
  let maximized=false;
  let lastNormalRect=null;
  let activePointer=null;
  const clamp=(value,min,max)=>Math.max(min,Math.min(Math.max(min,max),value));
  const bounds=()=>({width:window.innerWidth,height:window.innerHeight});
  const minimum=()=>({width:Math.min(510,window.innerWidth-12),height:Math.min(355,window.innerHeight-12)});
  function setRect(rect){
    const b=bounds(),mins=minimum();
    const width=clamp(rect.width,mins.width,b.width);
    const height=clamp(rect.height,mins.height,b.height);
    win.style.transform='none';
    win.style.left=clamp(rect.left,0,b.width-width)+'px';
    win.style.top=clamp(rect.top,0,b.height-height)+'px';
    win.style.width=width+'px';win.style.height=height+'px';
    win.style.right='auto';win.style.bottom='auto';
  }
  function getRect(){
    const rect=win.getBoundingClientRect();
    return {left:rect.left,top:rect.top,width:rect.width,height:rect.height};
  }
  function updateMaximizeControl(){
    const label=maximized?'Restore':'Maximize';
    maxButton.title=label;maxButton.setAttribute('aria-label',label+' Settings');
    maxButton.innerHTML=maximized?restoreGlyph:maximizedGlyph;
  }
  function setMaximized(next){
    if(maximized===next)return;
    if(next){
      lastNormalRect=getRect();
      win.style.left='';win.style.top='';win.style.right='';win.style.bottom='';
      win.style.width='';win.style.height='';win.style.transform='';
      maximized=true;win.classList.add('is-maximized');
    }else{
      maximized=false;win.classList.remove('is-maximized');
      const b=bounds(),mins=minimum();
      setRect(lastNormalRect||{width:Math.min(1010,b.width-24),height:Math.min(680,b.height-24),left:12,top:12});
    }
    updateMaximizeControl();refreshSidebarIndicator(false);
  }
  maxButton.addEventListener('click',()=>setMaximized(!maximized));
  titlebar.addEventListener('dblclick',event=>{
    if(event.target.closest('button'))return;
    setMaximized(!maximized);
  });
  function beginPointer(event,kind,edge=''){
    if(event.button!==0||activePointer)return;
    event.preventDefault();
    const target=event.currentTarget;
    if(kind==='move'&&maximized){
      const b=bounds();
      const old=getRect();
      setMaximized(false);
      const normal=getRect();
      const ratio=clamp(event.clientX/Math.max(1,old.width),.15,.85);
      setRect({...normal,left:event.clientX-normal.width*ratio,top:clamp(event.clientY-18,0,b.height-normal.height)});
    }
    if(kind==='resize'&&maximized)return;
    activePointer={kind,edge,id:event.pointerId,target,startX:event.clientX,startY:event.clientY,rect:getRect()};
    target.setPointerCapture(event.pointerId);
    win.classList.add('ww11-window-interacting');
  }
  function movePointer(event){
    const p=activePointer;
    if(!p||event.pointerId!==p.id)return;
    const deltaX=event.clientX-p.startX,deltaY=event.clientY-p.startY;
    const b=bounds(),mins=minimum();
    if(p.kind==='move'){
      setRect({...p.rect,left:clamp(p.rect.left+deltaX,0,b.width-p.rect.width),top:clamp(p.rect.top+deltaY,0,b.height-p.rect.height)});
    }else{
      let l=p.rect.left,t=p.rect.top,r=l+p.rect.width,bt=t+p.rect.height;
      if(p.edge.includes('w'))l=clamp(l+deltaX,0,r-mins.width);
      if(p.edge.includes('e'))r=clamp(r+deltaX,l+mins.width,b.width);
      if(p.edge.includes('n'))t=clamp(t+deltaY,0,bt-mins.height);
      if(p.edge.includes('s'))bt=clamp(bt+deltaY,t+mins.height,b.height);
      setRect({left:l,top:t,width:r-l,height:bt-t});
    }
    refreshSidebarIndicator(false);
  }
  function endPointer(event){
    if(!activePointer||event.pointerId!==activePointer.id)return;
    const p=activePointer;activePointer=null;
    win.classList.remove('ww11-window-interacting');
    if(p.target.hasPointerCapture?.(event.pointerId))p.target.releasePointerCapture(event.pointerId);
    if(!maximized)lastNormalRect=getRect();
  }
  titlebar.addEventListener('pointerdown',event=>{
    if(event.target.closest('button, input, a, label, .wua-titlebar-navigation, .wua-titlebar-search'))return;
    beginPointer(event,'move');
  });
  [titlebar,...win.querySelectorAll('.ww-settings-resize-handle')].forEach(handle=>{
    handle.addEventListener('pointermove',movePointer);
    handle.addEventListener('pointerup',endPointer);
    handle.addEventListener('pointercancel',endPointer);
  });
  win.querySelectorAll('.ww-settings-resize-handle').forEach(handle=>{
    handle.addEventListener('pointerdown',event=>beginPointer(event,'resize',handle.dataset.edge));
  });
  window.addEventListener('resize',()=>{
    if(!maximized&&opened)setRect(getRect());
  },{passive:true});
  updateMaximizeControl();
  document.addEventListener('keydown',event=>{
    if(opened && event.key==='Escape'){
      if(!searchResults.hidden){closeSearchResults();search.value='';}
      else close();event.stopPropagation();
    }
  });
  document.addEventListener('pointerdown',event=>{
    if(!opened)return;
    if(win.contains(event.target)){focused=true;window.dispatchEvent(new Event('webwindows:settings-focused'));}
    else if(!event.target.closest('[data-ww11-open-settings]'))focused=false;
    refreshTaskbarAppState();
  });
  document.querySelectorAll('[data-ww11-open-settings]').forEach(button=>{
    button.removeAttribute('disabled');button.removeAttribute('aria-disabled');
    button.addEventListener('click',open);
  });
  window.WebWindows11FocusAssist={getMode:()=> 'off',shouldNotify:()=>true};
  window.WebWindows11Settings={
    open,close,minimize,isOpen:()=>opened,isRunning:()=>opened||minimized,navigate,
    getGlassAppearance:()=>({...glassState}),
    setGlassAppearance:({color,opacity}={})=>{
      if(color!==undefined){
        if(Object.prototype.hasOwnProperty.call(GLASS_PRESETS,color))glassState.color=color;
        else if(/^#[a-f\d]{6}$/i.test(color)){glassState.customColor=color;glassState.color='custom';}
      }
      if(opacity!==undefined && Number.isFinite(Number(opacity)))glassState.opacity=Math.max(0,Math.min(100,Math.round(Number(opacity))));
      applyGlassState();
    },
    searchIndex:()=>settingsSearchItems.map(item=>({...item})),
    openSearchResult:item=>{
      if(!item||!settingsSearchItems.some(entry=>entry.title===item.title&&entry.route===item.route))return false;
      open(item.route);
      revealSearchDestination(item);
      return true;
    }
  };
  window.WebWindows11Wallpaper={getCurrent:()=>currentWallpaper,getThemeId:()=>activeId,select:id=>{
    const theme=getActiveRecord(id);if(theme)syncWallpaper(theme.url,theme.id);
  }};
  restoreCustom();
  window.addEventListener('pagehide',()=>{
    for(const url of objectURLs.values())URL.revokeObjectURL(url);
    objectURLs.clear();
  },{once:true});
})();


/* 11H11 Get Started: real native window and guided sequence, shared with Settings.
   Its laptop is a colored inline SVG referencing Assets/Get-started/GS.png. */
(() => {
  'use strict';
  const $ = id=>document.getElementById(id);
  const overlay=$('ww-gs-overlay'), win=$('ww-gs-window'), titlebar=$('ww-gs-titlebar');
  if(!overlay||!win||!titlebar)return;
  const heading=$('ww-gs-heading'), description=$('ww-gs-description'), label=$('ww-gs-step-label');
  const action=$('ww-gs-main-action'), copy=$('ww-gs-copy'), prev=$('ww-gs-previous'),next=$('ww-gs-next');
  const highlights=$('ww-gs-highlights'), skip=$('ww-gs-skip');
  const progress=$('ww-gs-progress'), track=document.querySelector('.ww-gs-progress-track'),fill=$('ww-gs-progress-fill');
  const reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
  let openState=false,minimized=false,focused=false,maximized=false,step=0,lastRect=null,activePointer=null;
  // Each action either opens a working feature or continues the guide. Other app
  // shortcuts have intentionally not been presented as operational setup steps.
  // 11H11 beta tour: describe features implemented in this build. Keep actions
  // linked to real apps and settings routes instead of showing nonfunctional UI.
  const pages=[
    {heading:()=>`Welcome to 11H11, ${displayName()}`,description:'Explore what is new in WebWindows 11H11, from Discover and desktop widgets to the redesigned glass controls.',button:'Get started'},
    {heading:'Meet the Start menu',description:'Start keeps your apps and current news together in one place.',tips:['Open Start from the taskbar or with Ctrl + Esc.','Scroll through the news section without expanding the menu.'],button:'Explore Start',preview:'start'},
    {heading:'Discover the headlines',description:'Discover brings live stories into a compact, two-column news view.',tips:['Select a news tile to open the article from its source.','The three-dot menu opens Bing Search and Settings.'],button:'Open Discover',preview:'discover-news'},
    {heading:'Widgets, on your desktop',description:'Switch Discover to Widgets for live time and weather, or move either widget to the desktop.',tips:['Use the right chevron in Discover to open Widgets.','Drag a widget away to detach it; drag it back to its slot to dock it.'],button:'Explore Widgets',preview:'discover-widgets'},
    {heading:'Time and weather, live',description:'The Time widget follows your browser time zone. Weather shows current conditions and a three-day forecast.',tips:['Compare other time zones beside the local clock.','Weather uses Open-Meteo; forecast percentages show precipitation chances.'],button:'View live widgets',preview:'discover-widgets'},
    {heading:'Make Mica your own',description:'Choose the glass color and opacity in Settings. Main and secondary Mica surfaces keep their frosted finish.',tips:['Apply a preset or custom glass color.','Adjust transparency without changing the frost strength.'],button:'Customize glass',settings:'colors'},
    {heading:'Personalize your desktop',description:'Choose your wallpaper and set up the desktop the way you want.',tips:['Use Settings → Personalization for wallpapers.','Your selections are saved for your next visit.'],button:'Open Personalization',settings:'personalization'},
    {heading:'Make the taskbar fit',description:'Change taskbar size, alignment, position, and layout without losing the shortcut controls.',tips:['Choose an attached, floating, or separated taskbar.','The icons and Search area adapt when taskbar size changes.'],button:'Taskbar settings',settings:'taskbar'},
    {heading:'Search without digging',description:'Find apps and Settings directly from the taskbar Search control.',tips:['Use Ctrl + K to jump into Search.','Search results open the matching app or Settings page.'],button:'Try Search',preview:'search'},
    {heading:'Profile and visual effects',description:'Finish by setting your display name and profile picture, or revisit window and lighting effects later.',tips:['Settings → Accounts lets you update your profile.','Visual effects are available in Settings → Colors.'],button:'Edit profile',settings:'accounts'},
    {heading:'Ready for 11H11',description:'Your desktop is ready. Discover, widgets, personalization, and taskbar settings are available whenever you need them.',tips:['Open Get Started from Start, Search, or the taskbar to revisit the tour.','Changes you make in Settings remain available after you close the guide.'],button:'Finish',finish:true}
  ];
  const displayName=()=>{
    try{const value=JSON.parse(localStorage.getItem('webwindows.11h11.account')||'null')?.name;
      const label=(typeof value==='string'&&value.trim())?value.trim():(document.getElementById('start-account-name')?.textContent?.trim()||'Russel John');
      return label.split(/\s+/)[0];
    }catch{return document.getElementById('start-account-name')?.textContent?.trim().split(/\s+/)[0]||'Russel';}
  };
  function foreground(){
    focused=true;overlay.classList.remove('is-behind');
    window.dispatchEvent(new Event('webwindows:getstarted-focused'));
    updateIndicator();
  }
  function updateIndicator(){
    const popup=!!(window.WebWindows11Start?.isOpen?.()||window.WebWindows11Search?.isOpen?.());
    window.WebWindows11TaskbarApps?.setState('get-started',{
      running:openState||minimized,minimized,focused:openState&&focused&&!popup,instances:1
    });
    document.querySelectorAll('[data-ww11-open-get-started]').forEach(b=>b.setAttribute('aria-pressed',String(openState)));
  }
  function showStep(n){
    step=Math.max(0,Math.min(pages.length-1,n));
    const p=pages[step],last=pages.length-1;
    heading.textContent=typeof p.heading==='function'?p.heading():p.heading;
    description.textContent=p.description;
    action.textContent=p.button;
    highlights.replaceChildren();
    for(const tip of p.tips||[]){const item=document.createElement('li');item.textContent=tip;highlights.append(item)}
    highlights.hidden=!highlights.childElementCount;
    label.hidden=step===0;
    label.textContent=step===last?'Tour complete':`Step ${step} of ${last-1}`;
    skip.hidden=step===last;
    prev.disabled=step===0;next.disabled=step===last;
    progress.textContent=step===0?'Welcome':step===last?'Complete':`${step} / ${last-1}`;
    track.setAttribute('aria-valuemax',String(last));
    track.setAttribute('aria-valuenow',String(step));
    track.setAttribute('aria-valuetext',step===last?'Complete':`${step} of ${last-1}`);
    fill.style.width=`${Math.round(step/last*100)}%`;
    if(!reduced.matches){
      copy.classList.remove('ww11-native-page-enter');
      void copy.offsetWidth;
      copy.classList.add('ww11-native-page-enter');
    }
  }
  function launchSettings(route,flyout){
    // Keep the guide resumable while users work in the real Settings window.
    overlay.classList.add('is-behind');focused=false;updateIndicator();
    window.WebWindows11Settings?.open(route);
    if(flyout){
      const trigger=$(flyout);
      if(trigger && trigger.getAttribute('aria-expanded')!=='true')trigger.click();
    }
  }
  function launchPreview(which){
    // Minimize the guide so Start/Search is fully accessible rather than hidden
    // behind the Get Started window. The taskbar indicator remains available.
    minimize();
    if(which==='start')window.WebWindows11Start?.show?.();
    else if(which==='search')window.WebWindows11Search?.open?.('');
    else if(which==='discover-news'||which==='discover-widgets'){
      window.WebWindows11Discover?.open?.();
      if(which==='discover-widgets')document.getElementById('ww11-discover-next')?.click();
    }
  }
  function activate(){
    const p=pages[step];
    if(p.finish){close();return;}
    const destination=step+1;
    if(p.settings){launchSettings(p.settings,p.flyout);showStep(destination);return;}
    if(p.preview){showStep(destination);launchPreview(p.preview);return;}
    showStep(destination);
  }
  function open(){
    window.WebWindows11Start?.hide?.();window.WebWindows11Search?.close?.();
    window.WebWindows11Discover?.close?.();
    overlay.hidden=false;overlay.setAttribute('aria-hidden','false');
    openState=true;minimized=false;foreground();showStep(step);
  }
  function hide(){overlay.hidden=true;overlay.setAttribute('aria-hidden','true');}
  function minimize(){if(!openState)return;openState=false;minimized=true;focused=false;hide();updateIndicator();}
  function close(){if(!openState&&!minimized)return;openState=false;minimized=false;focused=false;hide();step=0;updateIndicator();}
  action.addEventListener('click',activate);
  skip.addEventListener('click',()=>showStep(pages.length-1));
  next.addEventListener('click',()=>showStep(step+1));
  prev.addEventListener('click',()=>showStep(step-1));
  $('ww-gs-close').addEventListener('click',close);
  $('ww-gs-minimize').addEventListener('click',minimize);
  const maxButton=$('ww-gs-maximize');
  const maxSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.3" y="5.3" width="13.4" height="13.4" rx=".7"/></svg>';
  const restoreSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7V5.4h9.6v10h-2.2M5.4 9h11.2v10H5.4Z"/></svg>';
  // Match the Settings window model: eight directional resize handles,
  // pointer capture, maximized drag-to-restore, minimum size and viewport clamping.
  const clamp=(v,min,max)=>Math.max(min,Math.min(Math.max(min,max),v));
  const bounds=()=>({width:window.innerWidth,height:window.innerHeight});
  const minimum=()=>({width:Math.min(510,window.innerWidth-12),height:Math.min(355,window.innerHeight-12)});
  function getRect(){const r=win.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height};}
  function setRect(rect){
    const b=bounds(),mins=minimum();
    const width=clamp(rect.width,mins.width,b.width);
    const height=clamp(rect.height,mins.height,b.height);
    win.style.transform='none';
    win.style.left=clamp(rect.left,0,b.width-width)+'px';
    win.style.top=clamp(rect.top,0,b.height-height)+'px';
    win.style.width=width+'px';win.style.height=height+'px';
    win.style.right='auto';win.style.bottom='auto';
  }
  function updateMaxButton(){
    const name=maximized?'Restore':'Maximize';
    maxButton.innerHTML=maximized?restoreSvg:maxSvg;
    maxButton.title=name;maxButton.setAttribute('aria-label',name+' Get Started');
  }
  function toggleMax(force){
    const next=typeof force==='boolean'?force:!maximized;
    if(next===maximized)return;
    if(next){
      lastRect=getRect();
      win.style.left='';win.style.top='';win.style.width='';win.style.height='';
      win.style.right='';win.style.bottom='';win.style.transform='';
      maximized=true;win.classList.add('is-maximized');
    }else{
      maximized=false;win.classList.remove('is-maximized');
      const b=bounds();
      setRect(lastRect||{left:12,top:12,width:Math.min(1010,b.width-24),height:Math.min(680,b.height-24)});
    }
    updateMaxButton();
  }
  maxButton.addEventListener('click',()=>toggleMax());
  titlebar.addEventListener('dblclick',e=>{
    if(e.target.closest('button'))return;
    toggleMax();
  });
  function beginPointer(event,kind,edge=''){
    if(event.button!==0||activePointer)return;
    event.preventDefault();
    foreground();
    const target=event.currentTarget;
    if(kind==='move'&&maximized){
      const old=getRect();
      toggleMax(false);
      const normal=getRect();
      const ratio=clamp(event.clientX/Math.max(1,old.width),.15,.85);
      setRect({...normal,left:event.clientX-normal.width*ratio,top:clamp(event.clientY-18,0,innerHeight-normal.height)});
    }
    if(kind==='resize'&&maximized)return;
    activePointer={kind,edge,id:event.pointerId,target,startX:event.clientX,startY:event.clientY,rect:getRect()};
    target.setPointerCapture(event.pointerId);
    win.classList.add('ww11-window-interacting');
  }
  function movePointer(event){
    const p=activePointer;
    if(!p||event.pointerId!==p.id)return;
    const dx=event.clientX-p.startX,dy=event.clientY-p.startY;
    const b=bounds(),mins=minimum();
    if(p.kind==='move'){
      setRect({...p.rect,left:clamp(p.rect.left+dx,0,b.width-p.rect.width),top:clamp(p.rect.top+dy,0,b.height-p.rect.height)});
    }else{
      let l=p.rect.left,t=p.rect.top,r=l+p.rect.width,bt=t+p.rect.height;
      if(p.edge.includes('w'))l=clamp(l+dx,0,r-mins.width);
      if(p.edge.includes('e'))r=clamp(r+dx,l+mins.width,b.width);
      if(p.edge.includes('n'))t=clamp(t+dy,0,bt-mins.height);
      if(p.edge.includes('s'))bt=clamp(bt+dy,t+mins.height,b.height);
      setRect({left:l,top:t,width:r-l,height:bt-t});
    }
  }
  function endPointer(event){
    if(!activePointer||event.pointerId!==activePointer.id)return;
    const p=activePointer;activePointer=null;
    win.classList.remove('ww11-window-interacting');
    if(p.target.hasPointerCapture?.(event.pointerId))p.target.releasePointerCapture(event.pointerId);
    if(!maximized)lastRect=getRect();
  }
  titlebar.addEventListener('pointerdown',event=>{
    if(event.target.closest('button, input, a, label'))return;
    beginPointer(event,'move');
  });
  [titlebar,...win.querySelectorAll('.ww-gs-resize-handle')].forEach(handle=>{
    handle.addEventListener('pointermove',movePointer);
    handle.addEventListener('pointerup',endPointer);
    handle.addEventListener('pointercancel',endPointer);
    handle.addEventListener('lostpointercapture',event=>{
      if(activePointer?.id===event.pointerId){activePointer=null;win.classList.remove('ww11-window-interacting');}
    });
  });
  win.querySelectorAll('.ww-gs-resize-handle').forEach(handle=>{
    handle.addEventListener('pointerdown',event=>beginPointer(event,'resize',handle.dataset.edge));
  });
  window.addEventListener('resize',()=>{
    if(!maximized&&openState)setRect(getRect());
  },{passive:true});
  updateMaxButton();
  document.querySelector('.start-app-row[data-app-name="get started"]')?.addEventListener('click',()=>open());
  document.querySelector('.start-app-row[data-app-name="get started"]')?.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}
  });
  document.querySelectorAll('[data-ww11-open-get-started]').forEach(b=>b.addEventListener('click',open));
  window.addEventListener('webwindows:taskbar-context-changed',updateIndicator);
  window.addEventListener('webwindows:settings-focused',()=>{
    if(!openState)return;focused=false;overlay.classList.add('is-behind');updateIndicator();
  });
  window.addEventListener('webwindows:account-changed',()=>{if(step===0)heading.textContent=`Welcome back, ${displayName()}`;});
  win.addEventListener('pointerdown',foreground);
  document.addEventListener('pointerdown',e=>{
    if(openState && !win.contains(e.target) && !e.target.closest('[data-ww11-open-get-started]')){focused=false;updateIndicator();}
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&openState&&!window.WebWindows11Start?.isOpen?.()&&!window.WebWindows11Search?.isOpen?.()){
      if(!window.WebWindows11Settings?.isOpen?.()){close();e.stopPropagation();}
    }
  });
  window.WebWindows11GetStarted={open,close,minimize,showStep,isOpen:()=>openState};
  showStep(0);updateIndicator();
})();

/* ===== Embedded HDR Lighting Renderer (previously hdr-lighting.js) ===== */
/* WebWindows 11H11 — wallpaper-aware HDR-style tone enhancement.
 * Canvas is intentionally constrained to wallpaper pixels: applications,
 * Phosphor SVG icons and original-color Icons8 artwork are not recolored.
 * This is a perceptual SDR / wide-gamut enhancement, NOT an OS HDR switch or
 * a guarantee of HDR10 output. It uses Display P3 where the browser supports it.
 */
(() => {
  'use strict';
  const root = document.documentElement;
  const img = document.getElementById('wallpaper');
  const grade = document.getElementById('ww-hdr-tonemap');
  const near = document.getElementById('ww-hdr-bloom-near');
  const far = document.getElementById('ww-hdr-bloom-far');
  if (!img || !grade || !near || !far) return;

  const clamp = (x, lo=0, hi=1) => Math.min(hi, Math.max(lo, x));
  const smooth = (a, b, x) => { const t=clamp((x-a)/(b-a)); return t*t*(3-2*t); };
  const readSaved = () => {
    try {
      const data = JSON.parse(localStorage.getItem('webwindows.11h11.colors.material') || '{}');
      return {
        enabled:data.hdr === true,
        intensity:clamp(Number.isFinite(+data.hdrIntensity)?+data.hdrIntensity:68,0,100),
        bloom:clamp(Number.isFinite(+data.hdrBloom)?+data.hdrBloom:38,0,100)
      };
    } catch { return {enabled:false,intensity:68,bloom:38}; }
  };
  let settings = readSaved();
  let pending = 0;
  let rendered = '';
  const setReady = ready => {root.dataset.wwHdrReady = ready ? 'true' : 'false';};
  setReady(false);

  // One-dimensional sliding-window blur. A small local luminance map lets
  // highlights gain microcontrast without uniformly crushing shadows.
  function blurLuma(source, width, height, radius) {
    const tmp=new Float32Array(source.length), output=new Float32Array(source.length);
    for(let y=0;y<height;y++) {
      const row=y*width;
      let sum=0;
      for(let x=0;x<=Math.min(radius,width-1);x++)sum+=source[row+x];
      for(let x=0;x<width;x++) {
        tmp[row+x]=sum/(Math.min(width-1,x+radius)-Math.max(0,x-radius)+1);
        const remove=x-radius, add=x+radius+1;
        if(remove>=0)sum-=source[row+remove];
        if(add<width)sum+=source[row+add];
      }
    }
    for(let x=0;x<width;x++) {
      let sum=0;
      for(let y=0;y<=Math.min(radius,height-1);y++)sum+=tmp[y*width+x];
      for(let y=0;y<height;y++) {
        output[y*width+x]=sum/(Math.min(height-1,y+radius)-Math.max(0,y-radius)+1);
        const remove=y-radius, add=y+radius+1;
        if(remove>=0)sum-=tmp[remove*width+x];
        if(add<height)sum+=tmp[add*width+x];
      }
    }
    return output;
  }

  function render() {
    pending=0;
    if (!settings.enabled) { setReady(false); return; }
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
      setReady(false); return;
    }
    const bounds=img.getBoundingClientRect();
    const cssW=Math.round(bounds.width), cssH=Math.round(bounds.height);
    if (cssW<2 || cssH<2) return;
    // Process up to ~1.9 million pixels; original wallpaper remains underneath
    // to preserve native-resolution fine detail.
    const scale=Math.min(1, Math.sqrt(1900000/(cssW*cssH)));
    const width=Math.max(1,Math.round(cssW*scale));
    const height=Math.max(1,Math.round(cssH*scale));
    const key=`${img.currentSrc}|${width}x${height}|${settings.intensity}`;
    if (key===rendered && root.dataset.wwHdrReady==='true') return;

    setReady(false);
    const wide=!!window.matchMedia?.('(color-gamut: p3)').matches;
    const colorSpace=wide?'display-p3':'srgb';
    let context;
    try { context=grade.getContext('2d',{willReadFrequently:true,colorSpace,alpha:false}); }
    catch { context=grade.getContext('2d',{willReadFrequently:true,alpha:false}); }
    if (!context) return;
    try {
      for(const canvas of [grade,near,far]) {canvas.width=width;canvas.height=height;}
      context=grade.getContext('2d',{willReadFrequently:true,alpha:false});
      // Image rendering uses the same geometry as CSS object-fit: cover.
      const sourceW=img.naturalWidth,sourceH=img.naturalHeight;
      const crop=Math.max(width/sourceW,height/sourceH);
      const renderW=sourceW*crop,renderH=sourceH*crop;
      context.clearRect(0,0,width,height);
      context.drawImage(img,(width-renderW)/2,(height-renderH)/2,renderW,renderH);
      const image=context.getImageData(0,0,width,height);
      const pixels=image.data;
      const mapScale=Math.max(4,Math.round(Math.min(width,height)/125));
      const smallW=Math.max(1,Math.ceil(width/mapScale));
      const smallH=Math.max(1,Math.ceil(height/mapScale));
      const smallCanvas=document.createElement('canvas');
      smallCanvas.width=smallW; smallCanvas.height=smallH;
      const smallCtx=smallCanvas.getContext('2d',{willReadFrequently:true});
      smallCtx.drawImage(grade,0,0,smallW,smallH);
      const smallPixels=smallCtx.getImageData(0,0,smallW,smallH).data;
      const local=new Float32Array(smallW*smallH);
      for(let p=0,k=0;p<smallPixels.length;p+=4,k++)
        local[k]=(.2126*smallPixels[p]+.7152*smallPixels[p+1]+.0722*smallPixels[p+2])/255;
      const smoothLocal=blurLuma(local,smallW,smallH,5);
      const glowCanvas=document.createElement('canvas');
      glowCanvas.width=width;glowCanvas.height=height;
      const glowCtx=glowCanvas.getContext('2d',{willReadFrequently:true});
      const glowImage=glowCtx.createImageData(width,height);
      const glow=glowImage.data;
      const strength=settings.intensity/100;

      for(let y=0;y<height;y++) {
        const row=y*width*4;
        const smallY=Math.min(smallH-1,Math.floor(y*smallH/height));
        for(let x=0;x<width;x++) {
          const index=row+x*4;
          const r=pixels[index],g=pixels[index+1],b=pixels[index+2];
          const lum=(.2126*r+.7152*g+.0722*b)/255;
          const neighborhood=smoothLocal[smallY*smallW+Math.min(smallW-1,Math.floor(x*smallW/width))];
          // Moderate local contrast and roll off added exposure as channels
          // approach 255. This prevents clipped white patches/color fringing.
          const detail=clamp((lum-neighborhood)*.145*strength,-.028,.028);
          const highlight=.16*strength*smooth(.49,.89,lum)*Math.pow(1-lum,.57);
          const shadowLift=.012*strength*Math.pow(1-lum,3);
          const rawDelta=(highlight+shadowLift+detail)*255;
          const brightest=Math.max(r,g,b), darkest=Math.min(r,g,b);
          const delta=rawDelta>=0
            ? Math.min(rawDelta,(255-brightest)*.84)
            : Math.max(rawDelta,-darkest*.60);
          // Constrain vibrance near peak brightness; don't clip saturated hues.
          const vibrance=1+strength*(.027+.027*(1-Math.abs(lum*2-1)))*(1-smooth(.82,1,lum));
          const baseline=lum*255;
          pixels[index]=clamp(baseline+(r-baseline)*vibrance+delta,0,255);
          pixels[index+1]=clamp(baseline+(g-baseline)*vibrance+delta,0,255);
          pixels[index+2]=clamp(baseline+(b-baseline)*vibrance+delta,0,255);
          // Threshold-based glow follows bright pixels, not the whole image.
          // A contrast term reduces broad halos on light but flat surfaces.
          const relativeHighlight=smooth(.025,.19,lum-neighborhood);
          const bloomMask=Math.pow(smooth(.73,.955,lum),1.4)
            *smooth(.76,.99,brightest/255)*(.55+.45*relativeHighlight);
          glow[index]=Math.min(255,Math.round(r*.80+55));
          glow[index+1]=Math.min(255,Math.round(g*.80+55));
          glow[index+2]=Math.min(255,Math.round(b*.80+55));
          glow[index+3]=Math.round(205*bloomMask);
        }
      }
      context.putImageData(image,0,0);
      glowCtx.putImageData(glowImage,0,0);
      near.getContext('2d').drawImage(glowCanvas,0,0);
      far.getContext('2d').drawImage(glowCanvas,0,0);
      rendered=key;
      setReady(true);
    } catch(error) {
      // E.g., a tainted cross-origin wallpaper canvas. Keep the wallpaper visible.
      rendered='';setReady(false);
      console.info('Wallpaper HDR: using CSS fallback.',error?.message||error);
    }
  }
  function schedule(force=false) {
    if(force) rendered='';
    if(pending) clearTimeout(pending);
    if (!settings.enabled) {setReady(false);return;}
    pending=setTimeout(render,force?80:120);
  }
  img.addEventListener('load',()=>schedule(true));
  img.addEventListener('error',()=>{rendered='';setReady(false);});
  document.addEventListener('webwindows:wallpaper-changed',()=>{rendered='';setReady(false);schedule(true);});
  window.addEventListener('resize',()=>schedule(true),{passive:true});
  window.addEventListener('webwindows:hdr-changed',event=>{
    const next=event.detail||{};
    const intensity=clamp(Number(next.intensity)||0,0,100);
    const intensityChanged=intensity!==settings.intensity;
    const wasEnabled=settings.enabled;
    settings={enabled:!!next.enabled,intensity,bloom:clamp(Number(next.bloom)||0,0,100)};
    // Bloom updates via CSS variables immediately; no pixel recomputation needed.
    if(!settings.enabled) {if(pending)clearTimeout(pending);pending=0;setReady(false);return;}
    if(!wasEnabled||intensityChanged) schedule(intensityChanged);
    else if(root.dataset.wwHdrReady!=='true') schedule();
  });
  if(settings.enabled) schedule(true);
  window.WebWindows11HDR={isEnabled:()=>settings.enabled,refresh:()=>schedule(true),getSettings:()=>({...settings})};
})();

/* ===== WinUI Advanced: integrated behavior (11H11) ===== */
/* WebWindows 11H11 | WinUI Advanced controller.
   Progressive enhancement only; never supplies new OS features. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const settingsOverlay = $('settings-overlay');
  const settingsWindow = $('ww-settings-window');
  const getStartedOverlay = $('ww-gs-overlay');
  const getStartedWindow = $('ww-gs-window');
  const start = $('start-menu');
  const search = $('search-panel');
  const active = el => !!el && !el.hidden && el.getAttribute('aria-hidden') !== 'true';

  /* Link existing flyout motion to the launcher that actually opened it. */
  function alignFlyout(panel, launcher) {
    if (!panel || !launcher) return;
    const anchor=launcher.getBoundingClientRect();
    const bounds=panel.getBoundingClientRect();
    if (!bounds.width) return;
    const x=Math.max(5,Math.min(95,((anchor.left+anchor.width/2-bounds.left)/bounds.width)*100));
    panel.style.setProperty('--wua-launch-x',`${x.toFixed(2)}%`);
    const y=Math.max(5,Math.min(95,((anchor.top+anchor.height/2-bounds.top)/Math.max(1,bounds.height))*100));
    panel.style.setProperty('--wua-launch-y',`${y.toFixed(2)}%`);
  }
  // One source of truth for the taskbar's ACTUAL screen footprint.  Measuring
  // .taskbar (not #taskbar-dock) is essential in Separated mode, where the
  // launcher group is display:contents and has no meaningful bounding box.
  const clamp=(v,min,max)=>Math.max(min,Math.min(v,Math.max(min,max)));
  const workProperties=['--ww11-work-left','--ww11-work-top','--ww11-work-right','--ww11-work-bottom'];
  let lastWorkValues=[];
  function getWorkArea(){
    const dock=document.querySelector('.taskbar');
    const edge=root.dataset.ww11Taskbar||'bottom';
    const bar=dock?.getBoundingClientRect();
    let left=0,top=0,right=0,bottom=0;
    if(bar){
      if(edge==='left')left=Math.max(0,bar.right);
      else if(edge==='right')right=Math.max(0,innerWidth-bar.left);
      else if(edge==='top')top=Math.max(0,bar.bottom);
      else bottom=Math.max(0,innerHeight-bar.top);
    }
    return {edge,bar,left,top,right:innerWidth-right,bottom:innerHeight-bottom,
      reserved:{left,top,right,bottom},width:Math.max(0,innerWidth-left-right),height:Math.max(0,innerHeight-top-bottom)};
  }
  function updateWorkArea(){
    const area=getWorkArea(), values=[area.reserved.left,area.reserved.top,area.reserved.right,area.reserved.bottom];
    values.forEach((value,index)=>{
      // Don't churn computed styles on resize/observer frames when unchanged.
      if(lastWorkValues[index]!==value){root.style.setProperty(workProperties[index],`${Math.round(value)}px`);lastWorkValues[index]=value;}
    });
    return area;
  }
  window.WebWindows11DockGeometry={getWorkArea};
  function positionDockPanel(panel,launcher,area=getWorkArea()){
    if(!panel||!launcher||!area.bar)return;
    const {edge,bar}=area;
    const anchor=launcher.getBoundingClientRect();
    const width=panel.offsetWidth,height=panel.offsetHeight;
    if(width<=0||height<=0)return;
    const gap=9,pad=9;
    const horizontal=edge==='bottom'||edge==='top';
    // Start stays near Start; Search stays near Search. Both move to the
    // opposite side of the actual taskbar, even with Floating/Separated.
    let x=panel===start?anchor.left:anchor.left+anchor.width/2-width*.30;
    let y=edge==='top'?bar.bottom+gap:bar.top-height-gap;
    if(!horizontal){
      x=edge==='left'?bar.right+gap:bar.left-width-gap;
      y=anchor.top+anchor.height/2-height/2;
    }
    x=clamp(x,area.left+pad,area.right-width-pad);
    y=clamp(y,area.top+pad,area.bottom-height-pad);
    panel.style.left=Math.round(x)+'px';
    panel.style.right='auto';
    panel.style.top=Math.round(y)+'px';
    panel.style.bottom='auto';
    panel.style.translate='none';
    panel.style.setProperty('--ww11-flyout-origin-x',horizontal?'30%':edge==='left'?'0%':'100%');
    panel.style.setProperty('--ww11-flyout-origin-y',edge==='top'?'0%':edge==='bottom'?'100%':'50%');
    alignFlyout(panel,launcher);
  }
  function adaptPinnedApps(){
    const dock=$('taskbar-dock');
    const center=dock?.querySelector('.taskbar__center');
    const left=dock?.querySelector('.taskbar__left');
    const right=document.querySelector('.taskbar__right');
    if(!dock||!center||!left||!right)return;
    const vertical=['left','right'].includes(root.dataset.ww11Taskbar);
    if(vertical||root.dataset.ww11TaskbarAlign!=='center'){
      root.dataset.ww11TaskbarCrowded='false';return;
    }
    const leftEdge=left.getBoundingClientRect().right+8;
    const rightEdge=right.getBoundingClientRect().left-8;
    const centeredLeft=(innerWidth-center.scrollWidth)/2;
    const crowded=centeredLeft<leftEdge||centeredLeft+center.scrollWidth>rightEdge;
    root.dataset.ww11TaskbarCrowded=crowded?'true':'false';
  }
  let dockLayoutFrame=0;
  const alignAll=()=>{
    if(dockLayoutFrame)return;
    dockLayoutFrame=requestAnimationFrame(()=>{
      dockLayoutFrame=0;
      adaptPinnedApps();
      const workArea=updateWorkArea();
      positionDockPanel(start,$('start-toggle'),workArea);
      positionDockPanel(search,$('taskbar-search-shell'),workArea);
    });
  };
  alignAll();
  window.addEventListener('resize',alignAll,{passive:true});
  window.addEventListener('webwindows:start-preopening',alignAll);
  window.addEventListener('webwindows:search-opening',alignAll);
  window.addEventListener('webwindows:taskbar-context-changed',()=>{updateWorkArea();alignAll();});
  new ResizeObserver(alignAll).observe(search);
  new ResizeObserver(alignAll).observe(start);

  /* High-frequency pointer input is throttled to one animation frame.
     Highlight follows an existing window's edge and never its content. */
  for (const surface of [settingsWindow,getStartedWindow]) {
    if(!surface)continue;
    let frame=0;
    let x=0,y=0;
    surface.addEventListener('pointermove',event=>{
      if(reduced.matches||event.pointerType==='touch')return;
      x=event.clientX;y=event.clientY;
      if(frame)return;
      frame=requestAnimationFrame(()=>{
        frame=0;
        const rect=surface.getBoundingClientRect();
        if(!rect.width||!rect.height)return;
        const percentX=Math.max(0,Math.min(100,(x-rect.left)/rect.width*100));
        const percentY=Math.max(0,Math.min(100,(y-rect.top)/rect.height*100));
        surface.style.setProperty('--wua-light-x',`${percentX.toFixed(1)}%`);
        surface.style.setProperty('--wua-light-y',`${percentY.toFixed(1)}%`);
      });
    },{passive:true});
    surface.addEventListener('pointerleave',()=>{
      surface.style.removeProperty('--wua-light-x');
      surface.style.removeProperty('--wua-light-y');
    },{passive:true});
  }

  /* Spatial focus: the existing two app windows respond when one is brought
     forward. The Start/Search surfaces keep their own taskbar stacking rules. */
  let lastFocused='settings';
  function syncDepth() {
    const settingsOpen=active(settingsOverlay);
    const guideOpen=active(getStartedOverlay);
    settingsOverlay?.classList.toggle('is-wua-unfocused',settingsOpen&&guideOpen&&lastFocused!=='settings');
    getStartedOverlay?.classList.toggle('is-wua-unfocused',settingsOpen&&guideOpen&&lastFocused!=='get-started');
  }
  settingsWindow?.addEventListener('pointerdown',()=>{lastFocused='settings';syncDepth();});
  getStartedWindow?.addEventListener('pointerdown',()=>{lastFocused='get-started';syncDepth();});
  window.addEventListener('webwindows:settings-focused',()=>{lastFocused='settings';syncDepth();});
  window.addEventListener('webwindows:getstarted-focused',()=>{lastFocused='get-started';syncDepth();});
  for(const overlay of [settingsOverlay,getStartedOverlay]) {
    if(!overlay)continue;
    new MutationObserver(syncDepth).observe(overlay,{attributes:true,attributeFilter:['hidden','aria-hidden']});
  }
  syncDepth();

  // 11H11: app notifications, InfoBars, and teaching tips are removed.
})();


/* Shared WinUI switch microinteraction. Delegation also supports Settings controls
   generated later during navigation; programmatic initial state stays still. */
(() => {
  document.addEventListener('change', event => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement) || !control.matches('.ww11-switch')) return;
    control.classList.remove('is-toggle-on', 'is-toggle-off');
    // Restart cleanly for fast repeated clicks or keyboard toggles.
    void control.offsetWidth;
    control.classList.add(control.checked ? 'is-toggle-on' : 'is-toggle-off');
  }, true);
  document.addEventListener('animationend', event => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement) || event.pseudoElement !== '::before') return;
    if (event.animationName === 'ww11-toggle-on') control.classList.remove('is-toggle-on');
    if (event.animationName === 'ww11-toggle-off') control.classList.remove('is-toggle-off');
  }, true);
})();


/* Windows 11-style wallpaper context menu. Only the three requested entries
   exist; buttons use the existing Settings destinations, never mock system APIs. */
(() => {
  'use strict';
  const desktop=document.querySelector('main.desktop');
  const menu=document.getElementById('ww11-desktop-context-menu');
  if(!desktop||!menu)return;
  const items=Array.from(menu.querySelectorAll('[role="menuitem"]'));
  let lastFocus=null;
  let opened=false;
  const close=(restoreFocus=false)=>{
    if(!opened)return;
    opened=false;menu.hidden=true;menu.classList.remove('is-opening');
    if(restoreFocus&&lastFocus?.isConnected)lastFocus.focus({preventScroll:true});
    lastFocus=null;
  };
  const open=(clientX,clientY,focusFirst=false)=>{
    close();lastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    window.WebWindows11Start?.hide?.();
    window.WebWindows11Search?.close?.();
    syncGlassEditor();
    menu.hidden=false;opened=true;
    const bounds=desktop.getBoundingClientRect();
    const taskbar=document.querySelector('.taskbar');
    const barBounds=taskbar?.getBoundingClientRect();
    const dockSide=document.documentElement.dataset.ww11Taskbar||'bottom';
    // Keep the taller 11H11 glass editor above/beside the taskbar. Smaller
    // viewports scroll the context menu rather than losing its final actions.
    const reserveBar=barBounds&&['top','bottom'].includes(dockSide)?Math.max(0,barBounds.height+8):0;
    menu.style.maxHeight=`${Math.max(140,bounds.height-reserveBar-16)}px`;
    const menuWidth=menu.offsetWidth,menuHeight=menu.offsetHeight;
    const reserveLeft=barBounds&&dockSide==='left'?barBounds.width+7:0;
    const reserveRight=barBounds&&dockSide==='right'?barBounds.width+7:0;
    const minX=8+reserveLeft;
    const maxX=Math.max(minX,bounds.width-menuWidth-8-reserveRight);
    const minY=8+(dockSide==='top'?reserveBar:0);
    const maxY=Math.max(minY,bounds.height-menuHeight-8-(dockSide==='bottom'?reserveBar:0));
    const localX=Math.max(minX,Math.min(clientX-bounds.left,maxX));
    const localY=Math.max(minY,Math.min(clientY-bounds.top,maxY));
    menu.style.left=`${localX}px`;menu.style.top=`${localY}px`;
    menu.classList.remove('is-opening');
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){void menu.offsetWidth;menu.classList.add('is-opening');}
    if(focusFirst)items[0]?.focus({preventScroll:true});
  };
  desktop.addEventListener('contextmenu',event=>{
    if(!(event.target instanceof Element))return;
    // A desktop right-click never hijacks application, flyout, or taskbar menus.
    if(event.target.closest('.taskbar,.start-menu,.search-panel,.settings-overlay,.ww-gs-overlay,.ww11-desktop-context-menu'))return;
    event.preventDefault();open(event.clientX,event.clientY);
  });
  document.addEventListener('pointerdown',event=>{
    if(opened&&!menu.contains(event.target))close();
  },true);
  document.addEventListener('keydown',event=>{
    if(!opened)return;
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();const index=items.indexOf(document.activeElement);
      items[(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();
    }
    if(event.key==='Home'||event.key==='End'){
      event.preventDefault();items[event.key==='Home'?0:items.length-1].focus();
    }
  },true);
  window.addEventListener('resize',()=>close());
  desktop.addEventListener('scroll',()=>close(),{passive:true,capture:true});
  for(const item of items){item.addEventListener('click',()=>{
    const action=item.dataset.ww11DesktopAction;
    close();
    const settings=window.WebWindows11Settings;
    if(!settings?.open)return;
    if(action==='personalize')settings.open('personalization');
    // 11H11 does not have a separate Display page yet: use Settings home.
    else if(action==='display')settings.open('home');
    // Customize this menu's shared Mica tint using the existing Colors settings.
    else if(action==='customize')settings.open('context-menu');
  });}

  // Optional 10H10-style glass quick editor. Off by default to keep the
  // three-command context menu requested for 11H11 intact.
  const glassEditor=document.createElement('div');
  glassEditor.className='ww11-desktop-glass-editor';
  glassEditor.innerHTML=`
    <div class="ww11-desktop-glass-heading">
      <div class="ww11-desktop-glass-heading-text"><strong>Glass surface</strong><small>Adjust the Mica color and transparency.</small></div>
      <button type="button" id="ww11-context-glass-reset">Reset</button>
    </div>
    <div class="ww11-desktop-glass-section">
      <div class="ww11-desktop-glass-section-title">Glass color</div>
      <div class="ww11-desktop-glass-swatches" role="group" aria-label="Glass color presets">
        ${[['original','#fff'],['white','#fff'],['silver','#e2e2e2'],['warm','#faedda'],['sky','#dfeffb'],['black','#1b1b1b']].map(([id,color])=>`<button type="button" data-ww11-context-glass-color="${id}" style="--sample:${color}" title="${id==='original'?'Original':id.charAt(0).toUpperCase()+id.slice(1)}" aria-label="${id} glass" aria-pressed="false"></button>`).join('')}
        <label class="ww11-desktop-glass-custom" title="Custom glass color" aria-label="Custom glass color">
          <input type="color" id="ww11-context-color" value="#ffffff" aria-label="Choose a custom glass color">
        </label>
      </div>
    </div>
    <div class="ww11-desktop-glass-section ww11-desktop-hex-section">
      <label class="ww11-desktop-hex-label" for="ww11-context-glass-hex">Custom color (HEX)
        <input type="text" id="ww11-context-glass-hex" maxlength="7" autocomplete="off" spellcheck="false" value="#ffffff" aria-label="Glass color HEX" inputmode="text">
      </label>
    </div>
    <div class="ww11-desktop-glass-section ww11-desktop-opacity-section">
      <label class="ww11-desktop-glass-range-row" for="ww11-context-opacity">Glass opacity
        <output id="ww11-context-opacity-label" for="ww11-context-opacity">90%</output>
      </label>
      <input type="range" id="ww11-context-opacity" min="0" max="100" step="1" value="90" style="--range-progress:90%" aria-label="Glass surface opacity">
    </div>
    <button class="ww11-desktop-glass-advanced" type="button" id="ww11-context-advanced">
      <span>More color settings</span>
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>
    </button>`;
  menu.prepend(glassEditor);
  function syncGlassEditor(){
    const prefs=window.WebWindows11Preferences;
    glassEditor.hidden=!prefs?.contextGlassControls;
    const appearance=window.WebWindows11Settings?.getGlassAppearance?.();
    if(!appearance)return;
    const opacity=glassEditor.querySelector('#ww11-context-opacity');
    opacity.value=appearance.opacity;
    opacity.style.setProperty('--range-progress',`${Number(appearance.opacity)}%`);
    glassEditor.querySelector('#ww11-context-opacity-label').textContent=appearance.opacity+'%';
    glassEditor.querySelector('#ww11-context-color').value=appearance.customColor;
    const hex=glassEditor.querySelector('#ww11-context-glass-hex');
    const hexColors={original:'#ffffff',white:'#ffffff',silver:'#e2e2e2',warm:'#faedda',sky:'#dfeffb',black:'#1b1b1b'};
    if(document.activeElement!==hex)hex.value=appearance.color==='custom'?appearance.customColor:(hexColors[appearance.color]||'#ffffff');
    glassEditor.querySelectorAll('[data-ww11-context-glass-color]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.ww11ContextGlassColor===appearance.color)));
    glassEditor.querySelector('.ww11-desktop-glass-custom').classList.toggle('is-selected',appearance.color==='custom');
  }
  glassEditor.addEventListener('click',event=>{
    const button=event.target.closest('[data-ww11-context-glass-color]');
    if(button){window.WebWindows11Settings?.setGlassAppearance?.({color:button.dataset.ww11ContextGlassColor});syncGlassEditor();}
    if(event.target.closest('#ww11-context-advanced')){close();window.WebWindows11Settings?.open('colors');}
    if(event.target.closest('#ww11-context-glass-reset')){window.WebWindows11Settings?.setGlassAppearance?.({color:'original',opacity:90});syncGlassEditor();}
  });
  glassEditor.querySelector('#ww11-context-color').addEventListener('input',event=>window.WebWindows11Settings?.setGlassAppearance?.({color:event.target.value}));
  glassEditor.querySelector('#ww11-context-glass-hex').addEventListener('change',event=>{
    const hex=event.target.value.trim();
    if(/^#[0-9a-f]{6}$/i.test(hex))window.WebWindows11Settings?.setGlassAppearance?.({color:hex});
    else event.target.setCustomValidity('Enter a 6-digit HEX color, such as #ffffff.');
    if(/^#[0-9a-f]{6}$/i.test(hex))event.target.setCustomValidity('');
    syncGlassEditor();
  });
  glassEditor.querySelector('#ww11-context-opacity').addEventListener('input',event=>{
    window.WebWindows11Settings?.setGlassAppearance?.({opacity:event.target.value});syncGlassEditor();
  });
  window.addEventListener('webwindows:desktop-appearance-changed',syncGlassEditor);
  window.addEventListener('webwindows:glass-changed',syncGlassEditor);
  syncGlassEditor();
  // The right-click position is recalculated after the optional editor is shown.
  window.WebWindows11DesktopMenu={open,close,isOpen:()=>opened};
})();


/* 10H10 taskbar right-click shortcut, rendered with 11H11's secondary Mica. */
(() => {
  const bar=document.querySelector('.taskbar');if(!bar)return;
  const menu=document.createElement('div');menu.className='ww11-taskbar-context';
  menu.setAttribute('role','menu');menu.hidden=true;
  menu.innerHTML='<button type="button" role="menuitem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 5h18v14H3zM3 15h18M9 19h6"/></svg><span>Taskbar settings</span></button>';
  document.querySelector('main.desktop')?.append(menu);
  const hide=()=>{menu.hidden=true};
  bar.addEventListener('contextmenu',event=>{
    if(event.target.closest('#search-panel,#start-menu'))return;
    event.preventDefault();menu.hidden=false;
    menu.style.left=Math.min(event.clientX,innerWidth-menu.offsetWidth-10)+'px';
    menu.style.top=Math.min(event.clientY,innerHeight-menu.offsetHeight-10)+'px';
  });
  menu.querySelector('button').addEventListener('click',()=>{hide();window.WebWindows11Settings?.open('taskbar');});
  document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target))hide();},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){event.preventDefault();hide();}},true);
  window.addEventListener('resize',hide);
})();

/* 11H11 Mica name tooltips. A single portal keeps glass above the taskbar,
   Start and Search containers, without clipping by their scroll regions. */
(() => {
  'use strict';
  const hint=document.createElement('div');
  hint.id='ww11-app-mica-tooltip';
  hint.className='ww11-app-mica-tooltip';
  hint.setAttribute('role','tooltip');
  hint.setAttribute('aria-hidden','true');
  document.body.append(hint);
  let current=null;
  let showTimer=0;
  const hide=()=>{
    clearTimeout(showTimer);showTimer=0;current=null;
    hint.classList.remove('is-visible');
    hint.setAttribute('aria-hidden','true');
  };
  const position=()=>{
    if(!current||!current.isConnected)return hide();
    const bounds=current.getBoundingClientRect();
    const width=hint.offsetWidth,height=hint.offsetHeight,gap=10,pad=8;
    let x=bounds.left+(bounds.width-width)/2;
    let y=bounds.top-height-gap;
    const dock=current.closest('.taskbar');
    const side=dock?document.documentElement.dataset.ww11Taskbar:'start';
    if(side==='top'||side==='start')y=bounds.bottom+gap;
    if(side==='left') {x=bounds.right+gap;y=bounds.top+(bounds.height-height)/2;}
    if(side==='right'){x=bounds.left-width-gap;y=bounds.top+(bounds.height-height)/2;}
    if(y<pad)y=bounds.bottom+gap;
    if(y+height>innerHeight-pad)y=bounds.top-height-gap;
    x=Math.max(pad,Math.min(x,innerWidth-width-pad));
    y=Math.max(pad,Math.min(y,innerHeight-height-pad));
    hint.style.left=`${Math.round(x)}px`;
    hint.style.top=`${Math.round(y)}px`;
  };
  const show=element=>{
    if(!element||!element.isConnected)return;
    clearTimeout(showTimer);
    current=element;
    hint.textContent=element.dataset.ww11MicaTooltip||'';
    if(!hint.textContent)return hide();
    hint.classList.add('is-visible');
    hint.setAttribute('aria-hidden','false');
    position();
  };
  function enter(target,delayed){
    const element=target?.closest?.('[data-ww11-mica-tooltip]');
    if(element===current)return;
    hide();
    if(!element)return;
    if(delayed)showTimer=setTimeout(()=>show(element),340);
    else show(element);
  }
  document.addEventListener('pointerover',event=>enter(event.target,true));
  document.addEventListener('pointerout',event=>{
    const from=event.target?.closest?.('[data-ww11-mica-tooltip]');
    if(from&&!from.contains(event.relatedTarget))hide();
  });
  document.addEventListener('focusin',event=>enter(event.target,false));
  document.addEventListener('focusout',event=>{
    const from=event.target?.closest?.('[data-ww11-mica-tooltip]');
    if(from&&!from.contains(event.relatedTarget))hide();
  });
  document.addEventListener('pointerdown',hide);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
  window.addEventListener('resize',()=>{if(current)position();});
  window.addEventListener('scroll',hide,true);
  window.addEventListener('webwindows:taskbar-context-changed',()=>{if(current)position();});
  window.addEventListener('webwindows:search-opening',hide);
})();


/* === 11H11 Discover taskbar flyout: publisher-linked news tiles and quick actions === */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const overlay=$('ww11-discover-overlay'), panel=$('ww11-discover-window');
  const gallery=$('ww11-discover-gallery'), trigger=document.querySelector('#taskbar-dock [data-ww11-discover]');
  const left=$('ww11-discover-previous'),right=$('ww11-discover-next'),more=$('ww11-discover-more');
  const actionTray=$('ww11-discover-actions'),actionList=$('ww11-discover-action-list');
  const settingsAction=$('ww11-discover-action-settings');
  const titlebar=$('ww11-discover-titlebar');
  if(!overlay||!panel||!gallery||!trigger) return;
  let isOpen=false,renderToken=0,actionsExpanded=false;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function setActionsExpanded(expanded){
    actionsExpanded=Boolean(expanded && isOpen);
    actionTray?.classList.toggle('is-expanded',actionsExpanded);
    titlebar?.classList.toggle('has-expanded-actions',actionsExpanded);
    more?.setAttribute('aria-expanded',String(actionsExpanded));
    more?.setAttribute('aria-label',actionsExpanded?'Hide Discover actions':'Show Discover actions');
    actionList?.setAttribute('aria-hidden',String(!actionsExpanded));
    if(actionList)actionList.inert=!actionsExpanded;
  }

  function position() {
    if(!isOpen)return;
    const taskbar=trigger.closest('.taskbar');
    const area=window.WebWindows11DockGeometry?.getWorkArea?.();
    const barRect=area?.bar||taskbar?.getBoundingClientRect()||trigger.getBoundingClientRect();
    const width=panel.offsetWidth,height=panel.offsetHeight;
    const edge=document.documentElement.dataset.ww11Taskbar || 'bottom';
    // Animate from the actual taskbar edge without modifying flyout placement.
    const reveal={
      top:['0px','-12px','50% 0%'],
      bottom:['0px','12px','50% 100%'],
      left:['-12px','0px','0% 50%'],
      right:['12px','0px','100% 50%']
    }[edge] || ['0px','12px','50% 100%'];
    panel.style.setProperty('--ww11-discover-open-x',reveal[0]);
    panel.style.setProperty('--ww11-discover-open-y',reveal[1]);
    panel.style.setProperty('--ww11-discover-open-origin',reveal[2]);
    const gap=8,pad=8;
    // Center across the usable desktop, not across a display:contents dock
    // or under a vertically positioned taskbar.
    const work=area||{left:0,top:0,right:innerWidth,bottom:innerHeight,width:innerWidth,height:innerHeight};
    let leftPos=work.left+(work.width-width)/2;
    let topPos=edge==='top'?barRect.bottom+gap:barRect.top-height-gap;
    if(edge==='left'||edge==='right')topPos=work.top+(work.height-height)/2;
    leftPos=clamp(leftPos,work.left+pad,Math.max(work.left+pad,work.right-width-pad));
    topPos=clamp(topPos,work.top+pad,Math.max(work.top+pad,work.bottom-height-pad));
    panel.style.left=`${Math.round(leftPos)}px`;
    panel.style.top=`${Math.round(topPos)}px`;
  }
  // One header logo only: no layered duplicate SVG underneath MSN.png.
  const brandImg=$('ww11-discover-logo-img');
  const backup='https://img.icons8.com/?size=100&id=W5To6Q3gjDiK&format=png&color=000000';
  brandImg?.addEventListener('error',()=>{
    if(!brandImg.dataset.backupTried){brandImg.dataset.backupTried='1';brandImg.src=backup;}
    else brandImg.hidden=true;
  });
  if(brandImg?.complete && !brandImg.naturalWidth)brandImg.dispatchEvent(new Event('error'));
  const bingImg=actionList?.querySelector('.ww11-discover-action--bing img');
  bingImg?.addEventListener('error',()=>{
    if(!bingImg.dataset.localFallback){
      bingImg.dataset.localFallback='1';
      bingImg.src='Assets/ww11/bing-search-fallback.png';
    }else bingImg.classList.add('is-unavailable');
  });
  bingImg?.addEventListener('load',()=>bingImg.classList.remove('is-unavailable'));
  if(bingImg?.complete && !bingImg.naturalWidth)bingImg.dispatchEvent(new Event('error'));

  function stories(){
    const all=window.WebWindows11News?.get?.()||[];
    if(!Array.isArray(all))return [];
    const urls=new Set();
    return all.filter(article=>{
      if(!article||typeof article.title!=='string'||!article.title.trim()||
        typeof article.url!=='string'||!/^https?:\/\//i.test(article.url)||urls.has(article.url))return false;
      urls.add(article.url);return true;
    }).slice(0,4);
  }
  function publisherName(story){
    const host=(story.domain||(()=>{try{return new URL(story.url).hostname;}catch{return '';}})())
      .replace(/^www\./i,'').toLowerCase();
    const known={
      'usatoday.com':'USA TODAY','nytimes.com':'The New York Times',
      'bbc.com':'BBC','bbc.co.uk':'BBC','cnn.com':'CNN',
      'reuters.com':'Reuters','apnews.com':'AP News','theguardian.com':'The Guardian',
      'foxnews.com':'Fox News','nbcnews.com':'NBC News','cbsnews.com':'CBS News',
      'abcnews.go.com':'ABC News','washingtonpost.com':'The Washington Post',
      'dw.com':'DW','thehill.com':'The Hill'
    };
    return known[host] || host.replace(/\.(com|org|net|co\.uk|gov)$/i,'').replace(/[._-]/g,' ').trim() || 'Publisher';
  }
  function elapsedAge(story){
    const timestamp=Number(story.published);
    if(!Number.isFinite(timestamp)||timestamp<=0)return '';
    const elapsed=Math.max(0,Date.now()-timestamp);
    const mins=Math.floor(elapsed/60000);
    if(mins<60)return `${Math.max(1,mins)}m`;
    const hours=Math.floor(elapsed/3600000);
    if(hours<24)return `${hours}h`;
    const days=Math.floor(elapsed/86400000);
    return days<7?`${days}d`:`${Math.floor(days/7)}w`;
  }
  function makeTile(story,token){
    // Each tile is a real article link, including the white fallback when
    // its publisher image is unavailable. Native links support mouse,
    // keyboard (Enter), touch, and opening in a new tab.
    const tile=document.createElement('a');
    tile.className='ww11-discover-tile ww11-discover-tile--no-image';
    tile.href=story.url;
    tile.target='_blank';
    tile.rel='noopener noreferrer';
    tile.setAttribute('aria-label',`Read article: ${story.title}`);
    const candidates=[...new Set([story.image,...(Array.isArray(story.images)?story.images:[])]
      .filter(url=>typeof url==='string'&&/^https?:\/\//i.test(url)))];
    // Publisher and headline are present even when the story has no image.
    // This keeps the empty-image fallback useful and clickable.
    const img=candidates.length?document.createElement('img'):null;
    if(img){
      img.className='ww11-discover-tile-image';
      img.alt='';img.decoding='async';img.loading='eager';img.referrerPolicy='no-referrer';
    }

    // The overlay uses white text over photographs and dark text over the
    // glass-tinted image-less fallback. Publisher artwork stays unchanged.
    const caption=document.createElement('div');
    caption.className='ww11-discover-story-caption ww11-discover-story-caption--always';
    caption.setAttribute('aria-hidden','true');
    const source=document.createElement('div');
    source.className='ww11-discover-story-source';
    const publisher=publisherName(story),age=elapsedAge(story);
    const sourceLabel=document.createElement('span');
    sourceLabel.textContent=age?`${publisher} · ${age}`:publisher;
    const domain=(story.domain||(()=>{try{return new URL(story.url).hostname;}catch{return '';}})())
      .toLowerCase().replace(/^www\./,'');
    if(/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)){
      const publisherIcon=document.createElement('img');
      publisherIcon.className='ww11-discover-story-source-icon';
      publisherIcon.alt='';publisherIcon.loading='lazy';
      publisherIcon.referrerPolicy='no-referrer';
      publisherIcon.onerror=()=>publisherIcon.remove();
      publisherIcon.src=`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
      source.append(publisherIcon);
    }
    source.append(sourceLabel);
    const headline=document.createElement('strong');
    headline.className='ww11-discover-story-title';
    headline.textContent=story.title;
    caption.append(source,headline);
    if(img)tile.append(img);
    tile.append(caption);
    if(!img)return tile;

    let index=0,timer;
    const clear=()=>{if(timer){clearTimeout(timer);timer=undefined;}};
    const fallback=()=>{
      clear();if(token!==renderToken)return;
      // When every image fails, keep the publisher and headline on the
      // glass-colored tile, instead of leaving an empty rectangle.
      img.remove();tile.classList.add('ww11-discover-tile--no-image');
    };
    const attempt=()=>{
      clear();if(token!==renderToken||!tile.isConnected)return;
      if(index>=candidates.length){fallback();return;}
      img.src=candidates[index++];timer=setTimeout(attempt,12000);
    };
    img.addEventListener('load',()=>{
      clear();if(img.naturalWidth<=1||img.naturalHeight<=1)attempt();
      else tile.classList.remove('ww11-discover-tile--no-image');
    });
    img.addEventListener('error',attempt);
    queueMicrotask(attempt);
    return tile;
  }
  function render(){
    const token=++renderToken;
    // Render only real articles. The 2 x 2 CSS Grid fills row-major automatically.
    gallery.replaceChildren(...stories().map(story=>makeTile(story,token)));
  }
  function open(){
    if(isOpen)return;
    isOpen=true;
    window.WebWindows11Start?.hide?.();
    window.WebWindows11Search?.close?.();
    overlay.hidden=false;overlay.setAttribute('aria-hidden','false');
    trigger.setAttribute('aria-expanded','true');
    render();position();
    // A fresh opening class restarts all three reveal phases on every open.
    panel.classList.remove('is-opening');
    void panel.offsetWidth;
    panel.classList.add('is-opening');
    window.dispatchEvent(new Event('webwindows:discover-opening'));
  }
  function close(){
    if(!isOpen)return;
    setActionsExpanded(false);
    isOpen=false;renderToken++;
    panel.classList.remove('is-opening');
    overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
    trigger.setAttribute('aria-expanded','false');
  }
  panel.addEventListener('animationend',event=>{
    if(event.target===panel && event.animationName==='ww11-discover-shell-enter'){
      panel.classList.remove('is-opening');
    }
  });
  trigger.addEventListener('click',()=>isOpen?close():open());
  more?.addEventListener('click',()=>setActionsExpanded(!actionsExpanded));
  settingsAction?.addEventListener('click',()=>{
    close();
    window.WebWindows11Settings?.open?.('home');
  });
  // The gallery chevrons retain their original behavior; the ellipsis now
  // controls this staged quick-actions surface. Keep press feedback for all.
  for(const button of [left,right,more]){
    button?.addEventListener('pointerdown',()=>button.classList.add('is-held'));
    for(const ev of ['pointerup','pointercancel','pointerleave']){
      button?.addEventListener(ev,()=>button.classList.remove('is-held'));
    }
    button?.addEventListener('click',()=>button.classList.remove('is-held'));
  }
  document.addEventListener('pointerdown',event=>{
    if(!isOpen)return;
    // A detached widget can be grabbed while Discover is open to dock it again.
    if(event.target.closest?.('.ww11-widget-desktop-shell'))return;
    if(!panel.contains(event.target)&&!trigger.contains(event.target)){close();return;}
    if(actionsExpanded && !actionTray?.contains(event.target))setActionsExpanded(false);
  });
  document.addEventListener('keydown',event=>{
    if(!isOpen||event.key!=='Escape')return;
    if(actionsExpanded){setActionsExpanded(false);more?.focus({preventScroll:true});}
    else{close();trigger.focus({preventScroll:true});}
    event.stopPropagation();
  });
  // Keep the taskbar-anchored flyout on screen while the Widgets view grows
  // to its concept dimensions, and while it shrinks back to the News view.
  if(typeof ResizeObserver!=='undefined'){
    new ResizeObserver(()=>{if(isOpen)position();}).observe(panel);
  }
  for(const ev of ['resize','webwindows:taskbar-context-changed'])window.addEventListener(ev,position,{passive:true});
  window.addEventListener('webwindows:news-updated',()=>{if(isOpen)render();});
  window.addEventListener('webwindows:news-error',()=>{if(isOpen)render();});
  window.addEventListener('webwindows:start-opening',close);
  window.addEventListener('webwindows:search-opening',close);
  window.WebWindows11Discover={open,close,isOpen:()=>isOpen,refresh:render};
})();


/* === 11H11 Discover section navigation, live timezones and Open-Meteo widgets === */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const track=$('ww11-discover-page-track'), gallery=$('ww11-discover-gallery'), widgets=$('ww11-discover-widgets');
  const prev=$('ww11-discover-previous'), next=$('ww11-discover-next'), label=$('ww11-discover-section-name');
  if(!track||!widgets||!prev||!next)return;
  let page='news', clockTimer=null, weatherLoaded=false, weatherLoading=false;
  let weatherLocation=null, weatherUpdateAt=0;
  const knownLocationKey='ww11.discover.weatherLocation.v1';
  const nowLabel=$('ww11-widget-current-label'), nowIcon=$('ww11-widget-now-icon');
  const dayList=$('ww11-widget-forecast-days');
  const iconMap=(()=>{try{return JSON.parse($('ww11-weather-icon-map')?.textContent||'{}').icons||{};}catch{return {};}})();
  const iconPath='Assets/ww11/Sun.png';
  // The main clock follows the browser/OS time zone, rather than a fixed
  // US time zone. No location permission or remote time-zone service needed.
  const clockSlots=[
    {node:$('ww11-widget-central-time')},
    {node:$('ww11-widget-eastern-time')},
    {node:$('ww11-widget-pacific-time')}
  ];
  for(const slot of clockSlots)slot.label=slot.node?.parentElement?.querySelector('span')||null;
  const referenceZones={
    eastern:{zone:'America/New_York',label:'Eastern Time'},
    central:{zone:'America/Chicago',label:'Central Time'},
    mountain:{zone:'America/Denver',label:'Mountain Time'},
    pacific:{zone:'America/Los_Angeles',label:'Pacific Time'}
  };
  let clockZone='', activeClocks=[];
  const clockFormatCache=new Map();
  function browserTimeZone(){
    try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';}
    catch{return 'UTC';}
  }
  function readableTimeZone(zone){
    if(zone==='UTC'||zone.startsWith('Etc/GMT'))return zone==='UTC'?'UTC':'Local Time';
    try{
      const parts=new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'longGeneric'}).formatToParts(new Date());
      const name=parts.find(part=>part.type==='timeZoneName')?.value;
      if(name && name.length<=22 && !/^[A-Z]{2,5}[+-]\d/.test(name))return name;
    }catch{}
    const city=zone.split('/').pop().replace(/_/g,' ');
    return city ? `${city} Time` : 'Local Time';
  }
  function configureClocks(){
    const current=browserTimeZone();
    if(clockZone===current && activeClocks.length)return;
    clockZone=current;
    const localLabel=readableTimeZone(current);
    const localGroup=Object.keys(referenceZones).find(key=>referenceZones[key].label===localLabel);
    // Keep the familiar US comparison clocks, but don't repeat the user's zone.
    // Central -> Eastern/Pacific; Eastern -> Central/Pacific;
    // Pacific -> Eastern/Central; elsewhere -> Eastern/Pacific.
    const preferred=localGroup==='eastern'?['central','pacific']:
      localGroup==='pacific'?['eastern','central']:
      localGroup==='central'||localGroup==='mountain'?['eastern','pacific']:
      ['eastern','pacific'];
    const otherClocks=preferred.map(key=>referenceZones[key])
      .filter(ref=>ref.zone!==current && ref.label!==localLabel).slice(0,2);
    // Protect the two comparison slots even for uncommon IANA aliases.
    if(otherClocks.length<2){
      for(const ref of Object.values(referenceZones)){
        if(ref.zone!==current && ref.label!==localLabel && !otherClocks.some(item=>item.zone===ref.zone))otherClocks.push(ref);
        if(otherClocks.length===2)break;
      }
    }
    activeClocks=[{zone:current,label:localLabel},...otherClocks];
    clockSlots.forEach((slot,index)=>{
      if(slot.label)slot.label.textContent=activeClocks[index]?.label||'';
      if(slot.node){slot.node.setAttribute('data-time-zone',activeClocks[index]?.zone||'');}
    });
  }
  function updateClocks(){
    configureClocks();
    const date=new Date();
    clockSlots.forEach((slot,index)=>{
      if(!slot.node)return;
      const zone=activeClocks[index]?.zone;
      try{
        if(!clockFormatCache.has(zone))clockFormatCache.set(zone,new Intl.DateTimeFormat('en-US',
          {timeZone:zone,hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true}));
        slot.node.textContent=clockFormatCache.get(zone).format(date).replace(/\s(?=[AP]M$)/,'');
      }catch{slot.node.textContent='--:--:--';}
    });
  }
  function setClockRunning(running){
    if(clockTimer){clearInterval(clockTimer);clockTimer=null;}
    if(running){updateClocks();clockTimer=setInterval(updateClocks,1000);}
  }
  updateClocks();
  function switchPage(section,instant=false){
    const target=section==='widgets'?'widgets':'news';
    page=target;
    if(instant){track.style.transition='none';}
    track.dataset.page=target;
    label.textContent=target==='widgets'?'Widgets':'News';
    prev.disabled=target==='news';next.disabled=target==='widgets';
    gallery.inert=target==='widgets';widgets.inert=target==='news';
    if(instant)requestAnimationFrame(()=>{track.style.removeProperty('transition');});
    const running=!document.hidden && (
      (target==='widgets'&&$('ww11-discover-overlay')?.getAttribute('aria-hidden')==='false') ||
      window.WebWindows11WidgetDesktop?.hasActive('time')
    );
    setClockRunning(running);
    const wantsWeather=(target==='widgets'&&$('ww11-discover-overlay')?.getAttribute('aria-hidden')==='false') || window.WebWindows11WidgetDesktop?.hasActive('weather');
    if(wantsWeather && (!weatherLoaded || Date.now()-weatherUpdateAt>15*60*1000))void loadWeather();
  }
  prev.addEventListener('click',()=>switchPage('news'));
  next.addEventListener('click',()=>switchPage('widgets'));
  window.addEventListener('webwindows:discover-opening',()=>switchPage('news',true));
  window.addEventListener('webwindows:start-opening',()=>setClockRunning(false));
  document.addEventListener('visibilitychange',()=>setClockRunning(!document.hidden && (
    (page==='widgets'&&$('ww11-discover-overlay')?.getAttribute('aria-hidden')==='false') ||
    window.WebWindows11WidgetDesktop?.hasActive('time')
  )));
  // Use an existing saved location or browser geolocation; tooltip dots are
  // visual-only because the concept does not define actions for them.
  try{
    const saved=JSON.parse(localStorage.getItem(knownLocationKey)||'null');
    if(saved&&Number.isFinite(saved.latitude)&&Number.isFinite(saved.longitude)&&typeof saved.name==='string')weatherLocation=saved;
  }catch{}
  function setLocation(loc){
    weatherLocation={latitude:loc.latitude,longitude:loc.longitude,name:loc.name};
    try{localStorage.setItem(knownLocationKey,JSON.stringify(weatherLocation));}catch{}
  }
  if(weatherLocation)setLocation(weatherLocation);
  // Convert the full WMO weather-code set returned by Open-Meteo into concise,
  // Windows-style condition labels. The live description may describe an action
  // ("Raining", "Snowing"); daily forecast alt text uses forecast-style nouns.
  function weatherInfo(code,isDay=true,forecast=false){
    const weatherCode=Number(code);
    if(code==null||!Number.isInteger(weatherCode))return {key:'cloudy',label:'Conditions unavailable'};
    const info={
      0:  {key:isDay?'sun':'night',label:isDay?'Sunny':'Clear'},
      1:  {key:'partly',label:isDay?'Mostly sunny':'Mostly clear'},
      2:  {key:'partly',label:'Partly cloudy'},
      3:  {key:'overcast',label:'Cloudy'},
      45: {key:'fog',label:'Foggy'},
      48: {key:'fog',label:'Freezing fog'},
      51: {key:'drizzle',label:'Light drizzle'},
      53: {key:'drizzle',label:forecast?'Drizzle':'Drizzling'},
      55: {key:'drizzle',label:'Heavy drizzle'},
      56: {key:'sleet',label:'Light freezing drizzle'},
      57: {key:'sleet',label:'Freezing drizzle'},
      61: {key:isDay?'rain':'rainyNight',label:'Light rain'},
      63: {key:isDay?'rain':'rainyNight',label:forecast?'Rain':'Raining'},
      65: {key:'heavyRain',label:'Heavy rain'},
      66: {key:'sleet',label:'Light freezing rain'},
      67: {key:'sleet',label:'Heavy freezing rain'},
      71: {key:'lightSnow',label:'Light snow'},
      73: {key:'snow',label:forecast?'Snow':'Snowing'},
      75: {key:'heavySnow',label:'Heavy snow'},
      77: {key:'snow',label:'Snow grains'},
      80: {key:'showers',label:'Light showers'},
      81: {key:'showers',label:'Rain showers'},
      82: {key:'torrential',label:'Heavy rain showers'},
      85: {key:'lightSnow',label:'Snow showers'},
      86: {key:'heavySnow',label:'Heavy snow showers'},
      95: {key:'thunder',label:'Thunderstorms'},
      96: {key:'thunderRain',label:'Thunderstorms with hail'},
      97: {key:'thunderRain',label:'Heavy thunderstorms'},
      99: {key:'thunderRain',label:'Heavy thunderstorms with hail'}
    };
    return info[weatherCode]||{key:'cloudy',label:'Conditions unavailable'};
  }
  function weatherIcon(key){
    return key==='sun'?iconPath:(iconMap[key]?.url||iconMap.cloudy?.url||iconPath);
  }
  function changeIcon(image,key){
    image.onerror=()=>{image.onerror=null;image.src='Assets/ww11/weather-unavailable.svg';};
    image.src=weatherIcon(key);
  }
  function weatherStatus(message){
    if(nowLabel)nowLabel.textContent=message;
    if(nowIcon)nowIcon.hidden=true;
    if(dayList){dayList.replaceChildren();const p=document.createElement('div');p.className='ww11-widget-day-placeholder';p.textContent=message;dayList.append(p);}
  }
  function degree(value){return Number.isFinite(Number(value))?`${Math.round(Number(value))}°F`:'--';}
  function renderWeather(data){
    const current=data?.current, daily=data?.daily;
    if(!current||!daily||!Array.isArray(daily.time)||!Array.isArray(daily.weather_code)||!Number.isFinite(Number(current.temperature_2m)))throw Error('Incomplete forecast');
    const info=weatherInfo(current.weather_code,current.is_day===1);
    if(nowLabel)nowLabel.textContent=`${info.label} · ${degree(current.temperature_2m)}`;
    if(nowIcon){nowIcon.hidden=false;changeIcon(nowIcon,info.key);}
    const cards=[];
    for(let i=1;i<Math.min(4,daily.time.length);i++){
      const code=daily.weather_code[i], infoDay=weatherInfo(code,true,true);
      const card=document.createElement('div');card.className='ww11-widget-day';
      const icon=document.createElement('img');icon.alt=infoDay.label;icon.loading='lazy';changeIcon(icon,infoDay.key);
      const rain=document.createElement('span');const chance=daily.precipitation_probability_max?.[i];rain.textContent=Number.isFinite(chance)?`${Math.round(chance)}%`:'--%';rain.title='Maximum precipitation probability';
      const temperature=document.createElement('span');temperature.textContent=`${Math.round(daily.temperature_2m_max?.[i])}°/${Math.round(daily.temperature_2m_min?.[i])}°`;temperature.title='High / low temperatures in Fahrenheit';
      card.append(icon,rain,temperature);cards.push(card);
    }
    if(dayList)dayList.replaceChildren(...cards);
    weatherLoaded=true;weatherUpdateAt=Date.now();
  }
  async function fetchJSON(url){
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
    try{const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error(`HTTP ${response.status}`);return await response.json();}
    finally{clearTimeout(timer);}
  }
  function getBrowserLocation(){
    return new Promise((resolve,reject)=>{
      if(!navigator.geolocation){reject(Error('Location unsupported'));return;}
      navigator.geolocation.getCurrentPosition(pos=>resolve({latitude:pos.coords.latitude,longitude:pos.coords.longitude,name:'Your location'}),reject,{enableHighAccuracy:false,maximumAge:3600000,timeout:7500});
    });
  }
  async function loadWeather(forceLocation=false){
    if(weatherLoading)return;
    weatherLoading=true;weatherStatus('Loading weather…');
    try{
      let place=forceLocation?null:weatherLocation;
      if(!place){place=await getBrowserLocation();setLocation(place);}
      const endpoint=new URL('https://api.open-meteo.com/v1/forecast');
      const params={latitude:String(place.latitude),longitude:String(place.longitude),current:'temperature_2m,is_day,weather_code',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',forecast_days:'4',timezone:'auto',temperature_unit:'fahrenheit'};
      Object.entries(params).forEach(([key,value])=>endpoint.searchParams.set(key,value));
      const weather=await fetchJSON(endpoint.href);
      renderWeather(weather);
    }catch(err){weatherLoaded=false;weatherStatus('Weather unavailable');}
    finally{weatherLoading=false;}
  }
  // When Weather is on the desktop, refresh it periodically even with
  // Discover closed. The existing 15-minute cache gate avoids extra API use.
  setInterval(()=>{
    if(!document.hidden && window.WebWindows11WidgetDesktop?.hasActive('weather') &&
       !weatherLoading && Date.now()-weatherUpdateAt>=15*60*1000)void loadWeather();
  },60000);
  window.addEventListener('ww11:desktop-widgets-updated',()=>{
    const hubVisible=page==='widgets'&&$('ww11-discover-overlay')?.getAttribute('aria-hidden')==='false';
    setClockRunning(!document.hidden && (hubVisible || window.WebWindows11WidgetDesktop?.hasActive('time')));
    if((hubVisible || window.WebWindows11WidgetDesktop?.hasActive('weather')) &&
       (!weatherLoaded || Date.now()-weatherUpdateAt>15*60*1000))void loadWeather();
  });
  window.WebWindows11Widgets={showWidgets:()=>switchPage('widgets'),showNews:()=>switchPage('news'),refreshWeather:()=>loadWeather()};
})();


/* === 11H11 detachable, dockable live desktop widgets =====================
   A widget is ONE live element. Drag it out of Discover, leaving an empty
   glass docking slot; drag it home and release over the highlighted slot.
   No duplicate DOM IDs, copies, close buttons, or secondary weather fetches.
   Stored desktop positions remain compatible with desktopWidgets.v1. */
(()=>{
  'use strict';
  const layer=document.getElementById('ww11-desktop-widget-layer');
  const hub=document.getElementById('ww11-discover-widgets');
  const overlay=document.getElementById('ww11-discover-overlay');
  if(!layer||!hub)return;
  const storageKey='webwindows.11h11.desktopWidgets.v1';
  const types=['time','weather'];
  const originals=Object.fromEntries(types.map(type=>[
    type,hub.querySelector('.ww11-widget-'+type)
  ]));
  const detached=new Map();
  const clamp=(n,min,max)=>Math.max(min,Math.min(n,max));
  const notify=()=>window.dispatchEvent(new Event('ww11:desktop-widgets-updated'));
  const saved=(()=>{
    try{const value=JSON.parse(localStorage.getItem(storageKey)||'{}');
      return value&&typeof value==='object'?value:{};
    }catch{return {};}
  })();
  let dragging=null;

  function save(){
    const data={};
    for(const [type,entry] of detached){
      data[type]={x:parseFloat(entry.shell.style.left)||8,
                  y:parseFloat(entry.shell.style.top)||8};
    }
    try{localStorage.setItem(storageKey,JSON.stringify(data));}catch{}
  }
  function place(shell,x,y){
    const rect=shell.getBoundingClientRect();
    const width=rect.width||Math.min(372,innerWidth-24);
    const height=rect.height||160;
    // Keep floating widgets inside the visible desktop, even after resize.
    const xx=clamp(x,8,Math.max(8,innerWidth-width-8));
    const yy=clamp(y,8,Math.max(8,innerHeight-height-8));
    shell.style.left=xx+'px';shell.style.top=yy+'px';
    return {x:xx,y:yy};
  }
  function detach(type,rect){
    if(detached.has(type))return detached.get(type);
    const widget=originals[type];if(!widget||!widget.parentNode)return null;
    const measured=rect||widget.getBoundingClientRect();
    const slot=document.createElement('div');
    slot.className='ww11-widget-dock-placeholder';
    slot.dataset.widgetSlot=type;
    slot.setAttribute('aria-hidden','true');
    slot.style.height=(measured.height>20?measured.height:(type==='time'?126:140))+'px';
    widget.replaceWith(slot);
    const shell=document.createElement('div');
    // Preserve the exact compact widget styling from its Discover parent.
    shell.className='ww11-widget-desktop-shell ww11-discover-widgets';
    shell.dataset.widgetType=type;
    shell.style.width=Math.min(measured.width>20?measured.width:372,innerWidth-24)+'px';
    widget.classList.add('ww11-desktop-widget');
    widget.setAttribute('aria-label',(type==='time'?'Time':'Weather')+' desktop widget');
    shell.append(widget);layer.append(shell);
    const entry={widget,slot,shell,baseWidth:measured.width>20?measured.width:372};
    detached.set(type,entry);
    // Identical DOM nodes keep their live clock/weather updates automatically.
    notify();
    return entry;
  }
  function clearHint(){
    for(const entry of detached.values())entry.slot.classList.remove('is-dock-target');
  }
  function canDock(type,clientX,clientY){
    const entry=detached.get(type);
    if(!entry||overlay?.hidden||overlay?.getAttribute('aria-hidden')!=='false'||
       document.getElementById('ww11-discover-page-track')?.dataset.page!=='widgets')return false;
    const r=entry.slot.getBoundingClientRect();
    if(r.width<20||r.height<20)return false;
    const hovered=clientX>=r.left-24 && clientX<=r.right+24 &&
                  clientY>=r.top-24 && clientY<=r.bottom+24;
    const floating=entry.shell.getBoundingClientRect();
    const sharedWidth=Math.max(0,Math.min(r.right,floating.right)-Math.max(r.left,floating.left));
    const sharedHeight=Math.max(0,Math.min(r.bottom,floating.bottom)-Math.max(r.top,floating.top));
    return hovered || (sharedWidth*sharedHeight>r.width*r.height*.30);
  }
  function dock(type){
    const entry=detached.get(type);if(!entry)return;
    clearHint();
    entry.widget.classList.remove('ww11-desktop-widget');
    entry.widget.setAttribute('aria-label',(type==='time'?'Time':'Weather')+' widget');
    entry.slot.replaceWith(entry.widget);
    entry.shell.remove();
    detached.delete(type);
    save();notify();
  }
  function startDrag(event,type){
    if(event.button!==0||event.isPrimary===false||event.target.closest('button,a,input,textarea,select'))return;
    const widget=originals[type];if(!widget)return;
    if(dragging)return;
    const entry=detached.get(type);
    const rect=(entry?entry.shell:widget).getBoundingClientRect();
    if(rect.width<10||rect.height<10)return;
    const origin={x:event.clientX,y:event.clientY};
    const offsetX=clamp(origin.x-rect.left,0,rect.width);
    const offsetY=clamp(origin.y-rect.top,0,rect.height);
    let moved=false,current=entry;
    const startPosition=entry?{
      x:parseFloat(entry.shell.style.left)||8,
      y:parseFloat(entry.shell.style.top)||8
    }:null;
    const id=event.pointerId;
    dragging=type;
    event.preventDefault();
    function move(e){
      if(e.pointerId!==id)return;
      if(!moved&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)<6)return;
      if(!moved){
        moved=true;
        current=current||detach(type,rect);
        if(!current)return;
        layer.classList.add('is-dragging');
        current.shell.classList.add('is-dragging');
      }
      place(current.shell,e.clientX-offsetX,e.clientY-offsetY);
      current.slot.classList.toggle('is-dock-target',canDock(type,e.clientX,e.clientY));
    }
    function finish(e){
      if(e.pointerId!==id)return;
      document.removeEventListener('pointermove',move,true);
      document.removeEventListener('pointerup',finish,true);
      document.removeEventListener('pointercancel',finish,true);
      dragging=null;
      layer.classList.remove('is-dragging');
      if(current)current.shell.classList.remove('is-dragging');
      const canceled=e.type==='pointercancel';
      if(moved&&current){
        if(!canceled&&canDock(type,e.clientX,e.clientY)){
          dock(type);
        }else if(canceled&&!entry){
          // Canceling a new detach restores its original slot.
          dock(type);
        }else{
          if(canceled&&startPosition)place(current.shell,startPosition.x,startPosition.y);
          current.slot.classList.remove('is-dock-target');
          save();notify();
        }
      }
    }
    document.addEventListener('pointermove',move,true);
    document.addEventListener('pointerup',finish,true);
    document.addEventListener('pointercancel',finish,true);
  }
  for(const type of types){
    const widget=originals[type];if(!widget)continue;
    const heading=widget.querySelector('.ww11-widget-card-heading');
    widget.addEventListener('pointerdown',event=>startDrag(event,type));
    if(heading)heading.title='Drag to desktop or return to Widgets';
    const coords=saved[type];
    if(coords&&Number.isFinite(coords.x)&&Number.isFinite(coords.y)){
      const entry=detach(type);
      if(entry)place(entry.shell,coords.x,coords.y);
    }
  }
  window.addEventListener('resize',()=>{
    for(const entry of detached.values()){
      const dockedWidth=entry.slot.getBoundingClientRect().width;
      entry.shell.style.width=Math.min(dockedWidth>20?dockedWidth:entry.baseWidth,innerWidth-24)+'px';
      place(entry.shell,parseFloat(entry.shell.style.left)||8,parseFloat(entry.shell.style.top)||8);
    }
    save();
  },{passive:true});
  // Keep the older API surface, but make removal mean "return to its slot".
  window.WebWindows11WidgetDesktop={
    hasActive:type=>detached.has(type),
    remove:type=>dock(type),
    show:type=>{
      if(!types.includes(type))return;
      const entry=detach(type);
      if(entry){place(entry.shell,innerWidth/2-200,innerHeight/2-90);save();notify();}
    },
    dock
  };
  notify();
})();
