export type CountryDialCode = {
  iso: string;
  name: string;
  dial: string;
};

/** ISO 3166-1 alpha-2 and ISD (international dialing) codes for signup. */
export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { iso: "IN", name: "India", dial: "+91" },
  { iso: "AE", name: "United Arab Emirates", dial: "+971" },
  { iso: "AU", name: "Australia", dial: "+61" },
  { iso: "BD", name: "Bangladesh", dial: "+880" },
  { iso: "CA", name: "Canada", dial: "+1" },
  { iso: "DE", name: "Germany", dial: "+49" },
  { iso: "GB", name: "United Kingdom", dial: "+44" },
  { iso: "LK", name: "Sri Lanka", dial: "+94" },
  { iso: "NP", name: "Nepal", dial: "+977" },
  { iso: "PK", name: "Pakistan", dial: "+92" },
  { iso: "SG", name: "Singapore", dial: "+65" },
  { iso: "US", name: "United States", dial: "+1" },
];

export const DEFAULT_COUNTRY_ISO = "IN";

export function findCountryDial(iso: string): CountryDialCode {
  return COUNTRY_DIAL_CODES.find((country) => country.iso === iso) ?? COUNTRY_DIAL_CODES[0]!;
}

export function toE164Mobile(iso: string, nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, "").replace(/^0+/, "");
  const { dial } = findCountryDial(iso);
  if (nationalNumber.trim().startsWith("+")) {
    return `+${nationalNumber.replace(/\D/g, "")}`;
  }
  return `${dial}${digits}`;
}
