import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';

const mysqlMode=process.env.NOVA_STORAGE==='mysql';
const mysqlStorage=mysqlMode?await import('./mysql-store.js'):null;
export const DATA_DIR=process.env.NOVA_DATA_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../data');
fs.mkdirSync(DATA_DIR,{recursive:true});
for (const name of ['catalogo','pedidos','movimientos']) {
  const file=path.join(DATA_DIR,name+'.json');
  if (!fs.existsSync(file)) fs.writeFileSync(file,'[]\n');
}

export const read=(name)=>mysqlMode?mysqlStorage.readMysql(name):JSON.parse(fs.readFileSync(path.join(DATA_DIR,name+'.json'),'utf8'));
export function write(name,items){
  if(mysqlMode)return mysqlStorage.writeMysql(name,items);
  const target=path.join(DATA_DIR,name+'.json'),tmp=target+'.'+process.pid+'.tmp';
  fs.writeFileSync(tmp,JSON.stringify(items,null,2));fs.renameSync(tmp,target);
}
let pending=Promise.resolve();
export function transaction(fn){if(mysqlMode)return mysqlStorage.transactionMysql(fn);let p=pending.then(fn);pending=p.catch(()=>{});return p;}
export const id=()=>crypto.randomUUID();
export const nowDay=()=>new Date().toISOString().slice(0,10);
export const round=n=>Math.round(Number(n)*100)/100;
export const label=x=>String(x??'').trim();
export const validDate=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s)))return false;let d=new Date(s+'T00:00:00Z');return !Number.isNaN(+d)&&d.toISOString().slice(0,10)===s;};