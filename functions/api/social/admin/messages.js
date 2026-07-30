// GET /api/social/admin/messages?from=DATE&to=DATE&user=EMAIL&type=private|group&group_id=ID&limit=200
// Admin endpoint for querying all chat messages within 3-year window

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
    const fromDate = url.searchParams.get('from') || '2023-01-01';
    const toDate = url.searchParams.get('to') || '2030-01-01';
    const userEmail = url.searchParams.get('user');
    const msgType = url.searchParams.get('type') || 'private'; // private | group
    const groupId = url.searchParams.get('group_id');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200'), 500);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search');

    const db = env.DB;

    let sql = `SELECT * FROM chat_messages WHERE created_at >= ? AND created_at <= ?`;
    const params = [fromDate + ' 00:00:00', toDate + ' 23:59:59'];

    if (msgType === 'private') {
      sql += ` AND chat_type='private'`;
    } else if (msgType === 'group') {
      sql += ` AND chat_type='group'`;
    }

    if (userEmail) {
      sql += ` AND (from_email=? OR to_email=?)`;
      params.push(userEmail, userEmail);
    }

    if (groupId) {
      sql += ` AND group_id=?`;
      params.push(groupId);
    }

    if (search) {
      sql += ` AND content LIKE ?`;
      params.push('%' + search + '%');
    }

    // Get total count
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as cnt');
    const countResult = await db.prepare(countSql).bind(...params).all();
    const total = countResult.results[0]?.cnt || 0;

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const r = await db.prepare(sql).bind(...params).all();

    return Response.json({
      messages: r.results,
      total,
      limit,
      offset
    }, { headers: cors });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
}
