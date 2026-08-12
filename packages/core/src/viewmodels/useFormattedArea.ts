import { usePreferencesViewModel } from './usePreferencesViewModel';
import { convertArea } from '../utils/convertArea';
import { AREA_UNIT_OPTIONS } from '../constants/currencies';
import { AreaUnit } from '../models';

// Combines the signed-in user's preferredAreaUnit with the real convertArea()
// conversion into one `format(value, fromUnit)` closure — every call site
// that used to render a listing's raw {areaValue} {areaUnit} verbatim
// (never applying the viewer's own preference, and on web actively
// mislabeling the raw number as "sqft" regardless of its real unit)
// switches to this hook's format(value, fromUnit) instead. Falls back to
// the listing's own unit, unconverted, when no user is signed in — no
// regression for guest browsing (there's no preference to read yet).
export function useFormattedArea() {
  const { preferences } = usePreferencesViewModel();
  const targetUnit = preferences?.preferredAreaUnit;

  function format(value: number, fromUnit: AreaUnit): string {
    const unit = targetUnit ?? fromUnit;
    const converted = convertArea(value, fromUnit, unit);
    const label = AREA_UNIT_OPTIONS.find((o) => o.value === unit)?.label ?? unit;
    const rounded = Math.round(converted * 100) / 100;
    return `${rounded.toLocaleString()} ${label}`;
  }

  return { format };
}
