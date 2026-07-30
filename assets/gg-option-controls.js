/**
 * Option control builders — swatches and a custom dropdown.
 *
 * Returns detached DOM, so these compose into any product form, not just the
 * Gift Guide popup.
 */

import { optionValues } from './gg-variants.js';

const PRESSED = 'aria-pressed';

/**
 * Matched on the option's NAME, not its position — plenty of products list Size
 * first, and keying off index would swap the two controls on those.
 */
const COLOUR_OPTION = /colou?r/i;

export function isColourOption(name) {
  return COLOUR_OPTION.test(name);
}

/**
 * Segmented swatch group — one bordered unit, a colour bar per cell. Selecting
 * fills the cell with ink and flips the text white (Figma Components 208-212).
 */
export function buildSwatches({ variants, position, selection, onChange, swatches = {} }) {
  const group = document.createElement('div');
  group.className = 'gg-popup__swatches';

  optionValues(variants, position).forEach((value) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gg-popup__swatch';
    button.setAttribute(PRESSED, String(selection[position] === value));

    // Colour bar: configured map first (Blue is #0D499F, not the CSS keyword's
    // #0000FF), then the value as a CSS colour, then a neutral fallback.
    const swatch = swatches[value.toLowerCase()]
      ?? (CSS.supports('color', value) ? value : null);
    if (swatch) button.style.setProperty('--gg-swatch', swatch);

    const label = document.createElement('span');
    label.className = 'gg-popup__swatch-label';
    label.textContent = value;
    button.append(label);

    button.addEventListener('click', () => {
      group.querySelectorAll('.gg-popup__swatch').forEach((cell) => {
        cell.setAttribute(PRESSED, String(cell === button));
      });
      onChange(position, value);
    });

    group.append(button);
  });

  return group;
}

/**
 * Custom dropdown (Figma Component 213). A native <select> cannot render the
 * bordered 36px-row panel, so this is a combobox + listbox — which keeps it
 * keyboard operable and screen-reader legible despite not being native.
 */
export function buildDropdown({ variants, position, selection, label, onChange }) {
  const wrap = document.createElement('div');
  wrap.className = 'gg-popup__dropdown';

  const placeholder = `Choose your ${label.toLowerCase()}`;
  const values = optionValues(variants, position);

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'gg-popup__dropdown-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', label);

  const valueEl = document.createElement('span');
  valueEl.className = 'gg-popup__dropdown-value';
  valueEl.textContent = selection[position] ?? placeholder;
  if (selection[position] == null) valueEl.dataset.placeholder = 'true';

  const chevron = document.createElement('span');
  chevron.className = 'gg-popup__dropdown-chevron';
  chevron.innerHTML =
    '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  trigger.append(valueEl, chevron);

  const list = document.createElement('ul');
  list.className = 'gg-popup__dropdown-list';
  list.setAttribute('role', 'listbox');

  const setOpen = (open) => trigger.setAttribute('aria-expanded', String(open));

  values.forEach((value) => {
    const item = document.createElement('li');
    item.className = 'gg-popup__dropdown-option';
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', String(selection[position] === value));
    item.tabIndex = -1;
    item.textContent = value;

    item.addEventListener('click', () => {
      list.querySelectorAll('[role="option"]').forEach((el) => {
        el.setAttribute('aria-selected', String(el === item));
      });
      valueEl.textContent = value;
      delete valueEl.dataset.placeholder;
      setOpen(false);
      trigger.focus();
      onChange(position, value);
    });

    list.append(item);
  });

  trigger.addEventListener('click', () => {
    setOpen(trigger.getAttribute('aria-expanded') !== 'true');
  });

  // Escape closes without changing the selection.
  wrap.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (trigger.getAttribute('aria-expanded') !== 'true') return;
    // Stop the popup itself from closing on the same key press.
    event.stopPropagation();
    setOpen(false);
    trigger.focus();
  });

  wrap.append(trigger, list);
  return wrap;
}

/** Builds a labelled control per option: swatches for colour, dropdown otherwise. */
export function buildOptionControls({ optionNames, variants, selection, onChange, swatches }) {
  const fragment = document.createDocumentFragment();

  /*
   * Colour stacks above the rest, per the design. Only the render order changes:
   * each entry keeps its ORIGINAL index as `position`, since that addresses the
   * value inside a variant's options array. Sorting those too would silently
   * match the wrong variant.
   */
  const ordered = optionNames
    .map((name, position) => ({ name, position }))
    .sort((a, b) => Number(isColourOption(b.name)) - Number(isColourOption(a.name)));

  ordered.forEach(({ name, position }) => {
    const wrap = document.createElement('div');
    wrap.className = 'gg-popup__option';

    const label = document.createElement('span');
    label.className = 'gg-popup__option-label';
    label.textContent = name;

    const control = isColourOption(name)
      ? buildSwatches({ variants, position, selection, onChange, swatches })
      : buildDropdown({ variants, position, selection, label: name, onChange });

    wrap.append(label, control);
    fragment.append(wrap);
  });

  return fragment;
}
