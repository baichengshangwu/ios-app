// GET /api/social/get-messages?friend=EMAIL&limit=100&before=MSG_ID
// Private chat: fetch messages between curUser and friend
// Group chat: GET /api/social/get-messages?group_id=ID&limit=100

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cors = { 'Access-Control-Allow-Origin': '*' };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }
    });
  }

  try {
    const friend = url.searchParams.get('friend');
    const groupId = url.searchParams.get('group_id');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const before = url.searchParams.get('before');
    const userEmail = url.searchParams.get('user') || request.headers.get('x-auth-email') || '';

    if (!userEmail) {
      return Response.json({ error: 'Authentication required' }, { status: 401, headers: cors });
    }

    const db = env.DB;
    let results;

    const cols = 'id, from_email, to_email, chat_type, group_id, msg_type, content AS text, file_name, file_size, created_at';

    if (groupId) {
      let sql = `SELECT ${cols} FROM chat_messages WHERE chat_type='group' AND group_id=?`;
      const params = [groupId];
      if (before) { sql += ' AND created_at < ?'; params.push(before); }
      sql += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);
      const r = await db.prepare(sql).bind(...params).all();
      results = r.results.reverse();
    } else if (friend) {
      let sql = `SELECT ${cols} FROM chat_messages WHERE chat_type='private' 
        AND ((from_email=? AND to_email=?) OR (from_email=? AND to_email=?))`;
      const params = [userEmail, friend, friend, userEmail];
      if (before) { sql += ' AND created_at < ?'; params.push(before); }
      sql += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);
      const r = await db.prepare(sql).bind(...params).all();
      results = r.results.reverse();
    } else {
      return Response.json({ error: 'friend or group_id required' }, { status: 400, headers: cors });
    }

    return Response.json({ messages: results }, { headers: cors });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
}
