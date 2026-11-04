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