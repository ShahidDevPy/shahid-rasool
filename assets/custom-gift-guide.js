/**
 * <gift-guide-grid> — wires the grid markers to the shared product popup.
 *
 * Product data is serialised into the section by Liquid, so opening a popup
 * costs no network request. The only request made is the cart add itself.
 */

import { findVariant, firstAvailable, selectionMatchesAll } from './gg-variants.js';
import { buildOptionControls, isColourOption } from './gg-option-controls.js';
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
    // Any click outside an open dropdown dismisses it.
    this.#closeDropdownsExcept(event.target.closest('.gg-popup__dropdown'));

    const opener = event.target.closest('[data-gg-open]');
    if (opener && this.contains(opener)) {
      this.#open(Number(opener.dataset.ggOpen), opener);
      return;
    }

    if (event.target.closest('[data-gg-close]')) this.#close();
  };

  /** Collapses every dropdown except the one the click landed in. */
  #closeDropdownsExcept(keep) {
    this.querySelectorAll('.gg-popup__dropdown').forEach((dropdown) => {
      if (dropdown === keep) return;
      dropdown
        .querySelector('[aria-expanded="true"]')
        ?.setAttribute('aria-expanded', 'false');
    });
  }

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

    // Colour opens preselected, size on its placeholder — so add-to-cart stays
    // disabled until the shopper picks. By option name, not index: merchants
    // order options freely.
    const initial = firstAvailable(product.variants);
    this.basePrice = initial ? initial.price : '';
    this.selection = product.optionNames.map((name, index) =>
      isColourOption(name) && initial ? initial.options[index] : null
    );

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
        swatches: this.config.swatches,
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

  /**
   * Reflects the selected variant in the price and the CTA. An incomplete
   * selection shows the opening price and a disabled CTA — not "sold out",
   * which would misreport an item that is merely unspecified.
   */
  #syncVariant() {
    const complete = this.selection.every((value) => value != null);
    const variant = complete
      ? findVariant(this.activeProduct.variants, this.selection)
      : undefined;
    this.activeVariant = variant;

    this.querySelector('[data-gg-price]').textContent = variant?.price ?? this.basePrice;

    const purchasable = Boolean(variant?.available);
    this.addButton.disabled = !purchasable;
    this.addLabel.textContent =
      !complete || purchasable
        ? this.config.strings.addToCart
        : this.config.strings.soldOut;
  }

  /* ---------------------------------------------------------------- *
   * Cart
   * ---------------------------------------------------------------- */

  /**
   * Companion rule: a variant matching BOTH triggers (Black + Medium) adds the
   * companion product on the same request, so the cart updates once.
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

    const items = this.#buildItems();

    try {
      await addToCart(items, { cartAddUrl: this.config.cartAddUrl });

      this.addLabel.textContent = this.config.strings.added;
      // Not awaited: the cart drawer refreshing must not hold up the UI.
      notifyCartUpdated(items);

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
