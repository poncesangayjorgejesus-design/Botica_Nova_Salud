import {read,enriched} from '../store.js';
import {selectProducts} from './novaChat.js';
export async function obtenerProductosInformativos(molestia){return selectProducts((await read('catalogo')).map(p=>enriched(p)),[molestia],false)}
