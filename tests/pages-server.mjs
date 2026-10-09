// Test-only static host: exercise the same project subdirectory as GitHub Pages.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const base=resolve('dist-pages');
http.createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(!path.startsWith('/BANCADA.az/')){res.writeHead(404);res.end();return;}
  const file=resolve(base,path.slice('/BANCADA.az/'.length)||'index.html');
  if(!file.startsWith(base+'/')){res.writeHead(403);res.end();return;}
  const content=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff'})[extname(file)]||'application/octet-stream'});res.end(content);
 }catch{res.writeHead(404);res.end();}
}).listen(3200,'127.0.0.1');
