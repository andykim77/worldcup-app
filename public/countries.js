// Team name -> flagcdn.com country code (ISO 3166-1 alpha-2, plus UK subdivisions).
const COUNTRY_CODES = {
  "Algeria": "dz",
  "Argentina": "ar",
  "Australia": "au",
  "Belgium": "be",
  "Bosnia and Herzegovina": "ba",
  "Brazil": "br",
  "Cameroon": "cm",
  "Canada": "ca",
  "Chile": "cl",
  "Colombia": "co",
  "Costa Rica": "cr",
  "Croatia": "hr",
  "Denmark": "dk",
  "Ecuador": "ec",
  "Egypt": "eg",
  "England": "gb-eng",
  "France": "fr",
  "Germany": "de",
  "Ghana": "gh",
  "Greece": "gr",
  "Honduras": "hn",
  "Iceland": "is",
  "Iran": "ir",
  "Italy": "it",
  "Ivory Coast": "ci",
  "Japan": "jp",
  "Mexico": "mx",
  "Morocco": "ma",
  "Netherlands": "nl",
  "Nigeria": "ng",
  "Panama": "pa",
  "Peru": "pe",
  "Poland": "pl",
  "Portugal": "pt",
  "Qatar": "qa",
  "Russia": "ru",
  "Saudi Arabia": "sa",
  "Senegal": "sn",
  "Serbia": "rs",
  "South Korea": "kr",
  "Spain": "es",
  "Sweden": "se",
  "Switzerland": "ch",
  "Tunisia": "tn",
  "United States": "us",
  "Uruguay": "uy",
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
