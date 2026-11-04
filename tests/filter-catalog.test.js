import test from 'node:test';
import assert from 'node:assert/strict';
import {filterCatalog,normalizeQuery} from '../client/src/utils/filterCatalog.js';
const products=[
 {id:1,nombre:'Paracetamol',principio:'Paracetamol',concentracion:'500 mg',forma:'Tableta',categoria:'Analgésicos',precio:3,stock:10},
 {id:2,nombre:'Solución nasal',principio:'Cloruro de sodio',concentracion:'0.9%',forma:'Spray',categoria:'Cuidado nasal',precio:12,stock:0},
 {id:3,nombre:'Gel bucal',principio:'Producto demo',concentracion:'10 ml',forma:'Gel',categoria:'Cuidado bucal',precio:8,stock:4},
];
test('normalizar tildes y espacios',()=>assert.equal(normalizeQuery('  ANALGÉSICOS  '),'analgesicos'));
test('buscar por principio activo',()=>assert.deepEqual(filterCatalog(products,{search:'cloruro de sodio'}).map(p=>p.id),[2]));
test('filtrar por categoría y stock disponible',()=>assert.deepEqual(filterCatalog(products,{category:'Cuidado nasal',stockOnly:true}),[]));
test('ordenar por precio sin modificar entrada',()=>{const list=[...products];assert.deepEqual(filterCatalog(products,{sort:'priceDown'}).map(p=>p.id),[2,3,1]);assert.deepEqual(products,list)});
test('filtrar presentaciones',()=>assert.deepEqual(filterCatalog(products,{form:'Gel'}).map(p=>p.id),[3]));
