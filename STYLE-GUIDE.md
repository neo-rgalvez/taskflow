# TaskFlow — Style Guide

> The visual identity and component language for TaskFlow, a project management app built for freelancers who juggle multiple clients and projects.

---

## 1. Brand

### 1.1 Color System

TaskFlow's palette is professional but warm — it should feel like a calm, organized workspace, not a corporate dashboard. Colors are defined as CSS custom properties on `:root`.

#### Primary

The primary color anchors the brand — used for main CTAs, active navigation, links, and key interactive elements.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary-50` | `#EEF2FF` | Selected row backgrounds, light tinted areas |
| `--color-primary-100` | `#E0E7FF` | Hover backgrounds, subtle highlights |
| `--color-primary-200` | `#C7D2FE` | Focus ring color, light badges |
| `--color-primary-300` | `#A5B4FC` | Active borders |
| `--color-primary-400` | `#818CF8` | Hovered buttons, secondary interactive |
| `--color-primary-500` | `#6366F1` | **Main brand color** — primary buttons, links, active nav |
| `--color-primary-600` | `#4F46E5` | Hovered primary buttons |
| `--color-primary-700` | `#4338CA` | Pressed/active primary buttons |
| `--color-primary-800` | `#3730A3` | — |
| `--color-primary-900` | `#312E81` | — |

#### Neutral / Gray

Used for text, borders, backgrounds, and the overall structural chrome of the app.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-gray-50` | `#F9FAFB` | Page background, alternate table rows |
| `--color-gray-100` | `#F3F4F6` | Card backgrounds, sidebar background |
| `--color-gray-200` | `#E5E7EB` | Borders, dividers, disabled input backgrounds |
| `--color-gray-300` | `#D1D5DB` | Input borders (default state) |
| `--color-gray-400` | `#9CA3AF` | Placeholder text, disabled text, icons (inactive) |
| `--color-gray-500` | `#6B7280` | Secondary text, help text, timestamps |
| `--color-gray-600` | `#4B5563` | Body text (secondary) |
| `--color-gray-700` | `#374151` | Body text (primary) |
| `--color-gray-800` | `#1F2937` | Headings |
| `--color-gray-900` | `#111827` | High-emphasis text, page titles |

#### Semantic Colors

Each semantic color has a base (for icons, badges, buttons), a light (for backgrounds), and a dark (for text on light backgrounds).

| Category | Light | Base | Dark | Usage |
|----------|-------|------|------|-------|
| **Success** | `#F0FDF4` | `#22C55E` | `#15803D` | Completed tasks, paid invoices, positive budget status, success toasts |
| **Warning** | `#FFFBEB` | `#F59E0B` | `#B45309` | Budget at 80%, approaching deadlines, overdue warnings |
| **Error** | `#FEF2F2` | `#EF4444` | `#B91C1C` | Validation errors, overdue invoices, failed actions, destructive buttons |
| **Info** | `#EFF6FF` | `#3B82F6` | `#1D4ED8` | Informational toasts, tips, help callouts |

#### Status-Specific Colors

These map directly to TaskFlow's domain statuses and appear in badges, dots, and Kanban column headers.

| Status | Color | Hex | Used for |
|--------|-------|-----|----------|
| Active | Green | `#22C55E` | Active projects |
| On Hold | Amber | `#F59E0B` | On Hold projects, Waiting on Client tasks |
| Completed | Blue | `#3B82F6` | Completed projects, Done tasks |
| Cancelled | Gray | `#9CA3AF` | Cancelled projects |
| Draft | Gray | `#6B7280` | Draft invoices |
| Sent | Blue | `#3B82F6` | Sent invoices |
| Overdue | Red | `#EF4444` | Overdue invoices, overdue tasks |
| Partial | Amber | `#F59E0B` | Partially paid invoices |
| Paid | Green | `#22C55E` | Paid invoices |

#### Task Priority Colors

| Priority | Color | Hex | Indicator style |
|----------|-------|-----|-----------------|
| Urgent | Red | `#EF4444` | Solid left border or filled dot |
| High | Orange | `#F97316` | Solid left border or filled dot |
| Medium | Blue | `#3B82F6` | Solid left border or filled dot |
| Low | Gray | `#9CA3AF` | Solid left border or filled dot |

#### Client Color Palette

Each client is automatically assigned a distinct color from this rotation for calendar events and cross-project views. Colors are chosen to be visually distinguishable and accessible.

```
#6366F1  (Indigo)
#EC4899  (Pink)
#14B8A6  (Teal)
#F97316  (Orange)
#8B5CF6  (Violet)
#06B6D4  (Cyan)
#84CC16  (Lime)
#EF4444  (Red)
#F59E0B  (Amber)
#10B981  (Emerald)
```

### 1.2 Typography

TaskFlow uses a system font stack for maximum performance and native feel. No web fonts to load.

#### Font Stack

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji',
             'Segoe UI Emoji';
--font-mono: ui-monospace, 'SFMono-Regular', 'SF Mono', Menlo,
             Consolas, 'Liberation Mono', monospace;
```

`--font-sans` is used for all UI text. `--font-mono` is used for invoice numbers, time durations, currency amounts, and code-like data.

#### Type Scale

All sizes use `rem` based on a `16px` root. Line heights are unitless multipliers.

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-xs` | `0.75rem` (12px) | 400 | 1.5 | Timestamps, fine print, badge labels |
| `--text-sm` | `0.875rem` (14px) | 400 | 1.5 | Secondary text, help text, table cells, form labels |
| `--text-base` | `1rem` (16px) | 400 | 1.5 | Body text, input values, primary text |
| `--text-lg` | `1.125rem` (18px) | 600 | 1.5 | Card titles, section subheadings |
| `--text-xl` | `1.25rem` (20px) | 600 | 1.4 | Page section headings (h3) |
| `--text-2xl` | `1.5rem` (24px) | 700 | 1.3 | Page titles (h2), modal titles |
| `--text-3xl` | `1.875rem` (30px) | 700 | 1.3 | Main page headings (h1) |
| `--text-4xl` | `2.25rem` (36px) | 700 | 1.2 | Dashboard stat numbers, hero text |

#### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-normal` | 400 | Body text, descriptions, form values |
| `--font-medium` | 500 | Form labels, table headers, nav items, button text |
| `--font-semibold` | 600 | Card titles, section headings, active nav |
| `--font-bold` | 700 | Page headings, stat numbers, prices |

#### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `var(--color-gray-900)` | Page titles, headings |
| `--text-secondary` | `var(--color-gray-700)` | Body text |
| `--text-tertiary` | `var(--color-gray-500)` | Help text, timestamps, placeholders |
| `--text-disabled` | `var(--color-gray-400)` | Disabled inputs, inactive elements |
| `--text-link` | `var(--color-primary-500)` | Clickable links |
| `--text-on-primary` | `#FFFFFF` | Text on primary-colored backgrounds |
| `--text-error` | `var(--color-error-dark)` | Validation error messages |

### 1.3 Spacing System

A consistent 4px base unit applied everywhere. Components use these tokens — never arbitrary pixel values.

| Token | Value | Common Usage |
|-------|-------|--------------|
| `--space-0` | `0` | — |
| `--space-0.5` | `0.125rem` (2px) | Micro adjustments |
| `--space-1` | `0.25rem` (4px) | Tight gaps: icon-to-label, badge padding inline |
| `--space-1.5` | `0.375rem` (6px) | Small pill padding |
| `--space-2` | `0.5rem` (8px) | Compact padding: badge padding, tight list gaps |
| `--space-3` | `0.75rem` (12px) | Input padding (vertical), tight card padding |
| `--space-4` | `1rem` (16px) | Default padding: card padding, form group gap, list item padding |
| `--space-5` | `1.25rem` (20px) | Medium gaps |
| `--space-6` | `1.5rem` (24px) | Section gaps, card padding on large cards |
| `--space-8` | `2rem` (32px) | Page section spacing, modal padding |
| `--space-10` | `2.5rem` (40px) | Large section separation |
| `--space-12` | `3rem` (48px) | Page top/bottom padding |
| `--space-16` | `4rem` (64px) | Major layout separators |

### 1.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `0.25rem` (4px) | Badges, tags, small chips |
| `--radius-md` | `0.375rem` (6px) | Buttons, inputs, dropdowns |
| `--radius-lg` | `0.5rem` (8px) | Cards, modals, panels |
| `--radius-xl` | `0.75rem` (12px) | Large cards, hero sections |
| `--radius-full` | `9999px` | Avatars, status dots, pill badges |

### 1.5 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle lift: inputs, small cards |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | Cards, dropdowns |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Modals, popovers, floating timer bar |
| `--shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | Slide-over panels |

### 1.6 Transitions

All interactive elements use consistent transition timing.

```css
--transition-fast: 150ms ease;    /* Hover states, color changes */
--transition-base: 200ms ease;    /* Most interactions: focus, expand */
--transition-slow: 300ms ease;    /* Slide-overs, modals entering/exiting */
```

---

## 2. Component Patterns

### 2.1 Buttons

Buttons are the primary interactive controls. They come in four variants and three sizes.

#### Variants

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| **Primary** | `--color-primary-500` | White | None | Main CTAs: "Create Project", "Save", "Send Invoice" |
| **Secondary** | White | `--color-gray-700` | `1px solid var(--color-gray-300)` | Secondary actions: "Cancel", "Export PDF", "Filter" |
| **Destructive** | `--color-error-base` | White | None | Dangerous actions: "Delete Project", "Remove Client" |
| **Ghost** | Transparent | `--color-gray-600` | None | Tertiary/inline actions: "Add subtask", "Edit", icon buttons |

#### Sizes

| Size | Height | Padding (h) | Font Size | Icon Size | Usage |
|------|--------|-------------|-----------|-----------|-------|
| **Small** | `32px` | `--space-3` | `--text-sm` | 16px | Table row actions, compact UI, dropdowns |
| **Medium** | `40px` | `--space-4` | `--text-sm` | 18px | Default — most buttons |
| **Large** | `48px` | `--space-6` | `--text-base` | 20px | Landing page CTAs, prominent actions |

#### States

```
Default    → base styles
Hover      → darken background by one shade (e.g., primary-500 → primary-600)
            Secondary: background changes to gray-50
Focus      → 2px offset ring in --color-primary-200 (see Accessibility section)
Active     → darken background by two shades (e.g., primary-500 → primary-700)
Disabled   → opacity: 0.5; cursor: not-allowed; no hover/focus effects
Loading    → text replaced with spinner (14px); button width locked to prevent layout shift;
             pointer-events: none; opacity: 0.8
```

**Icon buttons**: Square aspect ratio at each size (32x32, 40x40, 48x48). Icon centered. Ghost variant by default. Tooltip required for accessibility.

**Button with icon**: Icon placed before label with `--space-2` gap. Icon inherits the button's text color.

### 2.2 Forms

Forms are the backbone of TaskFlow — every client, project, task, time entry, and invoice involves a form. They must be fast to fill, clear about errors, and forgiving of mistakes.

#### Text Inputs

```
┌─ Label ──────────────────────── * (required) ─┐
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  Placeholder text...                     │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  Help text appears here in gray-500            │
└────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| **Label** | `--text-sm`, `--font-medium`, `--color-gray-700`. Positioned above the input with `--space-1.5` gap. |
| **Required indicator** | Red asterisk (`*`) after the label text, colored `--color-error-base`. Screen reader: `aria-required="true"` on the input. |
| **Input field** | Height: `40px`. Padding: `--space-3` vertical, `--space-3` horizontal. Border: `1px solid var(--color-gray-300)`. Radius: `--radius-md`. Background: white. Font: `--text-base`. |
| **Placeholder** | `--color-gray-400`. Use actionable phrasing: "e.g., Acme Corp" not "Enter client name". |
| **Help text** | `--text-sm`, `--color-gray-500`. Below input with `--space-1` gap. |
| **Focus state** | Border: `--color-primary-500`. Ring: `0 0 0 3px var(--color-primary-200)`. |
| **Error state** | Border: `--color-error-base`. Ring: `0 0 0 3px #FEE2E2`. Error message below in `--text-sm`, `--color-error-dark`, with a 16px error icon inline. |
| **Disabled state** | Background: `--color-gray-100`. Text: `--color-gray-400`. Cursor: `not-allowed`. |

#### Textarea

Same styling as text inputs. Minimum height: `120px`. Resizable vertically only (`resize: vertical`).

#### Select / Dropdown

Native `<select>` for simple cases (billing type, priority). Custom dropdown for searchable lists (client picker, project picker). Custom dropdowns follow the same border/focus/error styling as text inputs.

#### Checkbox and Radio

| Element | Style |
|---------|-------|
| **Checkbox** | 18x18px box, `--radius-sm`, border `--color-gray-300`. Checked: `--color-primary-500` fill with white checkmark. |
| **Radio** | 18x18px circle. Selected: `--color-primary-500` outer with white inner dot. |
| **Label** | `--text-base`, `--color-gray-700`. Positioned to the right with `--space-2` gap. Clickable. |

#### Toggle Switch

Used for on/off settings (billable toggle, notification preferences). Track: `36px x 20px`, rounded pill. Knob: `16px` circle. Off: gray-300 track, white knob. On: primary-500 track, white knob. Transition: `--transition-fast`.

#### Form Layout

- Stack form fields vertically with `--space-5` gap between groups.
- Group related fields side-by-side in a 2-column grid on desktop when they belong together (e.g., "First name / Last name", "Start date / End date").
- Action buttons (Save / Cancel) go at the bottom-right of the form, separated by `--space-8` from the last field and `--space-3` between buttons. Primary on the right, secondary on the left.

#### Inline Validation

- Validate on blur (not on every keystroke — freelancers type fast).
- Show the error message immediately when the field loses focus and is invalid.
- Clear the error as soon as the user starts typing a correction.
- On form submission, scroll to and focus the first invalid field.

### 2.3 Cards

Cards are the primary container for grouped information. Three specialized card types.

#### Base Card

```
┌─────────────────────────────────────────────┐
│                                             │   Border: 1px solid --color-gray-200
│  Content                                    │   Radius: --radius-lg
│                                             │   Background: white
│                                             │   Shadow: --shadow-sm
│                                             │   Padding: --space-5
└─────────────────────────────────────────────┘
```

Hover (if clickable): `--shadow-md`, border color `--color-gray-300`, `--transition-fast`. Cursor: pointer.

#### Stat Card (Dashboard)

Used on the Dashboard for "Active Projects", "Hours This Week", "Outstanding Invoices", "Upcoming Deadlines".

```
┌─────────────────────────────────────────────┐
│  Hours This Week                   [icon]   │   Label: --text-sm, --color-gray-500
│                                             │
│  32.5 hrs                                   │   Value: --text-4xl, --font-bold, --color-gray-900
│                                             │          Use --font-mono for numbers
│  ▲ 12% vs. last week                       │   Trend: --text-sm; green if up, red if down
└─────────────────────────────────────────────┘
```

- Fixed height on desktop for grid alignment: `140px`.
- Icon in top-right corner: `24px`, `--color-gray-400`.
- Clickable — navigates to the relevant detail view.

#### Project Card

Used on the Client Detail page and Project List when displayed as cards.

```
┌─────────────────────────────────────────────┐
│  ● Active            Due: Mar 15, 2026      │   Status dot + label | Deadline
│                                             │
│  Website Redesign                           │   Title: --text-lg, --font-semibold
│  Acme Corp                                  │   Client: --text-sm, --color-gray-500
│                                             │
│  ████████████░░░░░  65%                     │   Budget progress bar
│  26 / 40 hrs                                │   Budget detail: --text-xs, --color-gray-500
│                                             │
│  12 tasks   ·   3 overdue                   │   Footer metadata
└─────────────────────────────────────────────┘
```

- Status dot: `8px` circle using status color, placed before the status label.
- Budget progress bar: `4px` height, `--radius-full`. Track: `--color-gray-200`. Fill: `--color-primary-500` when under 80%, `--color-warning-base` at 80-99%, `--color-error-base` at 100%+.
- If deadline is past due: deadline text colored `--color-error-base` with bold weight.

#### Task Card (Kanban Board)

Used on the Project Board view. Draggable.

```
┌─────────────────────────────────────────────┐
│ ┃ Design homepage mockup                    │   Left border: 3px, priority color
│ ┃                                           │
│ ┃ ☐ 2/5 subtasks   📎 3   🕐 2.5h          │   Metadata row: --text-xs, --color-gray-500
│ ┃                                           │
│ ┃ Mar 10              !!! High              │   Due date | Priority badge
└─────────────────────────────────────────────┘
```

- Left border: `3px solid` in the task's priority color.
- Title: `--text-sm`, `--font-medium`, `--color-gray-800`. Truncate with ellipsis at 2 lines.
- Metadata icons: `14px`, `--color-gray-400`.
- While dragging: `--shadow-lg`, slight rotation (`transform: rotate(2deg)`), `opacity: 0.9`.
- Drop target: dashed `2px` border in `--color-primary-300`, background `--color-primary-50`.

### 2.4 Tables

Used for Time Entries, Invoice List, Cross-Project Task List, Client List (alternate view).

#### Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  [Search field]                    [Filter] [Sort]    [+ New]   │   Toolbar row
├──────────────────────────────────────────────────────────────────┤
│  Name ▲        Client      Status       Due Date      Actions   │   Header row
├──────────────────────────────────────────────────────────────────┤
│  Task Alpha    Acme Corp   ● Active     Mar 10        ⋯         │   Data row
│  Task Beta     Widget Co   ● Review     Mar 12        ⋯         │   Alternate row
│  Task Gamma    Acme Corp   ● Done       Mar 8         ⋯         │   Data row
├──────────────────────────────────────────────────────────────────┤
│  ◀  1  2  3  …  8  ▶                    Showing 1-20 of 156    │   Pagination
└──────────────────────────────────────────────────────────────────┘
```

#### Styling

| Element | Style |
|---------|-------|
| **Toolbar** | Padding: `--space-4`. Flex layout, space-between. Search input on left, action buttons on right. |
| **Header row** | Background: `--color-gray-50`. Text: `--text-xs`, `--font-medium`, uppercase, `--color-gray-500`, `letter-spacing: 0.05em`. Padding: `--space-3` vertical. Sticky on scroll. |
| **Sortable column** | Hover: `--color-gray-700`. Active sort shows arrow icon (▲/▼). Cursor: pointer. |
| **Data row** | Padding: `--space-3` vertical. Border-bottom: `1px solid var(--color-gray-100)`. |
| **Row hover** | Background: `--color-gray-50`. |
| **Selected row** | Background: `--color-primary-50`. Left border: `2px solid var(--color-primary-500)`. |
| **Actions column** | Right-aligned. Overflow menu (`⋯`) that opens a dropdown with Edit, Delete, etc. |

#### Search

- Search input in the toolbar with a magnifying glass icon prefix.
- Debounced at `300ms` — filters the table as the user types.
- Highlight matching text in results with `--color-warning-light` background.

#### Filters

- Filter button opens a dropdown panel with filter options relevant to the table (status checkboxes, client dropdown, date range picker).
- Active filters shown as removable pills/chips below the toolbar.
- Chip: `--radius-full`, `--color-primary-50` background, `--color-primary-700` text, `16px` x icon on right.

#### Pagination

- Page numbers with Previous/Next arrows.
- Current page: `--color-primary-500` background, white text, `--radius-md`.
- Other pages: ghost style, hover `--color-gray-100`.
- "Showing X-Y of Z" counter right-aligned, `--text-sm`, `--color-gray-500`.
- Default page size: 20 rows. Optionally allow 20 / 50 / 100.

#### Empty State (Table)

When a table has no data (no filters active), show the table's empty state (see section 2.9).

When filters produce no results:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    No results match your filters                 │
│                                                                  │
│             Try adjusting your search or filter criteria          │
│                                                                  │
│                      [Clear All Filters]                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.5 Modals and Slide-Over Panels

TaskFlow uses two overlay patterns depending on context.

#### Modals

For confirmations, short forms, and focused decisions (delete confirmation, record payment, quick-add task).

```
┌────────────────────────── Backdrop (black, 50% opacity) ─────────────────────┐
│                                                                               │
│         ┌─────────────────────────────────────────────┐                       │
│         │  ✕                                          │  Max width: 480px     │
│         │                                             │  (sm) or 640px (md)   │
│         │  Delete this project?                       │                       │
│         │                                             │  Radius: --radius-lg  │
│         │  This will permanently remove "Website      │  Shadow: --shadow-xl  │
│         │  Redesign" and all its tasks. Time          │  Padding: --space-8   │
│         │  entries will be preserved.                  │                       │
│         │                                             │                       │
│         │              [Cancel]  [Delete Project]     │                       │
│         └─────────────────────────────────────────────┘                       │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| **Backdrop** | `background: rgba(0, 0, 0, 0.5)`. Clicking it closes the modal (unless destructive confirmation). |
| **Panel** | White background, `--radius-lg`, `--shadow-xl`, centered vertically and horizontally. |
| **Close button (✕)** | Top-right, `32px` ghost button, `--color-gray-400`, hover `--color-gray-600`. |
| **Title** | `--text-xl`, `--font-semibold`. |
| **Body** | `--text-base`, `--color-gray-600`. |
| **Actions** | Bottom-right, same convention as form buttons. Destructive modals: destructive button on right, secondary cancel on left. |
| **Animation** | Backdrop fades in (`--transition-slow`). Panel scales from 95% to 100% and fades in. |

#### Slide-Over Panels

For detailed views that keep the parent context visible — Task Detail, Invoice Detail preview, Edit forms for records accessed from a table.

```
┌─── Page content (dimmed) ────────────────────────┬──────────────────────┐
│                                                   │  ✕  Task Detail      │
│                                                   │                      │
│   (clickable to close)                            │  [Content scrolls    │
│                                                   │   independently]     │
│                                                   │                      │
│                                                   │                      │
│                                                   │                      │
│                                                   │                      │
│                                                   │                      │
│                                                   │  ─────────────────── │
│                                                   │  [Cancel]  [Save]    │
└───────────────────────────────────────────────────┴──────────────────────┘
```

| Element | Style |
|---------|-------|
| **Width** | `480px` (default), `640px` (wide, for invoice preview). Never more than `50vw` on desktop. |
| **Position** | Fixed to the right edge of the viewport. Full viewport height. |
| **Shadow** | `--shadow-xl` on the left side. |
| **Header** | Sticky top. Close button on left, title centered or left-aligned. Border-bottom: `1px solid var(--color-gray-200)`. |
| **Body** | Scrollable, padded `--space-6`. |
| **Footer** | Sticky bottom. Action buttons. Border-top: `1px solid var(--color-gray-200)`. Padded `--space-4`. |
| **Animation** | Slides in from the right (`transform: translateX(100%) → translateX(0)`), `--transition-slow`. |
| **Backdrop** | Same as modal. Clicking it closes the panel. |

### 2.6 Navigation

#### Sidebar (Desktop)

The primary navigation. Fixed on the left side.

```
┌──────────────────┐
│  ◆ TaskFlow      │   Logo + wordmark: --text-lg, --font-bold
│                  │
│  ▶ Dashboard     │   Nav item: --text-sm, --font-medium
│    Today         │   Active: --color-primary-50 bg, --color-primary-700 text
│    Clients       │   Hover: --color-gray-100 bg
│    Projects      │   Icon: 20px, --space-3 gap to label
│    Tasks         │
│    Time          │
│    Invoices      │
│    Calendar      │
│                  │
│  ──────────────  │   Divider: --color-gray-200
│                  │
│    Settings      │
│    Search        │
│                  │
│  ──────────────  │
│  ┌────────────┐  │
│  │ ▶ 01:23:45 │  │   Active timer mini-display (if running)
│  │ Task name  │  │   --color-primary-50 bg, pulsing dot
│  └────────────┘  │
│                  │
│  Sarah F.     ⚙  │   User avatar/initials + name, settings gear
└──────────────────┘
```

| Property | Value |
|----------|-------|
| Width | `240px` (expanded), `64px` (collapsed — icons only) |
| Background | White |
| Border | Right: `1px solid var(--color-gray-200)` |
| Collapse trigger | User toggle or automatic at `< 1024px` |

#### Mobile Bottom Navigation

On mobile (`< 768px`), the sidebar is replaced by a bottom tab bar.

```
┌────────────────────────────────────────────────┐
│  [🏠]      [📋]      [⏱]      [💰]     [⋯]   │
│  Home     Tasks    Timer   Invoices   More     │
└────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | `56px` + safe area inset bottom |
| Background | White |
| Border | Top: `1px solid var(--color-gray-200)` |
| Active tab | `--color-primary-500` icon and label |
| Inactive tab | `--color-gray-400` icon, `--color-gray-500` label |
| Label | `--text-xs`, `--font-medium` |

- "More" tab opens a full-screen menu with remaining nav items (Clients, Projects, Calendar, Settings, Search).
- If a timer is running, the Timer tab shows a pulsing dot indicator.

#### Breadcrumbs

Shown on detail pages to maintain context. Positioned above the page title.

```
Clients  /  Acme Corp  /  Website Redesign  /  Tasks
```

| Element | Style |
|---------|-------|
| Separator | `/` in `--color-gray-300`, `--space-2` horizontal padding |
| Ancestor links | `--text-sm`, `--color-gray-500`, hover `--color-primary-500`, underline on hover |
| Current page | `--text-sm`, `--color-gray-800`, `--font-medium`, not a link |

On mobile: collapse to show only the immediate parent as a back link: `← Website Redesign`.

### 2.7 Toast Notifications

Brief, non-blocking messages that confirm actions or report errors. Appear in the top-right corner of the viewport, stacked vertically with `--space-3` gap.

```
┌──────────────────────────────────────────────┐
│  ✓  Invoice #INV-042 sent to client          │   ✕
└──────────────────────────────────────────────┘
```

#### Variants

| Variant | Icon | Left Border Color | Icon Color |
|---------|------|-------------------|------------|
| **Success** | Checkmark circle | `--color-success-base` | `--color-success-base` |
| **Error** | X circle | `--color-error-base` | `--color-error-base` |
| **Info** | Info circle | `--color-info-base` | `--color-info-base` |
| **Warning** | Alert triangle | `--color-warning-base` | `--color-warning-base` |

#### Behavior

| Property | Value |
|----------|-------|
| Width | `360px` max, responsive down to viewport edge minus `--space-4` |
| Background | White |
| Border | `1px solid var(--color-gray-200)`, plus `4px` left border in variant color |
| Shadow | `--shadow-lg` |
| Radius | `--radius-lg` |
| Padding | `--space-4` |
| Title | `--text-sm`, `--font-semibold`, `--color-gray-900` |
| Message | `--text-sm`, `--color-gray-600` |
| Auto-dismiss | Success and Info: `5s`. Warning: `8s`. Error: manual dismiss only. |
| Animation | Slide in from right + fade in. Slide out to right + fade out on dismiss. |
| Close button | `✕` on the right, ghost style. |
| Stacking | Maximum 3 visible. Oldest dismissed first when a 4th arrives. |
| Action link | Optional. `--text-sm`, `--color-primary-500`, underline. E.g., "Undo" or "View Invoice". |

### 2.8 Loading States

#### Skeleton Screens

The preferred loading pattern. Show the layout structure with animated placeholder blocks before real data arrives.

```
┌─────────────────────────────────────────────┐
│  ████████░░░░░                              │   Title skeleton: 40% width, 20px height
│                                             │
│  ██████████████████░░░░░░░░░░░              │   Text skeleton: 70% width, 14px height
│  ████████████░░░░░░░░░░░░░░░░               │   Text skeleton: 50% width, 14px height
│                                             │
│  ████  ████████  ████                       │   Metadata row
└─────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Shape color | `--color-gray-200` |
| Animation | Shimmer pulse — a gradient highlight sweeping left to right, `1.5s` duration, infinite loop |
| Border radius | Match the element being replaced (text → `--radius-sm`, card → `--radius-lg`, avatar → `--radius-full`) |
| Layout | Must match the actual content layout exactly so there is zero layout shift when data loads |

**Where to use**: Dashboard stat cards, project list, task board columns, invoice list, time entries table, client list.

#### Spinners

Used for in-place loading where skeleton screens don't make sense: button loading state, form submission, timer starting.

| Size | Diameter | Border Width | Usage |
|------|----------|-------------|-------|
| Small | `16px` | `2px` | Inline, inside buttons |
| Medium | `24px` | `2.5px` | Section loading |
| Large | `40px` | `3px` | Full-page loading (rare) |

Style: Circle border in `--color-gray-200`, top-arc in `--color-primary-500`, spinning clockwise, `0.75s` per rotation.

#### Progress Indicators

For actions with known duration (file upload, PDF export):

- Use a horizontal progress bar: `4px` height, `--radius-full`, track `--color-gray-200`, fill `--color-primary-500`.
- Show percentage text next to it in `--text-sm`.

### 2.9 Empty States

Shown when a list or view has no data yet. Each empty state has an illustration area, a headline, a description, and a primary CTA.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         [ illustration ]                        │
│                                                                 │
│                      No projects yet                            │
│                                                                 │
│         Create your first project to start tracking             │
│         tasks, time, and budgets for a client.                  │
│                                                                 │
│                    [+ Create Project]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| **Illustration** | Simple, single-color SVG line illustration in `--color-gray-300`, `120px` max height. Depicts the concept (e.g., empty folder for projects, clock for time entries, document for invoices). |
| **Headline** | `--text-lg`, `--font-semibold`, `--color-gray-800`. |
| **Description** | `--text-sm`, `--color-gray-500`, max-width `360px`, centered. |
| **CTA** | Primary button (medium size). |
| **Alignment** | All centered vertically and horizontally within the content area. |

#### Specific Empty States

| View | Headline | Description | CTA |
|------|----------|-------------|-----|
| Dashboard (new user) | Welcome to TaskFlow | Add your first client to get started. You'll be tracking time and sending invoices in no time. | + Add Your First Client |
| Client List | No clients yet | Add a client to organize your projects, track time, and generate invoices. | + Add Client |
| Project List | No projects yet | Create your first project to start tracking tasks, time, and budgets. | + Create Project |
| Task Board | No tasks in this project | Break your work into tasks so nothing falls through the cracks. | + Add Task |
| Time Entries | No time tracked yet | Start a timer on any task or log time manually. Your billable hours show up here. | + Log Time |
| Invoice List | No invoices yet | When you're ready to bill a client, create an invoice from your tracked time or milestones. | + Create Invoice |
| Today View | Nothing due today | You're all caught up! Enjoy the breathing room or get ahead on upcoming work. | _(no CTA — this is a positive state)_ |
| Calendar | No upcoming deadlines | Add due dates to your tasks and projects to see them on the calendar. | Go to Projects |

### 2.10 Error States

When something goes wrong beyond validation (network failure, server error, unexpected state).

#### Full Page Error

For situations where the entire page cannot render (500 error, critical data fetch failure).

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     [ warning illustration ]                    │
│                                                                 │
│                   Something went wrong                          │
│                                                                 │
│          We couldn't load this page. This is on us,             │
│          not you. Please try again.                             │
│                                                                 │
│                      [Try Again]                                │
│                                                                 │
│                  or  Return to Dashboard                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| **Illustration** | Simple warning/error SVG, `--color-gray-300` with `--color-error-base` accent, `120px` max height. |
| **Headline** | `--text-xl`, `--font-semibold`, `--color-gray-800`. |
| **Description** | `--text-base`, `--color-gray-500`, max-width `420px`, centered. |
| **Primary CTA** | Primary button: "Try Again" — reloads the failed request. |
| **Secondary link** | Text link: "Return to Dashboard" — navigates to `/dashboard`. |

#### Inline/Section Error

When one section of a page fails but the rest is fine (e.g., dashboard widget fails to load).

```
┌─────────────────────────────────────────────┐
│  ⚠  Couldn't load recent activity          │
│                                             │
│     [Retry]                                 │
└─────────────────────────────────────────────┘
```

- Same card container as the content it replaces.
- Warning icon (`⚠`) in `--color-warning-base`.
- Message: `--text-sm`, `--color-gray-600`.
- Retry button: small secondary button.

#### Offline Banner

Persistent banner across the top of the app when the network is unavailable.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ⚡  You're offline. Changes will sync when you reconnect.              │
└──────────────────────────────────────────────────────────────────────────┘
```

- Background: `--color-warning-light`. Border-bottom: `1px solid var(--color-warning-base)`.
- Text: `--text-sm`, `--color-warning-dark`.
- Pushes page content down (not overlay).
- Auto-dismisses when connection is restored, with a brief success toast: "You're back online."

---

## 3. Responsive Behavior

TaskFlow is designed mobile-first in code but desktop-first in experience — freelancers primarily work on laptops but frequently check tasks and log time from phones.

### 3.1 Breakpoints

| Name | Width | Target |
|------|-------|--------|
| `sm` | `≥ 640px` | Large phones (landscape) |
| `md` | `≥ 768px` | Tablets (portrait) |
| `lg` | `≥ 1024px` | Small laptops, tablets (landscape) |
| `xl` | `≥ 1280px` | Desktop |
| `2xl` | `≥ 1536px` | Large desktop |

### 3.2 Layout Strategy by Breakpoint

#### Desktop (`≥ 1024px`)

```
┌────────────┬────────────────────────────────────────────────────────────────┐
│            │                                                                │
│  Sidebar   │  Main Content Area                                            │
│  (240px)   │  (fluid, max-width 1200px, centered)                          │
│            │                                                                │
│  Fixed     │  ┌─── Page Header ──────────────────────────────────────────┐  │
│  position  │  │  Breadcrumbs                                             │  │
│            │  │  Page Title                        [Primary Action]      │  │
│            │  └──────────────────────────────────────────────────────────┘  │
│            │                                                                │
│            │  ┌─── Content ─────────────────────────────────────────────┐  │
│            │  │                                                         │  │
│            │  │  (grid, table, cards, board — page specific)            │  │
│            │  │                                                         │  │
│            │  └─────────────────────────────────────────────────────────┘  │
└────────────┴────────────────────────────────────────────────────────────────┘
```

- Sidebar: visible, expanded (240px).
- Dashboard stat cards: 4-column grid.
- Tables: all columns visible.
- Kanban board: all 5 columns visible, horizontally scrollable if needed.
- Slide-over panels: 480px width, page content visible behind backdrop.

#### Tablet (`768px – 1023px`)

- Sidebar: collapsed to icon-only (64px) or hidden behind hamburger menu.
- Dashboard stat cards: 2-column grid.
- Tables: hide lowest-priority columns (use a "..." overflow menu per row for actions).
- Kanban board: show 3 columns at a time, horizontally swipeable.
- Slide-over panels: full width of viewport.
- Forms: 2-column layouts collapse to single column.

#### Mobile (`< 768px`)

- Sidebar: hidden. Replaced by bottom tab bar (56px).
- Page navigation: hamburger menu (top-left) opens full-screen nav overlay.
- Dashboard stat cards: single column, stacked.
- Tables: transform into stacked card lists. Each row becomes a card.

```
  Desktop table row:
  │ Task Name │ Client │ Status │ Due │ Actions │

  Mobile card:
  ┌────────────────────────────────┐
  │  Task Name                     │
  │  Client Name  ·  ● Status     │
  │  Due: Mar 10, 2026      [⋯]   │
  └────────────────────────────────┘
```

- Kanban board: single column visible at a time. Swipe left/right or use column tab selector at top.
- Slide-over panels: full-screen sheets that slide up from the bottom.
- Modals: full-screen on small phones (`< 480px`), centered small modal on larger phones.
- Breadcrumbs: collapse to back arrow + parent name only.
- Page titles: reduce from `--text-3xl` to `--text-2xl`.
- Padding: reduce page padding from `--space-8` to `--space-4`.

### 3.3 Page-Specific Responsive Behavior

| Page | Desktop | Tablet | Mobile |
|------|---------|--------|--------|
| **Dashboard** | 4-col stat grid + 2-col layout (deadlines left, activity right) | 2-col stat grid + single-col layout | Single-col stat stack + single-col layout |
| **Client List** | Table view with all columns | Table with fewer columns | Card list |
| **Project Board** | 5 Kanban columns side by side | 3 visible columns, scroll | Single column with tab selector |
| **Task List** | Full table with sort/filter toolbar | Table with hidden columns | Card list with filter sheet |
| **Time Entries** | Full table grouped by day | Table with condensed columns | Card list grouped by day |
| **Invoice List** | Full table | Table with fewer columns | Card list |
| **Invoice Detail** | Full layout with line items table | Full layout, narrower | Stacked layout, line items as cards |
| **Calendar** | Monthly grid view | Monthly grid (compact cells) | Week view default, swipeable |
| **Settings** | Two-column: nav sidebar + content | Two-column (narrower) | Stacked: nav as tabs at top, content below |

### 3.4 Touch Considerations

- Touch targets: minimum `44px x 44px` (per WCAG).
- Drag-and-drop (Kanban): supported on touch with long-press to initiate (300ms hold). Provide haptic feedback if available. Also provide a "Move to..." context menu as an alternative.
- Swipe gestures: used for Kanban column navigation on mobile, dismissing toasts, and navigating between calendar weeks.
- Hover states: not relied upon for critical information. Any tooltip content must be accessible via tap (open on tap, close on second tap or tap outside).

### 3.5 Active Timer Bar (Responsive)

The global timer bar adapts to screen size:

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Shown at the bottom of the sidebar. Shows task name, project, and elapsed time. Stop/Discard buttons. |
| Tablet | Slim bar at the top of the content area, below the header. Compact layout. |
| Mobile | Floating pill at the bottom of the screen, above the tab bar. Shows elapsed time. Tap to expand with controls. |

---

## 4. Accessibility

TaskFlow must be usable by everyone. These are the baseline requirements, not aspirational goals.

### 4.1 Color Contrast

| Requirement | Standard | Minimum Ratio |
|-------------|----------|---------------|
| Normal text (`< 18px`) | WCAG 2.1 AA | 4.5:1 against background |
| Large text (`≥ 18px bold` or `≥ 24px`) | WCAG 2.1 AA | 3:1 against background |
| UI components (borders, icons) | WCAG 2.1 AA | 3:1 against adjacent color |
| Non-text contrast (buttons, inputs) | WCAG 2.1 AA | 3:1 against background |

**Rules**:

- Never use color alone to convey meaning. Status dots always have a text label beside them. Priority indicators use both color and a label. Budget bars show a percentage number alongside the colored fill.
- Error states use red color AND an error icon AND a text message.
- The "billable" toggle uses color AND the word "Billable" / "Non-billable".

### 4.2 Focus Management

#### Focus Rings

Every interactive element must have a visible focus indicator.

```css
/* Default focus ring */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* For elements on dark/colored backgrounds */
.focus-ring-light:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}
```

- Use `:focus-visible` (not `:focus`) to show rings only for keyboard navigation, not mouse clicks.
- Focus ring color: `--color-primary-500` (indigo) on light backgrounds, white on dark/colored backgrounds.
- Outline-offset: `2px` to prevent the ring from overlapping the element.
- Never set `outline: none` without providing an equivalent visible focus indicator.

#### Focus Trapping

- Modals and slide-over panels trap focus within themselves. Tab cycles through interactive elements inside the panel and does not escape to the page behind.
- When a modal opens, focus moves to the first focusable element inside (or the close button).
- When a modal closes, focus returns to the element that triggered it.
- Escape key closes modals and slide-overs.

#### Focus Order

- Focus order follows the visual layout: left-to-right, top-to-bottom.
- Skip-to-content link as the first focusable element on every page: visually hidden until focused, then appears at the top.
- Sidebar nav is before main content in focus order.
- After an action (task created, invoice saved), move focus to the newly created item or back to a logical position — never leave focus stranded.

### 4.3 Keyboard Navigation

Every action achievable by mouse must be achievable by keyboard.

| Area | Keyboard Support |
|------|-----------------|
| **Navigation** | Tab through sidebar items. Enter/Space to activate. Arrow keys to move between nav items. |
| **Kanban board** | Arrow keys to move between cards. Enter to open task detail. Ctrl+Arrow to move a card to the adjacent column. Space to pick up a card, arrows to reposition, Space to drop, Escape to cancel. |
| **Tables** | Tab to reach the table. Arrow keys to navigate cells. Enter to activate a row action. Space to select/deselect a row. |
| **Modals** | Tab cycles through controls. Enter on primary action. Escape to close. |
| **Dropdowns** | Arrow keys to navigate options. Enter/Space to select. Escape to close. Type-ahead to jump to matching option. |
| **Forms** | Tab between fields. Enter to submit (when focus is on submit button or last field in simple forms). Escape to cancel/close (in modal forms). |
| **Toasts** | Focusable via Tab. Action links activatable via Enter. Escape to dismiss. |
| **Calendar** | Arrow keys to navigate days. Enter to select a date. Page Up/Down for month navigation. |
| **Timer** | Global keyboard shortcut: `Ctrl+Shift+T` (or `Cmd+Shift+T` on Mac) to start/stop the timer on the currently viewed task. |

### 4.4 Screen Reader Considerations

#### Semantic HTML

- Use proper heading hierarchy (`h1` → `h2` → `h3`). Each page has exactly one `h1`.
- Use `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>` landmark elements.
- Use `<button>` for actions, `<a>` for navigation. Never put click handlers on `<div>` or `<span>`.
- Tables use `<th scope="col">` / `<th scope="row">` appropriately.

#### ARIA Usage

| Pattern | ARIA Implementation |
|---------|-------------------|
| **Status badges** | `role="status"`, `aria-label="Project status: Active"` |
| **Progress bars** | `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Budget usage: 65%"` |
| **Kanban columns** | Each column is `role="list"` with `aria-label="To Do — 5 tasks"`. Cards are `role="listitem"`. |
| **Modals** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the title element. |
| **Slide-overs** | Same as modals. `role="dialog"`, `aria-modal="true"`. |
| **Toasts** | Container is `role="log"`, `aria-live="polite"`. Error toasts use `aria-live="assertive"`. |
| **Icon-only buttons** | `aria-label` describing the action: `aria-label="Delete task"`, `aria-label="Start timer"`. |
| **Sortable columns** | `aria-sort="ascending"` / `"descending"` / `"none"` on `<th>`. |
| **Drag-and-drop** | Announce via `aria-live` region: "Task picked up. Use arrow keys to move. Currently in column In Progress, position 3 of 5." |
| **Active timer** | `aria-live="off"` on the timer display (to prevent reading every second). Announce state changes: "Timer started for Design homepage mockup." |
| **Form errors** | `aria-invalid="true"` on the input, `aria-describedby` linking to the error message element. Error message has `role="alert"`. |
| **Loading states** | `aria-busy="true"` on the loading container. `aria-label="Loading projects"`. |
| **Empty states** | Treated as informational content, no special ARIA needed — the heading and description convey the state. |

#### Announcements

Use an `aria-live` region (visually hidden) for dynamic announcements:

- "Task moved to In Progress column"
- "Timer started — Design homepage mockup"
- "Timer stopped — 1 hour 23 minutes logged"
- "Invoice #INV-042 sent successfully"
- "3 tasks match your filter"
- "Payment of $500.00 recorded"

### 4.5 Reduced Motion

Respect `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- Skeleton shimmer: replaced with a static gray block.
- Slide-over panels: appear instantly instead of sliding.
- Toasts: appear instantly instead of sliding in.
- Kanban drag: no rotation transform while dragging.
- Timer spinning icon: replaced with a static icon.

---

*This document is the visual and interaction reference for TaskFlow. It should be used alongside the [Product Definition](./PRODUCT-DEFINITION.md) and [Application Plan](./APPLICATION-PLAN.md) during implementation. Update it as design decisions evolve.*
