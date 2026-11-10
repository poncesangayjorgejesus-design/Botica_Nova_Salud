// Explicit, isolated integration test. Needs CREATE/DROP DATABASE privileges.
import mysql from 'mysql2/promise';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const config={host:process.env.MYSQL_HOST||'127.0.0.1',port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER||'root',password:process.env.MYSQL_PASSWORD||'',multipleStatements:true};
const db='nova_test_'+randomBytes(6).toString('hex');
let conn,created=false;
try{
 conn=await mysql.createConnection(config);
 await conn.query(`CREATE DATABASE ${db} CHARACTER SET utf8mb4`);created=true;
 const schema=fs.readFileSync(new URL('../sql/nova_salud.sql',import.meta.url),'utf8').replace(/CREATE DATABASE[^;]+;/,'').replace('USE nova_salud;',`USE ${db};`);
 await conn.query(schema);
 process.env.MYSQL_DATABASE=db;
 const {migrateClinical,readMysql,writeMysql,transactionMysql}=await import('../server/mysql-store.js');
 await migrateClinical();await migrateClinical();
 const p={id:1,nombre:'Test',principio:'Test',concentracion:'1',forma:'Tableta',categoria:'Test',precio:2,minimo:0,visible:true,receta:'Venta libre',indicaciones:'Documento de prueba',fuenteFarmacologica:'Test',estadoRevision:'Revisado',requiereReceta:false,lotes:[{id:'lot',codigo:'TEST',cantidad:10,vencimiento:'2099-01-01'}]};
 await transactionMysql(()=>writeMysql('catalogo',[p]));
 const saved=await readMysql('catalogo');assert.equal(saved[0].indicaciones,p.indicaciones);assert.equal(saved[0].lotes[0].cantidad,10);
 await assert.rejects(transactionMysql(async()=>{await writeMysql('catalogo',[{...p,nombre:'Rollback'}]);throw Error('expected')}));
 assert.equal((await readMysql('catalogo'))[0].nombre,'Test');
 await conn.end();conn=await mysql.createConnection({...config,database:db});
 const [[row]]=await conn.query('SELECT nombre FROM productos WHERE id=1');assert.equal(row.nombre,'Test');
 const [[clinical]]=await conn.query('SELECT datos FROM producto_clinica WHERE producto_id=1');assert.match(JSON.stringify(clinical),/Documento de prueba/);
 console.log('PASS: MySQL schema, additive/idempotent migration, clinical persistence, lots, rollback and reconnection.');
}catch(e){console.error('MySQL test could not complete:',e.code||e.message);process.exitCode=1}
finally{if(conn){if(created)await conn.query(`DROP DATABASE ${db}`);await conn.end()}process.exit(process.exitCode||0)}
