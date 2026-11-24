import { AbstractControl, FormControl } from '@angular/forms';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js/min';

const regionNames = new Intl.DisplayNames('es', { type: 'region' });
export const countryDialCodes = getCountries().map(country => ({
  country,
  name: regionNames.of(country) ?? country,
  dialCode: `+${getCountryCallingCode(country)}`,
})).sort((left, right) => left.name.localeCompare(right.name, 'es'));

const dialCodeByCountry = new Map<string, string>(
  countryDialCodes.map(({ country, dialCode }) => [country, dialCode]),
);

export function getDialPrefix(country: string): string {
  return dialCodeByCountry.get(country) ?? (country === '+' ? '+' : '');
}

export function splitPhone(value: string) {
  const number = value.trim().replace(/[^0-9+]/g, '');
  const parsedCountry = number.startsWith('+') ? parsePhoneNumberFromString(number)?.country : undefined;
  const matchingCountry = parsedCountry
    ?? countryDialCodes.find(({ dialCode }) => number.startsWith(dialCode))?.country;
  const phoneCountry = matchingCountry ?? (number.startsWith('+') ? '+' : '');
  return {
    phoneCountry,
    phone: number.slice(getDialPrefix(phoneCountry).length).replace(/[^0-9]/g, ''),
    legacyDialCode: matchingCountry ? null : phoneCountry,
  };
}

export function validatePhoneLength(form: AbstractControl) {
  const { phoneCountry, phone } = form.getRawValue();
  const length = getDialPrefix(phoneCountry).length + phone.length;
  return length >= 10 && length <= 15 ? null : { phoneLength: true };
}

export function keepPhoneDigits(event: Event, control: FormControl<string>): void {
  const input = event.target as HTMLInputElement;
  const digits = input.value.replace(/[^0-9]/g, '');
  if (input.value !== digits) {
    input.value = digits;
    control.setValue(digits);
  }
}
