(async ()=>{
  try {
    const r1 = await fetch('http://localhost:3000/api/requests');
    const j1 = await r1.json();
    console.log('/api/requests ->', JSON.stringify(j1, null, 2));
    const r2 = await fetch('http://localhost:3000/api/chats?userId=1');
    const j2 = await r2.json();
    console.log('/api/chats?userId=1 ->', JSON.stringify(j2, null, 2));
  } catch (e) { console.error('fetch failed', e); process.exit(2);} })();
