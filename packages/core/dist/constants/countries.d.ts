export interface Country {
    name: string;
    dialCode: string;
    iso2: string;
    maxPhoneDigits?: number;
}
export declare const COUNTRIES: Country[];
export declare function getMaxPhoneDigits(dialCode: string): number | undefined;
