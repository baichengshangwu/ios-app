// GET /api/social/call/signal?call_id=X&my_email=Y&since=TIMESTAMP
// Poll for new signals

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cors = { 'Access-Control-Allow-Origin': '*' };

  try {
    const callId = url.searchParams.get('call_id');
    const myEmail = url.searchParams.get('my_email');
    const since = url.searchParams.get('since') || '2000-01-01 00:00:00';

    if (!callId || !myEmail) {
      return Response.json({ error: 'call_id and my_email required' }, { status: 400, headers: cors });
    }

    const db = env.DB;

    // Get signals destined for me, newer than since
    const r = await db.prepare(
      `SELECT * FROM call_signals WHERE call_id=? AND receiver_email=? AND created_at > ? ORDER BY created_at ASC`
    ).bind(callId, myEmail, since).all();

    // Check if call was hung up
    const callInfo = await db.prepare(
      `SELECT * FROM active_calls WHERE call_id=?`
    ).bind(callId).first();

    const isEnded = !callInfo || callInfo.status !== 'active';

    // Delete the signals we've delivered
    if (r.results.length > 0) {
      const ids = r.results.map(s => s.id).join(',');
      await db.prepare(`DELETE FROM call_signals WHERE id IN (${ids})`).run();
    }

    return Response.json({
      signals: r.results.map(s => ({
        signal_type: s.signal_type,
        sender_email: s.sender_email,
        payload: JSON.parse(s.payload),
        created_at: s.created_at
      })),
      call_ended: isEnded,
      call_info: callInfo ? { initiator: callInfo.initiator, participant: callInfo.participant, call_type: callInfo.call_type } : null
    }, { headers: cors });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
}
