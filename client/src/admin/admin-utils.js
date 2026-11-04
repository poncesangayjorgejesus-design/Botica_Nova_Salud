function normalize(value){return String(value??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
export function filterInventory(products,query='') {
  if(!Array.isArray(products))return [];
  const term=normalize(query);
  return !term?[...products]:products.filter(p=>normalize([p.nombre,p.principio,p.categoria,p.concentracion].join(' ')).includes(term));
}
export function createCSV(rows) {
  if(!Array.isArray(rows)||!rows.length)return '';
  const headers=Object.keys(rows[0]);
  const cell=value=>{
    let valueStr=String(value??'');
    // Excel puede interpretar = + - @ como fórmula al abrir CSV; anteponer apóstrofo.
    if(/^[\s\uFEFF]*[=+\-@]/.test(valueStr))valueStr="'"+valueStr;
    return '"'+valueStr.replace(/"/g,'""')+'"';
  };
  return '\uFEFF'+headers.map(cell).join(',')+'\r\n'+rows.map(row=>headers.map(k=>cell(row[k])).join(',')).join('\r\n');
}
