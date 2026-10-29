import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {handler} from '../netlify/functions/offers.mjs';
const types={'.css':'text/css','.js':'text/javascript','.json':'application/json','.html':'text/html'};
http.createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;if(path==='/api/offers'){const r=await handler();res.writeHead(r.statusCode,r.headers);res.end(r.body);return}const file=path==='/'?'index.html':path.slice(1);if(!['index.html','app.js','style.css','catalog.json'].includes(file)){res.writeHead(404);res.end();return}try{const data=await readFile(new URL('../public/'+file,import.meta.url));res.writeHead(200,{'Content-Type':types['.'+file.split('.').pop()]});res.end(data)}catch{res.writeHead(404);res.end()}}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log(`Local: http://localhost:${process.env.PORT||3000}`));
