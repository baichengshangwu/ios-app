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

    const { results } = await env.DB.prepare(
      "UPDATE friend_requests SET status = 'rejected' WHERE id = ? AND to_email = ? AND status = 'pending'"
    ).bind(request_id, authEmail).run();
    return j({ success: true });
  } catch (e) {
    return j({ error: e.message }, 500);
  }
}
