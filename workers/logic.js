// ============================================
// logic.js - 完整版
// ============================================

// === 1. API 处理函数 (搜索/随机) ===
export async function handleApiPosts(url, env) {
  const q = url.searchParams.get('q');
  const page = parseInt(url.searchParams.get('page')) || 1;
  const pageSize = 30;
  const offset = (page - 1) * pageSize;

  if (q === 'random') {
    const { results } = await env.DB.prepare("SELECT * FROM images ORDER BY RANDOM() LIMIT 1").all();
    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  let sql;
  let params = [];
  
  if (q) {
    const keywords = q.replace(/#/g, '').trim().split(/\s+/).filter(k => k.length > 0);
    if (keywords.length > 0) {
      const conditions = keywords.map(() => `(tags LIKE ? OR caption LIKE ?)`).join(' AND ');
      sql = `SELECT * FROM images WHERE ${conditions} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      keywords.forEach(k => { params.push(`%${k}%`); params.push(`%${k}%`); });
      params.push(pageSize, offset);
    } else {
      sql = `SELECT * FROM images ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params = [pageSize, offset];
    }
  } else {
    sql = `SELECT * FROM images ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params = [pageSize, offset];
  }

  try {
    const { results } = await env.DB.prepare(sql).bind(...params).all();
    console.log(`Page ${page}: returned ${results.length} images`);
    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    console.error('Database error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// === 2. 图片代理函数 ===
export async function proxyTelegramImage(fileId, botToken, dlExt = null) {
  try {
    const r1 = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const j1 = await r1.json();
    if (!j1.ok) return new Response("404", { status: 404 });
    
    const r2 = await fetch(`https://api.telegram.org/file/bot${botToken}/${j1.result.file_path}`);
    const h = new Headers(r2.headers);
    h.set("Cache-Control", "public, max-age=31536000, immutable");
    h.set("Access-Control-Allow-Origin", "*");
    
    if (dlExt) {
      const filename = `${fileId}.${dlExt}`;
      h.set("Content-Disposition", `attachment; filename="${filename}"`);
    }
    
    return new Response(r2.body, { headers: h });
  } catch (e) {
    return new Response("Error", { status: 500 });
  }
}

// === 3. 详情页处理函数 ===
export async function handleDetail(id, env, url = null) {
  const img = await env.DB.prepare(
    "SELECT id, file_name, origin_id, caption, artist, tags, created_at, width, height FROM images WHERE id = ?"
  ).bind(id).first();
  
  if (!img) return new Response("404", { status: 404 });

  let parentId = img.id;
  const m = img.id.match(/^(.*)_p(\d+)$/);
  if (m) parentId = m[1];

  const { results: siblings } = await env.DB
    .prepare("SELECT * FROM images WHERE id = ? OR id LIKE ? ORDER BY id ASC")
    .bind(parentId, parentId + "_p%")
    .all();

  const { results: randomPosts } = await env.DB
    .prepare("SELECT * FROM images WHERE id != ? ORDER BY RANDOM() LIMIT 6")
    .bind(id)
    .all();

  const items = siblings.sort((a, b) => a.id.localeCompare(b.id));

  if (url && url.pathname.startsWith('/api/detail/')) {
    return new Response(JSON.stringify({
      image: img,
      siblings: items,
      randomPosts
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  return new Response("Please use Vue frontend", {
    status: 404,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// === 4. 背景随机图 ===
const BG_BLOCK_KEYWORDS = ['R-18', 'R18', 'NSFW', 'Hentai', '性爱', '性交', '乱伦', '裸胸',
  '露点', '调教', '触手', '高潮', '喷水', '阿黑颜', '颜射', '后宫',
  '痴汉', 'NTR', '3P', 'Boobs', 'Tits', 'Nipples', 'Breast', '乳房',
  '乳头', '胸部', '巨乳', '爆乳', 'Creampie', 'Cum', 'Bukkake', 'Sex',
  'Fuck', 'Blowjob', '射精', 'Handjob', 'Paizuri', '乳交', 'Cunnilingus', 'Fellatio',
  'Masturbation', 'Pussy', 'Vagina', 'Penis', 'Dick', 'Cock', 'Genitals', 'Pubic',
  '阴部', '生殖器', '阴茎', '阴道', '私处', '下体', 'Nude', 'Topless',
  'Ahegao', '潮吹', 'X-ray', '透视', 'Mind Break', '精神崩溃', '洗脑', '堕落',
  'Futa', '扶她', '双性', 'Tentacle', 'BDSM', 'Bondage', '捆绑', '束缚',
  'Scat', 'Pregnant', '怀孕', '孕妇', 'School Swimsuit', 'Maid', 'Swimsuit', 'Ass',
  '臀部', '屁股', 'Pantyhose', 'Garter', 'Lingerie', 'Panty', 'Stockings', '断面图',
  '丁字裤', '内裤', '胖次', '情趣内衣', '透视装', 'naked', 'nipples', 'anus',
  '肛门', '菊花', '乳首', 'スカトロ', 'レイプ', '口交', '丸吞', '妊娠',
  '破れタイツ', '快楽堕ち', '寝取られ', '乳出し', 'ふたなり', '輪姦', '異種姦', '孕ませ',
  '緊縛', '奴隷', '悪堕ち', '精神崩壊', 'セックス', '中出し', '顔射', 'イラマチオ',
  'フェラ', 'パイズリ', '手コキ', '潮吹き', '絶頂', 'アヘ顔', '全裸', 'ペニス',
  'ヴァギナ', 'クリトリス', '近親', '調教'];

export async function handleBgRandom(includeR18, url, env) {
  let sql = "SELECT * FROM images";
  let params = [];

  if (!includeR18) {
    const conditions = BG_BLOCK_KEYWORDS
      .map(() => "(tags NOT LIKE ? AND caption NOT LIKE ?)")
      .join(" AND ");
    sql += ` WHERE ${conditions}`;
    BG_BLOCK_KEYWORDS.forEach(k => {
      params.push(`%${k}%`);
      params.push(`%${k}%`);
    });
  }

  sql += " ORDER BY RANDOM() LIMIT 1";

  const { results } = await env.DB.prepare(sql).bind(...params).all();
  if (!results || results.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const fileId = results[0].file_name;

  if (url.searchParams.get('type') === 'image') {
    return await proxyTelegramImage(fileId, env.BOT_TOKEN, 'jpg');
  }

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// === 5. 画师分类处理函数 ===
export async function handleArtists(url, env) {
  const format = url.searchParams.get('format');

  if (format === 'json') {
    const page = parseInt(url.searchParams.get('page')) || 1;
    const q = url.searchParams.get('q') || '';
    const pageSize = 50;
    const offset = (page - 1) * pageSize;

    let sql;
    let params;

    if (q.trim()) {
      sql = `
        SELECT t.artist, COUNT(*) as count, t.file_name as cover, t.width, t.height
        FROM (
          SELECT * FROM images
          WHERE artist IS NOT NULL AND artist != '' AND artist LIKE ?
          ORDER BY id DESC
        ) t
        GROUP BY t.artist
        ORDER BY count DESC
        LIMIT ? OFFSET ?
      `;
      params = [`%${q.trim()}%`, pageSize, offset];
    } else {
      sql = `
        SELECT t.artist, COUNT(*) as count, t.file_name as cover, t.width, t.height
        FROM (
          SELECT * FROM images
          WHERE artist IS NOT NULL AND artist != ''
          ORDER BY id DESC
        ) t
        GROUP BY t.artist
        ORDER BY count DESC
        LIMIT ? OFFSET ?
      `;
      params = [pageSize, offset];
    }

    try {
      const { results } = await env.DB.prepare(sql).bind(...params).all();
      return new Response(JSON.stringify(results), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  return new Response("Please use Vue frontend", {
    status: 404,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// === 6. 画师详情页处理函数 ===
export async function handleArtistProfile(artistName, url, env) {
  const artist = decodeURIComponent(artistName);

  const metaSql = `SELECT COUNT(*) as count, MAX(created_at) as last_update FROM images WHERE artist = ?`;
  const meta = await env.DB.prepare(metaSql).bind(artist).first();

  if (!meta || meta.count === 0) {
    return new Response(JSON.stringify({ error: 'Artist not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const coverSql = `SELECT file_name FROM images WHERE artist = ? ORDER BY created_at DESC LIMIT 2`;
  const { results: covers } = await env.DB.prepare(coverSql).bind(artist).all();
  const cover1 = covers[0]?.file_name;
  const cover2 = covers[1]?.file_name || cover1;

  const platformSql = `SELECT id FROM images WHERE artist = ? LIMIT 20`;
  const { results: sampleIds } = await env.DB.prepare(platformSql).bind(artist).all();
  let platforms = new Set();

  sampleIds.forEach(row => {
    if (row.id.startsWith('pixiv_')) platforms.add('Pixiv');
    else if (row.id.startsWith('yande')) platforms.add('Yande.re');
    else if (row.id.startsWith('mtcacg')) platforms.add('MtcACG');
    else if (row.id.startsWith('twitter')) platforms.add('Twitter');
    else platforms.add('Other');
  });

  const priority = ['Pixiv', 'Yande.re', 'MtcACG', 'Twitter'];
  const sortedPlatforms = Array.from(platforms).sort((a, b) => {
    return (priority.indexOf(a) === -1 ? 99 : priority.indexOf(a)) -
           (priority.indexOf(b) === -1 ? 99 : priority.indexOf(b));
  });
  const platformText = sortedPlatforms.join('、');

  const format = url.searchParams.get('format');
  if (format === 'json') {
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = 15;
    const offset = (page - 1) * pageSize;

    const postsSql = `SELECT * FROM images WHERE artist = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const { results } = await env.DB.prepare(postsSql).bind(artist, pageSize, offset).all();

    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  return new Response("Please use Vue frontend", {
    status: 404,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// === 7. 画师 API 专用函数（供 Vue 前端调用）===
export async function handleArtistProfileAPI(artistName, url, env) {
  const artist = decodeURIComponent(artistName);

  const metaSql = `SELECT COUNT(*) as count, MAX(created_at) as last_update FROM images WHERE artist = ?`;
  const meta = await env.DB.prepare(metaSql).bind(artist).first();

  if (!meta || meta.count === 0) {
    return new Response(JSON.stringify({ error: 'Artist not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const coverSql = `SELECT file_name FROM images WHERE artist = ? ORDER BY created_at DESC LIMIT 2`;
  const { results: covers } = await env.DB.prepare(coverSql).bind(artist).all();
  const cover1 = covers[0]?.file_name;
  const cover2 = covers[1]?.file_name || cover1;

  const platformSql = `SELECT id FROM images WHERE artist = ? LIMIT 20`;
  const { results: sampleIds } = await env.DB.prepare(platformSql).bind(artist).all();
  let platforms = new Set();

  sampleIds.forEach(row => {
    if (row.id.startsWith('pixiv_')) platforms.add('Pixiv');
    else if (row.id.startsWith('yande')) platforms.add('Yande.re');
    else if (row.id.startsWith('mtcacg')) platforms.add('MtcACG');
    else if (row.id.startsWith('twitter')) platforms.add('Twitter');
    else platforms.add('Other');
  });

  const priority = ['Pixiv', 'Yande.re', 'MtcACG', 'Twitter'];
  const sortedPlatforms = Array.from(platforms).sort((a, b) => {
    return (priority.indexOf(a) === -1 ? 99 : priority.indexOf(a)) -
           (priority.indexOf(b) === -1 ? 99 : priority.indexOf(b));
  });
  const platformText = sortedPlatforms.join('、');

  // ✅✅ 关键修复：支持 page / limit
  const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1);

  // 默认 15（和你之前一致），允许前端传 limit（比如 30）
  let pageSize = parseInt(url.searchParams.get('limit')) || 15;
  pageSize = Math.min(50, Math.max(1, pageSize)); // 给个上限，避免一次拉太多

  const offset = (page - 1) * pageSize;

  const postsSql = `SELECT * FROM images WHERE artist = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const { results: posts } = await env.DB.prepare(postsSql).bind(artist, pageSize, offset).all();

  let updateTime = '未知';
  if (meta.last_update) {
    const ts = meta.last_update.toString().length === 10 ? meta.last_update * 1000 : meta.last_update;
    const d = new Date(ts);
    updateTime = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  return new Response(JSON.stringify({
    profile: {
      artist,
      count: meta.count,
      updateTime,
      cover1,
      cover2,
      platformText
    },
    posts
  }), {
    headers: {
      'Content-Type': 'application/json',
      // 注意：带 query 的 URL 会分别缓存不同 page；这里先沿用你原本策略
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

