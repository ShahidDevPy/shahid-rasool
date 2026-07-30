/**
 * <gg-banner-menu> — mobile menu toggle for the banner's utility bar.
 *
 * Showing and hiding is entirely CSS keyed off `aria-expanded`, so this does
 * one job: keep that attribute truthful. Accessibility contract and styling
 * hook stay in one place, and desktop is untouched.
 */

class GgBannerMenu extends HTMLElement {
  connectedCallback() {
    this.trigger = this.querySelector('[data-gg-menu-toggle]');
    if (!this.trigger) return;

    this.trigger.addEventListener('click', this.#toggle);
    document.addEventListener('keydown', this.#onKeydown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.#onKeydown);
  }

  get open() {
    return this.trigger.getAttribute('aria-expanded') === 'true';
  }

  #toggle = () => {
    this.trigger.setAttribute('aria-expanded', String(!this.open));
  };

  #onKeydown = (event) => {
    if (event.key !== 'Escape' || !this.open) return;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.trigger.focus();
  };
}

if (!customElements.get('gg-banner-menu')) {
  customElements.define('gg-banner-menu', GgBannerMenu);
}
