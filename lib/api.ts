const API_BASE = 'https://api.aladhan.com/v1';

export interface PrayerTimings {
	Fajr: string;
	Sunrise: string;
	Dhuhr: string;
	Asr: string;
	Sunset: string;
	Maghrib: string;
	Isha: string;
	Imsak: string;
	Midnight: string;
	Firstthird: string;
	Lastthird: string;
}

export interface HijriDate {
	date: string;
	day: string;
	month: {number: number; en: string; ar: string};
	year: string;
	weekday: {en: string; ar: string};
}

export interface GregorianDate {
	date: string;
	day: string;
	month: {number: number; en: string};
	year: string;
	weekday: {en: string};
}

export interface PrayerMeta {
	latitude: number;
	longitude: number;
	timezone: string;
	method: {id: number; name: string};
	school: {id: number; name: string};
}

export interface PrayerData {
	timings: PrayerTimings;
	date: {
		readable: string;
		timestamp: string;
		hijri: HijriDate;
		gregorian: GregorianDate;
	};
	meta: PrayerMeta;
}

export interface ApiResponse<T> {
	code: number;
	status: string;
	data: T;
}

export interface NextPrayerData {
	timings: PrayerTimings;
	date: PrayerData['date'];
	meta: PrayerMeta;
	nextPrayer: string;
	nextPrayerTime: string;
}

export interface CalculationMethod {
	id: number;
	name: string;
	params: {Fajr: number; Isha: number | string};
}

export interface MethodsResponse {
	[key: string]: CalculationMethod;
}

const formatDate = (date: Date): string => {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();
	return `${day}-${month}-${year}`;
};

export const fetchTimingsByCity = async (opts: {
	city: string;
	country: string;
	method?: number;
	school?: number;
	date?: Date;
}): Promise<PrayerData> => {
	const date = formatDate(opts.date || new Date());
	const params = new URLSearchParams({
		city: opts.city,
		country: opts.country,
	});
	if (opts.method !== undefined) params.set('method', String(opts.method));
	if (opts.school !== undefined) params.set('school', String(opts.school));

	const res = await fetch(`${API_BASE}/timingsByCity/${date}?${params}`);
	const json = (await res.json()) as ApiResponse<PrayerData>;
	if (json.code !== 200) throw new Error(json.status);
	return json.data;
};

export const fetchTimingsByCoords = async (opts: {
	latitude: number;
	longitude: number;
	method?: number;
	school?: number;
	timezone?: string;
	date?: Date;
}): Promise<PrayerData> => {
	const date = formatDate(opts.date || new Date());
	const params = new URLSearchParams({
		latitude: String(opts.latitude),
		longitude: String(opts.longitude),
	});
	if (opts.method !== undefined) params.set('method', String(opts.method));
	if (opts.school !== undefined) params.set('school', String(opts.school));
	if (opts.timezone) params.set('timezonestring', opts.timezone);

	const res = await fetch(`${API_BASE}/timings/${date}?${params}`);
	const json = (await res.json()) as ApiResponse<PrayerData>;
	if (json.code !== 200) throw new Error(json.status);
	return json.data;
};

export const fetchNextPrayer = async (opts: {
	latitude: number;
	longitude: number;
	method?: number;
	school?: number;
	timezone?: string;
}): Promise<NextPrayerData> => {
	const date = formatDate(new Date());
	const params = new URLSearchParams({
		latitude: String(opts.latitude),
		longitude: String(opts.longitude),
	});
	if (opts.method !== undefined) params.set('method', String(opts.method));
	if (opts.school !== undefined) params.set('school', String(opts.school));
	if (opts.timezone) params.set('timezonestring', opts.timezone);

	const res = await fetch(`${API_BASE}/nextPrayer/${date}?${params}`);
	const json = (await res.json()) as ApiResponse<NextPrayerData>;
	if (json.code !== 200) throw new Error(json.status);
	return json.data;
};

export const fetchCalendarByCity = async (opts: {
	city: string;
	country: string;
	year: number;
	month?: number;
	method?: number;
	school?: number;
}): Promise<PrayerData[]> => {
	const params = new URLSearchParams({
		city: opts.city,
		country: opts.country,
	});
	if (opts.method !== undefined) params.set('method', String(opts.method));
	if (opts.school !== undefined) params.set('school', String(opts.school));

	const path = opts.month ? `${opts.year}/${opts.month}` : String(opts.year);
	const res = await fetch(`${API_BASE}/calendarByCity/${path}?${params}`);
	const json = (await res.json()) as ApiResponse<PrayerData[]>;
	if (json.code !== 200) throw new Error(json.status);
	return json.data;
};

export const fetchMethods = async (): Promise<MethodsResponse> => {
	const res = await fetch(`${API_BASE}/methods`);
	const json = (await res.json()) as ApiResponse<MethodsResponse>;
	if (json.code !== 200) throw new Error(json.status);
	return json.data;
};

export interface QiblaData {
	latitude: number;
	longitude: number;
	direction: number;
}

export const fetchQibla = async (latitude: number, longitude: number): Promise<QiblaData> => {
	const res = await fetch(`${API_BASE}/qibla/${latitude}/${longitude}`);
	const json = (await res.json()) as ApiResponse<QiblaData>;
	if (json.code !== 200) throw new Error(json.status);
	return json.data;
};

// Map countries to recommended calculation methods
const countryMethodMap: Record<string, number> = {
	// ISNA (2) - North America
	'United States': 2,
	'USA': 2,
	'US': 2,
	'Canada': 2,
	'Mexico': 2,

	// Karachi (1) - South Asia
	'Pakistan': 1,
	'Bangladesh': 1,
	'India': 1,
	'Afghanistan': 1,

	// MWL (3) - Europe & others
	'United Kingdom': 3,
	'UK': 3,
	'Germany': 3,
	'Netherlands': 3,
	'Belgium': 3,
	'Sweden': 3,
	'Norway': 3,
	'Denmark': 3,
	'Finland': 3,
	'Austria': 3,
	'Switzerland': 3,
	'Poland': 3,
	'Italy': 3,
	'Spain': 3,
	'Greece': 3,
	'Japan': 3,
	'China': 3,
	'South Korea': 3,
	'Australia': 3,
	'New Zealand': 3,
	'South Africa': 3,

	// Makkah (4) - Arabian Peninsula
	'Saudi Arabia': 4,
	'Yemen': 4,
	'Oman': 4,
	'Bahrain': 4,

	// Egypt (5)
	'Egypt': 5,
	'Syria': 5,
	'Lebanon': 5,
	'Palestine': 5,
	'Jordan': 5,
	'Iraq': 5,
	'Libya': 5,
	'Sudan': 5,

	// Tehran (7) - Iran
	'Iran': 7,

	// Kuwait (9)
	'Kuwait': 9,

	// Qatar (10)
	'Qatar': 10,

	// Singapore (11)
	'Singapore': 11,

	// France (12)
	'France': 12,

	// Turkey (13)
	'Turkey': 13,
	'Türkiye': 13,

	// Russia (14)
	'Russia': 14,

	// Dubai (16)
	'United Arab Emirates': 16,
	'UAE': 16,

	// Malaysia (17)
	'Malaysia': 17,
	'Brunei': 17,

	// Tunisia (18)
	'Tunisia': 18,

	// Algeria (19)
	'Algeria': 19,

	// Indonesia (20)
	'Indonesia': 20,

	// Morocco (21)
	'Morocco': 21,

	// Portugal (22)
	'Portugal': 22,

	// Jordan (23) - already using Egypt (5) which is common there
};

export const getRecommendedMethod = (country: string): number | null => {
	// Try exact match first
	if (countryMethodMap[country]) {
		return countryMethodMap[country];
	}

	// Try case-insensitive match
	const lowerCountry = country.toLowerCase();
	for (const [key, value] of Object.entries(countryMethodMap)) {
		if (key.toLowerCase() === lowerCountry) {
			return value;
		}
	}

	// Default to MWL (3) for unknown countries - it's widely accepted
	return null;
};

// Hanafi countries (later Asr time)
const hanafiCountries = new Set([
	'Pakistan',
	'Bangladesh',
	'India',
	'Afghanistan',
	'Turkey',
	'Türkiye',
	'Iraq',
	'Syria',
	'Jordan',
	'Palestine',
	'Central Asia',
	'Kazakhstan',
	'Uzbekistan',
	'Tajikistan',
	'Turkmenistan',
	'Kyrgyzstan',
]);

export const getRecommendedSchool = (country: string): number => {
	// Check if Hanafi country
	if (hanafiCountries.has(country)) {
		return 1; // Hanafi
	}
	// Check case-insensitive
	for (const c of hanafiCountries) {
		if (c.toLowerCase() === country.toLowerCase()) {
			return 1;
		}
	}
	return 0; // Shafi (default)
};

export const getMethodName = (id: number): string => {
	const methods: Record<number, string> = {
		0: 'Jafari',
		1: 'Karachi',
		2: 'ISNA',
		3: 'MWL',
		4: 'Makkah',
		5: 'Egypt',
		7: 'Tehran',
		8: 'Gulf',
		9: 'Kuwait',
		10: 'Qatar',
		11: 'Singapore',
		12: 'France',
		13: 'Turkey',
		14: 'Russia',
		15: 'Moonsighting',
		16: 'Dubai',
		17: 'JAKIM',
		18: 'Tunisia',
		19: 'Algeria',
		20: 'Indonesia',
		21: 'Morocco',
		22: 'Portugal',
		23: 'Jordan',
	};
	return methods[id] || 'Unknown';
};
