// Vercel Serverless 代理函数（配合本影视站使用，解决跨域）
// 部署后在影视站「设置 → 自建代理」填：
//   https://你的项目名.vercel.app/api/proxy
// Vercel 会自动把 api/proxy.js 映射为 /api/proxy 路由。

export default async function handler(req, res) {
  // 放行跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const target = req.query.url;
  if (!target || !/^https?:\/\//i.test(target)) {
    res.status(400).send('bad url');
    return;
  }

  try {
    const r = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(target).origin,
        'Accept': '*/*'
      },
      // 指定超时，避免函数卡住（Vercel 免费计划函数有 10s 硬上限）
      signal: AbortSignal.timeout(8000)
    });
    const body = await r.arrayBuffer();
    const ct = r.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.status(r.status).send(Buffer.from(body));
  } catch (e) {
    res.status(502).send('proxy error: ' + e.message);
  }
}
