// Common auth helper
function getAuthEmail(request) {
  const auth = request.headers.get('x-auth-email');
  const pass = request.headers.get('x-auth-pass');
  return { email: auth, pass };
}

// CORS helper
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-auth-email, x-auth-pass',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}

export { getAuthEmail, corsHeaders, json };
