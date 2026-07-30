export async function onRequestGet({ request, env }) {
  const TH_BASE = 'https://tokenhub.wetok.ai/v1';

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

  // Chat models with their primary and fallback groups
  const CHAT_MODELS = [
    { id: 'deepseek-v4-pro', primary: 'default', fallback: 'Aliyun_adb' },
    { id: 'deepseek-v4-flash', primary: 'default', fallback: 'Aliyun_adb' },
    { id: 'glm-5', primary: 'default', fallback: 'tencent' },
    { id: 'glm-5-turbo', primary: 'default', fallback: 'tencent' },
    { id: 'glm-5.1', primary: 'default', fallback: 'tencent' },
    { id: 'glm-5.2', primary: 'Aliyun_promo', fallback: 'default' },
    { id: 'glm-5.2-fast-preview', primary: 'Aliyun_adb', fallback: null },
    { id: 'kimi-k3', primary: 'default', fallback: 'Aliyun_adb' },
    { id: 'kimi-k2.7-code-highspeed', primary: 'Aliyun_adb', fallback: null },
    { id: 'MiniMax/MiniMax-M3', primary: 'Aliyun_adb', fallback: null },
    { id: 'gpt-5.3-codex', primary: 'vip', fallback: null },
    { id: 'gpt-5.4', primary: 'vip', fallback: null },
    { id: 'gpt-5.4-pro', primary: 'vip', fallback: null },
    { id: 'gpt-5.5', primary: 'vip', fallback: null },
    { id: 'gpt-5.5-instant', primary: 'vip', fallback: null },
    { id: 'claude-opus-4-6', primary: 'vip', fallback: null },
    { id: 'claude-opus-4-6-thinking', primary: 'vip', fallback: null },
    { id: 'claude-opus-4-7', primary: 'vip', fallback: null },
    { id: 'claude-opus-4-8', primary: 'vip', fallback: null },
    { id: 'claude-sonnet-4-6', primary: 'vip', fallback: null },
    { id: 'claude-sonnet-4-6-thinking', primary: 'vip', fallback: null },
    { id: 'qwen3.7-plus', primary: 'Aliyun_disc', fallback: null },
    { id: 'qwen3.7-max', primary: 'Aliyun_disc', fallback: null },
    { id: 'qwen3.7-flash', primary: 'Aliyun_disc', fallback: null },
    { id: 'qwen3-32b-AWQ', primary: 'selfhosted', fallback: null },
    { id: 'unipass/gpt-5.4', primary: 'hops', fallback: null },
    { id: 'unipass/gpt-5.5', primary: 'hops', fallback: null },
    { id: 'unipass/gpt-5.6', primary: 'hops', fallback: null },
    { id: 'unipass/gpt-5.6-sol', primary: 'hops', fallback: null },
    { id: 'unipass/gpt-5.6-terra', primary: 'hops', fallback: null },
    { id: 'unipass/gpt-5.6-luna', primary: 'hops', fallback: null },
    { id: 'unipass/claude-opus-4-6', primary: 'hops', fallback: null },
    { id: 'unipass/claude-opus-4-7', primary: 'hops', fallback: null },
    { id: 'unipass/claude-opus-4-8', primary: 'hops', fallback: null },
    { id: 'unipass/claude-sonnet-4-6', primary: 'hops', fallback: null },
    { id: 'relaypool/gpt-5.4', primary: 'hops', fallback: null },
    { id: 'relaypool/gpt-5.5', primary: 'hops', fallback: null },
    { id: 'relaypool/gpt-5.6', primary: 'hops', fallback: null },
    { id: 'relaypool/gpt-5.6-sol', primary: 'hops', fallback: null },
    { id: 'relaypool/gpt-5.6-terra', primary: 'hops', fallback: null },
    { id: 'relaypool/gpt-5.6-luna', primary: 'hops', fallback: null },
    { id: 'relaypool/claude-opus-4-6', primary: 'hops', fallback: null },
    { id: 'relaypool/claude-opus-4-7', primary: 'hops', fallback: null },
    { id: 'relaypool/claude-opus-4-8', primary: 'hops', fallback: null },
    { id: 'relaypool/claude-sonnet-4-6', primary: 'hops', fallback: null },
    { id: 'relaypool/claude-sonnet-5', primary: 'hops', fallback: null },
  ];

  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  async function testModel(modelId, group, key) {
    try {
      const resp = await fetch(TH_BASE + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ model: modelId, messages: [{ role: 'user', content: 'hi' }], max_tokens: 10 }),
        signal: AbortSignal.timeout(15000),
      });
      if (resp.ok) return { ok: true };
      const data = await resp.json().catch(() => ({}));
      const msg = data?.error?.message || data?.error?.code || 'HTTP ' + resp.status;
      return { ok: false, error: msg };
    } catch (e) {
      return { ok: false, error: e.message || 'timeout' };
    }
  }

  // Test all models in parallel (batched to avoid rate limit)
  const results = new Map();
  const BATCH_SIZE = 8;

  for (let i = 0; i < CHAT_MODELS.length; i += BATCH_SIZE) {
    const batch = CHAT_MODELS.slice(i, i + BATCH_SIZE);
    const checks = batch.map(async (m) => {
      const key = GROUP_KEYS[m.primary];
      if (!key) return { model: m.id, group: m.primary, status: 'unconfigured' };

      // Test primary
      let r = await testModel(m.id, m.primary, key);
      if (r.ok) return { model: m.id, group: m.primary, status: 'ok' };

      // Try fallback
      if (m.fallback && GROUP_KEYS[m.fallback]) {
        let r2 = await testModel(m.id, m.fallback, GROUP_KEYS[m.fallback]);
        if (r2.ok) return { model: m.id, group: m.fallback, status: 'ok', fallback: true, primary_error: r.error };
      }

      return { model: m.id, group: m.primary, status: 'error', error: r.error };
    });
    const batchResults = await Promise.all(checks);
    batchResults.forEach(r => results.set(r.model, r));
  }

  // Build summary
  const items = Array.from(results.values());
  const ok = items.filter(r => r.status === 'ok').length;
  const errors = items.filter(r => r.status === 'error');
  const unconfigured = items.filter(r => r.status === 'unconfigured').length;

  // Identify models needing routing fix (works on fallback but not primary)
  const needsFix = items.filter(r => r.fallback);

  return new Response(JSON.stringify({
    timestamp: new Date().toISOString(),
    total: items.length,
    ok,
    error: errors.length,
    unconfigured,
    needs_fix: needsFix.map(r => ({
      model: r.model,
      current_group: r.group,
      was_primary: r.group !== 'default', // primary was something else
      primary_error: r.primary_error,
    })),
    models: items,
  }), { headers: h });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}
