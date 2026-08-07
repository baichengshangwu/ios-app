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
    const { email, password } = body;

    if (!email || !password) {
      return err('Missing email or password', 400);
    }

    if (!DB) {
      return err('Backend database unavailable', 503);
    }

    const emailLower = email.toLowerCase();

    // Authenticate user
    const user = await DB.prepare(
      'SELECT email, name, pass, ac_balance, cny_balance, usd_balance, total_recharge, kyc, joined, ref, addr, role FROM users WHERE email = ? AND pass = ?'
    ).bind(emailLower, password).first();

    if (!user) {
      return err('Invalid email or password', 401);
    }

    // Generate a simple token (email + timestamp hash)
    const token = btoa(user.email + ':' + Date.now());

    return new Response(JSON.stringify({
      success: true,
      token: token,
      user: {
        name: user.name,
        email: user.email,
        ac_balance: user.ac_balance || 0,
        cny_balance: user.cny_balance || 0,
        usd_balance: user.usd_balance || 0,
        total_recharge: user.total_recharge || 0,
        kyc: user.kyc || 'Bronze',
        joined: user.joined || '',
        ref: user.ref || '',
        addr: user.addr || '',
        role: user.role || 'user',
        nexus_balance: user.ac_balance || 0
      }
    }), { headers: h });

  } catch (e) {
    return err('Login failed: ' + (e.message || 'unknown'), 500);
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
