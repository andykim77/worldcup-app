// Team name -> flagcdn.com country code (ISO 3166-1 alpha-2, plus UK subdivisions).
const COUNTRY_CODES = {
  "Algeria": "dz",
  "Angola": "ao",
  "Argentina": "ar",
  "Australia": "au",
  "Austria": "at",
  "Belgium": "be",
  "Bolivia": "bo",
  "Bosnia and Herzegovina": "ba",
  "Brazil": "br",
  "Bulgaria": "bg",
  "Cameroon": "cm",
  "Canada": "ca",
  "Cape Verde": "cv",
  "Chile": "cl",
  "China": "cn",
  "Colombia": "co",
  "Costa Rica": "cr",
  "Croatia": "hr",
  "Cuba": "cu",
  "Curaçao": "cw",
  "Czech Republic": "cz",
  "Czechia": "cz",
  // Czechoslovakia (1934-1994): the modern Czech Republic kept the same flag design.
  "Czechoslovakia": "cz",
  "Denmark": "dk",
  "DR Congo": "cd",
  "Ecuador": "ec",
  "Egypt": "eg",
  "El Salvador": "sv",
  "England": "gb-eng",
  "France": "fr",
  "Germany": "de",
  "Ghana": "gh",
  "Greece": "gr",
  "Haiti": "ht",
  "Honduras": "hn",
  "Hungary": "hu",
  "Iceland": "is",
  "Iran": "ir",
  "Iraq": "iq",
  "Israel": "il",
  "Italy": "it",
  "Ivory Coast": "ci",
  "Jamaica": "jm",
  "Japan": "jp",
  "Jordan": "jo",
  "Kuwait": "kw",
  "Mexico": "mx",
  "Morocco": "ma",
  "Netherlands": "nl",
  "New Zealand": "nz",
  "Nigeria": "ng",
  "North Korea": "kp",
  "Northern Ireland": "gb-nir",
  "Norway": "no",
  "Panama": "pa",
  "Paraguay": "py",
  "Peru": "pe",
  "Poland": "pl",
  "Portugal": "pt",
  "Qatar": "qa",
  "Republic of Ireland": "ie",
  "Romania": "ro",
  "Russia": "ru",
  "Saudi Arabia": "sa",
  "Scotland": "gb-sct",
  "Senegal": "sn",
  "Serbia": "rs",
  "Slovakia": "sk",
  "Slovenia": "si",
  "South Africa": "za",
  "South Korea": "kr",
  "Spain": "es",
  "Sweden": "se",
  "Switzerland": "ch",
  "Togo": "tg",
  "Trinidad and Tobago": "tt",
  "Tunisia": "tn",
  "Turkey": "tr",
  "Ukraine": "ua",
  "United Arab Emirates": "ae",
  "United States": "us",
  "Uruguay": "uy",
  "Uzbekistan": "uz",
  "Wales": "gb-wls",
  // West Germany (1954-1990): same flag design as reunified Germany.
  "West Germany": "de"
  // Not mapped (no accurate modern-ISO equivalent — visually distinct historical
  // flags with no current country matching them): Dutch East Indies, East Germany,
  // Serbia and Montenegro, Soviet Union, Yugoslavia, Zaire. These degrade
  // gracefully to no flag icon, same as the existing Serbia and Montenegro case.
};

function flagUrl(country, width) {
  const code = COUNTRY_CODES[country];
  if (!code) return null;
  const w = width || 40;
  return `https://flagcdn.com/w${w}/${code}.png`;
}

function flagImgHtml(country, cssClass) {
  const url = flagUrl(country);
  const cls = cssClass || 'flag';
  if (!url) return '';
  const safeCountry = String(country).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<img class="${cls}" src="${url}" alt="${safeCountry} flag" loading="lazy">`;
}
