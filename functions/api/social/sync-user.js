export async function onRequest(context) {
  const { request, env } = context;
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-auth-email, x-auth-pass',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
  function j(data, s = 200) {
    return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json', ...h } });
  }
  if (request.method === 'OPTIONS') return new Response(null, { headers: h });
  if (request.method !== 'POST') return j({ error: 'POST required' }, 405);

  const authEmail = request.headers.get('x-auth-email');
  const authPass = request.headers.get('x-auth-pass');
  if (!authEmail || !authPass) return j({ error: 'Auth required' }, 401);

  try {
    const { name } = await request.json();
    const displayName = name || authEmail;

    // Upsert user
    const { results } = await env.DB.prepare(
      'SELECT email FROM users WHERE email = ?'
    ).bind(authEmail).all();

    if (!results || results.length === 0) {
      await env.DB.prepare(
        'INSERT INTO users (email, name, pass, joined) VALUES (?, ?, ?, ?)'
      ).bind(authEmail, displayName, authPass, new Date().toISOString()).run();
    } else {
      await env.DB.prepare(
        'UPDATE users SET name = ?, pass = ? WHERE email = ?'
      ).bind(displayName, authPass, authEmail).run();
    }

    return j({ success: true });
  } catch (e) {
    return j({ error: e.message }, 500);
  }
}
