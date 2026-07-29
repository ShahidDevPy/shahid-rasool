/**
 * <gift-guide-grid> — wires the grid markers to the shared product popup.
 *
 * Written from scratch for the Ecomexperts test: no jQuery, no framework, and
 * no imports from the theme's `@theme/*` module map.
 *
 * Product data is serialised into the section by Liquid, so opening a popup
 * costs no network request. The only request made is the cart add itself.
 */

import { findVariant, firstAvailable, selectionMatchesAll } from './gg-variants.js';
import { buildOptionControls } from './gg-option-controls.js';
import { addToCart, notifyCartUpdated } from './gg-cart.js';

class GiftGuideGrid extends HTMLElement {
  connectedCallback() {
    this.products = this.#readJSON('[data-gg-products]', []);
    this.config = this.#readJSON('[data-gg-config]', {});

    this.popup = this.querySelector('[data-gg-popup]');
    this.optionsHost = this.querySelector('[data-gg-options]');
    this.addButton = this.querySelector('[data-gg-add]');
    this.addLabel = this.querySelector('[data-gg-add-label]');
    this.status = this.querySelector('[data-gg-status]');

    this.activeProduct = null;
    this.activeVariant = null;
    this.activeTrigger = null;
    this.selection = [];

    // One delegated listener covers all six markers and both close controls.
    this.addEventListener('click', this.#onClick);
    this.addButton?.addEventListener('click', this.#onAddToCart);
    document.addEventListener('keydown', this.#onKeydown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.#onKeydown);
    document.body.classList.remove('gg-popup-open');
  }

  #readJSON(selector, fallback) {
    try {
      return JSON.parse(this.querySelector(selector).textContent);
    } catch {
      return fallback;
    }
  }

  #onClick = (event) => {
    const opener = event.target.closest('[data-gg-open]');
    if (opener && this.contains(opener)) {
      this.#open(Number(opener.dataset.ggOpen), opener);
      return;
    }

    if (event.target.closest('[data-gg-close]')) this.#close();
  };

  #onKeydown = (event) => {
    if (event.key === 'Escape' && !this.popup.hidden) this.#close();
  };

  /* ---------------------------------------------------------------- *
   * Open / close
   * ---------------------------------------------------------------- */

  #open(index, trigger) {
    const product = this.products[index];
    if (!product) return;

    this.activeProduct = product;
    this.activeTrigger = trigger;

    // Start on a purchasable variant so the popup never opens sold out.
    const initial = firstAvailable(product.variants);
    this.selection = initial ? [...initial.options] : [];

    const image = this.querySelector('[data-gg-image]');
    image.src = product.image || '';
    image.alt = product.imageAlt || '';
    this.querySelector('[data-gg-title]').textContent = product.title;
    this.querySelector('[data-gg-description]').textContent = product.description || '';

    this.optionsHost.replaceChildren(
      buildOptionControls({
        optionNames: product.optionNames,
        variants: product.variants,
        selection: this.selection,
        onChange: this.#onOptionChange,
      })
    );

    this.#syncVariant();

    this.popup.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('gg-popup-open');
    this.querySelector('[data-gg-close]')?.focus();
  }

  #close() {
    this.popup.hidden = true;
    this.#setStatus('');
    this.activeTrigger?.setAttribute('aria-expanded', 'false');
    this.activeTrigger?.focus();
    this.activeTrigger = null;
    this.activeProduct = null;
    document.body.classList.remove('gg-popup-open');
  }

  /* ---------------------------------------------------------------- *
   * Selection
   * ---------------------------------------------------------------- */

  #onOptionChange = (position, value) => {
    this.selection[position] = value;
    this.#syncVariant();
  };

  /** Reflects the selected variant in the price and the CTA. */
  #syncVariant() {
    const variant = findVariant(this.activeProduct.variants, this.selection);
    this.activeVariant = variant;

    this.querySelector('[data-gg-price]').textContent = variant?.price ?? '';

    const purchasable = Boolean(variant?.available);
    this.addButton.disabled = !purchasable;
    this.addLabel.textContent = purchasable
      ? this.config.strings.addToCart
      : this.config.strings.soldOut;
  }

  /* ---------------------------------------------------------------- *
   * Cart
   * ---------------------------------------------------------------- */

  /**
   * The brief's companion rule: when the chosen variant matches BOTH trigger
   * values (Black + Medium), the companion product goes in on the same request
   * so the cart only updates once.
   */
  #buildItems() {
    const items = [{ id: this.activeVariant.id, quantity: 1 }];
    const bonus = this.config.bonus;

    if (bonus?.variantId && selectionMatchesAll(this.selection, bonus.triggers)) {
      items.push({ id: bonus.variantId, quantity: 1 });
    }

    return items;
  }

  #onAddToCart = async () => {
    if (!this.activeVariant?.available) return;

    this.addButton.disabled = true;
    this.#setStatus('');

    try {
      await addToCart(this.#buildItems(), { cartAddUrl: this.config.cartAddUrl });

      this.addLabel.textContent = this.config.strings.added;
      notifyCartUpdated({ source: 'gift-guide' });

      setTimeout(() => {
        if (this.activeProduct) this.#syncVariant();
      }, 1800);
    } catch {
      this.#setStatus(this.config.strings.error, true);
      this.addButton.disabled = false;
    }
  };

  #setStatus(message, isError = false) {
    this.status.textContent = message;
    this.status.classList.toggle('gg-popup__status--error', isError);
  }
}

if (!customElements.get('gift-guide-grid')) {
  customElements.define('gift-guide-grid', GiftGuideGrid);
}
