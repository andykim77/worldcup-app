// Team name -> flagcdn.com country code (ISO 3166-1 alpha-2, plus UK subdivisions).
const COUNTRY_CODES = {
  "Algeria": "dz",
  "Angola": "ao",
  "Argentina": "ar",
  "Australia": "au",
  "Austria": "at",
  "Belgium": "be",
  "Bosnia and Herzegovina": "ba",
  "Brazil": "br",
  "Cameroon": "cm",
  "Canada": "ca",
  "Cape Verde": "cv",
  "Chile": "cl",
  "China": "cn",
  "Colombia": "co",
  "Costa Rica": "cr",
  "Croatia": "hr",
  "Curaçao": "cw",
  "Czech Republic": "cz",
  "Czechia": "cz",
  "Denmark": "dk",
  "DR Congo": "cd",
  "Ecuador": "ec",
  "Egypt": "eg",
  "England": "gb-eng",
  "France": "fr",
  "Germany": "de",
  "Ghana": "gh",
  "Greece": "gr",
  "Haiti": "ht",
  "Honduras": "hn",
  "Iceland": "is",
  "Iran": "ir",
  "Iraq": "iq",
  "Italy": "it",
  "Ivory Coast": "ci",
  "Japan": "jp",
  "Jordan": "jo",
  "Mexico": "mx",
  "Morocco": "ma",
  "Netherlands": "nl",
  "New Zealand": "nz",
  "Nigeria": "ng",
  "North Korea": "kp",
  "Norway": "no",
  "Panama": "pa",
  "Paraguay": "py",
  "Peru": "pe",
  "Poland": "pl",
  "Portugal": "pt",
  "Qatar": "qa",
  "Republic of Ireland": "ie",
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
  "United States": "us",
  "Uruguay": "uy",
  "Uzbekistan": "uz",
  "Wales": "gb-wls"
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
