# Maintenance Guide

Long-term maintenance and enhancement reference for developers working on Cloudy.

## Modifying the Frontend

### UI Components
The frontend relies on **TailwindCSS** (CDN). Modify the UI by adding Tailwind classes directly into HTML strings found in:
- `frontend/js/ui/ui.js` — Shared UI rendering (nav, dashboard, calendar, agenda)
- `frontend/js/ui/forms.js` — Leave/event submission forms, edit/cancel flows
- `frontend/js/ui/calendar.js` — Calendar views
- `frontend/js/ui/parade.js` — Parade State rendering
- `frontend/js/ui/admin/admin.js` — Admin settings panel
- `frontend/js/ui/admin/structure.js` — Org structure tree
- `frontend/js/ui/dutyplanner/` — Duty Planner UI

### Theme Customization
The Tailwind config is defined inline in `index.html`. Add custom colors under `theme.extend.colors` for dark/light variants. The theme toggle class (`dark`) is applied to `<html>` based on user preference.

### Form Logic
The combined form (`index.html`) dynamically switches between event and leave mode based on the selected event type's `isEvent` property:
- **Event mode**: Shows time pickers, recurrence options, InfoAll toggle.
- **Leave mode**: Shows AM/PM toggles, overseas fields.
- **Field visibility and ordering**: Driven by event type configuration from the backend.

### Adding a New Form Field
1. Add the field to the backend schema (update `verifySchema` in `Code.js`).
2. Add the field UI in `forms.js`.
3. Register the field in the admin Event Type configuration (field toggles).
4. Add the field to relevant templates if needed.

## Modifying the Backend

### Testing Locally
The system uses 3 separate environments: `Exp`, `Dev`, and `Prod`. Toggle `ENV` inside `backend/config.js` to point the frontend to the correct GAS backend.

### Database Schema Changes
If you add new data fields to `Leaves.js`:
1. Add the field handling logic.
2. Update the `verifySchema` array in `Code.js` — this auto-generates missing columns in the Google Sheet on the next API call.
3. Test with a non-production environment first.

### Duty Planner Database
The duty planner stores its data in separate sheets within `Company_Leaves_DB`:

| Sheet | Purpose |
|---|---|
| `Seniorities` | Seniority levels and priorities |
| `Roles` | Role definitions |
| `Shifts` | Shift configurations per role |
| `Personnel` | Personnel records |
| `Tags` | Personnel-to-role assignments |
| `Schedule` | Monthly scheduling data |

To reset or migrate DP data, run `dpRunMigration()` from the GAS editor.

### Deploying Backend Changes
- Push to `main` branch → GitHub Actions auto-deploys (if CI/CD is configured).
- Manual deploy: Use `clasp push --force` then `clasp deploy` from CLI.
- If CI/CD fails, use the [Fail-Safe Updater](admin-guide/fail-safe.md).

## Template Variables Reference

Available across all templates (GCal, Agenda, Announcements, KAH emails):

| Variable | Source | Example |
|---|---|---|
| `{EventType}` | Selected event type | "Official Trip" |
| `{Name}` | Submitting user's name | "John Tan" |
| `{Attendees}` | Selected attendees | "Jane, Bob" |
| `{Department}` | User's department | "Alpha Company" |
| `{Location}` | Location dropdown | "In Camp" |
| `{LocationDetails}` | Location details field | "Room 302" |
| `{Country}` | Country field (overseas) | "Australia" |
| `{State}` | State/province field | "Queensland" |
| `{StartTime}` | Start date/time | "2026-08-03 09:00" |
| `{EndTime}` | End date/time | "2026-08-03 17:00" |
| `{Remarks}` | Remarks field | "Team meeting" |
| `{EventDescription}` | Auto-generated description | Result of template rendering |

## Syncing Contacts to Phones (VCF)

Cloudy uses a secure, native **1-Click Download** method instead of Google Cloud Platform OAuth:

1. In the app menu, users click **"Save Contacts"**.
2. A `.vcf` file is instantly generated and downloaded.
3. iOS/Android natively interprets the file and prompts the user to add/update company contacts into their phone's address book.

No backend infrastructure or OAuth tokens required.

## Handling Google Contact Sync Issues

Google Contacts is the master directory. If a user isn't appearing correctly:

1. Ensure the user's phone number exists exactly as registered.
2. If units are renamed or corrupted, use **"Force Sync G-Contacts"** in **Admin Settings -> Org Structure** to wipe and rebuild from app state.
3. Allow ~1 minute for Google's sync to propagate after changes.
4. If the issue persists, check the GAS execution logs for People API errors.

## Fail-Safe Code Updater & Backups

- **Code Backup**: In **Admin Settings -> Fail-Safe Updater**, trigger a 1-click backup of the latest repository code to a Google Doc.
- **Manual Patching**: If CI/CD fails, use the backup Doc with the [Fail-Safe Code Updater](https://oncloudnintynine.github.io/Fail-Safe-Code-Updater/) tool to manually patch the backend.
- **Credential Rotation**: Clasp credentials expire eventually. Regenerate via GitHub Codespaces using `clasp login --no-localhost`.

## Regular Maintenance Checklist

| Frequency | Task |
|---|---|
| Daily | Check GAS execution logs for errors |
| Weekly | Verify CI/CD pipeline is deploying successfully |
| Monthly | Review KAH group memberships for accuracy |
| Quarterly | Back up `Company_Leaves_DB` spreadsheet |
| Annually | Regenerate Clasp credentials and update GitHub Secrets |
| As needed | Update event types and templates when organizational needs change |

## Monitoring

- **GAS Executions**: View in the Apps Script editor under **Executions** (left sidebar). Shows success/failure for every API call.
- **GitHub Actions**: View deployment status in the repository's **Actions** tab.
- **Google Sheets**: The spreadsheet itself can be monitored for data integrity.
- **Google Calendar**: Verify events are being created correctly by checking any department calendar.
