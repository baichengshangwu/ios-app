// POST /api/social/send-message
// Body: { from_email, to_email, msg_type, content, file_name?, file_size? }
// chat_type = 'private' | 'group', group_id for group chats

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  const cors = { 'Access-Control-Allow-Origin': '*' };

  try {
    const body = await request.json();
    const { from_email, to_email, msg_type, content, file_name, file_size, chat_type, group_id } = body;

    if (!from_email || !content) {
      return Response.json({ error: 'from_email and content required' }, { status: 400, headers: cors });
    }

    // Private chat requires to_email; group chat requires group_id
    const ct = chat_type || 'private';
    if (ct === 'private' && !to_email) {
      return Response.json({ error: 'to_email required for private chat' }, { status: 400, headers: cors });
    }
    if (ct === 'group' && !group_id) {
      return Response.json({ error: 'group_id required for group chat' }, { status: 400, headers: cors });
    }

    const id = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const db = env.DB;
    await db.prepare(
      `INSERT INTO chat_messages (id, from_email, to_email, chat_type, group_id, msg_type, content, file_name, file_size, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, from_email, to_email || '', ct, group_id || '', msg_type || 'text', content, file_name || '', file_size || 0, created_at).run();

    return Response.json({ ok: true, id, created_at }, { headers: cors });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
}
