import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { products as examples } from './src/store.js';
const root = resolve(process.env.BANCADA_DATA_DIR || '.data'); mkdirSync(root, {recursive:true});
const db = new DatabaseSync(join(root,'bancada.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL, password TEXT NOT NULL, salt TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer', profile TEXT NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
if (!db.prepare("SELECT value FROM settings WHERE key='seeded'").get()) { const insert = db.prepare('INSERT OR IGNORE INTO products VALUES (?,?)'); for (const p of examples) insert.run(p.id,JSON.stringify(p)); db.prepare('INSERT INTO settings VALUES (?,?)').run('seeded','1'); }
const hash = value => createHash('sha256').update(value).digest('hex');
const phoneKey = value => String(value || '').replace(/[\s()+-]/g,'').replace(/^244/,'');
function passwordHash(password,salt) { return scryptSync(password,salt,64).toString('hex'); }
if (process.argv.includes('--create-admin')) {
 const phone = phoneKey(process.env.BANCADA_ADMIN_PHONE), password = process.env.BANCADA_ADMIN_PASSWORD;
 if (!/^9\d{8}$/.test(phone) || !password || password.length < 12) { console.error('Defina BANCADA_ADMIN_PHONE (9 dígitos) e BANCADA_ADMIN_PASSWORD (mínimo 12 caracteres).'); process.exit(1); }
 const salt = randomBytes(16).toString('hex');
 db.prepare("INSERT INTO users(name,phone,password,salt,role) VALUES (?,?,?,?,'admin') ON CONFLICT(phone) DO UPDATE SET password=excluded.password,salt=excluded.salt,role='admin'").run('Administrador',phone,passwordHash(password,salt),salt);
 const user = db.prepare('SELECT id FROM users WHERE phone=?').get(phone); db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
 console.log('Administrador configurado. Entre pela página Conta.'); db.close(); process.exit(0);
}
const rate = new Map();
const publicUser = row => row && ({ id:row.id, name:row.name, phone:row.phone, role:row.role, profile:JSON.parse(row.profile) });
function userFor(req) { const token = (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('bancada_session='))?.slice(16); if (!token) return null; return db.prepare('SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE sessions.token=? AND sessions.expires>?').get(hash(token),Date.now()); }
function session(res,id) { const token = randomBytes(32).toString('hex'); db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now()); db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash(token),id,Date.now()+7*86400000); res.setHeader('Set-Cookie',`bancada_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${process.env.NODE_ENV==='production' ? '; Secure' : ''}`); }
function send(res,status,data) { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); }
async function body(req) { let text=''; for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text)>100000) { const error = new Error('Pedido demasiado grande.'); error.status=413; throw error; } } try { return JSON.parse(text || '{}'); } catch { const error = new Error('Dados inválidos.'); error.status=400; throw error; } }
function safeProfile(data) { const value={}; for(const key of ['name','phone','province','municipality','address','reference']) { value[key]=String(data[key]||'').trim().slice(0,key==='address'?500:key==='reference'?300:120); } return value; }
function checkedProduct(data) { const id=String(data.id||'').trim(); if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||id.length>80) throw new Error('Use um identificador com letras minúsculas, números e hífens.'); const result={id}; for(const key of ['name','category','description','tag']) result[key]=String(data[key]||'').trim().slice(0,key==='description'?3000:120); if (!result.name || !result.category || !result.description) throw new Error('Preencha nome, categoria e descrição.'); result.price=Number(data.price); if(!Number.isFinite(result.price)||result.price<=0||result.price>1e9) throw new Error('Informe um preço válido em AOA.'); result.image=String(data.image||'').trim().slice(0,2000); if(result.image){ if(!/^photo-[a-z0-9-]+$/.test(result.image)){ const url=new URL(result.image); if(url.protocol!=='https:') throw new Error('A imagem deve usar um endereço HTTPS.'); } } result.details=Array.isArray(data.details)?data.details.map(x=>String(x).trim().slice(0,300)).filter(Boolean).slice(0,15):[]; result.tone='#eeeeee'; result.icon='◈'; result.demo=false; return result; }
async function api(req,res,path) {
 if (!['GET','HEAD'].includes(req.method)) { const origin=req.headers.origin; if(origin){ try{if(new URL(origin).host!==req.headers.host) return send(res,403,{error:'Origem não autorizada.'});}catch{return send(res,403,{error:'Origem inválida.'});} } if(!String(req.headers['content-type']||'').startsWith('application/json')) return send(res,415,{error:'Envie dados JSON.'}); }
 const user=userFor(req);
 if(req.method==='GET'&&path==='/api/products') return send(res,200,db.prepare('SELECT data FROM products ORDER BY rowid').all().map(p=>JSON.parse(p.data)));
 if(req.method==='GET'&&path==='/api/me') return send(res,200,{user:publicUser(user)});
 if(req.method==='POST'&&['/api/register','/api/login'].includes(path)) {
  const key=req.socket.remoteAddress; const bucket=rate.get(key); if(bucket && Date.now()-bucket.at<600000 && bucket.count>=15) return send(res,429,{error:'Muitas tentativas. Aguarde alguns minutos.'}); rate.set(key,{at:bucket&&Date.now()-bucket.at<600000?bucket.at:Date.now(),count:bucket&&Date.now()-bucket.at<600000?bucket.count+1:1});
  const data=await body(req); const phone=phoneKey(data.phone); const password=String(data.password||'');
  if(!/^9\d{8}$/.test(phone)||password.length<8||password.length>200) return send(res,400,{error:'Use um telefone de Angola válido e uma senha entre 8 e 200 caracteres.'});
  let row;
  if(path==='/api/register') { const name=String(data.name||'').trim().slice(0,120); if(!name) return send(res,400,{error:'Informe o seu nome.'}); if(db.prepare('SELECT id FROM users WHERE phone=?').get(phone)) return send(res,409,{error:'Este telefone já tem conta. Use Entrar.'}); const salt=randomBytes(16).toString('hex'); const result=db.prepare('INSERT INTO users(name,phone,password,salt) VALUES (?,?,?,?)').run(name,phone,passwordHash(password,salt),salt); row=db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid); }
  else { row=db.prepare('SELECT * FROM users WHERE phone=?').get(phone); const salt=row?.salt || 'unregistered-user'; const supplied=Buffer.from(passwordHash(password,salt),'hex'); const expected=Buffer.from(row?.password || '00'.repeat(64),'hex'); if(!timingSafeEqual(supplied,expected)||!row) return send(res,401,{error:'Telefone ou senha incorretos.'}); }
  session(res,row.id); return send(res,200,{user:publicUser(row)});
 }
 if(req.method==='POST'&&path==='/api/logout'){ const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('bancada_session='))?.slice(16); if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token)); res.setHeader('Set-Cookie','bancada_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'); return send(res,200,{ok:true}); }
 if(path==='/api/profile'&&req.method==='PUT'){if(!user)return send(res,401,{error:'Entre na sua conta.'}); const profile=safeProfile(await body(req)); db.prepare('UPDATE users SET profile=? WHERE id=?').run(JSON.stringify(profile),user.id); return send(res,200,{ok:true});}
 if(path.startsWith('/api/admin/products')){if(user?.role!=='admin')return send(res,403,{error:'Apenas o administrador pode gerir produtos.'});if(req.method==='POST'&&path==='/api/admin/products'){try{const p=checkedProduct(await body(req)); if(db.prepare('SELECT id FROM products WHERE id=?').get(p.id))return send(res,409,{error:'Esse identificador já existe. Edite o produto existente.'});db.prepare('INSERT INTO products VALUES (?,?)').run(p.id,JSON.stringify(p));return send(res,201,p);}catch(e){return send(res,400,{error:e.message});}} const id=decodeURIComponent(path.slice('/api/admin/products/'.length));if(!db.prepare('SELECT id FROM products WHERE id=?').get(id))return send(res,404,{error:'Produto não encontrado.'});if(req.method==='PUT'){try{const p=checkedProduct({...await body(req),id}); db.prepare('UPDATE products SET data=? WHERE id=?').run(JSON.stringify(p),id); return send(res,200,p);}catch(e){return send(res,400,{error:e.message});}}if(req.method==='DELETE'){db.prepare('DELETE FROM products WHERE id=?').run(id);return send(res,200,{ok:true});}}
 return send(res,404,{error:'Página não encontrada.'});
}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff'};
const server=http.createServer(async(req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');try{const path=new URL(req.url,'http://localhost').pathname;if(path.startsWith('/api/'))return await api(req,res,path);if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Método não permitido.'}); const base=resolve('dist');const file=resolve(base,'.'+decodeURIComponent(path));if(!file.startsWith(base+'/')&&file!==base)return send(res,403,{error:'Acesso negado.'});const target=existsSync(file)&&extname(file)?file:join(base,'index.html');if(!existsSync(target))return send(res,503,{error:'Execute npm run build antes de iniciar o servidor.'});res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','Cache-Control':target.endsWith('index.html')?'no-cache':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:readFileSync(target));}catch(e){send(res,e.status||500,{error:e.status?e.message:'Não foi possível concluir. Tente novamente.'});}});
server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log(`BANCADA.az servidor pronto na porta ${process.env.PORT||3000}`));
