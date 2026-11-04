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