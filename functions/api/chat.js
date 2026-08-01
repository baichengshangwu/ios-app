export async function onRequestPost({ request, env }) {
  const TH_BASE = 'https://tokenhub.wetok.ai/v1';
  const DB = env.DB;

  // Exchange rate: 1000 AC = $1.47 → 1 AC = $0.00147
  const AC_EXCHANGE_RATE = 0.00147;

  const GROUP_KEYS = {
    default:     'sk-DxDwymmGYufmtzfcVHGJF1kF7EU5sFNeZ6kpB122ukM3VoTn',
    tencent:     'sk-xkPb4YwXOx5XdryWjdkHdVeJl7M4SMcPPcomUknSmDhb2VZN',
    vip:         'sk-OI2R2yuHzqVvvl8BWkAu0xGk2r6vkDCAiAd4wxIyjcSPQeL0',
    hops:        'sk-MPF77sFsqwdz6Mt6mNVIOYCuagBf1SB5yUwBoL07XOntUJP2',
    Aliyun_disc: 'sk-OuzumvsllT5PZaYDBHCGpgVwWcM2b3P541ZT8Tp5ZEYLmnfC',
    Aliyun_adb:  'sk-Ll2KeWE85DC9Cgp0gqp9OQZDWoTmncKuFEb4zz1quMu2WR1H',
    Aliyun_promo:'sk-o6QtFKEtz3P5ehrAV4ML2USLuOvuVgatliucS1U8MHUPupBx',
    selfhosted:  'sk-WoyIQfC4zBdCB89Un0LUAA6gYvd0DNa2MAPslrkGdbBomEaq',
    Seedance:    'sk-C1yhv9ws3DUEHItoTG2ds1UyLkLFuMHzQHO4A3XiVRUETdXk',
  };

  const MODEL_GROUP = {
    'deepseek-v4-pro': 'default', 'deepseek-v4-flash': 'default',
    'glm-5': 'default', 'glm-5-turbo': 'default', 'glm-5.1': 'default',
    'glm-5.2': 'Aliyun_promo', 'glm-5.2-fast-preview': 'Aliyun_adb',
    'kimi-k3': 'default', 'kimi-k2.7-code-highspeed': 'Aliyun_adb',
    'gpt-5.3-codex': 'vip', 'gpt-5.4': 'vip', 'gpt-5.4-pro': 'vip',
    'gpt-5.5': 'vip', 'gpt-5.5-instant': 'vip',
    'claude-opus-4-6': 'vip', 'claude-opus-4-6-thinking': 'vip',
    'claude-opus-4-7': 'vip', 'claude-opus-4-8': 'vip',
    'claude-sonnet-4-6': 'vip', 'claude-sonnet-4-6-thinking': 'vip',
    'qwen3.7-plus': 'Aliyun_disc', 'qwen3.7-max': 'Aliyun_disc', 'qwen3.7-flash': 'Aliyun_disc',
    'qwen3-32b-AWQ': 'selfhosted', 'MiniMax/MiniMax-M3': 'Aliyun_adb',
    'unipass/gpt-5.4': 'hops', 'unipass/gpt-5.5': 'hops', 'unipass/gpt-5.6': 'hops',
    'unipass/gpt-5.6-sol': 'hops', 'unipass/gpt-5.6-terra': 'hops', 'unipass/gpt-5.6-luna': 'hops',
    'unipass/claude-opus-4-6': 'hops', 'unipass/claude-opus-4-7': 'hops',
    'unipass/claude-opus-4-8': 'hops', 'unipass/claude-sonnet-4-6': 'hops',
    'relaypool/gpt-5.4': 'hops', 'relaypool/gpt-5.5': 'hops', 'relaypool/gpt-5.6': 'hops',
    'relaypool/gpt-5.6-sol': 'hops', 'relaypool/gpt-5.6-terra': 'hops', 'relaypool/gpt-5.6-luna': 'hops',
    'relaypool/claude-opus-4-6': 'hops', 'relaypool/claude-opus-4-7': 'hops',
    'relaypool/claude-opus-4-8': 'hops', 'relaypool/claude-sonnet-4-6': 'hops',
    'relaypool/claude-sonnet-5': 'hops',
    'gpt-image-1.5': 'vip', 'gpt-image-2': 'vip',
    'gpt-image-2-text-to-image': 'hops', 'gpt-image-2-image-to-image': 'hops',
    'doubao-seedance-2.0': 'Seedance',
    'qwen3.7-text-embedding': 'Aliyun_disc', 'qwen3-rerank': 'Aliyun_disc',
  };

  // TH_MODELS pricing map (USD per 1M tokens, from frontend TH_MODELS.price)
  // Also handles -td suffix stripping internally
  const MODEL_PRICE_MAP = {
    'deepseek-v4-flash': 0.03, 'deepseek-v4-pro': 0.37,
    'glm-5': 0.70, 'glm-5-turbo': 0.84, 'glm-5.1': 2.10, 'glm-5.2': 2.50,
    'glm-5.2-fast-preview': 1.50, 'kimi-k3': 1.73, 'kimi-k2.7-code-highspeed': 2.00,
    'gpt-5.3-codex': 2.0, 'gpt-5.4': 2.0, 'gpt-5.4-pro': 2.5, 'gpt-5.5': 3.0, 'gpt-5.5-instant': 1.5,
    'claude-opus-4-6': 15.0, 'claude-opus-4-6-thinking': 15.0, 'claude-opus-4-7': 15.0, 'claude-opus-4-8': 15.0,
    'claude-sonnet-4-6': 3.0, 'claude-sonnet-4-6-thinking': 3.0,
    'qwen3.7-plus': 1.0, 'qwen3.7-max': 2.0, 'qwen3.7-flash': 0.5,
    'qwen3-32b-AWQ': 0.5, 'MiniMax/MiniMax-M3': 1.0,
    'relaypool/gpt-5.4': 1.6, 'relaypool/gpt-5.5': 2.4, 'relaypool/gpt-5.6': 3.0,
    'relaypool/gpt-5.6-sol': 3.0, 'relaypool/gpt-5.6-terra': 3.0, 'relaypool/gpt-5.6-luna': 3.0,
    'relaypool/claude-opus-4-6': 12.0, 'relaypool/claude-opus-4-7': 12.0, 'relaypool/claude-opus-4-8': 12.0,
    'relaypool/claude-sonnet-4-6': 2.4, 'relaypool/claude-sonnet-5': 3.0,
    'unipass/gpt-5.4': 1.6, 'unipass/gpt-5.5': 2.4, 'unipass/gpt-5.6': 3.0,
    'unipass/gpt-5.6-sol': 3.0, 'unipass/gpt-5.6-terra': 3.0, 'unipass/gpt-5.6-luna': 3.0,
    'unipass/claude-opus-4-6': 12.0, 'unipass/claude-opus-4-7': 12.0, 'unipass/claude-opus-4-8': 12.0,
    'unipass/claude-sonnet-4-6': 2.4,
    'gpt-image-1.5': 5.0, 'gpt-image-2': 8.0,
    'gpt-image-2-text-to-image': 6.0, 'gpt-image-2-image-to-image': 6.0,
    'doubao-seedance-2.0': 10.0,
    'qwen3.7-text-embedding': 0.1, 'qwen3-rerank': 0.1,
  };

  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Auth-Email, X-Auth-Pass',
    'Content-Type': 'application/json',
  };

  function err(msg, status) {
    return new Response(JSON.stringify({ error: msg }), { status: status || 500, headers: h });
  }

  // Generate unique ID
  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  try {
    const body = await request.json();
    const { model, messages, provider, price_per_1m } = body;
    if (provider !== 'th') return err('unsupported provider', 400);
    if (!model || !messages || !messages.length) return err('missing model or messages', 400);

    // --- User Auth (optional for backwards compat, but required for AC deduction) ---
    const authEmail = request.headers.get('X-Auth-Email') || '';
    const authPass = request.headers.get('X-Auth-Pass') || '';

    let user = null;
    if (authEmail && DB) {
      try {
        user = await DB.prepare('SELECT email, name, ac_balance FROM users WHERE email = ? AND pass = ?')
          .bind(authEmail, authPass).first();
      } catch(e) { /* DB not ready, skip auth */ }
    }

    // --- Resolve model ID (strip -td suffix) ---
    let modelId = model.replace(/-td$/, '');
    if (modelId.startsWith('relaypool-')) modelId = modelId.replace('relaypool-', 'relaypool/');
    if (modelId.startsWith('unipass-')) modelId = modelId.replace('unipass-', 'unipass/');

    const group = MODEL_GROUP[modelId] || 'default';
    const TH_KEY = GROUP_KEYS[group];
    if (!TH_KEY) return err('No key configured for group: ' + group, 500);

    // --- Call TokenHub ---
    const resp = await fetch(TH_BASE + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TH_KEY },
      body: JSON.stringify({ model: modelId, messages }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      const detail = data?.error?.message || data?.error?.code || ('HTTP ' + resp.status);
      return err('Model unavailable: ' + detail, 503);
    }

    if (!data || !data.choices || !Array.isArray(data.choices)) {
      return err('Empty response from model', 502);
    }

    // --- Calculate cost ---
    const usage = data.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = promptTokens + completionTokens;

    // Price: prefer request-specified, fall back to price map
    const pricePer1M = price_per_1m || MODEL_PRICE_MAP[modelId] || 0.1;
    const costUSD = Math.round(totalTokens * pricePer1M * 100) / 100000000; // tokens * price / 1M, rounded to cents

    // AC deduction
    const acToDeduct = costUSD > 0 ? Math.ceil(costUSD / AC_EXCHANGE_RATE * 100) / 100 : 0;
    let acAfter = null;
    let deducted = false;

    if (user && DB && acToDeduct > 0 && user.ac_balance >= acToDeduct) {
      try {
        acAfter = Math.round((user.ac_balance - acToDeduct) * 100) / 100;
        await DB.prepare('UPDATE users SET ac_balance = ? WHERE email = ?')
          .bind(acAfter, authEmail).run();
        deducted = true;
      } catch(e) { /* DB update failed, skip deduction */ }
    } else if (user) {
      acAfter = user.ac_balance; // not enough balance or DB error
    }

    // --- Log to model_usage ---
    if (user && DB) {
      try {
        const logId = uid();
        await DB.prepare(`
          INSERT INTO model_usage (id, user_email, model_id, model_name, vendor,
            prompt_tokens, completion_tokens, total_tokens, cost_usd, ac_deducted,
            ac_balance_after, exchange_rate, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(logId, authEmail, modelId, model, group,
          promptTokens, completionTokens, totalTokens, costUSD,
          deducted ? acToDeduct : 0, acAfter, AC_EXCHANGE_RATE).run();
      } catch(e) { /* log failed, non-fatal */ }
    }

    return new Response(JSON.stringify({
      ...data,
      _ztw: {
        cost: costUSD,
        tokens: totalTokens,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        group,
        ac_deducted: deducted ? acToDeduct : 0,
        ac_balance: acAfter,
        exchange_rate: AC_EXCHANGE_RATE,
        user_identified: !!user,
      }
    }), { headers: h });

  } catch (e) {
    return err('Service error: ' + (e.message || 'unknown'), 500);
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