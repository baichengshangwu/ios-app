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

  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  const authEmail = request.headers.get('x-auth-email');
  const authPass = request.headers.get('x-auth-pass');

  if (!email) return j({ error: 'Missing email param' }, 400);
  if (!authEmail || !authPass) return j({ error: 'Auth required' }, 401);

  try {
    const { results } = await env.DB.prepare(
      'SELECT email, name, kyc, bio, joined FROM users WHERE email = ?'
    ).bind(email).all();

    if (!results || results.length === 0) return j({ found: false });
    return j({ found: true, user: results[0] });
  } catch (e) {
    return j({ error: e.message }, 500);
  }
}
