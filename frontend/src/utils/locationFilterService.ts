/**
 * Service de filtrage avancé pour les locations WeatherWeS
 * Gère les options de filtrage et les paramètres de requête pour l'API
 */

// Types pour les filtres de localisation
export interface LocationFilter {
  city?: string;         // Filtrer par ville
  country?: string;      // Filtrer par pays (code pays)
  coordinates?: {        // Filtrer par coordonnées (rayon)
    latitude: number;
    longitude: number;
    radius: number;      // Rayon en kilomètres
  };
  bbox?: {               // Filtrer par bounding box
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  };
  parameters?: string[]; // Filtrer par paramètres/polluants (PM2.5, NO2, etc.)
  limit?: number;        // Nombre max de résultats (pagination)
  page?: number;         // Page courante (pagination)
  hasRecent?: boolean;   // Uniquement avec des mesures récentes
  excludeUnknown?: boolean; // Exclure les emplacements "Unknown"
}

/**
 * Convertit les filtres en paramètres d'URL pour l'API
 * @param filters Les filtres à appliquer
 * @returns Les paramètres à ajouter à l'URL
 */
export const buildQueryParams = (filters: LocationFilter): string => {
  const params = new URLSearchParams();

  // Ajouter les filtres non-vides
  if (filters.city && filters.city.trim()) {
    params.append('city', filters.city.trim());
  }

  if (filters.country && filters.country.trim()) {
    params.append('country', filters.country.trim());
  }

  if (filters.coordinates) {
    params.append('latitude', filters.coordinates.latitude.toString());
    params.append('longitude', filters.coordinates.longitude.toString());
    params.append('radius', filters.coordinates.radius.toString());
  }

  if (filters.bbox) {
    params.append('min_lat', filters.bbox.minLat.toString());
    params.append('min_lon', filters.bbox.minLon.toString());
    params.append('max_lat', filters.bbox.maxLat.toString());
    params.append('max_lon', filters.bbox.maxLon.toString());
  }

  if (filters.parameters && filters.parameters.length > 0) {
    params.append('parameters', filters.parameters.join(','));
  }

  if (filters.limit) {
    params.append('limit', filters.limit.toString());
  }

  if (filters.page) {
    params.append('page', filters.page.toString());
  }

  if (filters.hasRecent !== undefined) {
    params.append('has_recent', filters.hasRecent ? 'true' : 'false');
  }

  if (filters.excludeUnknown !== undefined) {
    params.append('exclude_unknown', filters.excludeUnknown ? 'true' : 'false');
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Liste des pays disponibles dans l'API OpenAQ
 * Utilisé pour les filtres de pays
 */
export const countries = [
  { code: 'AD', name: 'Andorra' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AL', name: 'Albania' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AO', name: 'Angola' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AT', name: 'Austria' },
  { code: 'AU', name: 'Australia' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BI', name: 'Burundi' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BN', name: 'Brunei' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BS', name: 'Bahamas' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BZ', name: 'Belize' },
  { code: 'CA', name: 'Canada' },
  { code: 'CD', name: 'Democratic Republic of the Congo' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'CG', name: 'Republic of the Congo' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'CI', name: 'Ivory Coast' },
  { code: 'CL', name: 'Chile' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CU', name: 'Cuba' },
  { code: 'CV', name: 'Cape Verde' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DE', name: 'Germany' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'DK', name: 'Denmark' },
  { code: 'DO', name: 'Dominican Republic' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'EE', name: 'Estonia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'ES', name: 'Spain' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'FR', name: 'France' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'GE', name: 'Georgia' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GR', name: 'Greece' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'GY', name: 'Guyana' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HR', name: 'Croatia' },
  { code: 'HT', name: 'Haiti' },
  { code: 'HU', name: 'Hungary' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IN', name: 'India' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IR', name: 'Iran' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IT', name: 'Italy' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'JO', name: 'Jordan' },
  { code: 'JP', name: 'Japan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'KI', name: 'Kiribati' },
  { code: 'KM', name: 'Comoros' },
  { code: 'KP', name: 'North Korea' },
  { code: 'KR', name: 'South Korea' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'LA', name: 'Laos' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'LR', name: 'Liberia' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LY', name: 'Libya' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MD', name: 'Moldova' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MH', name: 'Marshall Islands' },
  { code: 'MK', name: 'North Macedonia' },
  { code: 'ML', name: 'Mali' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MT', name: 'Malta' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MV', name: 'Maldives' },
  { code: 'MW', name: 'Malawi' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'NA', name: 'Namibia' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NO', name: 'Norway' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NR', name: 'Nauru' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'OM', name: 'Oman' },
  { code: 'PA', name: 'Panama' },
  { code: 'PE', name: 'Peru' },
  { code: 'PG', name: 'Papua New Guinea' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'PW', name: 'Palau' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' },
  { code: 'RS', name: 'Serbia' },
  { code: 'RU', name: 'Russia' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SB', name: 'Solomon Islands' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SD', name: 'Sudan' },
  { code: 'SE', name: 'Sweden' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SM', name: 'San Marino' },
  { code: 'SN', name: 'Senegal' },
  { code: 'SO', name: 'Somalia' },
  { code: 'SR', name: 'Suriname' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'ST', name: 'São Tomé and Príncipe' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'SY', name: 'Syria' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'TD', name: 'Chad' },
  { code: 'TG', name: 'Togo' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TJ', name: 'Tajikistan' },
  { code: 'TL', name: 'East Timor' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TO', name: 'Tonga' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TT', name: 'Trinidad and Tobago' },
  { code: 'TV', name: 'Tuvalu' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'UG', name: 'Uganda' },
  { code: 'US', name: 'United States' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VA', name: 'Vatican City' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'VU', name: 'Vanuatu' },
  { code: 'WS', name: 'Samoa' },
  { code: 'YE', name: 'Yemen' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' }
];

/**
 * Liste des paramètres/polluants disponibles
 * Utilisé pour les filtres de paramètres
 */
export const parameters = [
  { id: 'pm25', name: 'PM2.5', description: 'Particulate matter less than 2.5 micrometers in diameter' },
  { id: 'pm10', name: 'PM10', description: 'Particulate matter less than 10 micrometers in diameter' },
  { id: 'o3', name: 'O3', description: 'Ozone' },
  { id: 'no2', name: 'NO2', description: 'Nitrogen Dioxide' },
  { id: 'so2', name: 'SO2', description: 'Sulfur Dioxide' },
  { id: 'co', name: 'CO', description: 'Carbon Monoxide' },
  { id: 'bc', name: 'BC', description: 'Black Carbon' },
  { id: 'no', name: 'NO', description: 'Nitric Oxide' },
  { id: 'co2', name: 'CO2', description: 'Carbon Dioxide' },
  { id: 'nh3', name: 'NH3', description: 'Ammonia' },
  { id: 'ch4', name: 'CH4', description: 'Methane' }
];

/**
 * Récupère le nom du pays à partir de son code
 * @param code Le code pays à rechercher
 * @returns Le nom du pays ou undefined si non trouvé
 */
export const getCountryNameByCode = (code: string): string | undefined => {
  const country = countries.find(c => c.code === code);
  return country?.name;
};

/**
 * Récupère des informations sur les paramètres/polluants à partir de leurs IDs
 * @param ids Les IDs des paramètres à rechercher
 * @returns Liste des paramètres correspondants
 */
export const getParametersByIds = (ids: string[]): { id: string; name: string; description: string; }[] => {
  return parameters.filter(parameter => ids.includes(parameter.id));
};

/**
 * Format de résumé pour les filtres appliqués
 * @param filters Les filtres appliqués
 * @returns Le résumé formaté pour l'affichage
 */
export const getFilterSummary = (filters: LocationFilter): string => {
  const parts: string[] = [];

  if (filters.city) {
    parts.push(`Ville: ${filters.city}`);
  }

  if (filters.country) {
    const countryObj = countries.find(c => c.code === filters.country);
    parts.push(`Pays: ${countryObj?.name || filters.country}`);
  }

  if (filters.parameters && filters.parameters.length > 0) {
    const paramNames = getParametersByIds(filters.parameters)
      .map(p => p.name)
      .join(', ');
    parts.push(`Polluants: ${paramNames}`);
  }

  if (filters.coordinates) {
    parts.push(`Rayon: ${filters.coordinates.radius}km autour de (${filters.coordinates.latitude.toFixed(2)}, ${filters.coordinates.longitude.toFixed(2)})`);
  }

  if (filters.hasRecent) {
    parts.push('Mesures récentes uniquement');
  }

  if (filters.excludeUnknown) {
    parts.push('Localisations inconnues exclues');
  }

  return parts.join(', ');
};
