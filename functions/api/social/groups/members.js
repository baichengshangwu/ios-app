// GET /api/social/groups/members?group_id=xxx
export async function onRequest(context) {
  const { request, env } = context;
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-auth-email, x-auth-pass',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
  function j(data, s = 200) {
    return new Response(JSON.stringify(data), { status: s, headers: { 'Content-Type': 'application/json', ...h } });
  }
  if (request.method === 'OPTIONS') return new Response(null, { headers: h });

  const authEmail = request.headers.get('x-auth-email');
  const authPass = request.headers.get('x-auth-pass');
  if (!authEmail || !authPass) return j({ error: 'Auth required' }, 401);

  const url = new URL(request.url);
  const groupId = url.searchParams.get('group_id');
  if (!groupId) return j({ error: 'group_id required' }, 400);

  try {
    const db = env.DB;
    const { results } = await db.prepare(
      `SELECT gm.user_email, u.name, gm.joined_at 
       FROM group_members gm LEFT JOIN users u ON gm.user_email = u.email 
       WHERE gm.group_id = ? ORDER BY gm.joined_at ASC`
    ).bind(groupId).all();

    return j({ members: results || [] });
  } catch (e) {
    return j({ error: e.message }, 500);
  }
}
