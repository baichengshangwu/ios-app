let codesStore = '{}';

function getCodes() {
  try { return JSON.parse(codesStore); } catch (e) { return {}; }
}
function setCodes(c) {
  codesStore = JSON.stringify(c);
}
function cleanExpired(codes) {
  const now = Date.now();
  for (const k of Object.keys(codes)) {
    if (codes[k].expires < now) delete codes[k];
  }
  return codes;
}

export async function onRequest(context) {
  const { request } = context;
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    const body = await request.json();
    const { email, action, code } = body;
    let codes = cleanExpired(getCodes());
    const now = Date.now();

    // --- Verify code ---
    if (action === 'verify') {
      if (!email || !code) {
        return new Response(JSON.stringify({ success: false, message: '参数不完整' }), { status: 400, headers: h });
      }
      const entry = codes[email];
      if (!entry) {
        return new Response(JSON.stringify({ success: false, message: '验证码已过期或不存在' }), { status: 400, headers: h });
      }
      if (entry.code !== String(code)) {
        return new Response(JSON.stringify({ success: false, message: '验证码错误' }), { status: 400, headers: h });
      }
      delete codes[email];
      setCodes(codes);
      return new Response(JSON.stringify({ success: true, message: '验证通过' }), { status: 200, headers: h });
    }

    // --- Send code ---
    if (!email) {
      return new Response(JSON.stringify({ success: false, message: '邮箱不能为空' }), { status: 400, headers: h });
    }

    // Rate limit: check if code was sent recently
    if (codes[email] && codes[email].sentAt && (now - codes[email].sentAt) < 60000) {
      return new Response(JSON.stringify({ success: false, message: '请60秒后再试' }), { status: 429, headers: h });
    }

    const vcode = String(Math.floor(100000 + Math.random() * 900000));
    codes[email] = { code: vcode, expires: now + 300000, sentAt: now };
    setCodes(codes);

    // Try MailChannels
    let mailOk = false;
    try {
      const mailResp = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: 'noreply@zhitongwang.cn', name: '知同网' },
          subject: '知同网 - 邮箱验证码',
          content: [{ type: 'text/plain', value: '您的验证码是：' + vcode + '，5分钟内有效。如非本人操作请忽略。' }],
        }),
      });
      mailOk = mailResp.ok;
    } catch (e) {
      // mail send failed, continue
    }

    return new Response(JSON.stringify({
      success: true,
      message: mailOk ? '验证码已发送到邮箱' : '验证码已生成',
      mail_sent: mailOk,
      debug_code: vcode
    }), { status: 200, headers: h });

  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      message: '服务异常: ' + (e.message || 'unknown').substring(0, 200),
    }), { status: 500, headers: h });
  }
}
