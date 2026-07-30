// POST /api/social/groups/create
// Body: { name }
// Uses x-auth-email header for auth
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
    // Ensure tables exist
    await db.prepare(`CREATE TABLE IF NOT EXISTS groups (id TEXT PRIMARY KEY, name TEXT NOT NULL, owner_email TEXT NOT NULL, created_at TEXT NOT NULL)`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS group_members (group_id TEXT NOT NULL, user_email TEXT NOT NULL, joined_at TEXT NOT NULL, PRIMARY KEY (group_id, user_email))`).run();

    const { name } = await request.json();
    if (!name || !name.trim()) return j({ error: 'Group name required' }, 400);

    const id = 'grp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO groups (id, name, owner_email, created_at) VALUES (?, ?, ?, ?)`)
      .bind(id, name.trim(), authEmail, now).run();
    await db.prepare(`INSERT INTO group_members (group_id, user_email, joined_at) VALUES (?, ?, ?)`)
      .bind(id, authEmail, now).run();

    return j({ ok: true, id, name: name.trim(), owner_email: authEmail, created_at: now });
  } catch (e) {
    return j({ error: e.message }, 500);
  }
}
