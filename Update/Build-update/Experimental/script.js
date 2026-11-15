/* WebWindows 11H11: one JavaScript entrypoint for desktop, Start, News, Search, and Settings. */


/* Embedded Phosphor vectors. Icons inherit currentColor from the active glass theme. */
window.WebWindows11Icons = Object.freeze({
  make(name, className='') {
    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
    icon.setAttribute('class',`${className} ww-ph-icon`.trim());
    icon.setAttribute('aria-hidden','true');
    icon.setAttribute('focusable','false');
    const use=document.createElementNS('http://www.w3.org/2000/svg','use');
    use.setAttribute('href',`#ww-ph-${name}`);
    icon.append(use);
    return icon;
  },
  html(name,className='') {
    return `<svg class="${className} ww-ph-icon" aria-hidden="true" focusable="false"><use href="#ww-ph-${name}"></use></svg>`;
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

  window.WebWindows11Start={show,hide,isOpen:()=>isOpen,refreshAccount:loadAccountIdentity};
})();


/* === Publisher news only in Start (not in Search) === */
/* WebWindows 11H11 · Reused GDELT DOC 2.0 from the 10H10 news implementation.
 * A local cache protects the Start/news widget during rate limits and outages.
 * The optional news endpoint meta tag can point to a shared caching proxy.
 * No fabricated articles are inserted on an upstream failure.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const newsGrid = $('ww10-start-news-grid');
  const feedStatus = $('ww10-news-update-status');
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
    if (feedStatus) feedStatus.textContent = !topFour.length
      ? (inFlight?'Updating…':'Unavailable')
      : (isStale()?'Saved headlines':'');
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
  const APP_ICONS = [
    {name:'Settings', id:'s5NUIabJrb4C', svg:'gear-six.svg', keywords:'preferences personalize settings'},
    {name:'Get Started', id:'4aFn3qEdMNQO', svg:'app-window.svg', keywords:'get started welcome intro guide setup'},
    {name:'Windows Security', id:'oo5voXhXsnEk', svg:'shield-check.svg', keywords:'defender protection security'},
    {name:'About', id:'IerOpHeUt2OH', svg:'user.svg', keywords:'about system windows'}
  ];
  const clean = value => String(value || '').trim().toLocaleLowerCase();
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
  function iconFor(data) {
    const wrap = document.createElement('span');
    wrap.className = 'search-result-icon';
    wrap.setAttribute('aria-hidden','true');
    const fallbackName=(data.fallbackAsset||'').match(/^assets\/phosphor\/([\w-]+)\.svg$/)?.[1]
      || (!data.fallbackAsset ? String(data.svg||'magnifying-glass.svg').replace(/\.svg$/,'') : null);
    const fallback = fallbackName
      ? window.WebWindows11Icons.make(fallbackName,'search-icon-fallback')
      : document.createElement('img');
    if(!fallbackName){
      fallback.className='search-icon-fallback';
      fallback.alt='';fallback.draggable=false;
      fallback.src=data.fallbackAsset;
    }
    if (data.id || data.iconUrl) {
      const remote = document.createElement('img');
      remote.className = 'search-icon-remote';
      remote.alt = '';
      remote.draggable = false;
      remote.decoding = 'async';
      const update = async () => {
        remote.classList.remove('is-loaded');
        if (!remote.naturalWidth || !remote.naturalHeight) return;
        try { await remote.decode(); if (remote.isConnected) remote.classList.add('is-loaded'); }
        catch { /* Bundled semantic icon stays visible. */ }
      };
      remote.addEventListener('load',update);
      remote.addEventListener('error',()=>remote.classList.remove('is-loaded'));
      wrap.append(remote,fallback);
      remote.src = data.iconUrl || `https://img.icons8.com/?size=100&id=${encodeURIComponent(data.id)}&format=png&color=000000`;
      if (remote.complete) update();
    } else wrap.append(fallback);
    return wrap;
  }
  function addRow({title,meta,icon,go,inactive=false}) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'search-result';
    row.setAttribute('role','listitem');
    if (inactive) row.dataset.inactive = 'true';
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
    row.addEventListener('click',go);
    results.append(row);
    matching.push(row);
    return row;
  }
  function selectApp(app) {
    if (app.name==='Settings') {
      close();window.WebWindows11Settings?.open('home');return;
    }
    if (app.name==='Get Started') {
      close();window.WebWindows11GetStarted?.open();return;
    }
    // Unfinished apps remain search-only rather than fabricating windows.
    input.value = app.name;
    render();
    input.focus({preventScroll:true});
  }
  function render() {
    loadHistory();
    results.replaceChildren();
    matching = [];
    exactMatch = null;
    const query = clean(input.value);
    let apps = APP_ICONS.filter(a => !query || clean(`${a.name} ${a.keywords}`).includes(query));
    const mode=window.WebWindows11Preferences?.searchResultsMode||'all';
    if(!query && mode==='recent') apps=[];
    if(!query && mode==='frequent') apps=apps.slice().sort((a,b)=>{
      const get=n=>{try{return Number(localStorage.getItem('webwindows.11h11.used.'+clean(n))||0)}catch{return 0}};
      return get(b.name)-get(a.name);
    });
    const recents = history.filter(q => (!query || clean(q).includes(query)) && !apps.some(a=>clean(a.name)===clean(q))).slice(0,6);
    // Search Settings and working desktop controls instead of news articles.
    const shortcuts = [
      {name:'Personalization', detail:'Settings · Wallpaper and themes', iconUrl:'https://img.icons8.com/fluency/48/paint-palette.png', fallbackAsset:'Assets/ww11-fluent/personalization.svg', keywords:'wallpaper theme desktop background customize upload image', section:'personalization'},
      {name:'Accounts', detail:'Settings · Account name and profile image', svg:'user.svg', keywords:'account profile user photo display name', section:'accounts'}
    ].filter(item=>query?clean(`${item.name} ${item.keywords}`).includes(query):true);

    for (const app of apps) {
      const go = () => {
        try{const k='webwindows.11h11.used.'+clean(app.name);localStorage.setItem(k,String(Number(localStorage.getItem(k)||0)+1))}catch{}
        selectApp(app);
      };
      addRow({title:app.name,meta:'System · App',icon:app,inactive:!['Settings','Get Started'].includes(app.name),go});
      if (query && query === clean(app.name)) exactMatch = go;
    }
    for (const title of recents) {
      addRow({title,meta:'Recently searched',icon:{svg:'clock-counter-clockwise-light.svg'},go:()=>{
        input.value=title;render();input.focus({preventScroll:true});
      }});
    }
    for (const action of shortcuts) {
      const go=()=>{
        if (action.section) {close();window.WebWindows11Settings?.open(action.section);}
        else action.run?.();
      };
      addRow({title:action.name,meta:action.detail,icon:action,go});
      if(query===clean(action.name)) exactMatch=go;
    }
    empty.hidden = matching.length > 0;
    empty.textContent = 'No results found.';
    openButton.hidden = !exactMatch;
    openButton.disabled = !exactMatch;
    if (opened) resize();
  }
  // Match 10H10's compact content-dependent Search height, up to 560px.
  function resize() {
    if (!opened) return;
    const style = getComputedStyle(panel);
    const padding = (parseFloat(style.paddingTop)||0)+(parseFloat(style.paddingBottom)||0);
    const gap = parseFloat(style.rowGap) || 0;
    const composer = panel.querySelector('.search-panel-composer')?.offsetHeight || 82;
    const content = matching.length ? results.scrollHeight : empty.scrollHeight;
    const maxHeight = Math.min(innerWidth<=520 ? 520 : 560,
      innerHeight-parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height'))-22);
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
  let previewNode=null, galleryNode=null, statusNode=null, uploadNode=null;
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
    black:{label:'Black',rgb:[27,27,27]}
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
      if(node){node.value=String(val);node.style.setProperty('--range-progress',`${100*val/Number(node.max||100)}%`)}
      const label=document.getElementById(output);if(label)label.textContent=val+'%';
    };
    checkbox('ww11-auto-accent',autoAccent);
    checkbox('ww11-shadows',glassState.shadows);
    checkbox('ww11-hdr',glassState.hdr);
    document.querySelectorAll('[data-ww11-hdr-adjustment]').forEach(node=>{node.disabled=!glassState.hdr});
    picker('ww11-custom-accent',activeAccent);
    picker('ww11-custom-glass',glassState.customColor);
    const label=document.getElementById('ww11-custom-glass-value');
    if(label)label.textContent=glassState.color==='custom'?glassState.customColor.toUpperCase():'Custom';
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
  function setMessage(message,type=''){
    if (!statusNode) return;
    statusNode.textContent=message;
    statusNode.dataset.status=type;
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
      if(statusNode)setMessage(error.message||'Uploaded wallpapers are unavailable.','error');
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
          <p class="ww-theme-status" id="ww-theme-status" aria-live="polite" role="status"></p>
        </div>
      </div>
      <div class="ww11-personalization-options" aria-label="Additional Personalization options">
        <button class="ww11-personalization-option ww11-colors-link" id="ww11-open-colors" type="button" aria-label="Open Colors">
          <svg class="ph ph-palette ww-ph-icon"  focusable="false" aria-hidden="true"><use href="#ww-ph-palette"></use></svg>
          <span>Colors</span>
          <svg class="ww11-option-chevron" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="ww11-personalization-option" type="button" disabled aria-disabled="true" title="Desktop appearance is not yet available">
          <svg class="ph ph-desktop ww-ph-icon"  focusable="false" aria-hidden="true"><use href="#ww-ph-desktop"></use></svg>
          <span>Desktop appearance</span>
        </button>
      </div>`;
    previewNode=document.getElementById('ww-desktop-live-preview');
    galleryNode=document.getElementById('ww-theme-gallery');
    statusNode=document.getElementById('ww-theme-status');
    uploadNode=document.getElementById('ww-theme-file-input');
    previewNode.style.backgroundImage=`url(${JSON.stringify(currentWallpaper)})`;
    uploadNode.addEventListener('change',()=>uploadFiles(uploadNode.files));
    renderGallery();
    document.getElementById('ww11-open-colors').addEventListener('click',()=>navigate('colors'));
  }
  const homeBanner=document.getElementById('ww-settings-home-banner');
  function renderColors(){
    heading.textContent='Colors';
    previewNode=null;galleryNode=null;statusNode=null;uploadNode=null;
    const accentOptions=[
      ['#0078d4','Windows blue'],['#e81123','Red'],['#107c10','Green'],
      ['#662278','Purple'],['#ff8c00','Orange'],['#0067b8','Dark blue']
    ];
    const arrow='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 9 7 7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const accentChips=accentOptions.map(([color,name])=>`<button type="button" class="ww11-color-choice" data-ww11-accent-color="${color}" style="--choice:${color}" aria-label="${name} accent" aria-pressed="false"><span aria-hidden="true">✓</span></button>`).join('');
    const glassChips=Object.entries(GLASS_PRESETS).map(([id,info])=>`<button type="button" class="ww11-color-choice ww11-glass-choice" data-ww11-glass-color="${id}" title="${info.label}" aria-label="${info.label} glass color" aria-pressed="false" style="--choice:rgb(${info.rgb.join(',')})"><span aria-hidden="true">✓</span></button>`).join('');
    section.innerHTML=`
      <div class="ww11-colors-page">
        <button type="button" class="ww11-colors-back" id="ww11-colors-back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 5-7 7 7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Personalization</span></button>
        <p class="ww11-colors-description">Customize accent colors, glass materials, and visual effects.</p>
        <div class="ww11-colors-flyouts">
          <div class="ww11-colors-accordion" id="ww11-colors-accordion">
            <button type="button" class="ww11-colors-disclosure" id="ww11-colors-disclosure" aria-expanded="false" aria-controls="ww11-colors-panel"><span><strong>Colors &amp; transparency effects</strong><small>Accent color, glass surface color, and opacity</small></span>${arrow}</button>
            <div id="ww11-colors-panel" class="ww11-colors-panel" role="region" aria-label="Colors and transparency effects" hidden>
              <label class="ww11-colors-card ww11-colors-toggle-row" for="ww11-auto-accent"><span><strong>Automatic accent color</strong><small>Extract an accent color from the selected desktop wallpaper</small></span><input id="ww11-auto-accent" type="checkbox" class="ww11-switch" /></label>
              <div class="ww11-colors-card"><div class="ww11-colors-card-text"><strong>Manual accent color</strong><small>Choose a preset or pick an exact accent color</small></div><div class="ww11-choice-row" role="group" aria-label="Manual accent color">${accentChips}<label class="ww11-color-edit" title="Choose a custom accent color"><input id="ww11-custom-accent" type="color" aria-label="Custom accent color"/><span>Custom accent</span></label></div></div>
              <div class="ww11-colors-card"><div class="ww11-colors-card-text"><strong>Glass surface color</strong><small>Choose a preset or edit a custom tint. All windows update immediately.</small></div><div class="ww11-choice-row" role="group" aria-label="Glass surface color">${glassChips}<label class="ww11-color-edit" title="Choose a custom glass color"><input id="ww11-custom-glass" type="color" aria-label="Custom glass color"/><span id="ww11-custom-glass-value">Custom</span></label></div></div>
              <div class="ww11-colors-card ww11-opacity-row"><label class="ww11-colors-card-text" for="ww11-opacity"><strong>Glass opacity</strong><small>Primary Mica opacity across the desktop and open apps</small></label><div class="ww11-opacity-controls"><input type="range" id="ww11-opacity" min="0" max="100" step="1" aria-label="Glass opacity" /><output id="ww11-opacity-value" for="ww11-opacity">90%</output></div></div>
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
      trigger.addEventListener('click',()=>{
        const expanding=trigger.getAttribute('aria-expanded')!=='true';
        trigger.setAttribute('aria-expanded',String(expanding));
        panel.hidden=!expanding;
        panel.classList.remove('ww11-colors-reveal');
        if(expanding&&!reducedMotion.matches){void panel.offsetWidth;panel.classList.add('ww11-colors-reveal')}
      });
    });
    document.getElementById('ww11-auto-accent').addEventListener('change',e=>setAutomaticAccent(e.currentTarget.checked));
    section.querySelectorAll('[data-ww11-accent-color]').forEach(button=>button.addEventListener('click',()=>{
      setAutomaticAccent(false);
      setAccent(button.dataset.ww11AccentColor);
      syncColorsForm();
    }));
    section.querySelectorAll('[data-ww11-glass-color]').forEach(button=>button.addEventListener('click',()=>{
      glassState.color=button.dataset.ww11GlassColor;applyGlassState();
    }));
    document.getElementById('ww11-custom-accent').addEventListener('input',e=>{
      setAutomaticAccent(false);setAccent(e.currentTarget.value);syncColorsForm();
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
    previewNode=null;galleryNode=null;statusNode=null;uploadNode=null;
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
    previewNode=null;galleryNode=null;statusNode=null;uploadNode=null;
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
        <p id="ww11-account-feedback" role="status" aria-live="polite" class="ww11-account-feedback" hidden></p>
      </div>`;
    const name=document.getElementById('ww11-account-display-name');
    const input=document.getElementById('ww11-account-name-input');
    const picture=document.getElementById('ww11-account-picture');
    const form=document.getElementById('ww11-account-name-form');
    const feedback=document.getElementById('ww11-account-feedback');
    const chooser=document.getElementById('ww11-account-file');
    const showFeedback=(message,isError=false)=>{
      feedback.hidden=false;feedback.textContent=message;
      feedback.classList.toggle('is-error',isError);
    };
    name.textContent=profileName(profile);
    input.value=profileName(profile);
    picture.src=profilePhoto(profile);
    picture.onerror=()=>{if(!picture.src.endsWith('/Assets/account-avatar.png'))picture.src='Assets/account-avatar.png';};
    form.addEventListener('submit',event=>{
      event.preventDefault();const nextName=input.value.trim().replace(/\s+/g,' ').slice(0,48);
      if(!nextName){input.focus();showFeedback('Enter an account name.',true);return;}
      try{saveProfile({name:nextName});name.textContent=nextName;input.value=nextName;feedback.hidden=true;feedback.textContent='';}
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
    if(!['home','personalization','colors','accounts'].includes(route))return;
    const previousRoute=current;
    if(route!==current && !routeHistoryTraversal){
      routeHistory.splice(routeHistoryIndex+1);
      routeHistory.push(route);
      routeHistoryIndex=routeHistory.length-1;
    }
    syncRouteHistory();
    const routeIndex={home:0,personalization:1,colors:2,accounts:3};
    win.dataset.wuaRouteMotion=routeIndex[route]<routeIndex[previousRoute]?'back':'forward';
    current=route;
    nav.forEach(btn=>{
      const active=btn.dataset.wwSettingsNav===(route==='colors'?'personalization':route);
      btn.classList.toggle('is-active',active);
      if(active)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
    });
    if(route==='home')renderHome();
    else {homeBanner.hidden=true;if(route==='accounts')renderAccounts();else if(route==='colors')renderColors();else renderPersonalization();}
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
    search.setAttribute('aria-expanded','false');
  }
  function hideWindow(){
    overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
    document.querySelectorAll('[data-ww11-open-settings]').forEach(node=>node.setAttribute('aria-expanded','false'));
    closeSearchResults();
    previewNode=null;galleryNode=null;statusNode=null;uploadNode=null;
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
    if(!wasOpen || route!==current)navigate(['home','personalization','colors','accounts'].includes(route)?route:'home');
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
  search.addEventListener('input',()=>{
    const value=search.value.trim().toLowerCase();
    searchResults.replaceChildren();
    if(!value){closeSearchResults();return;}
    if('system home device name computer'.includes(value)){
      const button=document.createElement('button');button.type='button';button.setAttribute('role','option');
      button.innerHTML=`${ph('house')}<span>System</span>`;
      button.addEventListener('click',()=>{search.value='';navigate('home');});searchResults.append(button);
    }else if('personalization wallpaper background image'.includes(value)){
      const button=document.createElement('button');
      button.type='button';button.setAttribute('role','option');
      button.innerHTML=`<img class="ww-settings-inline-svg" src="Assets/ww11-fluent/personalization.svg" alt="" aria-hidden="true"><span>Personalization</span>`;
      button.addEventListener('click',()=>{search.value='';navigate('personalization');});
      searchResults.append(button);
    }else if('colors accent glass transparency opacity material'.includes(value)){
      const button=document.createElement('button');button.type='button';button.setAttribute('role','option');
      button.innerHTML=`<svg class="ww-settings-inline-svg ww-ph-icon"  focusable="false" aria-hidden="true"><use href="#ww-ph-palette"></use></svg><span>Colors &amp; transparency effects</span>`;
      button.addEventListener('click',()=>{search.value='';navigate('colors')});searchResults.append(button);
    }else if('accounts profile account name photo picture avatar'.includes(value)){
      const button=document.createElement('button');button.type='button';button.setAttribute('role','option');
      button.innerHTML=`${ph('user')}<span>Accounts</span>`;
      button.addEventListener('click',()=>{search.value='';navigate('accounts');});
      searchResults.append(button);
    }else{
      const message=document.createElement('p');message.textContent='No matching settings';searchResults.append(message);
    }
    searchResults.hidden=false;search.setAttribute('aria-expanded','true');
  });
  search.addEventListener('keydown',event=>{
    if(event.key==='Escape'){search.value='';closeSearchResults();event.stopPropagation();}
    if(event.key==='Enter')searchResults.querySelector('button')?.click();
  });
  document.addEventListener('pointerdown',event=>{
    if(!event.target.closest('.ww-settings-search-wrap'))closeSearchResults();
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
  window.WebWindows11Settings={open,close,minimize,isOpen:()=>opened,isRunning:()=>opened||minimized,navigate};
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
  let openState=false,minimized=false,focused=false,maximized=false,step=0,lastRect=null,drag=null;
  // Each action either opens a working feature or continues the guide. Other app
  // shortcuts have intentionally not been presented as operational setup steps.
  const pages=[
    {heading:()=>`Welcome back, ${displayName()}`,description:"Let's make WebWindows 11H11 feel like yours. This short tour shows you the features that are ready to use.",button:'Get started'},
    {heading:'Get to know Start',description:'Start brings your apps and the latest news together in one place.',tips:['Open Start from the taskbar or with Ctrl + Esc.','Return to Get Started from the taskbar after exploring.'],button:'Explore Start',preview:'start'},
    {heading:'Choose your wallpaper',description:'Give your desktop a personal look in Settings → Personalization.',tips:['Add your own pictures to the six wallpaper slots.','Select an image to apply it immediately.'],button:'Open Personalization',settings:'personalization'},
    {heading:'Make the glass yours',description:'Pick an accent, select a glass color, and adjust transparency to suit your wallpaper.',tips:['Choose preset colors or create your own tint.','Control opacity and secondary surface transparency.'],button:'Customize colors',settings:'colors'},
    {heading:'Adjust visual effects',description:'Tune lighting and window effects without changing your chosen glass color.',tips:['Adjust HDR intensity and highlight bloom.','Enable or disable window shadows.'],button:'Open visual effects',settings:'colors',flyout:'ww11-visual-effects-disclosure'},
    {heading:'Set up your profile',description:'Make the Start menu and Settings identify this desktop as yours.',tips:['Change your display name.','Choose a profile picture from your device.'],button:'Edit profile',settings:'accounts'},
    {heading:'Find things quickly',description:'Search apps, pages, and Settings from the taskbar instead of navigating by hand.',tips:['Use Ctrl + K to jump straight into Search.','Return to Get Started from the taskbar to continue.'],button:'Try Search',preview:'search'},
    {heading:'Stay in the loop',description:'Start also includes a news area for discovering current headlines.',tips:['News cards size themselves to their contents.','Select a story to visit its source.'],button:'Continue'},
    {heading:"You're ready to go",description:'Your desktop is ready. You can revisit this tour or keep customizing whenever you like.',tips:['Changes to personalization are saved automatically.','Get Started is always available from Start or Search.'],button:'Finish',finish:true}
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
    label.textContent=step===last?'Setup complete':`Step ${step} of ${last-1}`;
    skip.hidden=step===last;
    prev.disabled=step===0;next.disabled=step===last;
    progress.textContent=step===0?'Welcome':step===last?'Complete':`${step} / ${last-1}`;
    track.setAttribute('aria-valuemax',String(last));
    track.setAttribute('aria-valuenow',String(step));
    track.setAttribute('aria-valuetext',step===last?'Complete':`${step} of ${last}`);
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
  function toggleMax(force){
    const next=typeof force==='boolean'?force:!maximized;
    if(next===maximized)return;
    if(next){lastRect=win.getBoundingClientRect();win.style.left='';win.style.top='';win.style.width='';win.style.height='';win.style.transform='';}
    maximized=next;win.classList.toggle('is-maximized',maximized);
    if(!next && lastRect){win.style.transform='none';win.style.left=lastRect.left+'px';win.style.top=lastRect.top+'px';win.style.width=lastRect.width+'px';win.style.height=lastRect.height+'px';}
    maxButton.innerHTML=maximized?restoreSvg:maxSvg;
    maxButton.title=maximized?'Restore':'Maximize';maxButton.setAttribute('aria-label',`${maxButton.title} Get Started`);
  }
  maxButton.addEventListener('click',()=>toggleMax());
  titlebar.addEventListener('dblclick',e=>{if(!e.target.closest('button'))toggleMax();});
  titlebar.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.target.closest('button'))return;
    foreground();
    if(maximized)return;
    const rect=win.getBoundingClientRect();
    drag={id:e.pointerId,rect,startX:e.clientX,startY:e.clientY};
    titlebar.setPointerCapture(e.pointerId);
  });
  titlebar.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const {rect}=drag;
    win.style.transform='none';
    win.style.left=Math.max(0,Math.min(innerWidth-rect.width,rect.left+e.clientX-drag.startX))+'px';
    win.style.top=Math.max(0,Math.min(innerHeight-rect.height,rect.top+e.clientY-drag.startY))+'px';
    win.style.width=rect.width+'px';win.style.height=rect.height+'px';
  });
  const stopDrag=e=>{if(drag?.id===e.pointerId){drag=null;if(titlebar.hasPointerCapture(e.pointerId))titlebar.releasePointerCapture(e.pointerId);}};
  titlebar.addEventListener('pointerup',stopDrag);titlebar.addEventListener('pointercancel',stopDrag);
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
  const alignAll = () => {
    alignFlyout(start,$('start-toggle'));
    alignFlyout(search,$('taskbar-search-shell'));
  };
  alignAll();
  window.addEventListener('resize',alignAll,{passive:true});
  window.addEventListener('webwindows:start-preopening',alignAll);
  window.addEventListener('webwindows:search-opening',alignAll);
  window.addEventListener('webwindows:taskbar-context-changed',alignAll);

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

  /* Reusable, accessible InfoBar. Only actual 11H11 news/account events use it. */
  const host=document.createElement('div');
  host.id='wua-infobar-host';
  host.setAttribute('role','region');
  host.setAttribute('aria-label','Application notices');
  document.querySelector('.desktop')?.append(host);
  const iconSvg=tone => tone==='success'
    ?'<svg class="wua-infobar-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m7.8 12.2 2.7 2.7 5.8-6"/></svg>'
    :'<svg class="wua-infobar-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.4v.3"/></svg>';
  const xSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19"/></svg>';
  let lastNewsNotice=0;
  function showInfo(title,message,tone='info',timeoutMs=8000) {
    if(!host?.isConnected)return;
    const item=document.createElement('div');
    item.className='wua-infobar';
    item.dataset.tone=tone;
    item.setAttribute('role',tone==='error'?'alert':'status');
    const icon=document.createElement('div');icon.innerHTML=iconSvg(tone);
    const copy=document.createElement('div');copy.className='wua-infobar-text';
    const label=document.createElement('strong');label.textContent=title;
    const body=document.createElement('p');body.textContent=message;
    copy.append(label,body);
    const dismiss=document.createElement('button');dismiss.type='button';dismiss.title='Dismiss';dismiss.setAttribute('aria-label','Dismiss notification');dismiss.innerHTML=xSvg;
    let timer=null;
    const close=()=>{
      clearTimeout(timer);
      if(!item.isConnected)return;
      if(reduced.matches){item.remove();return;}
      item.classList.add('is-dismissed');
      item.addEventListener('animationend',()=>item.remove(),{once:true});
      setTimeout(()=>item.remove(),250);
    };
    dismiss.addEventListener('click',close);
    item.append(icon,copy,dismiss);
    host.prepend(item);
    // No stacked-news/error flood. Preserve at most two simultaneous notices.
    while(host.children.length>2)host.lastElementChild.remove();
    if(timeoutMs>0)timer=setTimeout(close,timeoutMs);
    return close;
  }
  window.WebWindows11InfoBar={show:showInfo};
  window.addEventListener('webwindows:news-error',event=>{
    if(!window.WebWindows11Start?.isOpen?.())return;
    const now=Date.now();
    if(now-lastNewsNotice<60000)return;
    lastNewsNotice=now;
    showInfo('News could not refresh',event.detail?.hasSavedArticles
      ?'Previously saved headlines are still available.'
      :'Headlines are temporarily unavailable. Try reopening Start later.','error',9000);
  });
  let previousAccountFeedback='';
  function observeAccountFeedback(){
    const status=$('ww11-account-feedback');
    if(!status||status.dataset.wuaObserved)return;
    status.dataset.wuaObserved='true';
    const render=()=>{
      const message=status.textContent?.trim()||'';
      if(status.hidden||!message||message===previousAccountFeedback)return;
      previousAccountFeedback=message;
      showInfo(status.classList.contains('is-error')?'Account change failed':'Account updated',message,
        status.classList.contains('is-error')?'error':'success',6500);
    };
    new MutationObserver(render).observe(status,{attributes:true,attributeFilter:['hidden','class'],childList:true,subtree:true,characterData:true});
  }
  window.addEventListener('webwindows:settings-route',event=>{
    if(event.detail?.route==='accounts')observeAccountFeedback();
  });

  /* TeachingTip is contextual and one-time; it describes existing Settings
     search without pretending disabled categories are operational. */
  const TIP_KEY='webwindows.11h11.winui-advanced.settings-tip.dismissed';
  const getTipDismissed=()=>{try{return localStorage.getItem(TIP_KEY)==='true';}catch{return false;}};
  function maybeShowTip(){
    if(!active(settingsOverlay)||getTipDismissed()||settingsWindow?.getBoundingClientRect().width<740)return;
    const holder=document.querySelector('.ww-settings-profile');
    if(!holder||document.getElementById('wua-settings-tip'))return;
    const tip=document.createElement('div');tip.className='wua-teaching-tip';tip.id='wua-settings-tip';
    const body=document.createElement('div');
    const title=document.createElement('strong');title.textContent='Find Settings faster';
    const note=document.createElement('p');note.textContent='Use the titlebar search to find personalization, colors or account settings.';
    body.append(title,note);
    const close=document.createElement('button');close.type='button';close.title='Dismiss tip';close.setAttribute('aria-label','Dismiss Settings tip');close.innerHTML=xSvg;
    close.addEventListener('click',()=>{
      try{localStorage.setItem(TIP_KEY,'true');}catch{}
      tip.remove();
    });
    tip.append(body,close);holder.insertAdjacentElement('afterend',tip);
  }
  // Retain the opt-in TeachingTip component, but do not inject it into the
  // Settings sidebar automatically on every first opening. This avoids a
  // surprise card and respects the application's established layout.
  window.WebWindows11TeachingTip={show:maybeShowTip};
  // Remove the contextual tip if navigation becomes too narrow for text.
  if(settingsWindow && 'ResizeObserver' in window) {
    new ResizeObserver(entries=>{
      if(entries[0].contentRect.width<740)document.getElementById('wua-settings-tip')?.remove();
    }).observe(settingsWindow);
  }
})();
