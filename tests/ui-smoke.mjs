// Run after npm run build. Install playwright separately with npm install --no-save playwright.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let playwright;try{playwright=require('playwright')}catch{playwright=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright')}
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nova-ui-'));
process.env.NOVA_STORAGE='json';process.env.NOVA_DATA_DIR=dir;process.env.NOVA_ADMIN_PASSWORD='ui-test-only-password';process.env.AI_ENABLED='false';
const {app}=await import('../server/index.js');
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await playwright.chromium.launch({headless:true,timeout:15000,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
fs.mkdirSync('test-results',{recursive:true});
try{
 await page.goto(base+'/admin');await page.getByLabel('Contraseña de acceso').fill(process.env.NOVA_ADMIN_PASSWORD);await page.getByRole('button',{name:'Entrar al panel'}).click();
 await page.getByRole('button',{name:'Inventario',exact:true}).click();await page.getByRole('button',{name:'Nuevo producto'}).click();
 await page.getByLabel('Nombre comercial').fill('Ficha de prueba UI');await page.getByLabel('Principio activo',{exact:true}).fill('Principio de prueba');await page.getByLabel('Concentración',{exact:true}).fill('500 mg');await page.getByLabel('Precio referencial').fill('4');await page.getByLabel('Stock vigente',{exact:true}).fill('12');
 await page.getByLabel('Condición de venta').selectOption('Venta libre');await page.getByLabel('Indicaciones documentadas').fill('Alivio temporal del dolor dental');await page.getByLabel('Advertencias',{exact:true}).fill('Advertencia de prueba');await page.getByLabel('Contraindicaciones',{exact:true}).fill('Alergia al principio activo');await page.getByLabel('Fuente farmacológica').fill('Documento de prueba UI');await page.getByLabel('Estado de revisión').selectOption('Revisado');
 await page.getByRole('button',{name:'Guardar producto',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.getByRole('button',{name:'Editar',exact:true}).click();assert.equal(await page.getByLabel('Nombre comercial').inputValue(),'Ficha de prueba UI');await page.keyboard.press('Escape');
 await page.screenshot({path:'test-results/admin-desktop.png'});
 await page.goto(base);await page.getByRole('button',{name:'Abrir NOVA IA'}).click();await page.locator('.nova-suggestions').getByRole('button',{name:'Me duele la muela',exact:true}).click();await page.locator('.nova-message.assistant').waitFor();
 await page.getByLabel('Mensaje a NOVA IA').fill('Desde ayer, no tengo fiebre');await page.getByRole('button',{name:'Enviar mensaje'}).click();await page.locator('.nova-product').waitFor();assert.match(await page.locator('.nova-product').textContent(),/Ficha de prueba UI/);
 await page.locator('.nova-product').getByRole('button',{name:'Ver detalles'}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');
 await page.locator('.nova-product').getByRole('button',{name:'Solicitar',exact:true}).click();await page.getByRole('button',{name:'Cerrar asistente'}).click();await page.getByRole('button',{name:'Mi solicitud'}).click();await page.getByLabel('Nombre completo').fill('Cliente UI');await page.getByLabel('DNI ficticio').fill('12345678');await page.getByRole('button',{name:'Enviar para revisión'}).click();await page.locator('.cart-drawer').waitFor({state:'hidden'});
 await page.getByRole('button',{name:'Abrir NOVA IA'}).click();assert.equal(await page.locator('.nova-message.assistant').count(),2);await page.screenshot({path:'test-results/chat-desktop.png'});
 for(const width of [390,320,768]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`page overflow at ${width}`);const box=await page.locator('.nova-chat').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width,`chat overflow ${width}`);await page.screenshot({path:`test-results/chat-${width}.png`});}
 await page.getByRole('button',{name:'Nueva conversación'}).click();await page.locator('.nova-welcome').waitFor();assert.equal(await page.locator('.nova-message').count(),0);
 await page.getByRole('button',{name:'Cerrar asistente'}).click();await page.getByRole('button',{name:'Cambiar tema'}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.getByRole('button',{name:'Abrir NOVA IA'}).click();await page.screenshot({path:'test-results/chat-dark.png'});
 assert.deepEqual(errors,[]);console.log('UI PASS: admin create/edit, chat history/product/detail, cart/order, reset, dark mode, responsive 1440/768/390/320. No JS errors.');
}catch(e){await page.screenshot({path:'test-results/ui-failure.png'});throw e}finally{await browser.close();server.closeAllConnections();server.close();fs.rmSync(dir,{recursive:true,force:true})}
