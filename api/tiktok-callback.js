export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT,HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    return res.status(200).end();
  }

  // Handle TikTok OAuth Redirect (GET)
  const code = req.query.code;
  const state = req.query.state;

  if (code) {
    console.log('[TIKTOK OAUTH CALLBACK RECEIVED]', { code, state });
    // In production, redirect the user back to the CRM settings with success
    return res.redirect(302, '/settings?tiktok_auth=success');
  }

  // Handle any test ping / verification from TikTok
  return res.status(200).json({
    status: 'success',
    message: 'TikTok Login Callback Ready',
    query: req.query,
    body: req.body
  });
}
