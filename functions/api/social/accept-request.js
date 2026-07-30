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
    const { request_id } = await request.json();
    if (!request_id) return j({ error: 'Missing request_id' }, 400);

    // Get the request
    const { results: reqs } = await env.DB.prepare(
      "SELECT id, from_email, to_email, from_name FROM friend_requests WHERE id = ? AND to_email = ? AND status = 'pending'"
    ).bind(request_id, authEmail).all();
    if (!reqs || reqs.length === 0) return j({ error: 'Request not found' }, 404);

    const fr = reqs[0];
    await env.DB.batch([
      env.DB.prepare("UPDATE friend_requests SET status = 'accepted' WHERE id = ?").bind(request_id),
      env.DB.prepare('INSERT OR IGNORE INTO friends (user_email, friend_email) VALUES (?, ?)').bind(fr.from_email, fr.to_email),
      env.DB.prepare('INSERT OR IGNORE INTO friends (user_email, friend_email) VALUES (?, ?)').bind(fr.to_email, fr.from_email)
    ]);

    return j({ success: true });
  } catch (e) {
    return j({ error: e.message }, 500);
  }
}
