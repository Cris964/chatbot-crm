fetch('https://nexuscrmia.vercel.app/api/cron/remarketing?token=n3xus_cron_2026')
  .then(async (res) => {
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
  })
  .catch(console.error);
