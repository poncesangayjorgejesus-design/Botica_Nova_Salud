import express from 'express';
import {randomUUID,randomBytes} from 'node:crypto';
import {respond} from '../services/novaChat.js';
const router=express.Router(),sessions=new Map(),rates=new Map();
const ttl=30*60*1000;
const cookie=req=>(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('nova_chat_owner='))?.slice(16);
function cleanup(){const now=Date.now();for(const [k,s] of sessions)if(now-s.updated>ttl&&!s.busy)sessions.delete(k);for(const [k,s]of rates)if(now>s.until)rates.delete(k)}
const timer=setInterval(cleanup,60000);timer.unref();
router.post('/',async(req,res,next)=>{let session,acquired=false;try{
 cleanup();const message=req.body?.message??req.body?.query;
 if(typeof message!=='string'||!message.trim()||message.length>2000)return res.status(400).json({error:'Escribe un mensaje de 1 a 2000 caracteres.'});
 let rate=rates.get(req.ip);if(!rate||rate.until<Date.now()){if(rates.size>=5000)return res.status(503).json({error:'Servicio ocupado. Reintenta más tarde.'});rate={count:0,until:Date.now()+60000};rates.set(req.ip,rate)}
 if(++rate.count>20)return res.status(429).json({error:'Has enviado muchos mensajes. Espera un minuto.'});
 let owner=cookie(req);if(!owner||!/^[a-f0-9]{64}$/.test(owner)){owner=randomBytes(32).toString('hex');res.cookie('nova_chat_owner',owner,{httpOnly:true,sameSite:'strict',secure:process.env.COOKIE_SECURE==='true',path:'/'})}
 const requested=req.body.conversationId;
 let conversationId;
 if(requested){session=sessions.get(requested);if(!session||session.owner!==owner)return res.status(410).json({error:'La conversación venció. Inicia una nueva conversación.'});conversationId=requested;}
 else{if(sessions.size>=1000)return res.status(503).json({error:'Asistente ocupado. Reintenta más tarde.'});conversationId=randomUUID();session={owner,history:[],updated:Date.now(),busy:false};sessions.set(conversationId,session)}
 if(session.busy)return res.status(409).json({error:'Espera a que termine la respuesta anterior.'});
 session.busy=true;acquired=true;
 const history=[...session.history,{role:'user',content:message.trim()}].slice(-19);
 const result=await respond(history);
 session.history=[...history,{role:'assistant',content:result.message+' '+result.followup}].slice(-20);session.updated=Date.now();
 res.json({...result,conversationId});
 }catch(e){next(e)}finally{if(acquired)session.busy=false}});
router.delete('/:id',(req,res)=>{const s=sessions.get(req.params.id);if(s&&s.owner===cookie(req))sessions.delete(req.params.id);res.status(204).end()});
export default router;
