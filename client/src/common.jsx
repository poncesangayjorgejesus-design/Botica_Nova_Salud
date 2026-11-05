import React,{useEffect} from 'react';
import {HeartPulse,Sun,Moon,Package,X,ShieldCheck} from 'lucide-react';
export const request=async(url,options={})=>{const r=await fetch(url,{credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});let data;try{data=await r.json()}catch{data={}}if(!r.ok)throw new Error(data.error||'Error de conexión');return data;};
export const send=(url,body,method='POST')=>request(url,{method,body:JSON.stringify(body)});
export const money=v=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(Number(v)||0);
export const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export const fmtDate=v=>v?new Date(v).toLocaleDateString('es-PE',{year:'numeric',month:'short',day:'numeric'}):'—';
export const requirePrescription=p=>/receta/i.test(p.receta||'')&&!/por verificar|verificar condición/i.test(p.receta||'');
export const blankProduct={nombre:'',principio:'',concentracion:'',forma:'Tableta',categoria:'Otros',precio:0,minimo:10,stock:0,descripcion:'',receta:'Por verificar',visible:true,imagen:''};
export const saleOptions=['Por verificar','Verificar condición de venta','Requiere evaluación de receta','Sujeto a receta (demo)','Venta libre (demo, por verificar)'];
export function Brand({dark=false}){return <a href="/" className={'brand '+(dark?'brand-light':'')} aria-label="Nova Salud Pro - Inicio"><span className="brand-icon"><HeartPulse size={24} strokeWidth={2.3}/></span><span className="brand-copy"><strong>NOVA <span>SALUD</span></strong><small>PRO · BIENESTAR INTELIGENTE</small></span></a>}
export function Button({children,icon:Icon,variant='primary',className='',...props}){return <button className={'btn btn-'+variant+' '+className} {...props}>{Icon&&<Icon size={17}/>} {children}</button>}
export function Pill({children,tone='teal'}){return <span className={'pill pill-'+tone}>{children}</span>}
export function ProductVisual({product,large=false}){return <div className={'product-image '+(large?'product-image-lg':'')}>{product.imagen?<img src={product.imagen} alt={'Fotografía de '+product.nombre} loading="lazy"/>:<div className="visual-placeholder"><div className="placeholder-orbit"><Package size={large?54:42} strokeWidth={1.15}/></div><span>Fotografía pendiente</span></div>}</div>}
export function Modal({children,onClose,className=''}){useEffect(()=>{const fn=e=>{if(e.key==='Escape')onClose()};document.addEventListener('keydown',fn);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',fn);document.body.style.overflow=''}},[onClose]);return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section role="dialog" aria-modal="true" className={'modal '+className}>{children}</section></div>}
export function ThemeToggle({theme,toggle}){return <button className="icon-action" onClick={toggle} title={theme==='dark'?'Usar modo claro':'Usar modo oscuro'} aria-label="Cambiar tema">{theme==='dark'?<Sun size={20}/>:<Moon size={20}/>}</button>}
