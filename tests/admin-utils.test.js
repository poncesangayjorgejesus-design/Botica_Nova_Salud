import test from 'node:test';
import assert from 'node:assert/strict';
import {filterInventory,createCSV} from '../client/src/admin/admin-utils.js';
const demo=[{id:1,nombre:'Solución oral',principio:'Cloruro',categoria:'Cuidado oral',concentracion:'0.9%'},{id:2,nombre:'Crema',principio:'Demo',categoria:'Dermatológicos',concentracion:'3%'}];
test('búsqueda sin tildes encuentra categorías',()=>assert.deepEqual(filterInventory(demo,'DERMATOLOGICOS').map(x=>x.id),[2]));
test('filtro vacío devuelve todos los productos',()=>assert.equal(filterInventory(demo,'').length,2));
test('CSV incluye cabeceras y valores escapados',()=>{const csv=createCSV([{Nombre:'Demo, especial',Precio:5}]);assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"Demo, especial"'))});
test('CSV evita fórmulas maliciosas',()=>{const csv=createCSV([{Nombre:'=SUM(1,1)',Observacion:'  +cmd'}]);assert.ok(csv.includes("'="));assert.ok(csv.includes("'  +cmd"))});
test('CSV escapa comillas internas',()=>assert.ok(createCSV([{Nombre:'Producto "demo"'}]).includes('"Producto ""demo"""')));
