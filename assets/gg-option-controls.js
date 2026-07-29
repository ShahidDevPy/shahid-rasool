/**
 * Option control builders — swatches and selects.
 *
 * Returns detached DOM, so these compose into any product form, not just the
 * Gift Guide popup.
 */

import { optionValues } from './gg-variants.js';

const PRESSED = 'aria-pressed';

/**
 * Segmented swatch group. Each cell shows a colour chip when the value name is
 * a colour the browser recognises (Blue, Black, …).
 */
export function buildSwatches({ variants, position, selection, onChange }) {
  const group = document.createElement('div');
  group.className = 'gg-popup__swatches';

  optionValues(variants, position).forEach((value) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gg-popup__swatch';
    button.textContent = value;
    button.setAttribute(PRESSED, String(selection[position] === value));

    if (CSS.supports('color', value)) button.style.setProperty('--gg-swatch', value);

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

/** Native select, styled by the section, with a custom arrow. */
export function buildSelect({ variants, position, selection, label, onChange }) {
  const wrap = document.createElement('div');
  wrap.className = 'gg-popup__select-wrap';

  const select = document.createElement('select');
  select.className = 'gg-popup__select';
  select.setAttribute('aria-label', label);

  optionValues(variants, position).forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    option.selected = selection[position] === value;
    select.append(option);
  });

  select.addEventListener('change', () => onChange(position, select.value));

  const arrow = document.createElement('span');
  arrow.className = 'gg-popup__select-arrow';
  arrow.innerHTML =
    '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  wrap.append(select, arrow);
  return wrap;
}

/**
 * Builds a labelled control per option: the first renders as swatches (per the
 * design), the rest as selects.
 */
export function buildOptionControls({ optionNames, variants, selection, onChange }) {
  const fragment = document.createDocumentFragment();

  optionNames.forEach((name, position) => {
    const wrap = document.createElement('div');
    wrap.className = 'gg-popup__option';

    const label = document.createElement('span');
    label.className = 'gg-popup__option-label';
    label.textContent = name;

    const control =
      position === 0
        ? buildSwatches({ variants, position, selection, onChange })
        : buildSelect({ variants, position, selection, label: name, onChange });

    wrap.append(label, control);
    fragment.append(wrap);
  });

  return fragment;
}
