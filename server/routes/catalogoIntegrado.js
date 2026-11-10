import express from 'express';
import {read,write,transaction,enriched,productFields,adjustStock,audit,id,validDate,nonNegative,validationError} from '../store.js';
import {requerirSesionAdmin} from './auth.js';
const router=express.Router();
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
const find=(items,id)=>{const p=items.find(p=>String(p.id)===id);if(!p)throw Object.assign(new Error('Producto no encontrado'),{status:404});return p};
router.get('/',wrap(async(req,res)=>res.json((await read('catalogo')).filter(p=>p.visible!==false).map(p=>enriched(p)))));
router.get('/:id',wrap(async(req,res)=>{const p=find(await read('catalogo'),req.params.id);if(p.visible===false)return res.status(404).json({error:'Producto no disponible'});res.json(enriched(p))}));
router.post('/',requerirSesionAdmin,wrap(async(req,res)=>{
 const result=await transaction(async()=>{const items=await read('catalogo'),p=productFields(req.body);p.id=Math.max(0,...items.map(p=>+p.id))+1;items.push(p);await write('catalogo',items);await audit('Producto creado',p.nombre);return enriched(p,true)});res.status(201).json(result);
}));
async function mutate(req,action){return transaction(async()=>{const items=await read('catalogo'),p=find(items,req.params.id);await action(p);await write('catalogo',items);await audit('Inventario actualizado',p.nombre);return enriched(p,true)})}
router.patch('/:id',requerirSesionAdmin,wrap(async(req,res)=>res.json(await mutate(req,p=>Object.assign(p,productFields(req.body,p))))));
router.delete('/:id',requerirSesionAdmin,wrap(async(req,res)=>res.json(await mutate(req,p=>{p.visible=false}))));
router.patch('/:id/stock',requerirSesionAdmin,wrap(async(req,res)=>res.json(await mutate(req,p=>adjustStock(p,nonNegative(req.body.cantidad,'Stock',100000,true))))));
function lotFields(b){if(typeof b.codigo!=='string'||!b.codigo.trim()||b.codigo.length>50||!validDate(b.vencimiento))throw validationError('Código o vencimiento inválido');return {codigo:b.codigo.trim(),vencimiento:b.vencimiento,cantidad:nonNegative(b.cantidad,'Cantidad',100000,true)}}
router.post('/:id/lots',requerirSesionAdmin,wrap(async(req,res)=>res.status(201).json(await mutate(req,p=>{p.lotes.push({id:id(),...lotFields(req.body)})}))));
router.patch('/:id/lots/:lotId',requerirSesionAdmin,wrap(async(req,res)=>res.json(await mutate(req,p=>{const l=p.lotes.find(l=>l.id===req.params.lotId);if(!l)throw Object.assign(new Error('Lote no encontrado'),{status:404});Object.assign(l,lotFields(req.body))}))));
export default router;
