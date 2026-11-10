import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {read,write,transaction} from '../server/store.js';
if(process.env.NOVA_STORAGE!=='mysql'){
 console.error('NOVA_STORAGE debe ser mysql. Configura .env o usa: node --env-file=.env scripts/import_mysql.mjs');process.exit(1);
}
const {migrateClinical}=await import('../server/mysql-store.js');
await migrateClinical();
const source=JSON.parse(fs.readFileSync(new URL('../data/catalogo.json',import.meta.url),'utf8'));
try{
 const existing=await read('catalogo');
 if(existing.length){console.log(`Base de datos ya tiene ${existing.length} productos; NO se sobrescribe. Importación omitida.`);process.exit(0);}
 await transaction(async()=>{
  const recheck=await read('catalogo');
  if(recheck.length)throw new Error('Ya existen productos; no se sobrescribe');
  await write('catalogo',source);
 });
 console.log(`Importación exitosa: ${source.length} productos con sus lotes de demostración.`);process.exit(0);
}catch(e){console.error('Error al importar. Confirma que XAMPP MySQL esté iniciado, que la base exista y las credenciales sean correctas:',e.message);process.exit(1);}