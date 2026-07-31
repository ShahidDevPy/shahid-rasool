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
 * Tells the theme its cart is stale, so the drawer and bubble re-render without
 * a page reload.
 *
 * Uses Shopify's storefront standard event (the same one the theme's own cart
 * icon listens for) rather than a bespoke name, which nothing would hear.
 * Imported from @shopify/events — the platform's package, not a theme module —
 * and guarded so a theme without that import map degrades instead of throwing.
 *
 * Listeners read `event.promise`, so the fresh cart is passed that way.
 */
export async function notifyCartUpdated(items = []) {
  // failure here should never surface as an error — worst case the drawer
  // just doesn't refresh itself.
  try {
    const cart = await fetch('/cart.js').then((r) => r.json());
    const { StandardEvents, CartLinesUpdateEvent } = await import('@shopify/events');

    document.dispatchEvent(
      new CartLinesUpdateEvent({
        action: 'add',
        context: 'product',
        lines: items.map(({ id, quantity }) => ({
          merchandiseId: String(id),
          quantity,
        })),
        promise: Promise.resolve({
          cart: CartLinesUpdateEvent.createCartFromAjaxResponse(cart),
          detail: { itemCount: cart.item_count, items: cart.items },
        }),
      })
    );

    return StandardEvents.cartLinesUpdate;
  } catch {
    // Covers both a fetch failure and @shopify/events being unavailable —
    // fall back to a plain event so a host theme can still listen.
    document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
    return 'cart:refresh';
  }
}
