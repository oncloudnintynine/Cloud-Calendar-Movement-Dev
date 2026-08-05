# Admin Settings

The Admin Settings panel is accessible from **Menu -> Admin Settings** (admin login required). It has multiple tabs for configuring every aspect of Cloudy.

## General Settings

| Setting | Description |
|---|---|
| **Admin Password** | Change the admin login password. Default: `P@ssw0rd`. |
| **User Login Keyword** | The suffix users append to their phone number to log in (e.g., `peace` → user enters `91234567peace`). |
| **External Booking Link** | Generate and manage tokens for the [External Booking Portal](../features.md#external-booking-portal). |
| **GCal Two-Way Sync** | Enable/disable automatic reconciliation of externally deleted GCal events. |
| **App Interface Mode** | **Unified Mode** (single combined form) or **Separated Mode** (separate Leave and Event menu items). Affects all users' sidebar. |
| **Default Landing Page** | Which page users see after login: Dashboard, Parade State, My Calendar, or a specific form. |
| **Menu Order** | Drag-and-drop to reorder sidebar menu items. |
| **Dashboard Filter Order** | Reorder how departments appear in the dashboard department dropdown. |

## Users Management

### Registering Users
1. Click **Register User**.
2. Fill in: Name, Mobile (8-digit), Unit, Birthday.
3. Submit. The backend creates a Google Contact, adds it to the Contact Group, and invalidates the cache.
4. After ~1 minute, the user can log in with `[phone][keyword]`.

### Editing / Removing Users
- **Edit**: Change name, unit, or other details. Updates the Google Contact automatically.
- **Remove**: Deletes the user from Google Contacts and removes them from all groups.

### Contact Name Format
Control how names appear in Google Contacts and the app:
- Default: `{Name} (CG : {Unit})`
- Examples: `John Tan (CG : Alpha Company)` or `{Name}` for name only.

### Manual Sync
Use **"Force Sync G-Contacts"** to completely overwrite Google Contacts with the app's current state. Useful for fixing corrupted or mismatched contacts.

## Organisational Structure

Build and manage your organization's unit hierarchy.

### Tree View
- Units displayed in a hierarchical tree.
- Drag-and-drop personnel between units.
- Collapse/expand unit branches.

### Personnel List
- Flat list of all personnel with their unit assignments.
- Search and filter by name or unit.

### Operations
- **Add Unit**: Create a new department/sub-unit.
- **Move Personnel**: Drag a person from one unit to another.
- **Rename Unit**: Click to edit unit name.
- **Delete Unit**: Remove a unit (personnel become unassigned).

## Event Types & Templates

### Managing Event Types

Each event type can be fully customized:

#### Basic Configuration
| Field | Description |
|---|---|
| **Name** | Display name (e.g., "Official Trip", "Overseas Leave") |
| **Is Event** | `Time-Bound` (start/end times, recurrence) or `All-Day / Half-Day` (date + AM/PM) |
| **KAH Tracker** | Whether this type counts toward KAH out-of-office limits |
| **Default Location** | Pre-set "In Camp" or "Out of Camp" for Generic/Others types |

#### Form Field Configuration
Per event type, toggle which fields appear and whether they're required:

| Field | Configurable |
|---|---|
| Location | Show/Hide, Required toggle |
| Location Details | Show/Hide, Required toggle |
| Attendees | Show/Hide, Required toggle |
| Remarks | Show/Hide, Required toggle |

**Field Ordering**: Drag-and-drop to reorder form field blocks for each event type. The frontend renders fields in this order when that type is selected.

#### Display Template Overrides
Per-event type override for templates. If not set, global templates are used.

- **GCal Event Title** — Controls Google Calendar event name.
- **Agenda Card Title** — Title shown on Dashboard and My Calendar agenda cards.
- **Agenda Card Details** — Detail text shown when agenda card is expanded.
- **Announcements Card Title** — Title for InfoAll widget.
- **Announcements Card Details** — Detail text for InfoAll widget.

### Global Templates

Default templates used for all event types unless overridden:

| Template | Purpose | Example |
|---|---|---|
| GCal Event Title | Google Calendar event names | `{EventType} - {Name}` |
| Agenda Card Title | Dashboard/My Calendar agenda titles | `{EventType} | {Name}` |
| Agenda Card Details | Expanded card detail text | `{Name} - {Department} - {Remarks}` |
| Announcements Title | InfoAll widget title | `[INFO] {EventType}` |
| Announcements Details | InfoAll widget detail | `{EventDescription}` |

### Template Variables

Available in all templates:

`{EventType}`, `{Name}`, `{Attendees}`, `{Department}`, `{Location}`, `{LocationDetails}`, `{Country}`, `{State}`, `{StartTime}`, `{EndTime}`, `{Remarks}`, `{EventDescription}`

## Acronyms / Shortforms

Define mappings from short forms to full text for GCal event titles and agenda views.

Example:
- Short form: `PT`
- Long form: `Physical Training`

When a GCal event title or agenda card contains "PT", it's automatically expanded to "Physical Training".
