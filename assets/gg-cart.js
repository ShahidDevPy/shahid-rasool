/**
 * Cart API helper — reusable wherever a section needs to add lines.
 *
 * Wraps Shopify's AJAX Cart API. Nothing here is Gift Guide specific.
 */

/**
 * Adds one or more lines in a single request, so the cart updates once.
 *
 * @param {Array<{id: number, quantity: number}>} items
 * @param {{cartAddUrl?: string}} [options]
 * @returns {Promise<object>} the created cart lines
 */
export async function addToCart(items, { cartAddUrl = '/cart/add' } = {}) {
  const response = await fetch(`${cartAddUrl}.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    // Shopify returns a JSON body describing the failure; surface it verbatim.
    const detail = await response.text();
    throw new Error(`Cart add failed (${response.status}): ${detail}`);
  }

  return response.json();
}

/**
 * Tells the surrounding theme its cart is stale.
 *
 * Emitting a plain DOM event keeps this decoupled — no importing the theme's
 * own cart modules.
 */
export function notifyCartUpdated(detail = {}) {
  document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true, detail }));
}
