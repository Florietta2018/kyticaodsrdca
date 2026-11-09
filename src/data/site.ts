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
  street: 'Milana Rastislava Štefánika 360',
  postalCode: '914 01',
  locality: 'Trenčianska Teplá',
  city: '914 01 Trenčianska Teplá',
  geo: { latitude: 48.9341249, longitude: 18.1153304 },
  facebook: 'https://www.facebook.com/kyticaodsrdca/?locale=sk_SK',
  online: 'https://online.kyticaodsrdca.sk',
  maps: 'https://maps.app.goo.gl/Yx6LbvnbBTSySkMJ6',
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
