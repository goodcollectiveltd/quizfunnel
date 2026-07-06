# Funnel images — ready to wire in

Cropped/optimised from the company image bank (`company-context/image-bank/`) on 5 Jul 2026.
All served from the site root, e.g. `/images/products/probioPlus.png`.

## Products (transparent PNG cutouts — composite on any background)
| Web path | Product key |
|---|---|
| `/images/products/probioPlus.png` | `probioPlus` |
| `/images/products/omega.png` | `omega` |
| `/images/products/skinGutDuo.png` | `skinGutDuo` |

Suggested: add `image: string` to the `Product` interface (`src/data/products.ts`) and render it in
the SymptomLander offer card + the quiz `Result` product block. Right now those show no product photo.

## Symptoms (3:2 photos, 1200×800 — for the "Sound familiar?" agitate section)
| Web path | Symptom id | Shows |
|---|---|---|
| `/images/symptoms/paw-licking.jpg` | `paw-licking` | dog licking/chewing its paw |
| `/images/symptoms/itchy-skin.jpg` | `itchy-skin` | dog scratching |
| `/images/symptoms/gunky-ears.jpg` | `gunky-ears` | dog scratching at ear (proxy) |
| `/images/symptoms/tummy.jpg` | `tummy` | subdued/off-colour dog (proxy) |

Suggested: add `image?: string` (OPTIONAL) to the `Symptom` interface (`src/data/symptoms.ts`).
**`scooting` and `tear-staining` have NO photo** — no usable stock exists for them (see
`company-context/image-bank/INDEX.md`), so render the section text-only when `image` is undefined.

## Vet (trust)
| Web path | Use |
|---|---|
| `/images/people/kishan.jpg` | Kishan (vet), 4:5 portrait — for a "recommended by our vet" trust strip |

## Result-page product hero + UGC wall
Cropped from `company-context/image-bank/` on 6 Jul 2026. Live on the **Result page**.
| Web path | Shows | Used for |
|---|---|---|
| `/images/products/probio-sprinkle.jpg` | Capsule sprinkling into a food bowl, red bg (photoshoot `Probiotic-5`) | Recommendation card hero (`Product.heroImage`) |
| `/images/ugc/grid-dachshund.jpg` | Dachshund + Probiotic tub on grass | "Join thousands of UK dogs" social-proof wall |
| `/images/ugc/grid-golden.jpg` | Golden retriever, hand holding the tub | social-proof wall |
| `/images/ugc/grid-beagle.jpg` | Beagle nosing the tub | social-proof wall |
| `/images/ugc/grid-trio.jpg` | Three dogs + Joint Support & Probiotic tubs | social-proof wall |

UGC consent: **confirmed** by Will (all image-bank UGC is consented). `grid-cavapoo.jpg` and `happy-dog.jpg` are unused spares.

## Notes
- Need a different crop/aspect for a placement? Re-run `company-context/image-bank/_tools/crop.py`
  against the original in the bank — originals are full-res and untouched.
- **Gunky-ears & tummy are proxies.** The strongest *real* ear asset is the Murphy UGC ear
  before/after in the bank (`ugc/murphy/20251201_094350-135c`) — worth a dedicated before/after
  block on the ears lander later.
- Pairing UGC photos with the testimonial proof cards is a good next step (not done yet).
