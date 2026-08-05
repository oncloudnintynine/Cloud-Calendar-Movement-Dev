# Google Calendar Access Rights

The GCal Access Rights admin tab lets you manage sharing permissions for every Google Calendar created by the system. Changes are applied immediately through the Google Calendar API.

## Access

Navigate to **Admin Settings -> GCal Access Rights**.

## Calendar List

The main view lists every system-managed calendar:

| Column | Description |
|---|---|
| **Calendar Name** | Department name or KAH group name |
| **Type** | Department calendar or KAH group calendar |
| **Current Permissions** | List of users with access and their roles |
| **Public Status** | Whether the calendar is publicly accessible |

## Managing Access

### Add a User

1. Click **Add User** on the target calendar.
2. Enter the Google account email address.
3. Select a role:
   - **Reader** — Can view events, cannot modify.
   - **Writer** — Can create, edit, and delete events.
   - **Owner** — Full control including sharing permissions.
4. Click **Save**. The permission is applied immediately via the Calendar API.

### Update a User's Role

1. Find the user in the calendar's permissions list.
2. Click the role dropdown next to their name.
3. Select a new role (Reader → Writer → Owner).
4. The change takes effect immediately.

### Remove a User

1. Find the user in the calendar's permissions list.
2. Click the **Remove** (X) button.
3. Confirm removal. The user loses all access to that calendar.

### Make Public

Click **"Make Public Reader"** to expose a calendar as public read-only:
- Anyone with the link can view the calendar.
- Events are read-only for public viewers.
- Useful for sharing department schedules with external stakeholders.

### Delete Calendar

Click **Delete Calendar** to permanently remove a calendar and all its events:
- Only available for non-primary calendars.
- The primary owner's calendar cannot be deleted.
- Confirmation required before deletion.

## Notes

- Permissions are managed through the Google Calendar API ACL (Access Control List).
- Changes propagate within seconds.
- A user can have at most one access rule per calendar (reader, writer, or owner).
- Public access is a separate rule that doesn't conflict with individual permissions.
