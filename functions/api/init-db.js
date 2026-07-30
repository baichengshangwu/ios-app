export async function onRequest(context) {
  const { request } = context;
  
  try {
    // Create users table if not exists
    await context.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT,
        avatar TEXT,
        member_lv INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // Insert a test user for verification
    await context.env.DB.prepare(`
      INSERT OR IGNORE INTO users (email, name, member_lv) VALUES ('test@zhitongwang.com', 'TestUser', 0)
    `).run();

    // Verify
    const count = await context.env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first();
    
    return new Response(JSON.stringify({ 
      ok: true, 
      message: 'DB initialized', 
      user_count: count ? count.cnt : 0 
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message || String(e) }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
