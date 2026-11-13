/* OPTIONAL Cloudflare Worker for WebWindows 10H10 news.
 * Deploy this as a Worker and set <meta name="webwindows-news-endpoint"
 * content="https://YOUR-WORKER.workers.dev/news"> in Index.html.
 * Keeps GDELT requests cached at the edge instead of requesting separately
 * from every visitor. This is not required for the direct-fetch fallback.
 */
const SOURCE = 'https://api.gdeltproject.org/api/v2/doc/doc';
const CACHE_SECONDS = 20 * 60;
const QUERY = new URLSearchParams({
  query: '(technology OR science OR business) sourcelang:english',
  mode: 'artlist', format: 'json', sort: 'datedesc', timespan: '48h', maxrecords: '20'
});
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type',
  'Vary': 'Origin'
};
const jsonResponse = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors, ...extra }
});

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
    if (request.method !== 'GET' || url.pathname !== '/news')
      return jsonResponse({error:'not_found'},404);
    const cacheKey = new Request(`${url.origin}/news`,{method:'GET'});
    const cache = caches.default;
    const stored = await cache.match(cacheKey);
    if (stored) {
      const result = new Response(stored.body,stored);
      result.headers.set('X-WebWindows-Cache','HIT');
      return result;
    }
    let upstream;
    try {
      upstream = await fetch(`${SOURCE}?${QUERY.toString()}`,{
        headers: {'Accept':'application/json'},
        cf:{cacheTtl:0}
      });
    } catch {
      return jsonResponse({error:'upstream_unavailable'},503,{'Retry-After':'300'});
    }
    if (!upstream.ok) {
      return jsonResponse({error:upstream.status===429?'rate_limited':'upstream_unavailable'},
        upstream.status===429?429:503, {'Retry-After':upstream.headers.get('Retry-After')||'300'});
    }
    let payload;
    try { payload = JSON.parse(await upstream.text()); } catch {
      return jsonResponse({error:'invalid_response'},503,{'Retry-After':'300'});
    }
    if (!Array.isArray(payload?.articles)||!payload.articles.length)
      return jsonResponse({error:'no_articles'},503,{'Retry-After':'300'});
    // Return only source article metadata. The browser sanitizes URL/title text.
    const articles=payload.articles.slice(0,20);
    const response=jsonResponse({articles},200,{'Cache-Control':`public, max-age=${CACHE_SECONDS}`,'X-WebWindows-Cache':'MISS'});
    ctx.waitUntil(cache.put(cacheKey,response.clone()));
    return response;
  }
};
