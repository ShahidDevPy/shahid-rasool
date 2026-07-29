/**
 * Variant helpers — pure functions, no DOM, no theme coupling.
 *
 * Deliberately dependency-free so any section can reuse them for variant
 * pickers, quick-add, or product forms.
 *
 * A `variant` here is the shape serialised by the section:
 *   { id, options: string[], available: boolean, price: string }
 */

/** Distinct values for one option position, in the order they first appear. */
export function optionValues(variants, position) {
  return [...new Set(variants.map((variant) => variant.options[position]))];
}

/** The variant whose options match `selection` exactly. */
export function findVariant(variants, selection) {
  return variants.find((variant) =>
    variant.options.every((value, index) => value === selection[index])
  );
}

/** First purchasable variant, falling back to the first that exists. */
export function firstAvailable(variants) {
  return variants.find((variant) => variant.available) || variants[0];
}

/**
 * True when every trigger appears in the selection, compared case-insensitively.
 * Empty triggers are ignored so a half-configured rule never fires.
 */
export function selectionMatchesAll(selection, triggers = []) {
  const chosen = selection.map((value) => String(value).toLowerCase());
  const wanted = triggers.filter(Boolean).map((value) => String(value).toLowerCase());
  return wanted.length > 0 && wanted.every((trigger) => chosen.includes(trigger));
}
