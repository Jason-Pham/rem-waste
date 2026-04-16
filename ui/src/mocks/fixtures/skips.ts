import type { Skip } from '../../api/schemas';

/**
 * Canonical skip catalogue — 8 sizes (meets §2 "≥8 skip options with mixed
 * enabled/disabled states"). Stored by canonical `size` string; the UI
 * normalizes these into display labels ("4-yard" → "4 Yard Skip").
 */
export type CatalogueEntry = {
  size: string;
  price: number;
  /** true = cannot accept heavy waste — becomes disabled when heavyWaste=true. */
  blockedByHeavyWaste: boolean;
};

export const SKIP_CATALOGUE: CatalogueEntry[] = [
  { size: '4-yard',  price: 120, blockedByHeavyWaste: false },
  { size: '6-yard',  price: 180, blockedByHeavyWaste: false },
  { size: '8-yard',  price: 230, blockedByHeavyWaste: false },
  { size: '10-yard', price: 280, blockedByHeavyWaste: true  }, // disabled for heavy
  { size: '12-yard', price: 320, blockedByHeavyWaste: true  }, // disabled for heavy
  { size: '14-yard', price: 360, blockedByHeavyWaste: true  }, // disabled for heavy (3 ≥ 2 required)
  { size: '16-yard', price: 400, blockedByHeavyWaste: false },
  { size: '20-yard', price: 480, blockedByHeavyWaste: false },
];

export function buildSkips(heavyWaste: boolean): Skip[] {
  return SKIP_CATALOGUE.map((s) => ({
    size: s.size,
    price: s.price,
    disabled: heavyWaste && s.blockedByHeavyWaste,
    reason:
      heavyWaste && s.blockedByHeavyWaste
        ? 'Not available for heavy waste'
        : undefined,
  }));
}
