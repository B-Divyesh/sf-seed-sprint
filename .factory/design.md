# Seed Sprint visual thesis

## Direction

Seed Sprint uses a **risograph tactile collage** to make a digital logic board feel like a puzzle clipped from an independent print annual. Thick ink, imperfect registration, torn-paper edges, and visible grain give the daily seed a physical identity. The playable board stays crisp and readable; texture lives behind it and in nonessential decoration.

The asymmetrical landing layout puts a playable 6×6 board beside the short introduction. It avoids the centered software-landing pattern and makes the game visible in the first captured screen.

## Palette

Single light treatment, chosen to resemble warm uncoated stock. Dark overlays provide the pause and result treatments.

| Token | Value | Use |
| --- | --- | --- |
| paper | `#F4E8CE` | page background |
| paper-light | `#FFF9EA` | game tile faces and copy plates |
| ink | `#172820` | body text, outlines, strong controls |
| ink-soft | `#4F5B50` | secondary text on light surfaces |
| teal | `#087A72` | live signal and focus accents |
| coral | `#C83E2B` | source, urgency, selected state |
| sunflower | `#E4AD19` | decorative second-ink layer |
| focus | `#00665F` | keyboard focus ring; ≥5.6:1 against both paper surfaces |
| success | `#176B3A` | completed state with icon and text |
| danger | `#A52D24` | expired state with icon and text |

Body pairs use ink on paper or paper-light. Primary buttons use paper-light on ink. These combinations exceed 4.5:1. Coral and sunflower never carry meaning alone.

## Type

- **Fraunces SemiBold** for display headings and large result numbers. Its soft, irregular serifs echo cut paper and stamped type.
- **Atkinson Hyperlegible Regular/Bold** for controls, body text, and the timer. Its distinct forms support quick reading during play.
- Both families are self-hosted WOFF2 files under `public/fonts`, licensed under the SIL Open Font License, and use `font-display: swap`.

The scale is 16, 18, 24, 36, and a fluid 56–76 px display size. Body measure stays below 68 characters.

## Spacing and shape

Spacing follows an 8 px base: 8, 16, 24, 32, 48, 64, and 96 px. Buttons and board cells have a minimum 44 px target. Cards use clipped polygon corners and offset ink shadows instead of rounded software rectangles. Thin misregistered coral and teal shadows are decorative only.

On a 390 px screen, the introduction stacks above the board, the timer docks above the grid, and secondary explanations move below the game. Nothing required to play is hidden.

## Interaction grammar

- Click, tap, Enter, or Space rotates a tile clockwise.
- Arrow keys move the selected tile; `R` rotates it; `P` pauses.
- A visible orientation label gives nonvisual state for every tile.
- Correctly connected segments receive both a teal fill and a small pulse dot.
- The timer counts from five minutes. Assist mode removes the countdown without changing the board or result label.
- Pause and visibility changes stop elapsed play. Refresh restores the board and elapsed time from local storage.

## Difficulty and deterministic board plan

Each calendar day maps to a deterministic pseudo-random generator. A solved routing tree is built first, then each tile receives a deterministic non-zero rotation. The verifier solves the board by replaying the saved solution rotations. Daily boards contain 18–26 routed tiles plus inert blockers, which creates a 4–6 minute first run without precise timing.

The demo seed is fixed at `SPROUT-7`. It uses its own `demo:` storage namespace and starts with a partly solved board so the product appears in use immediately.

## Motion and feel

Tile rotation takes 180 ms and comes from the tile center. A solved board uses one 260 ms offset-print snap: the coral shadow aligns behind the teal circuit. The timer never flashes. There is no screen shake or autoplay audio. Under `prefers-reduced-motion`, rotation and entrances become instant, and the solved snap is replaced by a static outline.

The renderer is DOM/CSS rather than Canvas because the puzzle is turn-based. A requestAnimationFrame ticker updates the timer and pauses on hidden tabs; there is no simulation whose timing affects board state.

## Art direction and asset plan

The hero illustration is a top-down collage of an impossible botanical circuit board: oversized seed pods route ink lines through torn paper tiles into one glowing sprout. It is subordinate behind solid copy and play plates. The palette uses warm paper, bottle green, teal, coral, and sunflower inks. Lighting is flat printmaking light with visible paper fibers and two-color registration drift.

Prompt sheet:

> Use case: stylized-concept. Asset type: wide landing-page editorial illustration. Primary request: a top-down risograph collage of a six-by-six botanical signal-routing puzzle, with seed pods connected by thick circuit-like vines to one sprouting plant. Scene: torn handmade paper pieces on warm uncoated stock. Style: three-ink risograph print, tactile grain, imperfect registration, chunky geometric cut-paper shapes, editorial composition. Composition: landscape, dense visual interest on the right and quiet paper texture on the left, no user interface. Palette: bottle green, deep teal, coral red, sunflower yellow, cream paper. Lighting: flat printmaking studio light. Constraints: no people, no hands, no text, no letters, no numbers, no logos, no watermark, no recognizable brand, no photorealism, no gradients.

The generated master lives in `assets/src/seed-circuit.png`. Responsive AVIF and WebP derivatives plus a JPEG fallback live in `public/art/`. Authored assets include the seed favicon and social-preview crop. Generated imagery is disclosed in the footer.

## Provenance

- Hero art: generated for Seed Sprint with the factory image deployment on 2026-09-02 from the prompt above. Original to this product; reviewed for text, symbols, seams, and brand artifacts.
- UI glyphs and the seed favicon: authored in this repository as SVG/CSS geometry on 2026-09-02.
- Fonts: Fraunces and Atkinson Hyperlegible, SIL Open Font License.
