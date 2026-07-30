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

  const authEmail = request.headers.get('x-auth-email');
  const authPass = request.headers.get('x-auth-pass');
  if (!authEmail || !authPass) return j({ error: 'Auth required' }, 401);

  try {
    const { results } = await env.DB.prepare(
      'SELECT f.friend_email, u.name, u.kyc, u.bio FROM friends f LEFT JOIN users u ON f.friend_email = u.email WHERE f.user_email = ? ORDER BY f.created_at DESC'
    ).bind(authEmail).all();
    return j({ friends: results || [] });
  } catch (e) {
    return j({ error: e.message }, 500);
  }
}
