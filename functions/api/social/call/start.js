// POST /api/social/call/start
// Body: { from_email, to_email, call_type }
// Returns: { call_id, ok }

export async function onRequest(context) {
  const { request, env } = context;
  const cors = { 'Access-Control-Allow-Origin': '*' };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: { ...cors, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, x-auth-email' }
    });
  }

  try {
    const body = await request.json();
    const { from_email, to_email, call_type } = body;
    if (!from_email || !to_email) {
      return Response.json({ error: 'from_email and to_email required' }, { status: 400, headers: cors });
    }

    const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const db = env.DB;

    // End any previous active call between these two
    await db.prepare(
      `UPDATE active_calls SET status='ended', ended_at=datetime('now')
       WHERE ((initiator=? AND participant=?) OR (initiator=? AND participant=?)) AND status='active'`
    ).bind(from_email, to_email, to_email, from_email).run();

    await db.prepare(
      `INSERT INTO active_calls (call_id, initiator, participant, call_type, status)
       VALUES (?, ?, ?, ?, 'active')`
    ).bind(callId, from_email, to_email, call_type || 'voice').run();

    return Response.json({ ok: true, call_id: callId }, { headers: cors });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
}
