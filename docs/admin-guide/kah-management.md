# KAH Management

KAH (Key Appointment Holders) are designated personnel whose presence is critical for organizational continuity. The KAH Management system enforces limits on how many KAH personnel can be out-of-office simultaneously.

## Access

Navigate to **Admin Settings -> KAH Management**.

## Global Settings

| Setting | Default | Description |
|---|---|---|
| **KAH Limit (%)** | 50% | Global threshold. If more than this percentage of a KAH group is out-of-office, an alert is triggered. |
| **Approving Authority Email** | (none) | Recipient of email alerts when KAH limits are crossed for any group. |

## Custom KAH Groups

Create named groups of key personnel. Each group can have its own calendar, limit enforcement, and email templates.

### Creating a Group

1. Click **Add KAH Group**.
2. Enter a **Group Name** (e.g., "Commanders", "Section Heads", "Ops Team").
3. Select **Members** — Add personnel from the company directory. Members are typically drawn from multiple units.
4. Optionally enable **Dedicated Group Calendar**.
5. Optionally enable **Limit Enforcement** (does this group's percentage count against the global KAH limit?).
6. Click **Save**.

### Managing a Group

After creation, each group card shows:

| Feature | Description |
|---|---|
| **Members** | List of personnel in this group. Click to add/remove members. |
| **Member Count** | Total members in the group (used for percentage calculation). |
| **Current Status** | Current out-of-office percentage with a color indicator (green = within limit, red = over limit). |
| **Dedicated Calendar** | A separate Google Calendar for this group's events (if enabled). |
| **Limit Enforcement** | Toggle to include/exclude this group from global KAH limit checks. |
| **Calendar Backfill** | Sync all historical KAH-relevant records into the group's dedicated calendar. |
| **Backfill Status** | Shows progress during backfill operations. |

### Dedicated Group Calendar

When enabled:
- A new Google Calendar is created specifically for this KAH group.
- KAH-relevant events for group members are automatically duplicated to this calendar.
- **Calendar Backfill**: One-click operation to sync existing historical records into the group calendar. Useful when first enabling the calendar for an existing group.

### Limit Enforcement

Per-group toggle:
- **Enabled**: The group contributes to the global KAH percentage check. If `(outOfOffice / totalMembers) × 100 > KAH Limit`, an alert is triggered.
- **Disabled**: The group is tracked but doesn't trigger alerts. Useful for informational groups or groups where full attendance isn't critical.

### How Percentage Is Calculated

```
For each KAH-relevant event type being submitted/edited/cancelled:
  1. Identify all KAH groups the submitting user belongs to.
  2. For each group, count total members.
  3. Count how many members have concurrent out-of-office records on each affected day.
  4. Calculate (maxConcurrent / totalMembers) × 100.
  5. Compare against the configured KAH Limit.
  6. If exceeded → status updated on the record + email sent.
```

## KAH Email Templates

Customize the email sent when a KAH limit is crossed.

| Template Part | Description |
|---|---|
| **Subject** | Email subject line |
| **Body** | Email body content |

### Template Variables

`{Name}` — Name of the person whose submission triggered the alert
`{EventType}` — Type of event/leave
`{Unit}` — Department/unit of the person
`{Location}` — "In Camp" or "Out of Camp"
`{Remarks}` — Remarks field from the submission

### Example Template

**Subject**: `KAH Limit Alert - {Name} ({Unit})`

**Body**:
```
{Name} from {Unit} has submitted {EventType}.
Location: {Location}
Remarks: {Remarks}

This submission has caused the KAH out-of-office limit to be exceeded.
Please review and take necessary action.
```
