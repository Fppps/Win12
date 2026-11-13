# WebWindows 10H10 — Native app styling standard

Applies to **Settings**, **Feedback Hub**, and **Windows Security**. These are shipped WebWindows apps and should be treated as one consistent UI system, not individual design mockups.

## Materials and themes

- The root glass variables (`--mica-surface`, `--mica-sheen`, `--mica-blur`, `--text-primary`, `--text-secondary`, and `--control-surface`) are the source of truth. Respect `data-ww-ink` and the user's chosen glass color.
- All native app title bars share the same subtle glass-aware tint, `--ww10-app-titlebar-surface`, derived from `--titlebar-surface` at 32% opacity. Do not introduce app-specific title-bar pigments or separators; Settings, Feedback Hub, and Defender must match.
- Sidebars use `--ww10-app-sidebar-surface`. Do not introduce a separate sidebar color for each app.
- Default content cards use `--control-surface`; interactive hover surfaces use `--control-hover`.
- Navigation rows in all native apps, including selected rows, use `--control-hover` while hovered or keyboard-focused; Feedback Hub must not mix the accent into its nav background. Accent is reserved for the sliding selection indicator.
- The Settings search glyph is geometrically centered inside its search input, including in compact layouts; do not position it with a hardcoded `top` offset.

## Title bars and window controls

- Height: **40px** across native apps.
- Hamburger button: **42×40px**, aligned left of the title.
- Minimize, maximize/restore, and close buttons: **42×40px** each, aligned right, with matching optical centers and stroke weights.
- Use lightweight inline SVG for window-control geometry, where consistent optical rendering is more important than remote icon-font availability. Use Phosphor for normal app/navigation symbols; do not use custom SVG solely for decoration.
- The close button uses the same red hover/focus state across all three apps. No app logos in native title bars.

## Navigation

- A **single moving active-page indicator** is owned by `WWCompat.createSidebarIndicator`. It measures the selected row and animates a compositor transform; it must not be replaced with per-item `::before` pseudo-elements.
- Indicators reproduce the **9H09 rubber-band motion**: **150ms ease-in** extending toward the selected row, followed by **200ms ease-out** contracting to the destination and returning to **16px height**. Use CSS `top` and `height`, not sampled transform keyframes, overshoot, or spring rebounds. The shared implementation cancels pending timers on rapid selections; layout refreshes never replay the animation for the same destination.
- Settings supports a **58px icon-only rail**, toggled from its title-bar hamburger with a **420ms** width transition. The collapsed icons remain clickable. Its responsive layout keeps the same interaction in compact windows.
- Feedback Hub and Defender retain their existing app-specific navigation behavior but share the same indicator engine and title-bar standards.
- Tooltips/accessible labels must remain available for icon-only navigation. Respect `prefers-reduced-motion: reduce`.

## Toggle controls

- Use `.ww10-app-switch` on native-app settings switches; the existing Settings `.ww-settings-switch` and Defender `.wwdef-switch` can coexist with it.
- Standard track **38×21px**; thumb **14×14px**, inset **3px**, and **16px** checked travel.
- Animate the thumb for **345ms** with the same spring-like curve used in Settings. Keep pressed thumb feedback, keyboard focus, disabled visual state, and proper native checkbox semantics.
- Switch colors must follow the glass and selected-surface variables, never a Defender-only palette.

## Radio controls

- Windows Insider, Windows Security (Defender), and Settings Search results use the same glass-aware neutral outline, accent-colored selected ring, keyboard focus indicator, and reduced-motion handling.
- Do not change existing indicator diameters: Insider is **23px**, Defender and Search results are **18px**.
- Preserve native radio input semantics, mutually exclusive selection, and the existing preference/state handlers.

## Start menu

- The decorative Windows badge in the account header is a keyboard-focusable Settings button that opens the real Settings app via the existing taskbar action.
- Control, hover, selected, and account-header tint surfaces use the exact chosen glass RGB, without brightening, darkening, or cooling the swatch. Light and dark choices differ by their original RGB only; layer opacity supplies secondary depth.

- Start places the account header first, pinned apps next, then four news article cards in a 2×2 grid. In compact widths, the news grid may collapse to one column.
- Each News card uses Mica-derived `--control-surface` and `--control-hover`, with a restrained title strip, linked headline, publisher-supplied image (if available) and excerpt. Prefer articles with their own media; on a failed image, try additional media URLs from that same article, then allow another illustrated article from the feed. If none is available, show a clean text-forward article card instead of an empty placeholder. Never invent article content or substitute unrelated stock imagery.
- The News section uses no separate rule or inset separator; the small source-information control retains the GDELT/RSS credits.

## Maintenance checklist

Before a new app/page ships, verify normal and compact window sizes, keyboard controls, reduced motion, sidebar page changes, toggle off/on/focus, maximization and restore, glass color changes, and failure to load external icon fonts. Do not add app-specific overrides for shared components unless a functional reason is documented.

## Home cards and illustration rules

- Defender Home uses borderless cards with no inset stroke or raised hover shadow. Keyboard-focus outlines remain visible for accessibility.
- Feedback Hub suggestion/problem cards use the original layered document-and-action-medallion SVG motif, redrawn with cleaner geometry and glass-friendly gradients. Retain these self-contained SVG illustrations where their extra detail is warranted; use Phosphor for everyday interface/navigation glyphs.

## Taskbar-aware flyouts

- Start, Search, and Weather use `WWCompat.positionTaskbarPanel` and the real taskbar bounds, including floating taskbars. They open into the remaining viewport for top, bottom, left, and right placements. Weather anchors to its taskbar button.
- Flyout entrance directions match the dock side without scaling raster icons. Forecast information scrolls within the weather card when less height is available.
- All three update on taskbar layout changes and viewport resizing; animated and reduced-motion experiences remain operable.

## Start account titlebar subtint (2610140.Release)

- The Start menu account header fills the entire title area, without a border or separator.
- `--ww10-start-account-surface` is computed by `applyGlass()` using the **exact selected glass RGB**, with only opacity adjusted to produce a subtle Mica sublayer.
- The titlebar has `background-image: none` and uses the same `--mica-blur` filter as the main glass; do not add gradients, cool casts, or lighter/darker RGB pigments to that surface.
- Shared tint variables (`--ww-glass-tint-*`, `--control-surface`, `--control-hover`, and taskbar hover/selected surfaces) also retain the selected swatch RGB. Only opacity varies.
- Do not introduce a hardcoded light/dark titlebar color; preserve readable text and the existing Settings control.

- **Start titlebar opacity rule:** the titlebar opacity equals `max(0, main glass opacity − 10 percentage points)` (e.g. 100% → 90%, 80% → 70%). This applies only to the Start account titlebar; keep the rest of the Mica calculations unchanged.

## Taskbar news publisher-origin icons

- In the weather/news spotlight, preserve the shared taskbar widget and its existing slide/fade transition.
- News may show the user-provided Icons8 artwork for USA, UK, or United Nations sources, based on reliable feed country metadata or a recognized publisher domain. Do not infer an article's publisher country from its headline.
- When origin is unknown or an icon cannot load, use the existing Phosphor / inline SVG newspaper fallback. Retain compact and vertical taskbar sizing.

## Desktop appearance > Search flyout

- Desktop appearance lists Taskbar, Context menu, and Search flyout as **three separate cards**.
- Search flyout contains two separate subpages, Search placement and Search results. Search placement remains **To be determined** until its behavior is specified; existing dock-aware Search positioning is unchanged.
- Search results has three mutually exclusive persistent modes: All results (default), Recently opened (most recent eight selected Search actions), and Most used (up to eight selected actions, ranked by selection counts).
- When Search opens with an empty query, its results reflect the chosen mode. If no local usage exists yet, show an informative empty state rather than fictitious history. Typing a query always searches every available action, irrespective of mode.
- History tracks only selected action IDs in local browser storage, not user-entered query text. Selecting an item updates history and frequency counts, and mode selection changes take effect immediately.

## Settings disclosure flyout animation

- All Settings expandable panels and Settings selection popups share one 340ms
  entrance (`ww10-settings-flyout-enter`): soft opacity, slight rise/scale, and
  a gentle top-down reveal. This covers Search placement/results, Taskbar,
  Time, Windows Update, Insider, System specifications, PIN options, Settings
  search suggestions, and native choice lists.
- Reuse `.ww10-settings-reveal` for newly added Settings disclosures rather
  than introducing another animation or detached popover.
- Preserve each panel's existing layout, independent expansion state, keyboard
  semantics, and controls. With reduced-motion enabled the panels appear
  instantly.

## Language display and consistent glass (2610140 refinement)

- The Windows display language selector is an inline Settings disclosure, matching Taskbar and Search rather than a detached choice popup. Use the existing native-select change handler as the authoritative language state so persistence and the localized restart continue working.
- The base glass material is the exact selected RGB at the chosen opacity, with no white/light-colored sheen layer, including for pure black and while HDR wallpaper processing is enabled. Use `--mica-sheen: none` and do not add tinted decorative gradients to glass surfaces.
