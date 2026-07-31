// One-time DB initialization endpoint
// Visit: https://zhitongwang.cn/api/init-db?key=ztw_init_2026

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  // Simple auth
  if (key !== 'ztw_init_2026') {
    return new Response(JSON.stringify({ error: 'unauthorized', hint: 'Visit with ?key=ztw_init_2026' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const DB = env.DB;
  if (!DB) {
    return new Response(JSON.stringify({ error: 'D1 binding not found' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const results = [];
  const errors = [];

  // Step 1: Add ac_balance column (idempotent)
  try {
    await DB.prepare(`ALTER TABLE users ADD COLUMN ac_balance REAL DEFAULT 1000`).run();
    results.push('users.ac_balance: added');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      results.push('users.ac_balance: already exists (skip)');
    } else {
      errors.push('users.ac_balance: ' + e.message);
    }
  }

  // Step 2: Add nexus_balance column
  try {
    await DB.prepare(`ALTER TABLE users ADD COLUMN nexus_balance REAL DEFAULT 0`).run();
    results.push('users.nexus_balance: added');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      results.push('users.nexus_balance: already exists (skip)');
    } else {
      errors.push('users.nexus_balance: ' + e.message);
    }
  }

  // Step 3: Create model_usage table
  try {
    await DB.prepare(`
      CREATE TABLE IF NOT EXISTS model_usage (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        model_id TEXT NOT NULL,
        model_name TEXT NOT NULL,
        vendor TEXT,
        prompt_tokens INTEGER DEFAULT 0,
        completion_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        cost_usd REAL DEFAULT 0,
        ac_deducted REAL DEFAULT 0,
        ac_balance_after REAL,
        exchange_rate REAL DEFAULT 0.00147,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();
    results.push('model_usage: table created');
  } catch (e) {
    errors.push('model_usage: ' + e.message);
  }

  // Step 4: Create index
  try {
    await DB.prepare(`CREATE INDEX IF NOT EXISTS idx_model_usage_user ON model_usage(user_email, created_at DESC)`).run();
    results.push('idx_model_usage_user: index created');
  } catch (e) {
    errors.push('idx_model_usage_user: ' + e.message);
  }

  const success = errors.length === 0;

  return new Response(JSON.stringify({ success, results, errors }, null, 2), {
    status: success ? 200 : 500,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
