export async function onRequestPost(context) {
  const { email } = await context.request.json();
  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400 });
  }
  const res = await fetch('https://api.sender.net/v2/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${context.env.SENDER_API_TOKEN}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify({ email })
  });
  return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
