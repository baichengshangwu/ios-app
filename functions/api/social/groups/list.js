// GET /api/social/groups/list
// Returns groups the authenticated user is a member of
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

  try {
    const db = env.DB;
    const { results } = await db.prepare(
      `SELECT g.id, g.name, g.owner_email, g.created_at, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups g 
       INNER JOIN group_members gm ON g.id = gm.group_id 
       WHERE gm.user_email = ?
       ORDER BY g.created_at DESC`
    ).bind(authEmail).all();

    return j({ groups: results || [] });
  } catch (e) {
    return j({ error: e.message }, 500);
  }
}
