export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  
  if (!q) {
    return new Response(JSON.stringify({ found: false, error: 'Missing query' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    // Query registered users from the database
    const usersDB = await context.env.DB.prepare(
      'SELECT email, name, avatar, member_lv FROM users WHERE email = ? LIMIT 1'
    ).bind(q).first();
    
    if (usersDB) {
      return new Response(JSON.stringify({
        found: true,
        user: {
          email: usersDB.email,
          name: usersDB.name || usersDB.email.split('@')[0],
          avatar: usersDB.avatar || '',
          level: usersDB.member_lv || 0
        }
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    return new Response(JSON.stringify({ found: false }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ found: false, error: 'DB error: ' + (e.message || String(e)) }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
