export function normalizeQuery(value) {
  return String(value ?? '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

export function filterCatalog(products, {search='', category='', form='', stockOnly=false, sort='name'}={}) {
  if (!Array.isArray(products)) return [];
  const query = normalizeQuery(search);
  const result = products.filter(p => {
    if (category && p.categoria !== category) return false;
    if (form && p.forma !== form) return false;
    if (stockOnly && Number(p.stock) <= 0) return false;
    const text = normalizeQuery([p.nombre,p.principio,p.concentracion,p.forma,p.categoria].join(' '));
    return !query || text.includes(query);
  });
  if (sort === 'priceUp') result.sort((a,b) => Number(a.precio)-Number(b.precio));
  else if (sort === 'priceDown') result.sort((a,b) => Number(b.precio)-Number(a.precio));
  else result.sort((a,b) => String(a.nombre).localeCompare(String(b.nombre),'es'));
  return result;
}
