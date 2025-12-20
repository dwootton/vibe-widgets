# Vibe Widgets Theming API

## What Theming Does

A theme is a contract between the widget and its visual environment. It answers: how should this widget look and feel in context?

Widgets are embedded artifacts -- they live inside notebooks, dashboards, documents, presentations. A theme ensures the widget does not clash with its surroundings and communicates data clearly within that context.

Concretely, a theme controls:

1. **Ground and figure.** What is the backdrop? What color is text? This determines whether the widget feels like it belongs on a dark IDE, a white page, or a branded dashboard.
2. **Data encoding.** How do we map categories and quantities to color? A theme's palettes determine whether your bar chart is legible, whether groups are distinguishable, whether "high" feels different from "low."
3. **Typography.** What typeface carries labels, titles, tooltips? This shapes whether the widget reads as technical, editorial, playful, corporate.
4. **Interactive affordances.** How do elements respond to hover, focus, click? Transitions, opacity shifts, and focus rings make the widget feel responsive or sluggish, accessible or opaque.

A good theme is invisible -- it lets the data and interaction dominate. A bad theme distracts, confuses, or fatigues.

---

## What a Theme Actually Is

A theme is a prompt -- a rich natural language description that gets injected into widget generation. No schema, no hex codes, just a detailed specification of intent that the widget generator interprets.

When you write:

```python
chart = vw.create(df, "sales over time", theme=dark_ft)
```

The theme's description is woven into the generation prompt, shaping the output.

---

## API

### Creating Themes

```python
# Describe what you want
dark = vw.theme("dark")
ft = vw.theme("financial times style")
warm_dark = vw.theme("dark but with warmer grays and amber accents")
cyber = vw.theme("cyberpunk neon, high contrast")
```

All calls go through the same resolution pipeline. No distinction between lookup and generation from the user's perspective.

### Composition

Themes compose by nesting, with later arguments overriding earlier:

```python
# FT's colors and typography, but dark background treatment
dark_ft = vw.theme(vw.theme("financial times"), vw.theme("dark"))

# Layer multiple
branded = vw.theme(
    vw.theme("dark"),
    vw.theme("minimal"),
    vw.theme("our company blue #2563eb")
)
```

### Using Themes

```python
chart = vw.create(df, "sales over time", theme=dark_ft)

# Or set a session default
vw.config(theme=dark_ft)
```

### Saving

```python
ft.save("ft")  # persists to ~/.vibewidgets/themes/ft.json
```

Saved themes become resolvable by name in future sessions.

### Listing Themes

```python
vw.themes()
```

Output:
```
dark           -- Low-contrast dark theme, easy on eyes for extended use
light          -- Clean light theme with neutral grays
high-contrast  -- Maximum contrast for accessibility
minimal        -- Stripped-down, lets data dominate
ft             -- Financial Times editorial style, salmon and dark ink
```

---

## Resolution Pipeline

When `vw.theme(prompt)` is called:

1. **Embed the prompt** and compare against registered themes (names + descriptions)
2. **High similarity** -> return cached theme directly
3. **Partial match** -> LLM generation with matched theme as context
4. **No match** -> web search (if referencing real brands) + LLM generation

Generated themes are cached by prompt hash within a session. Saved themes persist to `~/.vibewidgets/themes/`.

---

## Design Choices

**Fonts**: LLM generates Google Fonts alternatives when referencing proprietary typefaces.

**Accessibility**: WCAG contrast compliance is preferred. Use `.ensure_accessible()` to auto-fix issues when strict compliance is needed.

**Storage**: Themes saved to `~/.vibewidgets/themes/{name}.json`. Registry index with embeddings stored alongside for semantic matching.

---

## Theme Generation Prompt

This prompt elicits a rich theme description from the user's request:

```
You are generating a theme description for interactive data visualization widgets. These widgets appear in computational notebooks, dashboards, and documents.

Given the user's request, write a detailed theme description that another AI can use to style widgets consistently. Your output should be a rich, specific prompt -- not code or JSON, but precise natural language that leaves no ambiguity about the visual intent.

Cover each of these dimensions. High contrast is required for all themes; ensure text and data marks meet WCAG AA contrast against their backgrounds.

## Environment & Ground

Describe the backdrop. Is this a dark interface or light? Warm or cool? What's the overall feeling -- technical, editorial, playful, corporate, minimal? Describe the background color in evocative but specific terms (not just "dark" but "deep charcoal with a subtle blue undertone" or "warm off-white like aged paper").

Describe secondary surfaces -- cards, containers, nested elements. How do they differentiate from the ground?

## Typography

Describe the typographic personality. Is it sharp and technical? Warm and humanist? Classic and editorial?

Specify a Google Font (or web-safe fallback) for body text and one for monospace/data. Describe the weight, the size feeling (compact? airy?), the overall texture of text on the page.

## Color System

### Accent & Interactive
Describe the primary accent color -- what draws the eye, what signals interactivity. Be specific: not "blue" but "a saturated cobalt" or "muted teal that recedes slightly."

### Semantic Colors
Describe how success, warning, error, and info states should feel. Do they pop aggressively or integrate subtly? What hues?

### Data Encoding
This is critical. Describe:
- **Categorical palette**: For unordered categories. How many colors? What's the hue range? Are they saturated or muted? Do they feel playful or serious? Should they be colorblind-safe?
- **Sequential palette**: For ordered continuous data. What hue? How does it progress from low to high -- light to dark? Muted to saturated?
- **Diverging palette**: For data with a meaningful center. What two hues diverge from the neutral middle?

## Chart Elements

Describe axes and grids. Are axes prominent or receding? What color, what weight? Are there gridlines? If so, are they subtle dotted lines or more structural? Should the chart frame assert itself or disappear?

## Interaction Feel

Describe how interactions should feel. Snappy and immediate? Smooth and relaxed? What happens on hover -- opacity shift? Subtle scale? Color change? How visible should focus rings be for keyboard navigation?

## Component Styling

Describe tooltips: their background, their contrast with content, their border treatment, whether they feel like floating cards or integrated callouts.

Describe default mark opacity for data points -- should overlapping points build up to show density, or should each point be fully opaque?

---

Write the theme as a cohesive description, not a bulleted checklist. It should read like a design specification that captures both the concrete details and the overall gestalt. Someone reading it should be able to visualize the theme and apply it consistently. High contrast is mandatory.

Begin with a one-sentence summary that captures the theme's essence, then elaborate on each dimension.
```

---

## Theme Modification Prompt

When the user's prompt partially matches an existing theme:

```
You are modifying an existing theme based on the user's request.

## Base Theme
{base_theme_description}

## User's Request
"{user_prompt}"

Write a new theme description that:
1. Preserves the base theme's overall character and coherence
2. Applies the user's requested modifications
3. Maintains internal consistency -- if you warm the background, warm the grays and adjust the palette to match
4. Keeps the same level of detail and specificity as the base theme
5. Maintains high contrast (WCAG AA) across text and data marks

Output a complete theme description in the same format, not just the changes.
```

---

## Theme Composition Prompt

When composing multiple themes via nesting:

```
You are combining multiple themes into a coherent whole.

## Base Themes (in order, later overrides earlier)
{theme_descriptions}

Write a new theme description that synthesizes these inputs. Later themes in the list should override earlier ones where they conflict, but the result should feel coherent -- not a mechanical merge but a thoughtful integration. Ensure high contrast (WCAG AA) throughout.

If themes conflict in mood or intent, favor the later theme's character while preserving useful specifics from earlier themes where they do not clash.
```

---

## Built-in Themes

| Name | Description |
|------|-------------|
| `dark` | Low-contrast dark theme, easy on eyes for extended use |
| `light` | Clean light theme with neutral grays |
| `high-contrast` | Maximum contrast for accessibility |
| `minimal` | Stripped-down, lets data dominate |

---

## Theme Library

```python
import vibewidgets as vw

# =============================================================================
# NEWS & DATA JOURNALISM
# =============================================================================

financial_times = vw.theme("""
    A sophisticated, financial editorial theme defined by its iconic 'Bisque' or salmon-pink background (#fff1e5).

    ## Environment & Ground
    The backdrop is the signature soft pink, creating a warm, paper-like reading environment.
    Secondary surfaces (tooltips, cards) use a deep slate or 'oxford blue' to create sharp, authoritative contrast.

    ## Typography
    The typographic personality is traditional yet urgent. Use a crisp, high-contrast Serif like 'Merriweather' or 'Playfair Display'
    for titles to evoke the 'Financier' typeface. For data labels and axes, switch to a clean, geometric Sans-Serif like 'Inter'
    to ensure legibility at small sizes.

    ## Color System
    - **Accent**: A sharp cyan or claret red used sparingly to highlight current values.
    - **Data Encoding**: Use a categorical palette that contrasts well with pink: slate blue, deep teal, and muted terracotta.
      Avoid yellows that get lost on the background.
    - **Semantic**: Positive/Negative values often use a specific 'financial' green and red, slightly desaturated to match the paper tone.

    ## Chart Elements
    Gridlines are horizontal only, thin, and styled in a dotted 'slate-400' tone. The chart frame is invisible;
    the data sits directly on the page. Axes are minimal.

    ## Interaction Feel
    Professional and crisp. Tooltips should snap into place with zero latency, styled as dark slate rectangles with white text.
""")

nyt_upshot = vw.theme("""
    The 'Upshot' data journalism style: minimalist, spacious, and obsessed with clarity.

    ## Environment & Ground
    Stark white background. No noise, no texture. The focus is entirely on the signal.

    ## Typography
    Type is classic and authoritative. Use 'Franklin Gothic' or 'Libre Franklin' for headers--strong, condensed, and assertive.
    Body and data text should be a highly readable serif like 'Georgia' or 'Noto Serif' for that 'newspaper of record' feel.

    ## Color System
    - **Data Encoding**: A distinctive, high-contrast categorical palette utilizing 'Upshot Red' (#aa1228), deep blues, and neutral grays.
    - **Sequential**: Monochromatic scales often use shades of purple or blue.
    - **Accent**: Black is used heavily for emphasis.

    ## Chart Elements
    Extremely thin, precise lines. Axis ticks are often removed in favor of direct labeling on the data points.
    Gridlines are extremely faint gray or removed entirely. The distinctive 'NYT pointer' style for annotations is essential.

    ## Component Styling
    Tooltips are minimalist white cards with a subtle drop shadow and a thin gray border.
""")

economist = vw.theme("""
    The 'Graphic Detail' style: compact, dense, and instantly recognizable by the 'red label'.

    ## Environment & Ground
    A clean white background for the chart area, often capped by a distinctive thick blue-gray header bar containing the title.

    ## Typography
    The personality is witty and concise. Use 'Officina Sans' or a close alternative like 'Fira Sans' or 'Roboto Slab'.
    Text is often slightly condensed to fit more data into small columns.

    ## Color System
    - **Accent**: The signature 'Economist Red' (#E3120B) is the primary interactive color.
    - **Data Encoding**: A recognizable palette of cyan, dark blue, and muted brown.
    - **Sequential**: Distinctive 'blue-to-red' diverging scales for political or economic sentiment.

    ## Chart Elements
    The defining feature is the 'Red Rectangle' signature often found in the top-left or accompanying the title.
    Charts often place the y-axis grid lines *on top* of the bars/area fills to aid precision reading.

    ## Interaction Feel
    Efficient. Hover states should highlight the data point with a thick red stroke.
""")

the_guardian = vw.theme("""
    A vibrant, modern editorial style that blends bold typography with a high-contrast palette.

    ## Environment & Ground
    A very light cool gray or pure white background. It feels airy and open.

    ## Typography
    Headline typography is the star. Use 'Garnett' or a similar distinct, slightly quirky sans-serif (like 'Work Sans' or 'Libre Franklin')
    in a bold weight. It should feel opinionated and contemporary.

    ## Color System
    - **Data Encoding**: A vibrant, almost primary palette: Guardian Red, Egyptian Blue, and a sunny Yellow.
      These colors are saturated and pop against the white ground.
    - **Semantic**: Success/Fail states use these same saturated brand colors rather than standard green/red.

    ## Chart Elements
    Circular elements (bubbles, dots) are common. Lines are thick and confident.
    Layouts often use asymmetric balance.

    ## Component Styling
    Tooltips are sharp-edged and use the signature deep blue background with white text.
""")

bloomberg = vw.theme("""
    A 'Terminal' inspired, high-density aesthetic that screams financial intelligence.

    ## Environment & Ground
    Can be either stark white (print style) or deep charcoal (terminal style). Let's default to the modern 'Bloomberg Graphics'
    web style: White background with very high-contrast black elements.

    ## Typography
    Neo-grotesque and Swiss. Use 'Inter' or 'Helvetica Now'. Titles are bold, black, and tightly kerned.
    Data labels are small, uppercase, and monochromatic.

    ## Color System
    - **Data Encoding**: Often monochromatic or duotone (Black + Neon Blue or Black + Magenta).
      When multiple colors are needed, they are intense, digital-native hues.
    - **Accent**: Electric blue or hot pink.

    ## Chart Elements
    Thick, bold axis lines. Brutalist grid structures. The design feels engineered rather than drawn.

    ## Interaction Feel
    Snappy, technical, and precise. Crosshairs on hover are appropriate.
""")

fivethirtyeight = vw.theme("""
    The 'Fox' style: accessible statistics with a distinct personality.

    ## Environment & Ground
    A very light gray (#f0f0f0) background is the signature. It separates the graphics from the surrounding white page.

    ## Typography
    Use 'Decima Mono' or a similar geometric, slightly condensed typeface like 'Atlas Grotesk' or 'Roboto'.
    Titles are bold and uppercase.

    ## Color System
    - **Data Encoding**: The 'FiveThirtyEight' palette: bright orange, medium blue, and gray.
      These are distinctive and colorblind-safe.
    - **Accent**: A darker gray for text, never pure black.

    ## Chart Elements
    Gridlines are dark gray and clearly visible--charts look like they are sitting on graph paper.
    Use a thick black baseline (zero line).

    ## Component Styling
    Tooltips have a slight opacity and rounded corners, feeling friendly rather than technical.
""")

the_pudding = vw.theme("""
    Modern scrollytelling. Playful, bespoke, and narrative-driven.

    ## Environment & Ground
    Often off-white or cream (#fdfbf7) to evoke a high-quality magazine feel.
    The layout is fluid, treating the chart as a story element rather than a discrete box.

    ## Typography
    Highly eclectic. Often pairs a brutalist serif for titles (like 'Tiempos Headline' or 'Playfair')
    with a clean monospace for data (like 'Pitch' or 'Fira Code').

    ## Color System
    - **Data Encoding**: Uses sophisticated, atypical palettes--pastels mixed with deep inks.
      Gradients are used for aesthetic effect, not just encoding.

    ## Interaction Feel
    Smooth and cinematic. Transitions are slow and eased (duration ~800ms).
    Scrubbing interactions are preferred over simple clicks.
""")

reuters_graphics = vw.theme("""
    Wire-service neutrality met with modern design principles.

    ## Environment & Ground
    Clean white. Unobtrusive. Designed to be embedded anywhere.

    ## Typography
    'Source Sans Pro' or similar open humanist sans-serifs. Highly legible, neutral, and global.

    ## Color System
    - **Data Encoding**: A palette of oranges, grays, and blues.
    - **Accent**: The Reuters Orange (#ff8000) is the primary interactive highlight.

    ## Chart Elements
    Clean, thin lines. Titles are descriptive and left-aligned.
    Source attribution is prominent but styled discreetly in gray.

    ## Component Styling
    No-nonsense tooltips. Just the data, fast.
""")

propublica = vw.theme("""
    Investigative rigor. Serious, high-contrast, and accessible.

    ## Environment & Ground
    White background. Text is often very dark gray (#111) rather than pure black.

    ## Typography
    A pairing of a sturdy Serif (like 'Merriweather') for introductions and a clear Sans (like 'Franklin Gothic') for charts.

    ## Color System
    - **Data Encoding**: High-contrast, colorblind-safe palettes are mandatory.
    - **Semantic**: Dark, serious tones. Avoid frivolous brights.

    ## Chart Elements
    Annotations are heavily used--text explaining specific data points directly on the chart.
    Layouts prioritize the 'stepper' or small multiples format.
""")

our_world_in_data = vw.theme("""
    The gold standard for accessibility and standardization.

    ## Environment & Ground
    White background. Charts are framed with a thin gray border, acting as self-contained cards.

    ## Typography
    'Playfair Display' for titles (giving a historic/academic feel) paired with 'Lato' for all data and labels.

    ## Color System
    - **Data Encoding**: A consistent, recognizable categorical palette: Blue, Red, Green, Yellow--but slightly desaturated to be easy on the eyes.
    - **Sequential**: Distinctive blue gradients.

    ## Chart Elements
    Discrete legends are avoided; direct labeling of lines/areas is preferred.
    A prominent footer always includes 'Source' and 'CC-BY' licensing.

    ## Interaction Feel
    Educational. Tooltips are comprehensive, often showing full sentences describing the data point.
""")

# =============================================================================
# SCIENTIFIC & ACADEMIC
# =============================================================================

nature_journal = vw.theme("""
    Scientific authority. Clean, dense, and print-ready.

    ## Environment & Ground
    Pure white background. Figures are designed to fit strictly within column widths.

    ## Typography
    'Harding' or a similar transitional serif for headers.
    Data is strictly sans-serif ('Arial' or 'Helvetica'), very neutral, allowing the science to speak.

    ## Color System
    - **Data Encoding**: The 'Nature' palette: rich, deep colors (teal, ochre, vermilion) that reproduce well in CMYK print.
    - **Sequential**: Viridis or Magma scales are preferred for heatmaps to ensure perceptual uniformity.

    ## Chart Elements
    Axes usually have ticks on the inside. Plot frames are often full boxes (borders on all 4 sides).
    Error bars are prominent and styled with 'cap' ends.
""")

cell_journal = vw.theme("""
    The 'Graphical Abstract' style. Visual, schematic, and diagrammatic.

    ## Environment & Ground
    White background. Layouts often resemble flowcharts or distinct panels.

    ## Typography
    'Helvetica Neue' or 'Arial'. Bold weights are used for pathway nodes and emphasis.

    ## Color System
    - **Data Encoding**: Bright, distinct colors meant to distinguish biological components.
      Blues for nuclei, Reds for inhibition, Greens for activation.

    ## Chart Elements
    Thick, schematic lines. Arrows are a major design element.
    Charts are often integrated with iconic representations of cells or molecules.
""")

the_lancet = vw.theme("""
    Medical precision. Minimalist and stark.

    ## Environment & Ground
    White.

    ## Typography
    A clean, humanist sans-serif like 'Frutiger' or 'Segoe UI'.
    Titles are understated.

    ## Color System
    - **Accent**: 'Lancet Orange' is the single dominant brand color used for key data lines.
    - **Secondary**: Grays and blacks.

    ## Chart Elements
    Kaplan-Meier survival curves are the archetype. Step-charts with confidence intervals shaded in light gray.
""")

arxiv_latex = vw.theme("""
    The 'Computer Modern' aesthetic. Academic, raw, and mathematical.

    ## Environment & Ground
    White background, but the 'vibe' evokes the texture of a PDF viewer.

    ## Typography
    Strictly 'Latin Modern Roman' (Computer Modern).
    Italicized math variables ($x$, $y$) in axis labels are essential.

    ## Color System
    - **Data Encoding**: Often black and white (dashes vs solid lines) or the standard 'Matplotlib' default colors (Blue, Orange, Green).

    ## Chart Elements
    Boxed axes (ticks on all sides).
    Gridlines are usually absent unless it's a log-log plot.
    Legends are placed inside the plot area in a box with a white background.
""")

# =============================================================================
# GEOGRAPHIC & ENVIRONMENTAL
# =============================================================================

national_geographic = vw.theme("""
    Cartographic excellence. Rich, textured, and photographic.

    ## Environment & Ground
    Can be white, but often uses subtle topographic textures or satellite imagery basemaps.
    The signature yellow border is a brand touchstone.

    ## Typography
    'Verlag' or 'Geograph'. Type is uppercase, tracked out (letter-spaced), and elegant.

    ## Color System
    - **Data Encoding**: Naturalistic palettes--earth tones for land, bathymetric blues for water.
      Data overlays use bright, contrasting hues like yellow or magenta to stand out against the map.

    ## Chart Elements
    Scale bars and north arrows are stylized.
    Line charts are smooth (spline interpolation) to mimic natural curves.
""")

usgs = vw.theme("""
    Federal standard. Utilitarian, accessible, and rugged.

    ## Environment & Ground
    White or light tan.

    ## Typography
    'Univers' or 'Arial'. Highly legible, bureaucratic, and functional.

    ## Color System
    - **Data Encoding**: Standardized geologic map colors.
      Pastels for area fills, strong black lines for boundaries.

    ## Chart Elements
    Heavy use of pattern fills (hatches, dots) to distinguish categories without relying solely on color (accessibility).
    Strict adherence to federal plain language guidelines in tooltips.
""")

noaa_climate = vw.theme("""
    Climate communication. Blue-to-Red diverging scales are central.

    ## Environment & Ground
    Clean white or light blue tint.

    ## Typography
    'Merriweather' for context, 'Source Sans' for data.

    ## Color System
    - **Data Encoding**: The 'Warming Stripes' aesthetic.
      Deep blues transitioning to angry reds.
    - **Sequential**: Precipitation scales (White -> Green -> Blue).

    ## Interaction Feel
    Time-series focused. Scrubbing across years is a primary interaction.
""")

# =============================================================================
# BUSINESS & INSTITUTIONAL
# =============================================================================

mckinsey = vw.theme("""
    Corporate insight. Clean, spacious, and executive-ready.

    ## Environment & Ground
    White background. Charts are often enclosed in a subtle light gray container.

    ## Typography
    'Bower' (Serif) for titles, 'McKinsey Sans' (or 'Arial') for data.
    Titles often take the form of an active sentence (e.g., "Profit grew by 10%...").

    ## Color System
    - **Data Encoding**: 'McKinsey Blue' (Deep Navy) is the primary color.
      Secondary colors are light blues and cool grays.
      Accent is often a teal or bright blue.

    ## Chart Elements
    Waterfall charts are the signature.
    Connectors between bars are thin and gray.
    Axis lines are removed; value labels sit directly on top of bars.
""")

us_census = vw.theme("""
    Demographic authority. Neutral and population-focused.

    ## Environment & Ground
    White.

    ## Typography
    'Roboto' or 'Lato'. Modern, clean, and screen-optimized.

    ## Color System
    - **Data Encoding**: A palette of Blues and Oranges.
    - **Semantic**: Distinct reliance on choropleth map conventions (light-to-dark saturation).

    ## Chart Elements
    Population pyramids and age-distribution charts.
    Bar charts are often horizontal to accommodate long state/county names.
""")

who_health = vw.theme("""
    Global health monitoring. Humanist, accessible, and blue-dominant.

    ## Environment & Ground
    White or very light gray.

    ## Typography
    'Arial' or 'Helvetica'. Neutrality is key.

    ## Color System
    - **Data Encoding**: 'WHO Blue' (UN Blue family).
      Orange is used for warnings/alerts.

    ## Chart Elements
    Donut charts for proportions.
    Simple line charts for epidemiological curves.
    Icons (people, hospitals) are often integrated into the visualization (ISOTYPE style).
""")

# =============================================================================
# EXPORT
# =============================================================================

# Dictionary for easy iteration/import
themes = {
    "financial_times": financial_times,
    "nyt_upshot": nyt_upshot,
    "economist": economist,
    "the_guardian": the_guardian,
    "bloomberg": bloomberg,
    "fivethirtyeight": fivethirtyeight,
    "the_pudding": the_pudding,
    "reuters_graphics": reuters_graphics,
    "propublica": propublica,
    "our_world_in_data": our_world_in_data,
    "nature_journal": nature_journal,
    "cell_journal": cell_journal,
    "the_lancet": the_lancet,
    "arxiv_latex": arxiv_latex,
    "national_geographic": national_geographic,
    "usgs": usgs,
    "noaa_climate": noaa_climate,
    "mckinsey": mckinsey,
    "us_census": us_census,
    "who_health": who_health
}
```
