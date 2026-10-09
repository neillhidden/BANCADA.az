import { municipalities } from './locations.js';
export const WHATSAPP = '244929560940';
export const provinces = ['Luanda', 'Icolo e Bengo'];
export let products = [
  { id: 'auscultadores-wireless', name: 'Auscultadores Wireless', category: 'Tecnologia', price: 24900, icon: '🎧', tone: '#e8ecec', image: 'photo-1505740420928-5e560c06d30e', tag: 'Som que acompanha', description: 'Música, chamadas e os seus podcasts favoritos. Um formato confortável para acompanhar o dia.', details: ['Ligação sem fios', 'Formato sobre a orelha', 'Cor: preto'] },
  { id: 'mochila-urbana', name: 'Mochila Urbana', category: 'Acessórios', price: 18500, icon: '🎒', tone: '#f0e8dd', image: 'photo-1553062407-98eeb64c6a62', tag: 'Para todos os dias', description: 'Leve consigo o essencial. Uma mochila prática para o trabalho, as aulas e pequenas escapadas.', details: ['Compartimentos para organizar', 'Alças ajustáveis', 'Cor: bege'] },
  { id: 'relogio-minimal', name: 'Relógio Minimal', category: 'Acessórios', price: 32000, icon: '⌚', tone: '#e5e8df', image: 'photo-1524805444758-089113d48a6d', tag: 'Detalhes que contam', description: 'Um toque simples para completar o seu estilo. Design discreto para usar em diferentes ocasiões.', details: ['Mostrador analógico', 'Pulseira ajustável', 'Estilo minimalista'] },
  { id: 'coluna-portatil', name: 'Coluna Portátil', category: 'Tecnologia', price: 15900, icon: '🔊', tone: '#e9e2ed', image: 'photo-1608043152269-423dbba4e7e1', tag: 'Leve o ritmo', description: 'O ambiente certo, onde estiver. Uma coluna compacta para ouvir música em casa ou levar consigo.', details: ['Ligação Bluetooth', 'Formato compacto', 'Cor: preto'] },
  { id: 'tenis-casual', name: 'Ténis Casual', category: 'Moda', price: 28900, icon: '👟', tone: '#e5eafa', image: 'photo-1542291026-7eec264c27ff', tag: 'Um passo à frente', description: 'Um modelo versátil para combinar com os seus looks do dia a dia. Confirme o tamanho no pedido.', details: ['Estilo casual', 'Tamanho a confirmar por WhatsApp', 'Cor a confirmar'] },
  { id: 'candeeiro-de-mesa', name: 'Candeeiro de Mesa', category: 'Casa', price: 22500, icon: '💡', tone: '#f2e8d9', image: 'photo-1507473885765-e6ed057f782c', tag: 'A sua casa, mais sua', description: 'Uma luz de apoio para o seu canto de leitura ou espaço de trabalho. Um detalhe que transforma o ambiente.', details: ['Uso em interiores', 'Formato de mesa', 'Acabamento a confirmar'] }
];
products.forEach(p => { p.demo = true; p.image = `/assets/${p.id}.webp`; });
export function setProducts(value) { products = value; }
export const money = amount => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(amount);
export function normalizeCart(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.filter(item => item && products.some(p => p.id === item.id) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99 && !seen.has(item.id) && seen.add(item.id)).map(({id,quantity}) => ({id,quantity}));
}
export const cartTotal = cart => normalizeCart(cart).reduce((sum, item) => sum + products.find(p => p.id === item.id).price * item.quantity, 0);
export function validateDelivery(data) {
  const errors = {};
  for (const [key, label] of Object.entries({ name: 'nome', phone: 'telefone', province: 'província', municipality: 'município', address: 'endereço', reference: 'ponto de referência' })) {
    if (!String(data[key] || '').trim()) errors[key] = `Preencha o ${label}.`;
  }
  const phone = String(data.phone || '').replace(/[\s()+-]/g, '');
  if (data.phone && !/^(?:244)?9\d{8}$/.test(phone)) errors.phone = 'Use um número de Angola com 9 dígitos, iniciado por 9, ou +244 seguido do número.';
  if (data.province && !provinces.includes(data.province)) errors.province = 'As entregas estão disponíveis em Luanda e Icolo e Bengo por enquanto.';
  if (data.municipality && !municipalities[data.province]?.includes(data.municipality)) errors.municipality = 'Selecione uma das localidades disponíveis.';
  return errors;
}
export function whatsappLink(cart, data) {
  const items = normalizeCart(cart);
  if (!items.length) throw new Error('O carrinho está vazio.');
  if (Object.keys(validateDelivery(data)).length) throw new Error('Verifique os dados de entrega.');
  const message = [
    'Olá, BANCADA.az! Gostaria de confirmar este pedido:', '',
    ...items.map(item => { const p = products.find(p => p.id === item.id); return `• ${p.name} × ${item.quantity} — ${money(p.price * item.quantity)}${p.publicUrl ? `\n  Produto: ${p.publicUrl}` : ''}${p.imageUrl ? `\n  Foto: ${p.imageUrl}` : ''}`; }),
    '', `Subtotal: ${money(cartTotal(items))}`, 'Entrega e disponibilidade: a confirmar.', '',
    `Nome: ${data.name.trim()}`, `Telefone: ${data.phone.trim()}`, `Província: ${data.province}`, `Município: ${data.municipality.trim()}`, `Endereço: ${data.address.trim()}`, `Ponto de referência: ${data.reference.trim()}`, ...(data.notes?.trim() ? [`Observações: ${data.notes.trim()}`] : []), '',
    'Aguardo a confirmação do total, disponibilidade, entrega e forma de pagamento.'
  ].join('\n');
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}
