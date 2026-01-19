// ============================================
// index.js - 修改版（支持 Vue 前端）
// ============================================

import {
  proxyTelegramImage,
  handleDetail,
  handleApiPosts,
  handleBgRandom,
  handleArtists,
  handleArtistProfile,
  handleArtistProfileAPI
} from './logic.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ✅ CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // 1) 域名修正
    if (url.hostname === 'www.mtcacg.top') {
      url.hostname = 'mtcacg.top';
      return Response.redirect(url.toString(), 301);
    }

    // 2) 图片代理
    if (path.startsWith('/image/')) {
      const cache = caches.default;
      let response = await cache.match(request);

      if (!response) {
        const fileId = path.replace('/image/', '');
        const dlExt = url.searchParams.get('dl');
        response = await proxyTelegramImage(fileId, env.BOT_TOKEN, dlExt);

        if (response.status === 200) {
          ctx.waitUntil(cache.put(request, response.clone()));
        }
      }
      return response;
    }

    // ✅ 3) API：详情 JSON（必须在 /detail/:id 之前）
    if (path.startsWith('/api/detail/')) {
      const id = path.replace('/api/detail/', '');
      return await handleDetail(id, env, url);
    }

    if (path.startsWith('/api/artist/')) {
      const artistName = path.replace('/api/artist/', '');
      return await handleArtistProfileAPI(artistName, url, env); // ✅ 传入 url 才能读 query
    }


    // ✅✅ 5) API：画师名人堂 JSON（关键修复点）
    // 你 Worker 只绑了 /api/*，所以名人堂接口必须放到 /api 下面
    if (path === '/api/artists') {
      return await handleArtists(url, env);
    }

    // 6) API：帖子 / 背景
    if (path === '/api/posts') {
      return await handleApiPosts(url, env);
    }

    if (path === '/api/bg_all') {
      return await handleBgRandom(true, url, env);
    }

    if (path === '/api/bg_safe') {
      return await handleBgRandom(false, url, env);
    }

    // ⚠️ 下面这些页面路由（/detail、/artist、/artists）在“Vue 前端模式”下通常不会走到 Worker
    // 因为你 Worker routes 没有绑定这些路径（而且也不应该绑定，避免抢走前端页面）

    // 7) 详情页（旧 HTML 模式，保留兼容/调试）
    const detailMatch = path.match(/^\/detail\/(.+)$/);
    if (detailMatch) {
      return await handleDetail(detailMatch[1], env, url);
    }

    // 8) 画师路由（旧模式：只有当你把 /artists 绑定到 Worker 才会触发）
    if (path === '/artists') {
      return await handleArtists(url, env);
    }

    const artistMatch = path.match(/^\/artist\/(.+)$/);
    if (artistMatch) {
      return await handleArtistProfile(artistMatch[1], url, env);
    }

    // 9) 访问 Worker 根域提示
    if (path === '/about' || path === '/r18' || path === '/') {
      return new Response(JSON.stringify({
        message: "Please visit the Vue frontend",
        api_endpoints: {
          posts: "/api/posts?q=keyword",
          random: "/api/posts?q=random",
          detail: "/api/detail/{id}",
          artists: "/api/artists?format=json",   // ✅ 改这里：提示用 /api/artists
          artist: "/api/artist/{name}",
          bg_safe: "/api/bg_safe?type=image",
          bg_all: "/api/bg_all?type=image"
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 10) 兜底
    return new Response(JSON.stringify({
      error: "Not Found",
      message: "This is the API backend. Please use the Vue frontend."
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
