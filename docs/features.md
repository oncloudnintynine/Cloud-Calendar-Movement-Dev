# Features

Cross-cutting features that span multiple pages or systems.

## External Booking Portal

Cloudy supports an external booking mode for guests or non-registered users to submit events without logging in.

### Setup

1. In **Admin Settings -> General Settings**, generate an external token (UUID).
2. Share the link with external parties:
   ```
   https://[your-app].github.io/[repo]/?ext=[UUID]
   ```
3. External users see a simplified form with:
   - Generic event type only
   - Name field
   - Date selector
   - Attendee fields
   - No access to internal dashboards or other data

### Usage

- External users don't need an account or login.
- Submissions follow the same flow: Google Calendar events are created, KAH is recalculated.
- The submitting user shows as the event creator in the system.

### Security

- Tokens are UUID-based and can be regenerated or revoked by the admin.
- External users cannot access internal data, user lists, or admin settings.
- Only the specific event type enabled for external booking is available.

## Meeting Room Booking

When submitting an event with location set to **"In Camp"**, additional meeting room booking options appear:

### Enabling Meeting Room Booking

1. Select "In Camp" as the location.
2. A **"Book Cloud Meeting Room"** checkbox appears.
3. Check it to enable meeting room booking.

### How It Works

- A specialized meeting room calendar is used instead of the department calendar.
- The Google Calendar event is created on the meeting room calendar.
- This enables meeting room availability checking through Google Calendar's native features.

### Use Cases

- Booking conference rooms for meetings.
- Scheduling training sessions in designated rooms.
- Coordinating shared facility usage.

## Two-Way Sync (GCal Reconciliation)

The system automatically reconciles Cloudy records with their Google Calendar counterparts.

### How It Works

Every time `getLeaves()` is called:
1. The backend scans all non-cancelled records with active EventIDs.
2. For each record, it checks if the associated Google Calendar events still exist.
3. If all GCal events for a record have been deleted externally (e.g., someone removed them directly in Google Calendar):
   - The record is **automatically cancelled** in Cloudy.
   - KAH limits are recalculated to reflect the cancellation.

### Public Holidays

Singapore public holidays are fetched from Google ICS calendars:
- Cached for **6 hours** to avoid excessive API calls.
- Merged into the leave/event feed and dashboard views.
- Displayed with a distinct indicator to differentiate from user-submitted events.

## Offline & Background Sync

The app uses an **optimistic UI** pattern with background sync to remain functional even without internet connectivity.

### How It Works

1. **Submit** — User fills in the form and clicks submit. The entry appears immediately in the UI (optimistic update).
2. **Queue** — If online, the submission is sent to the server immediately. If offline, it's queued in `localStorage`.
3. **Retry** — When connectivity returns, queued items are synced automatically.
4. **Reconcile** — After sync, the frontend fetches fresh data from the server to reconcile any differences.

### Sync Pill Indicator

A floating pill at the bottom of the screen shows sync status:

| Color | Status | Description |
|---|---|---|
| 🟢 Green | Up to date | All data synced. Auto-dismisses after 3 seconds. |
| 🔵 Blue | Syncing | Actively sending/receiving data. Shows item count. |
| 🔴 Red | Offline | No connectivity. Pending items queued locally. |

### Background Poller

- Fetches fresh data every **35 seconds** when the browser tab is active.
- Pauses when the tab is hidden (to conserve resources).
- Uses a `lastLocalChange` timestamp to prevent server data from overwriting optimistic local changes while syncing.

### Concurrency Protection

The system tracks a `lastLocalChange` timestamp. When background poller data arrives:
- If server data is newer than the last local change → UI is updated.
- If a local change is pending sync → server data is held until sync completes, preventing flicker or data loss.
