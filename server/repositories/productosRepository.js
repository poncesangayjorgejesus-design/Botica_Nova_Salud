// Legacy API adapter. Both APIs now use the SAME persistent inventory.
import {read,write,transaction,enriched,productFields,adjustStock,audit} from '../store.js';
import {normalize} from '../services/clinical.js';
const legacy=p=>({...enriched(p),principioActivo:p.principio,presentacion:p.forma,imagenUrl:p.imagen,demo:true});
export async function listarProductos(f={}){return (await read('catalogo')).filter(p=>p.visible!==false&&normalize(p.nombre).includes(normalize(f.nombre))&&normalize(p.categoria).includes(normalize(f.categoria))&&normalize(p.principio).includes(normalize(f.principioActivo))).map(legacy)}
export async function obtenerProductoPorId(id){const p=(await read('catalogo')).find(p=>p.id===Number(id)&&p.visible!==false);return p?legacy(p):null}
function fields(d,p={}){return {nombre:d.nombre,principio:d.principioActivo,categoria:d.categoria,forma:d.presentacion||p.forma||'Por documentar',concentracion:d.concentracion||p.concentracion||'Por documentar',precio:d.precio??p.precio??0,...(d.imagenUrl?.startsWith('data:image/')?{imagen:d.imagenUrl}:{})}}
export async function crearProducto(d){return transaction(async()=>{const all=await read('catalogo'),p=productFields(fields(d));p.id=Math.max(0,...all.map(x=>x.id))+1;if(d.stock!=null)adjustStock(p,d.stock);all.push(p);await write('catalogo',all);await audit('Producto creado',p.nombre);return legacy(p)})}
export async function actualizarProducto(id,d){return transaction(async()=>{const all=await read('catalogo'),p=all.find(x=>x.id===Number(id));if(!p)return null;Object.assign(p,productFields(fields(d,p),p));if(d.stock!=null)adjustStock(p,d.stock);await write('catalogo',all);await audit('Producto actualizado',p.nombre);return legacy(p)})}
export async function eliminarProducto(id){return transaction(async()=>{const all=await read('catalogo'),p=all.find(x=>x.id===Number(id));if(!p)return null;p.visible=false;await write('catalogo',all);await audit('Producto ocultado',p.nombre);return legacy(p)})}
