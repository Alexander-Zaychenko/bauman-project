const http = require('http');
function get(path){return new Promise((res,rej)=>{http.get({hostname:'localhost',port:3000,path,agent:false}, r=>{let data='';r.on('data',c=>data+=c);r.on('end',()=>res({statusCode:r.statusCode,body:data}));}).on('error',e=>rej(e));});}
(async ()=>{
  try{
    const r1 = await get('/api/requests'); console.log('/api/requests ->', r1.statusCode, r1.body.slice(0,500));
    const r2 = await get('/api/chats?userId=1'); console.log('/api/chats?userId=1 ->', r2.statusCode, r2.body.slice(0,500));
  }catch(e){console.error(e)}
})();
