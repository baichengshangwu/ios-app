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
    const { to_email } = await request.json();
    if (!to_email) return j({ error: 'Missing to_email' }, 400);
    if (to_email === authEmail) return j({ error: 'Cannot friend yourself' }, 400);

    // Check target user exists
    const { results: target } = await env.DB.prepare(
      'SELECT name FROM users WHERE email = ?'
    ).bind(to_email).all();
    if (!target || target.length === 0) return j({ error: 'User not found' }, 404);

    // Check existing request
    const { results: existing } = await env.DB.prepare(
      "SELECT id FROM friend_requests WHERE from_email = ? AND to_email = ? AND status = 'pending'"
    ).bind(authEmail, to_email).all();
    if (existing && existing.length > 0) return j({ error: 'Request already sent' }, 409);

    // Check if already friends
    const { results: friends } = await env.DB.prepare(
      'SELECT 1 FROM friends WHERE user_email = ? AND friend_email = ?'
    ).bind(authEmail, to_email).all();
    if (friends && friends.length > 0) return j({ error: 'Already friends' }, 409);

    const reqId = `fr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { results: sender } = await env.DB.prepare(
      'SELECT name FROM users WHERE email = ?'
    ).bind(authEmail).all();
    const fromName = (sender && sender[0]) ? sender[0].name : authEmail;

    await env.DB.prepare(
      'INSERT INTO friend_requests (id, from_email, to_email, from_name, status) VALUES (?, ?, ?, ?, ?)'
    ).bind(reqId, authEmail, to_email, fromName, 'pending').run();

    return j({ success: true, request_id: reqId });
  } catch (e) {
    return j({ error: e.message }, 500);
  }
}
