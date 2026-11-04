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
export const activeLots=p=>(p.lotes||[]).filter(l=>validDate(l.vencimiento)&&l.vencimiento>=nowDay()&&Number.isInteger(+l.cantidad)&&+l.cantidad>0);
export const stock=p=>activeLots(p).reduce((n,l)=>n+ +l.cantidad,0);
export function enriched(p,admin=false){
  let {lotes,...rest}=p;
  let valid=(lotes||[]).filter(l=>validDate(l.vencimiento)).sort((a,b)=>a.vencimiento.localeCompare(b.vencimiento));
  return {...rest,stock:stock(p),proximoVencimiento:valid.find(l=>l.vencimiento>=nowDay()&&l.cantidad>0)?.vencimiento||null,origen:p.origen||'Datos académicos de prueba',...(admin?{lotes:lotes||[]}:{})};
}
export function takeStock(p,quantity){
 if(stock(p)<quantity)throw Object.assign(new Error('Stock insuficiente'),{status:409});
 let remaining=quantity;
 for(const lot of activeLots(p).sort((a,b)=>a.vencimiento.localeCompare(b.vencimiento))){const use=Math.min(remaining,+lot.cantidad);lot.cantidad-=use;remaining-=use;if(!remaining)break;}
}
export function adjustStock(p,quantity){
 const current=stock(p),delta=quantity-current;
 if(delta<0){takeStock(p,-delta);return;}
 if(delta>0){let lot=(p.lotes||[]).find(l=>l.codigo==='AJUSTE-ACADEMICO'&&l.vencimiento==='2099-12-31');
 if(!lot){lot={id:id(),codigo:'AJUSTE-ACADEMICO',cantidad:0,vencimiento:'2099-12-31'};p.lotes??=[];p.lotes.push(lot);}lot.cantidad+=delta;
 }
}
export function audit(accion,detalle){if(mysqlMode)return mysqlStorage.auditMysql(accion,detalle);const a=read('movimientos');a.unshift({id:id(),fecha:new Date().toISOString(),accion,detalle:String(detalle).slice(0,250)});write('movimientos',a.slice(0,1000));}
export function validationError(message){return Object.assign(new Error(message),{status:400});}
export function nonNegative(value,name,max=1e7,integer=false){const n=Number(value);if(value===''||value===null||value===undefined||!Number.isFinite(n)||n<0||n>max||(integer&&!Number.isInteger(n)))throw validationError(name+' inválido');return n;}
export function productFields(b,existing={}){
 const p={...existing};
 for(let key of ['nombre','principio','concentracion','forma','categoria']){
   if(b[key]!==undefined||!existing.id){const v=label(b[key]);if(!v||v.length>100)throw validationError('Revisa el campo '+key);p[key]=v;}
 }
 if(b.precio!==undefined||!existing.id)p.precio=round(nonNegative(b.precio,'Precio',100000));
 if(b.minimo!==undefined||!existing.id)p.minimo=nonNegative(b.minimo??0,'Stock mínimo',100000,true);
 if(b.descripcion!==undefined)p.descripcion=label(b.descripcion).slice(0,1000);
 if(b.receta!==undefined){const valid=['Por verificar','Verificar condición de venta','Condición de venta por verificar en DIGEMID','Requiere evaluación de receta','Verificar receta','Sujeto a receta (demo)','Venta libre (demo, por verificar)'];if(!valid.includes(b.receta))throw validationError('Condición de venta inválida');p.receta=b.receta;}
 if(b.visible!==undefined){if(typeof b.visible!=='boolean')throw validationError('Visibilidad inválida');p.visible=b.visible;}
 if(b.imagen!==undefined){if(typeof b.imagen!=='string'||(b.imagen!==''&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(b.imagen))||b.imagen.length>1400000)throw validationError('Imagen inválida: formato JPG, PNG o WebP menor de 1 MB');p.imagen=b.imagen;}
 if(!existing.id){p.id=1;p.visible=b.visible??true;p.lotes=[];p.imagen=p.imagen||'';p.receta=p.receta||'Por verificar';p.descripcion=p.descripcion||'Producto de prueba. No representa información oficial de venta.';p.origen='Datos académicos de prueba';}
 return p;
}