export async function onRequest(context) {
  const { request } = context;
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body = await request.json();
    const { to } = body;
    
    if (!to) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing recipient' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Check if target user exists
    const target = await context.env.DB.prepare(
      'SELECT email FROM users WHERE email = ? LIMIT 1'
    ).bind(to).first();
    
    if (!target) {
      return new Response(JSON.stringify({ ok: false, error: 'User not found' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Insert friend relationship
    await context.env.DB.prepare(
      'INSERT OR IGNORE INTO friends (user_email, friend_email, created_at) VALUES (?, ?, datetime())'
    ).bind(to, to).run();

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Internal error' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
