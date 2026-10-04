# Design

## Information hierarchy
1. Header explains that data stays in this browser.
2. Creation form requests page name and production URL.
3. Filter buttons show all, pending, and ready release groups.
4. Each release card leads with its name, linked URL, readiness badge, completed count, and percentage.
5. Fixed checklist follows, ending with a clearly destructive delete button.

## Interaction
- Empty required fields show Korean inline validation.
- Checkbox labels have generous click targets.
- Filter state is visually and semantically selected.
- Delete asks for confirmation.

## Responsive behavior
- Wide layouts use a two-column top area and multi-column cards where space permits.
- At narrow widths controls stack and cards remain single-column.

## Accessibility
- Use labels for all form controls and native checkboxes/buttons.
- Make progress available as text and a `progress` element.
- Readiness is represented with words as well as color.
- Maintain visible keyboard focus and sufficient contrast.
