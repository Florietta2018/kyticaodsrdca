// Súbor: src/data/site.ts
// Jedno miesto pre kontaktné údaje a otváracie hodiny, aby sa nerozchádzali.

export const SITE = {
  name: 'Kytica od srdca',
  url: 'https://kyticaodsrdca.sk',
};

export const CONTACT = {
  phone: '+421940181839',
  phoneLabel: '0940 181 839',
  email: 'kyticaodsrdca@gmail.com',
  // Prevádzka je na začiatku ulice od hlavnej cesty, vľavo, hneď pri Atriu.
  street: 'Milana Rastislava Štefánika 360',
  streetShort: 'M. R. Štefánika 360',
  postalCode: '914 01',
  locality: 'Trenčianska Teplá',
  city: '914 01 Trenčianska Teplá',
  geo: { latitude: 48.9341214, longitude: 18.1179053 },
  facebook: 'https://www.facebook.com/kyticaodsrdca/?locale=sk_SK',
  online: 'https://online.kyticaodsrdca.sk',
  // Navigácia aj mapa hľadajú priamo prevádzku v Google (názov + obec), nie len adresu,
  // takže sa zobrazí „Kytica od srdca“ s hodnotením a špendlíkom pri Atriu.
  maps: 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent('Kytica od srdca, Trenčianska Teplá'),
  mapEmbed: 'https://maps.google.com/maps?q=' + encodeURIComponent('Kytica od srdca, Trenčianska Teplá') + '&hl=sk&z=18&output=embed',
};

// days: 0 = nedeľa, 1 = pondelok … 6 = sobota
export const HOURS = [
  { label: 'Pondelok – piatok', days: [1, 2, 3, 4, 5], open: '08:30', close: '15:00' },
  { label: 'Sobota', days: [6], open: '09:00', close: '11:30' },
  { label: 'Nedeľa', days: [0], open: null, close: null },
];

export const formatTime = (t: string) => t.replace(/^0/, '');

// Slovenská typografia: jednopísmenové predložky a spojky nenechávame na konci riadku.
export const nb = (text: string) => {
  let out = text;
  let prev;
  do {
    prev = out;
    out = out.replace(/(^|[\s ])([vszkaoiuVSZKAOIU]) /g, '$1$2 ');
  } while (out !== prev);
  return out;
};
