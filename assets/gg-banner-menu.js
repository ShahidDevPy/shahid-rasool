/**
 * <gg-banner-menu> — mobile menu toggle for the banner's utility bar.
 *
 * The mobile design hides the tagline and accent CTA behind a hamburger, then
 * reveals them in a panel below the bar. All of the showing/hiding is CSS keyed
 * off `aria-expanded`, so this element does one job: keep that attribute
 * truthful. That keeps the a11y contract and the styling hook in a single place,
 * and leaves the desktop layout entirely alone.
 *
 * Vanilla custom element — no jQuery, no theme module imports.
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
