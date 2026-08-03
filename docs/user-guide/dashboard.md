# Dashboard

The Dashboard is the default landing page for most users. It provides a combined, organization-wide view of personnel status, upcoming events, and announcements.

## Page Layout

### Top Widgets

- **Mini Calendar** (left) — A compact month grid showing the current date highlighted. Click any date to navigate the agenda view to that day.
- **Announcements Panel** (right) — Displays events marked as "InfoAll" (company-wide announcements). Cards show the event title and details using the configured Announcements templates.
- **Collapse Widgets** — Use the **"Hide Cal"** button to collapse the top widgets and maximize the agenda view. Click **"Show Cal"** to expand again.

### Main Content

Toggle between two views:

#### Agenda View
A chronological, searchable list of all events for the selected date range.

- **Search Bar** — Filter entries by name, event type, department, or any keyword.
- **Department Dropdown** — Filter to show only specific departments.
- **Date Selector** — Navigate forward/backward by day, or click the **"Today"** button to jump to the current date.
- **Event Cards** — Each card shows the event title and detail text (from configured Agenda templates). Click a card to expand for full details: name, department, type, location, attendees, remarks.
- **Expand All / Collapse All** — Opens or closes all event cards at once.

#### Month View
A full calendar grid showing the entire month.

- **Day Cells** — Each day shows colored dots indicating events on that date. Color legend:
  - Multiple event types are color-coded per admin configuration.
- **Click a Day** — Switches to Agenda View for that specific date.
- **Navigation** — Arrow buttons move between months; **"Today"** button returns to current month.

### Sync Pill
A floating indicator at the bottom of the screen shows data sync status:
- **Green** — Up to date (auto-dismisses after 3 seconds).
- **Blue spinner** — Syncing with server.
- **Red** — Offline with pending submissions queued.

### Dark Mode Toggle
The 🌗 button in the top nav bar switches between light and dark themes. Preference persists across sessions via `localStorage`.

## Quick Actions

From the Dashboard, you can:
1. **Filter by department** to see only your unit's events.
2. **Search for a name** to find a specific person's entries.
3. **Click any event card** to see full details including attendees and remarks.
4. **Navigate dates** using the mini calendar or agenda date controls.
5. **Switch to Month View** for a high-level overview of the month.

## Data Refresh

The dashboard auto-refreshes every 35 seconds when the browser tab is active. It pauses when the tab is hidden to conserve resources.
