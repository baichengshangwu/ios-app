/**
 * ZPay Payment Notification Handler
 * Receives async payment confirmations from zpayz.cn
 * POST body: pid, trade_no, out_trade_no, type, name, money, trade_status, param, sign, sign_type
 */
export async function onRequest(context) {
  const { request } = context;

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    const tradeStatus = params.get('trade_status');
    const money = parseFloat(params.get('money') || '0');
    const outTradeNo = params.get('out_trade_no');
    const email = params.get('param') || '';

    console.log(`[ZPay Notify] trade_status=${tradeStatus} money=${money} out_trade_no=${outTradeNo} email=${email}`);

    if (tradeStatus === 'SUCCESS' || tradeStatus === 'TRADE_SUCCESS') {
      // In production, update user balance in database/KV here
      // For now, log and return success - balance update handled client-side
      console.log(`[ZPay Notify] Payment confirmed: ${email} +¥${money} order=${outTradeNo}`);
    }

    return new Response('success', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (err) {
    console.error('[ZPay Notify] Error:', err.message);
    return new Response('error: ' + err.message, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
