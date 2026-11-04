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