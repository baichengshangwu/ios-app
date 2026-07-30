// GET /api/social/call/incoming?my_email=X
// Check if there's an active incoming call for this user

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cors = { 'Access-Control-Allow-Origin': '*' };

  try {
    const myEmail = url.searchParams.get('my_email');
    if (!myEmail) {
      return Response.json({ error: 'my_email required' }, { status: 400, headers: cors });
    }

    const db = env.DB;

    // Find active call where I'm the participant (not the initiator)
    const call = await db.prepare(
      `SELECT * FROM active_calls WHERE participant=? AND status='active' ORDER BY created_at DESC LIMIT 1`
    ).bind(myEmail).first();

    if (call) {
      return Response.json({
        active: true,
        call_id: call.call_id,
        initiator: call.initiator,
        call_type: call.call_type
      }, { headers: cors });
    }

    return Response.json({ active: false }, { headers: cors });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors });
  }
}
