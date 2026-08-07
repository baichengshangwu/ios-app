export async function onRequestPost({ request, env }) {
  const DB = env.DB;

  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Email, X-Auth-Pass',
    'Content-Type': 'application/json',
  };

  function err(msg, status) {
    return new Response(JSON.stringify({ error: msg }), { status: status || 500, headers: h });
  }

  try {
    const body = await request.json();
    const { name, email, password, code } = body;

    if (!name || !email || !password) {
      return err('Missing required fields: name, email, password', 400);
    }

    if (!DB) {
      // No D1 binding - accept registration but can't persist
      return new Response(JSON.stringify({
        success: true,
        note: 'Static mode - user registered locally',
        user: { name, email: email.toLowerCase() }
      }), { headers: h });
    }

    const emailLower = email.toLowerCase();

    // Check if user already exists
    const existing = await DB.prepare('SELECT email FROM users WHERE email = ?')
      .bind(emailLower).first();

    if (existing) {
      return err('Email already registered', 409);
    }

    // Create new user with initial AC balance
    const INITIAL_AC = 1000;
    await DB.prepare(
      'INSERT INTO users (email, name, pass, ac_balance, cny_balance, usd_balance, total_recharge, kyc, joined) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(emailLower, name, password, INITIAL_AC, 0, 0, 0, 'Bronze', new Date().toISOString().split('T')[0]).run();

    // Also insert into model_usage tracking table if it exists
    try {
      await DB.prepare(
        "CREATE TABLE IF NOT EXISTS model_usage (id TEXT PRIMARY KEY, user_email TEXT, model_id TEXT, model_name TEXT, vendor TEXT, prompt_tokens INTEGER, completion_tokens INTEGER, total_tokens INTEGER, cost_usd REAL, ac_deducted REAL, ac_balance_after REAL, exchange_rate REAL, created_at TEXT)"
      ).run();
    } catch(e) { /* table may already exist */ }

    // Ensure social tables exist
    try {
      await DB.prepare(
        "CREATE TABLE IF NOT EXISTS forum_posts (id TEXT PRIMARY KEY, author_email TEXT, author_name TEXT, title TEXT, content TEXT, tags TEXT, category TEXT, image_url TEXT, video_url TEXT, audio_url TEXT, likes INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT, pinned INTEGER DEFAULT 0, locked INTEGER DEFAULT 0)"
      ).run();
      await DB.prepare(
        "CREATE TABLE IF NOT EXISTS forum_comments (id TEXT PRIMARY KEY, post_id TEXT, author_email TEXT, author_name TEXT, content TEXT, created_at TEXT)"
      ).run();
    } catch(e) { /* non-critical */ }

    return new Response(JSON.stringify({
      success: true,
      user: {
        name,
        email: emailLower,
        ac_balance: INITIAL_AC,
        cny_balance: 0,
        usd_balance: 0,
        kyc: 'Bronze',
        joined: new Date().toISOString().split('T')[0]
      }
    }), { headers: h });

  } catch (e) {
    return err('Registration failed: ' + (e.message || 'unknown'), 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Email, X-Auth-Pass',
      'Access-Control-Max-Age': '86400',
    }
  });
}
