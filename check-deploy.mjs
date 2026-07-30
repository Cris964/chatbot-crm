fetch('https://nexuscrmia.vercel.app').then(r=>r.text()).then(t1 => {
  fetch('https://chatbot-bz2vddszg-cris964s-projects.vercel.app').then(r=>r.text()).then(t2 => {
    const s1 = t1.match(/<script[^>]*src="([^"]+)"/)[1];
    const s2 = t2.match(/<script[^>]*src="([^"]+)"/)[1];
    console.log('Alias length:', t1.length, 'Prod length:', t2.length, 'Equal:', t1===t2);
    console.log('Alias script:', s1);
    console.log('Prod script:', s2);
  })
})
