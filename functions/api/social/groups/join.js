// POST /api/social/groups/join
// Body: { group_id }
export async function onRequest(context) {
  const { request, env } = context;
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-auth-email, x-auth-pass',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const { group_id } = await request.json();
    if (!group_id) return j({ error: 'group_id required' }, 400);

    // Check group exists
    const { results: grps } = await db.prepare('SELECT id, name FROM groups WHERE id = ?').bind(group_id).all();
    if (!grps || grps.length === 0) return j({ error: 'Group not found' }, 404);

    // Check if already member
    const { results: existing } = await db.prepare(
      'SELECT * FROM group_members WHERE group_id = ? AND user_email = ?'
    ).bind(group_id, authEmail).all();
    if (existing && existing.length > 0) return j({ ok: true, already: true });

    const now = new Date().toISOString();
    await db.prepare('INSERT INTO group_members (group_id, user_email, joined_at) VALUES (?, ?, ?)')
      .bind(group_id, authEmail, now).run();

    return j({ ok: true, group_id, group_name: grps[0].name });
  } catch (e) {
    return j({ error: e.message }, 500);
  }
}
