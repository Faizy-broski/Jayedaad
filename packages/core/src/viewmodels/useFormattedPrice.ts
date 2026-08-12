import { usePreferencesViewModel } from './usePreferencesViewModel';
import { useExchangeRatesViewModel } from './useExchangeRatesViewModel';
import { convertPrice } from '../utils/convertPrice';
import { formatPrice } from '../utils/formatPrice';

// Combines the signed-in user's preferredCurrency with real fetched FX
// rates into one `format(amountPKR)` closure — every call site that used
// to do formatPrice(amount, preferences?.preferredCurrency) (a label swap
// only, no real conversion) switches to this hook's format(amount)
// instead. formatPrice() itself is unchanged — this hook just feeds it an
// already-converted number.
export function useFormattedPrice() {
  const { preferences } = usePreferencesViewModel();
  const { rates, isLoading: isRatesLoading } = useExchangeRatesViewModel();
  const currencyCode = preferences?.preferredCurrency ?? 'PKR';

  function format(amountPKR: number): string {
    return formatPrice(convertPrice(amountPKR, currencyCode, rates), currencyCode);
  }

  return { format, currencyCode, isLoading: isRatesLoading };
}
