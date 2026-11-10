import React,{useState,useRef,useEffect} from 'react';
import {Sparkles,X,Send,RotateCcw,ArrowRight,ShieldCheck,AlertTriangle,Plus} from 'lucide-react';
import {send,request,ProductVisual,money} from './common.jsx';
export default function NovaChat({open,onClose,seed,onDetail,onAdd}){
 const [messages,setMessages]=useState([]),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const conversation=useRef(null),end=useRef(null),input=useRef(null),lock=useRef(false),seen=useRef(null);
 useEffect(()=>{if(open)input.current?.focus()},[open]);
 useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth'})},[messages,busy,open,error]);
 async function ask(text){if(lock.current||!text.trim())return;lock.current=true;setBusy(true);setError('');setDraft('');
 const next={role:'user',message:text.trim()};setMessages(m=>[...m,next]);
 try{const response=await send('/api/ai/chat',{message:next.message,conversationId:conversation.current});conversation.current=response.conversationId;setMessages(m=>[...m,{role:'assistant',...response}]);}
 catch(e){setError(e.message);setDraft(text);setMessages(m=>m.slice(0,-1));}finally{lock.current=false;setBusy(false)} }
 useEffect(()=>{if(seed&&seed.id!==seen.current&&!lock.current){seen.current=seed.id;ask(seed.text)}},[seed]);
 async function reset(){if(busy)return;try{if(conversation.current)await request('/api/ai/chat/'+conversation.current,{method:'DELETE'});conversation.current=null;setMessages([]);setError('');setDraft('');input.current?.focus()}catch(e){setError(e.message)}}
 return <section className={'nova-chat '+(open?'is-open':'')} aria-label="Conversación con NOVA IA" hidden={!open}>
 <header className="nova-chat-header"><span className="nova-avatar"><Sparkles size={23}/></span><div><strong>NOVA IA</strong><small>Tu asistente inteligente de bienestar</small></div><button disabled={busy} onClick={reset} title="Nueva conversación" aria-label="Nueva conversación"><RotateCcw size={18}/></button><button onClick={onClose} aria-label="Cerrar asistente"><X size={21}/></button></header>
 <div className="nova-chat-scroll" role="log" aria-live="polite" aria-relevant="additions">
 {!messages.length&&<div className="nova-welcome"><span className="nova-welcome-icon"><Sparkles size={30}/></span><h2>Hablemos de tu bienestar.</h2><p>Cuéntame qué sientes o consulta un medicamento. Revisaremos las fichas disponibles en nuestra botica.</p><div className="nova-suggestions">{['Me duele la muela','Tengo tos desde ayer','¿Qué antibióticos hay en el catálogo?'].map(t=><button key={t} disabled={busy} onClick={()=>ask(t)}>{t}<ArrowRight size={16}/></button>)}</div><small><ShieldCheck size={15}/> La conversación se conserva temporalmente. Evita compartir nombres, DNI u otros datos personales. Con OpenAI activo, se envía al proveedor para responder.</small></div>}
 {messages.map((m,i)=><div key={i} className={'nova-message '+m.role}>
 <span className="nova-sender">{m.role==='user'?'Tú':'NOVA IA'}</span><div className={'nova-bubble '+(m.urgent?'urgent':'')}><p>{m.message}</p>{m.followup&&<p className="nova-followup">{m.followup}</p>}</div>
 {m.mode&&<span className="nova-mode">{m.notice}</span>}
 {m.warnings?.length>0&&<details className="nova-warnings" open={m.urgent}><summary><AlertTriangle size={14}/> Precauciones importantes</summary>{m.warnings.map((w,k)=><p key={k}>{w}</p>)}</details>}
 {!!m.products?.length&&<div className="nova-products">{m.products.map(p=><article key={p.id} className="nova-product"><div className="nova-product-head"><ProductVisual product={p}/><div><b>{p.nombre}</b><small>{p.principio} · {p.concentracion}</small><small>{p.forma}</small><strong>{money(p.precio)} <small>· {p.stock} disponibles al consultar</small></strong></div></div><span className={'nova-sale '+(p.requiresPrescription?'rx':'')}>{p.requiresPrescription?'Sujeto a receta · Ficha informativa':p.receta||'Condición por verificar'}</span><p>{p.estadoRevision==='Revisado'?p.indicaciones:'Información farmacológica pendiente de revisión.'}</p>{p.advertencias&&<p><b>Precauciones: </b>{p.advertencias}</p>}{p.contraindicaciones&&<p><b>Contraindicaciones: </b>{p.contraindicaciones}</p>}<div className="nova-product-actions"><button onClick={()=>onDetail(p)}>Ver detalles <ArrowRight size={15}/></button>{p.canRequest&&<button onClick={()=>onAdd(p)}><Plus size={15}/> Solicitar</button>}</div></article>)}</div>}
 </div>)}
 {busy&&<div className="nova-typing" role="status"><i/><i/><i/><span>NOVA IA está consultando…</span></div>}
 {error&&<div className="nova-error" role="alert">{error}</div>}<div ref={end}/></div>
 <form className="nova-compose" onSubmit={e=>{e.preventDefault();ask(draft)}}><textarea ref={input} value={draft} maxLength={2000} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();ask(draft)}}} placeholder="Escribe tu consulta…" aria-label="Mensaje a NOVA IA" rows={2}/><button disabled={busy||!draft.trim()} aria-label="Enviar mensaje"><Send size={20}/></button></form><footer className="nova-chat-foot">Información general · No sustituye atención profesional</footer>
 </section>
}
