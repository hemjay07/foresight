/**
 * Vercel Serverless Proxy — forwards all /api/* requests to Railway.
 *
 * Why this exists:
 * Vercel's CDN rewrite rules strip Set-Cookie headers from upstream responses.
 * This serverless function explicitly forwards them, allowing httpOnly cookies
 * to reach the browser correctly.
 */

const BACKEND_URL = 'https://foresight-backend-production-732e.up.railway.app';

// Headers we should never forward to the client
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'te',
  'trailer',
  'upgrade',
  'proxy-authorization',
  'proxy-authenticate',
]);

export default async function handler(req: any, res: any) {
  // req.url in a Vercel function is the full path, e.g. /api/auth/me?foo=bar
  const backendUrl = BACKEND_URL + req.url;

  // Forward the headers the backend needs
  const forward: Record<string, string> = {};
  for (const key of ['cookie', 'authorization', 'x-csrf-token', 'content-type', 'accept', 'user-agent']) {
    const val = req.headers[key];
    if (val) forward[key] = val;
  }
  // Tell the backend which origin the browser is on
  forward['origin'] = 'https://ct-foresight.xyz';

  const isBodyMethod = !['GET', 'HEAD', 'OPTIONS'].includes(req.method || 'GET');

  let body: string | undefined;
  if (isBodyMethod) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!forward['content-type']) forward['content-type'] = 'application/json';
  }

  try {
    const upstream = await fetch(backendUrl, {
      method: req.method,
      headers: forward,
      body,
    });

    // Forward status
    res.status(upstream.status);

    // Forward all response headers except hop-by-hop
    upstream.headers.forEach((value: string, key: string) => {
      if (HOP_BY_HOP.has(key.toLowerCase())) return;
      if (key.toLowerCase() === 'set-cookie') return; // handled below
      res.setHeader(key, value);
    });

    // Explicitly forward Set-Cookie — this is the whole reason this function exists.
    // Vercel's CDN rewrites strip these; a serverless function preserves them.
    const cookies: string[] = upstream.headers.getSetCookie
      ? upstream.headers.getSetCookie()
      : (upstream.headers.get('set-cookie') ? [upstream.headers.get('set-cookie')!] : []);

    if (cookies.length > 0) {
      res.setHeader('Set-Cookie', cookies);
    }

    const text = await upstream.text();
    res.send(text);
  } catch (err) {
    console.error('[proxy] Backend unreachable:', err);
    res.status(502).json({ success: false, error: 'Backend unavailable' });
  }
}
