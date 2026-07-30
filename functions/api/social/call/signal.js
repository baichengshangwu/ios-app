// POST /api/social/call/signal
// Body: { call_id, sender_email, signal_type, sdp/json_payload }
// signal_type: 'offer' | 'answer' | 'ice-candidate' | 'hangup'

export async function onRequest(context) {
  const { request, env } = context;
  const cors = { 'Access-Control-Allow-Origin': '*' };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: { ...cors, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
    });
  }

  try {
    const body = await request.json();
    const { call_id, sender_email, signal_type, payload } = body;
    if (!call_id || !sender_email || !signal_type) {
      return Response.json({ error: 'call_id, sender_email, signal_type required' }, { status: 400, headers: cors });
    }

    const db = env.DB;

    // Get the other participant
    const callInfo = await db.prepare(
      `SELECT * FROM active_calls WHERE call_id=? AND status='active'`
    ).bind(call_id).first();

    if (!callInfo) {
      return Response.json({ error: 'Call not found or ended' }, { status: 404, headers: cors });
    }

    const receiverEmail = callInfo.initiator === sender_email ? callInfo.participant : callInfo.initiator;

    await db.prepare(
      `INSERT INTO call_signals (call_id, sender_email, receiver_email, signal_type, payload)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(call_id, sender_email, receiverEmail, signal_type, JSON.stringify(payload)).run();

    // Mark call as ended on hangup
    if (signal_type === 'hangup') {
      await db.prepare(
        `UPDATE active_calls SET status='ended', ended_at=datetime('now') WHERE call_id=?`
      ).bind(call_id).run();
      // Clean old signals
      await db.prepare(`DELETE FROM call_signals WHERE call_id=?`).bind(call_id).run();
    }

    return Response.json({ ok: true }, { headers: cors });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
}
