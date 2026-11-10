import {AsyncLocalStorage} from 'node:async_hooks';
import mysql from 'mysql2/promise';

const pool=mysql.createPool({
  host:process.env.MYSQL_HOST||'127.0.0.1',
  port:Number(process.env.MYSQL_PORT||3306),
  user:process.env.MYSQL_USER||'root',
  password:process.env.MYSQL_PASSWORD||'',
  database:process.env.MYSQL_DATABASE||'nova_salud',
  waitForConnections:true,
  connectionLimit:6,
  dateStrings:true,
  decimalNumbers:true,
  charset:'utf8mb4',
  timezone:'Z'
});

export async function migrateClinical(){await pool.query(`CREATE TABLE IF NOT EXISTS producto_clinica (producto_id INT UNSIGNED PRIMARY KEY, datos JSON NOT NULL, CONSTRAINT fk_clinica_producto FOREIGN KEY (producto_id) REFERENCES productos(id)) ENGINE=InnoDB`);}
const context=new AsyncLocalStorage();
const executor=()=>context.getStore()||pool;
const checkName=name=>{if(!['catalogo','pedidos','movimientos'].includes(name))throw new Error('Colección desconocida');};
const columns=(rows,fields)=>rows.map(row=>fields.map(field=>row[field]??null));
const sqlInsert=async(table,fields,rows,keyUpdate)=>{
  if(!rows.length)return;
  const query=`INSERT INTO ${table} (${fields.map(f=>'`'+f+'`').join(',')}) VALUES ? ${keyUpdate?`ON DUPLICATE KEY UPDATE ${keyUpdate}`:''}`;
  for(let i=0;i<rows.length;i+=10)await executor().query(query,[columns(rows.slice(i,i+10),fields)]);
};

export async function readMysql(name){
  checkName(name);
  if(name==='catalogo'){
    const [rows]=await executor().query('SELECT id,nombre,principio,concentracion,forma,categoria,descripcion,imagen,precio,minimo,receta,origen,visible FROM productos ORDER BY id');
    const [lots]=await executor().query('SELECT id,producto_id,codigo,cantidad,vencimiento FROM lotes ORDER BY vencimiento,id');
    const byId=new Map(rows.map(r=>[r.id,{...r,visible:!!r.visible,imagen:r.imagen||'',lotes:[]} ]));
    for(const l of lots){const p=byId.get(l.producto_id);if(p)p.lotes.push({id:l.id,codigo:l.codigo,cantidad:l.cantidad,vencimiento:l.vencimiento});}
    const [clinical]=await executor().query('SELECT producto_id,datos FROM producto_clinica');
    for(const r of clinical){const p=byId.get(r.producto_id);if(p){const d=typeof r.datos==='string'?JSON.parse(r.datos):r.datos;for(const key of ['indicaciones','advertencias','contraindicaciones','fuenteFarmacologica','terminosBusqueda','estadoRevision','requiereReceta'])if(d[key]!==undefined)p[key]=d[key];}}
    return [...byId.values()];
  }
  if(name==='pedidos'){
    const [rows]=await executor().query('SELECT id,fecha,cliente,dni,total,estado,procesado,revisionConfirmada,nota FROM pedidos ORDER BY fecha DESC,id DESC');
    const [items]=await executor().query('SELECT pedido_id,producto_id,nombre,principio,concentracion,forma,qty,precio,subtotal,receta FROM pedido_items ORDER BY id');
    const byId=new Map(rows.map(o=>[o.id,{...o,procesado:o.procesado||undefined,revisionConfirmada:!!o.revisionConfirmada,items:[]} ]));
    for(const it of items){const o=byId.get(it.pedido_id);if(o)o.items.push({id:it.producto_id,nombre:it.nombre,principio:it.principio,concentracion:it.concentracion,forma:it.forma,qty:it.qty,precio:it.precio,subtotal:it.subtotal,receta:it.receta});}
    return [...byId.values()];
  }
  const [rows]=await executor().query('SELECT id,fecha,accion,detalle FROM movimientos ORDER BY fecha DESC,id DESC LIMIT 1000');return rows;
}

export async function writeMysql(name,items){
  checkName(name);if(!Array.isArray(items))throw new Error('La colección debe ser una lista');
  if(name==='catalogo'){
    const fields=['id','nombre','principio','concentracion','forma','categoria','descripcion','imagen','precio','minimo','receta','origen','visible'];
    const updates=fields.filter(f=>f!=='id').map(f=>`\`${f}\`=VALUES(\`${f}\`)`).join(',');
    await sqlInsert('productos',fields,items.map(p=>({...p,imagen:p.imagen||'',origen:p.origen||'Datos académicos de prueba',visible:p.visible!==false?1:0})),updates);
    await sqlInsert('producto_clinica',['producto_id','datos'],items.map(p=>({producto_id:p.id,datos:JSON.stringify(Object.fromEntries(['indicaciones','advertencias','contraindicaciones','fuenteFarmacologica','terminosBusqueda','estadoRevision','requiereReceta'].filter(k=>p[k]!==undefined).map(k=>[k,p[k]])))})),'datos=VALUES(datos)');
    await executor().query('DELETE FROM lotes');
    const lots=items.flatMap(p=>(p.lotes||[]).map(l=>({id:l.id,producto_id:p.id,codigo:l.codigo,cantidad:l.cantidad,vencimiento:l.vencimiento})));
    await sqlInsert('lotes',['id','producto_id','codigo','cantidad','vencimiento'],lots);
    return;
  }
  if(name==='pedidos'){
    const fields=['id','fecha','cliente','dni','total','estado','procesado','revisionConfirmada','nota'];
    const updates=fields.filter(f=>f!=='id').map(f=>`\`${f}\`=VALUES(\`${f}\`)`).join(',');
    await sqlInsert('pedidos',fields,items.map(o=>({...o,procesado:o.procesado||null,revisionConfirmada:o.revisionConfirmada?1:0,nota:o.nota||''})),updates);
    await executor().query('DELETE FROM pedido_items');
    const lines=items.flatMap(o=>(o.items||[]).map(i=>({pedido_id:o.id,producto_id:i.id,nombre:i.nombre,principio:i.principio||'',concentracion:i.concentracion||'',forma:i.forma||'',qty:i.qty,precio:i.precio,subtotal:i.subtotal,receta:i.receta||'Por verificar'})));
    await sqlInsert('pedido_items',['pedido_id','producto_id','nombre','principio','concentracion','forma','qty','precio','subtotal','receta'],lines);
    return;
  }
  await executor().query('DELETE FROM movimientos');
  await sqlInsert('movimientos',['id','fecha','accion','detalle'],items.slice(0,1000));
}

export async function transactionMysql(fn){
  if(context.getStore())return fn();
  const connection=await pool.getConnection();let locked=false;
  try{
    const [[lock]]=await connection.query("SELECT GET_LOCK('nova_salud_academico_write',15) AS acquired");
    if(lock.acquired!==1)throw new Error('La base de datos está ocupada; reintenta');locked=true;
    await connection.beginTransaction();
    const result=await context.run(connection,fn);
    await connection.commit();return result;
  }catch(e){try{await connection.rollback();}catch{}throw e;}
  finally{if(locked){try{await connection.query("SELECT RELEASE_LOCK('nova_salud_academico_write')");}catch{}}connection.release();}
}
export async function auditMysql(accion,detalle){
  const crypto=await import('node:crypto');
  await executor().query('INSERT INTO movimientos(id,fecha,accion,detalle) VALUES(?,?,?,?)',[crypto.randomUUID(),new Date().toISOString(),accion,String(detalle).slice(0,250)]);
  await executor().query('DELETE FROM movimientos WHERE id NOT IN (SELECT id FROM (SELECT id FROM movimientos ORDER BY fecha DESC,id DESC LIMIT 1000) m)');
}
export async function checkMysql(){await pool.query('SELECT 1');return true;}