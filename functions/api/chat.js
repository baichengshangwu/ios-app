export async function onRequestPost({ request, env }) {
  const TH_BASE = 'https://tokenhub.wetok.ai/v1';

  // Multi-key: model -> group -> key mapping
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

  // Model -> group mapping
  const MODEL_GROUP = {
    'deepseek-v4-pro': 'default',
    'deepseek-v4-flash': 'default',
    'glm-5': 'default',
    'glm-5-turbo': 'default',
    'glm-5.1': 'default',
    'glm-5.2': 'Aliyun_promo',
    'glm-5.2-fast-preview': 'Aliyun_adb',
    'kimi-k3': 'default',
    'kimi-k2.7-code-highspeed': 'Aliyun_adb',
    'gpt-5.3-codex': 'vip',
    'gpt-5.4': 'vip',
    'gpt-5.4-pro': 'vip',
    'gpt-5.5': 'vip',
    'gpt-5.5-instant': 'vip',
    'claude-opus-4-6': 'vip',
    'claude-opus-4-6-thinking': 'vip',
    'claude-opus-4-7': 'vip',
    'claude-opus-4-8': 'vip',
    'claude-sonnet-4-6': 'vip',
    'claude-sonnet-4-6-thinking': 'vip',
    'qwen3.7-plus': 'Aliyun_disc',
    'qwen3.7-max': 'Aliyun_disc',
    'qwen3.7-flash': 'Aliyun_disc',
    'qwen3-32b-AWQ': 'selfhosted',
    'MiniMax/MiniMax-M3': 'Aliyun_adb',
    'unipass/gpt-5.4': 'hops',
    'unipass/gpt-5.5': 'hops',
    'unipass/gpt-5.6': 'hops',
    'unipass/gpt-5.6-sol': 'hops',
    'unipass/gpt-5.6-terra': 'hops',
    'unipass/gpt-5.6-luna': 'hops',
    'unipass/claude-opus-4-6': 'hops',
    'unipass/claude-opus-4-7': 'hops',
    'unipass/claude-opus-4-8': 'hops',
    'unipass/claude-sonnet-4-6': 'hops',
    'relaypool/gpt-5.4': 'hops',
    'relaypool/gpt-5.5': 'hops',
    'relaypool/gpt-5.6': 'hops',
    'relaypool/gpt-5.6-sol': 'hops',
    'relaypool/gpt-5.6-terra': 'hops',
    'relaypool/gpt-5.6-luna': 'hops',
    'relaypool/claude-opus-4-6': 'hops',
    'relaypool/claude-opus-4-7': 'hops',
    'relaypool/claude-opus-4-8': 'hops',
    'relaypool/claude-sonnet-4-6': 'hops',
    'relaypool/claude-sonnet-5': 'hops',
    'gpt-image-1.5': 'vip',
    'gpt-image-2': 'vip',
    'gpt-image-2-text-to-image': 'hops',
    'gpt-image-2-image-to-image': 'hops',
    'doubao-seedance-2.0': 'Seedance',
    'qwen3.7-text-embedding': 'Aliyun_disc',
    'qwen3-rerank': 'Aliyun_disc',
  };

  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  function err(msg, status) {
    return new Response(JSON.stringify({ error: msg }), { status: status || 500, headers: h });
  }

  try {
    const body = await request.json();
    const { model, messages, provider } = body;
    if (provider !== 'th') return err('unsupported provider', 400);
    if (!model || !messages || !messages.length) return err('missing model or messages', 400);

    // Resolve group and key for this model
    const group = MODEL_GROUP[model] || 'default';
    const TH_KEY = GROUP_KEYS[group];
    if (!TH_KEY) return err('No key configured for group: ' + group, 500);

    const resp = await fetch(TH_BASE + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TH_KEY },
      body: JSON.stringify({ model, messages }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      const detail = data?.error?.message || data?.error?.code || ('HTTP ' + resp.status);
      return err('Model unavailable: ' + detail, 503);
    }

    if (!data || !data.choices || !Array.isArray(data.choices)) {
      return err('Empty response from model', 502);
    }

    const usage = data.usage || {};
    const tokens = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
    const cost = Math.round(tokens * 0.01) / 100;

    return new Response(JSON.stringify({ ...data, _ztw: { cost, tokens, group } }), { headers: h });
  } catch (e) {
    return err('Service error: ' + (e.message || 'unknown'), 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}
