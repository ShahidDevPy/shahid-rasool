# The Gift Guide — Shopify Section Build

A Figma design implemented as **two custom Shopify sections** on a single page, with a
product quick-view popup and working add-to-cart.

**Live page:** `/pages/gift-guide` · **Theme:** Horizon 4.1.3

---

## Contents

- [What was built](#what-was-built)
- [Requirements checklist](#requirements-checklist)
- [Performance](#performance)
- [Remarks](#remarks)

---

## What was built

| Section | File | Responsibility |
|---|---|---|
| **Banner** | `sections/custom-banner.liquid` | Utility bar, hero artwork + copy, strip. Mobile menu. |
| **Grid** | `sections/custom-grid.liquid` | 3×2 product grid, hotspot markers, quick-view popup, cart. |

Both are mounted by `templates/page.gift-guide.json`, a dedicated page template — so the
work lives on its own page and touches nothing else in the theme.

## Requirements checklist

| Requirement | Status |
|---|---|
| Two **new** sections, built from scratch | ✅ Banner + Grid |
| No ready-made theme sections/components | ✅ **0** `@theme/*` imports, **0** theme snippets rendered |
| No jQuery — vanilla JS only | ✅ **0** references; native custom elements |
| Banner text editable from the Customizer | ✅ Every red-rectangle string is a setting |
| Button animations | ✅ Pure CSS (fill sweep + arrow slide), 300ms ease-out |
| Grid shows six product blocks | ✅ `max_blocks: 6` |
| Products selectable from the Customizer | ✅ Per-block product picker |
| Popup: name, price, description, variants | ✅ All rendered from product data |
| Variants rendered **dynamically** | ✅ Derived from `product.variants`; nothing hardcoded |
| **Add to Cart** functional | ✅ `fetch` → `/cart/add.js`, no page reload |
| **Black + Medium → auto-add Soft Winter Jacket** | ✅ Second line item in the *same* request |
| Mobile view | ✅ Distinct mobile composition, not a narrowed desktop |

## Performance

- **Artwork optimised** via SVGO (`removeViewBox: false`, needed for responsive scaling) —
  desktop art **119 KB → 62 KB** gzipped; LCP resource **65 KB → 34 KB**.
- **Mobile never downloads desktop artwork** — gated behind a `min-width` `<source>` with a
  43-byte inline fallback; the preload is `media`-gated the same way.
- **Popup opens with zero network requests** — product data is serialised server-side; the
  only request is the cart add itself.
- **Icons inlined** — no icon-sprite requests.
- **All JS is deferred ES modules**, ~6.8 KB gzipped total. Button animation is pure CSS.
- **No layout shift** — every image has intrinsic dimensions; measured **CLS 0**.
- **No extra font requests** — typography comes from a section-level `font_picker`, so the
  page carries its own type without a store-wide font override.

## Remarks

1. **Logo font** — the Figma logo is an outlined vector with no attached type spec. Used a
   close-matching geometric sans so the string stays Customizer-editable, per the brief.
2. **Heading font** — Figma specifies Lustria; Shopify's font library doesn't host it, so
   Playfair Display is used as the closest available serif.
3. **"See all" button** — not present in the Figma. The grid is fixed at six tiles per the
   design, so no link to the wider catalogue was added.
4. **Popup marker offset** — the middle grid row's marker differs by 1px vertically from the
   other rows in the Figma itself (top 19px vs 18px); reproduced as measured.
5. **Base theme** — the store shipped with Horizon 4.1.3, not Dawn as named in the brief.
   Built on Horizon since that's what's installed.
6. **Add to Cart stays disabled** until both colour and size are chosen. Not shown in the
   Figma, but required — there is no valid variant to add otherwise.
