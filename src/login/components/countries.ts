export type Country = {
    /** ISO 3166-1 alpha-2 */
    code: string;
    name: string;
    /** Digits only (no "+") */
    dialCode: string;
};

// Keep this list dependency-free (works in Keycloak theme builds, Storybook, etc.).
// Order is roughly "most common" first; search filters by name/code/dialCode.
export const COUNTRIES: readonly Country[] = [
    { code: "IN", name: "India", dialCode: "91" },
    { code: "US", name: "United States", dialCode: "1" },
    { code: "GB", name: "United Kingdom", dialCode: "44" },
    { code: "AE", name: "United Arab Emirates", dialCode: "971" },
    { code: "SG", name: "Singapore", dialCode: "65" },
    { code: "AU", name: "Australia", dialCode: "61" },
    { code: "CA", name: "Canada", dialCode: "1" },
    { code: "DE", name: "Germany", dialCode: "49" },
    { code: "FR", name: "France", dialCode: "33" },
    { code: "NL", name: "Netherlands", dialCode: "31" },
    { code: "ES", name: "Spain", dialCode: "34" },
    { code: "IT", name: "Italy", dialCode: "39" },
    { code: "SE", name: "Sweden", dialCode: "46" },
    { code: "NO", name: "Norway", dialCode: "47" },
    { code: "DK", name: "Denmark", dialCode: "45" },
    { code: "CH", name: "Switzerland", dialCode: "41" },
    { code: "IE", name: "Ireland", dialCode: "353" },
    { code: "PT", name: "Portugal", dialCode: "351" },
    { code: "BE", name: "Belgium", dialCode: "32" },
    { code: "AT", name: "Austria", dialCode: "43" },
    { code: "PL", name: "Poland", dialCode: "48" },
    { code: "CZ", name: "Czechia", dialCode: "420" },
    { code: "HU", name: "Hungary", dialCode: "36" },
    { code: "RO", name: "Romania", dialCode: "40" },
    { code: "GR", name: "Greece", dialCode: "30" },
    { code: "TR", name: "Turkey", dialCode: "90" },
    { code: "SA", name: "Saudi Arabia", dialCode: "966" },
    { code: "QA", name: "Qatar", dialCode: "974" },
    { code: "KW", name: "Kuwait", dialCode: "965" },
    { code: "OM", name: "Oman", dialCode: "968" },
    { code: "BH", name: "Bahrain", dialCode: "973" },
    { code: "ZA", name: "South Africa", dialCode: "27" },
    { code: "NG", name: "Nigeria", dialCode: "234" },
    { code: "KE", name: "Kenya", dialCode: "254" },
    { code: "EG", name: "Egypt", dialCode: "20" },
    { code: "MA", name: "Morocco", dialCode: "212" },
    { code: "IL", name: "Israel", dialCode: "972" },
    { code: "RU", name: "Russia", dialCode: "7" },
    { code: "UA", name: "Ukraine", dialCode: "380" },
    { code: "BR", name: "Brazil", dialCode: "55" },
    { code: "AR", name: "Argentina", dialCode: "54" },
    { code: "CL", name: "Chile", dialCode: "56" },
    { code: "CO", name: "Colombia", dialCode: "57" },
    { code: "MX", name: "Mexico", dialCode: "52" },
    { code: "PE", name: "Peru", dialCode: "51" },
    { code: "JP", name: "Japan", dialCode: "81" },
    { code: "KR", name: "South Korea", dialCode: "82" },
    { code: "CN", name: "China", dialCode: "86" },
    { code: "HK", name: "Hong Kong", dialCode: "852" },
    { code: "TW", name: "Taiwan", dialCode: "886" },
    { code: "TH", name: "Thailand", dialCode: "66" },
    { code: "VN", name: "Vietnam", dialCode: "84" },
    { code: "MY", name: "Malaysia", dialCode: "60" },
    { code: "ID", name: "Indonesia", dialCode: "62" },
    { code: "PH", name: "Philippines", dialCode: "63" },
    { code: "BD", name: "Bangladesh", dialCode: "880" },
    { code: "PK", name: "Pakistan", dialCode: "92" },
    { code: "LK", name: "Sri Lanka", dialCode: "94" },
    { code: "NP", name: "Nepal", dialCode: "977" },
    { code: "MM", name: "Myanmar", dialCode: "95" },
    { code: "AF", name: "Afghanistan", dialCode: "93" },
    { code: "NZ", name: "New Zealand", dialCode: "64" },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES[0];

export function findCountryByCode(code: string | undefined): Country | undefined {
    if (!code) return undefined;
    return COUNTRIES.find(c => c.code.toLowerCase() === code.toLowerCase());
}

/**
 * Attempts to split an E.164 number into (country, nationalNumber).
 * If no match is found, returns undefined.
 */
export function parseE164PhoneNumber(value: string): { country: Country; nationalNumber: string } | undefined {
    const trimmed = value.trim();
    if (!trimmed.startsWith("+")) return undefined;
    const digits = trimmed.replace(/[^\d]/g, "");
    if (!digits) return undefined;

    // Some countries share dial codes (US/CA both "1"). Prefer the first in list.
    const candidates = COUNTRIES.filter(c => digits.startsWith(c.dialCode));
    if (candidates.length === 0) return undefined;

    // Longest prefix wins.
    const country = candidates.sort((a, b) => b.dialCode.length - a.dialCode.length)[0];
    const nationalNumber = digits.slice(country.dialCode.length);
    return { country, nationalNumber };
}


