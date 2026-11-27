import https from 'https';

https.get('https://homebrain-delta.vercel.app', (res) => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    console.log('HTML Status:', res.statusCode);
    const scripts = [...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
    const links = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    console.log('Found scripts:', scripts);
    console.log('Found links:', links);

    for (const src of scripts) {
      if (src.startsWith('/')) {
        https.get('https://homebrain-delta.vercel.app' + src, (r2) => {
          console.log(`Asset ${src} -> ${r2.statusCode} (${r2.headers['content-type']}, ${r2.headers['content-length']} bytes)`);
        });
      }
    }
  });
});
