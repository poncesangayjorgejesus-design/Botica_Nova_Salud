// Centralized classification: unknown conditions never imply OTC.
export const normalize = x => String(x??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export const needsPrescription = p => p.requiereReceta===true || /receta/.test(normalize(p.receta)) || /antibiot/.test(normalize(p.categoria));
export const reviewed = p => p.estadoRevision==='Revisado' && !!p.indicaciones && !!p.fuenteFarmacologica;
export const canRequest = p => reviewed(p) && p.receta==='Venta libre' && !needsPrescription(p);
