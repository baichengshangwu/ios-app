export async function onRequestGet({ request, env }) {
  // All 9 group keys
  const KEYS = {
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

  const TH_BASE = 'https://tokenhub.wetok.ai/v1';

  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // All 53 models with their group affiliation
  const ALL_MODELS = [
    // === Chat ===
    { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', cat: 'text', groups: ['default','tencent','Aliyun_adb'] },
    { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', cat: 'text', groups: ['default','tencent','Aliyun_adb'] },
    { id: 'glm-5', name: 'GLM-5', cat: 'text', groups: ['default','tencent'] },
    { id: 'glm-5-turbo', name: 'GLM-5 Turbo', cat: 'text', groups: ['default','tencent'] },
    { id: 'glm-5.1', name: 'GLM-5.1', cat: 'text', groups: ['default','tencent'] },
    { id: 'glm-5.2', name: 'GLM-5.2', cat: 'text', groups: ['Aliyun_promo','default','tencent'] },
    { id: 'glm-5.2-fast-preview', name: 'GLM-5.2 Fast Preview', cat: 'text', groups: ['Aliyun_adb'] },
    { id: 'kimi-k3', name: 'Kimi K3', cat: 'text', groups: ['default','tencent','Aliyun_adb'] },
    { id: 'kimi-k2.7-code-highspeed', name: 'Kimi K2.7 Code Highspeed', cat: 'text', groups: ['Aliyun_adb'] },
    { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex', cat: 'text', groups: ['vip'] },
    { id: 'gpt-5.4', name: 'GPT-5.4', cat: 'text', groups: ['vip'] },
    { id: 'gpt-5.4-pro', name: 'GPT-5.4 Pro', cat: 'text', groups: ['vip'] },
    { id: 'gpt-5.5', name: 'GPT-5.5', cat: 'text', groups: ['vip'] },
    { id: 'gpt-5.5-instant', name: 'GPT-5.5 Instant', cat: 'text', groups: ['vip'] },
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', cat: 'text', groups: ['vip'] },
    { id: 'claude-opus-4-6-thinking', name: 'Claude Opus 4.6 Thinking', cat: 'text', groups: ['vip'] },
    { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', cat: 'text', groups: ['vip','hops'] },
    { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', cat: 'text', groups: ['vip'] },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', cat: 'text', groups: ['vip','hops'] },
    { id: 'claude-sonnet-4-6-thinking', name: 'Claude Sonnet 4.6 Thinking', cat: 'text', groups: ['vip'] },
    { id: 'qwen3.7-plus', name: 'Qwen3.7 Plus', cat: 'text', groups: ['Aliyun_disc'] },
    { id: 'qwen3.7-max', name: 'Qwen3.7 Max', cat: 'text', groups: ['Aliyun_disc'] },
    { id: 'qwen3.7-flash', name: 'Qwen3.7 Flash', cat: 'text', groups: ['Aliyun_disc'] },
    { id: 'qwen3-32b-AWQ', name: 'Qwen3 32B AWQ', cat: 'text', groups: ['selfhosted'] },
    { id: 'MiniMax/MiniMax-M3', name: 'MiniMax M3', cat: 'text', groups: ['Aliyun_adb'] },
    { id: 'unipass/gpt-5.4', name: 'UniPass GPT-5.4', cat: 'text', groups: ['hops'] },
    { id: 'unipass/gpt-5.5', name: 'UniPass GPT-5.5', cat: 'text', groups: ['hops'] },
    { id: 'unipass/gpt-5.6', name: 'UniPass GPT-5.6', cat: 'text', groups: ['hops'] },
    { id: 'unipass/gpt-5.6-sol', name: 'UniPass GPT-5.6 Sol', cat: 'text', groups: ['hops'] },
    { id: 'unipass/gpt-5.6-terra', name: 'UniPass GPT-5.6 Terra', cat: 'text', groups: ['hops'] },
    { id: 'unipass/gpt-5.6-luna', name: 'UniPass GPT-5.6 Luna', cat: 'text', groups: ['hops'] },
    { id: 'unipass/claude-opus-4-6', name: 'UniPass Claude Opus 4.6', cat: 'text', groups: ['hops'] },
    { id: 'unipass/claude-opus-4-7', name: 'UniPass Claude Opus 4.7', cat: 'text', groups: ['hops'] },
    { id: 'unipass/claude-opus-4-8', name: 'UniPass Claude Opus 4.8', cat: 'text', groups: ['hops'] },
    { id: 'unipass/claude-sonnet-4-6', name: 'UniPass Claude Sonnet 4.6', cat: 'text', groups: ['hops'] },
    { id: 'relaypool/gpt-5.4', name: 'RelayPool GPT-5.4', cat: 'text', groups: ['hops'] },
    { id: 'relaypool/gpt-5.5', name: 'RelayPool GPT-5.5', cat: 'text', groups: ['hops'] },
    { id: 'relaypool/gpt-5.6', name: 'RelayPool GPT-5.6', cat: 'text', groups: ['hops'] },
    { id: 'relaypool/gpt-5.6-sol', name: 'RelayPool GPT-5.6 Sol', cat: 'text', groups: ['hops'] },
    { id: 'relaypool/gpt-5.6-terra', name: 'RelayPool GPT-5.6 Terra', cat: 'text', groups: ['hops'] },
    { id: 'relaypool/gpt-5.6-luna', name: 'RelayPool GPT-5.6 Luna', cat: 'text', groups: ['hops'] },
    { id: 'relaypool/claude-opus-4-6', name: 'RelayPool Claude Opus 4.6', cat: 'text', groups: ['hops'] },
    { id: 'relaypool/claude-opus-4-7', name: 'RelayPool Claude Opus 4.7', cat: 'text', groups: ['hops'] },
    { id: 'relaypool/claude-opus-4-8', name: 'RelayPool Claude Opus 4.8', cat: 'text', groups: ['hops'] },
    { id: 'relaypool/claude-sonnet-4-6', name: 'RelayPool Claude Sonnet 4.6', cat: 'text', groups: ['hops'] },
    { id: 'relaypool/claude-sonnet-5', name: 'RelayPool Claude Sonnet 5', cat: 'text', groups: ['hops'] },
    // === Image ===
    { id: 'gpt-image-1.5', name: 'GPT Image 1.5', cat: 'image', groups: ['vip'] },
    { id: 'gpt-image-2', name: 'GPT Image 2', cat: 'image', groups: ['vip'] },
    { id: 'gpt-image-2-text-to-image', name: 'GPT Image 2 Text-to-Image', cat: 'image', groups: ['hops'] },
    { id: 'gpt-image-2-image-to-image', name: 'GPT Image 2 Image-to-Image', cat: 'image', groups: ['hops'] },
    // === Video ===
    { id: 'doubao-seedance-2.0', name: 'Doubao Seedance 2.0', cat: 'video', groups: ['Seedance'] },
    // === Embedding & Rerank ===
    { id: 'qwen3.7-text-embedding', name: 'Qwen3.7 Text Embedding', cat: 'embedding', groups: ['Aliyun_disc'] },
    { id: 'qwen3-rerank', name: 'Qwen3 Rerank', cat: 'rerank', groups: ['Aliyun_disc'] },
  ];

  try {
    // Check each group key for availability
    const checks = Object.entries(KEYS).map(async ([group, key]) => {
      try {
        const resp = await fetch(TH_BASE + '/models', {
          headers: { 'Authorization': 'Bearer ' + key },
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data.data || []).map(m => m.id);
      } catch (e) {
        return [];
      }
    });

    const allAvailable = await Promise.all(checks);
    const availableSet = new Set();
    allAvailable.forEach(arr => arr.forEach(id => availableSet.add(id)));

    // Build model-to-group-key mapping
    const modelKeyMap = {};
    ALL_MODELS.forEach(m => {
      for (const g of m.groups) {
        if (KEYS[g]) {
          modelKeyMap[m.id] = g;
          break;
        }
      }
    });

    const models = ALL_MODELS.map(m => ({
      ...m,
      available: availableSet.has(m.id),
    })).sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      return a.id.localeCompare(b.id);
    });

    const availableCount = models.filter(m => m.available).length;

    return new Response(JSON.stringify({
      models,
      total: models.length,
      available: availableCount,
      unavailable: models.length - availableCount,
      model_key_map: modelKeyMap,
    }), { headers: h });
  } catch (e) {
    const models = ALL_MODELS.map(m => ({ ...m, available: false }));
    return new Response(JSON.stringify({
      models,
      total: models.length,
      available: 0,
      unavailable: models.length,
      error: 'Failed to fetch availability',
    }), { headers: h });
  }
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
