export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).send('tiktok-developers-site-verification=07mg5DGK2MK2mHUxMTjzRnMdWZJcTwgt');
}
