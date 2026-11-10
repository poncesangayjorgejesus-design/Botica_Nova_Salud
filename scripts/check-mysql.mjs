import {read} from '../server/store.js';
if(process.env.NOVA_STORAGE!=='mysql'){console.error('Selecciona NOVA_STORAGE=mysql en .env');process.exit(1);}
try{
 const {migrateClinical}=await import('../server/mysql-store.js');await migrateClinical();
 const products=await read('catalogo');
 const orders=await read('pedidos');
 console.log('MySQL XAMPP: CONEXIÓN CORRECTA');
 console.log('Productos en productos:',products.length);
 console.log('Lotes en lotes:',products.reduce((n,p)=>n+p.lotes.length,0));
 console.log('Pedidos en pedidos:',orders.length);
 if(!products.length)console.log('Catálogo vacío: ejecuta npm run db:seed (solo primera vez).');
 process.exit(0);
}catch(e){console.error('MySQL XAMPP: ERROR DE CONEXIÓN O ESQUEMA:',e.code||e.message,e.message);process.exit(1);}