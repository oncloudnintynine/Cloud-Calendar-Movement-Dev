# Parade State

The Parade State provides a real-time organizational view of personnel availability. It answers the question: **"Who is IN camp, who is OUT, and why?"** for any selected date and time.

## Using the Parade State

### Access
Navigate to **Parade State** from the sidebar menu.

### Date/Time Selector
- Use the date picker to select any date (defaults to today).
- For time-bound events, select a specific time to see who is out at that moment. Half-day leaves are reflected accordingly (AM out, PM in, or vice versa).

### Personnel Readout

The parade state displays all personnel organized by unit/department:

| Column | Description |
|---|---|
| **Name** | Personnel name as configured in admin settings |
| **Status** | **IN** (green), **OUT** (red), or **PARTIAL** (amber, half-day) |
| **Reason** | If OUT: the event type or leave type causing the absence |
| **Details** | Event description, location, or leave details |
| **Start / End** | Date/time range of the absence |

### Filtering
- Filter by department to focus on specific units.
- The display updates automatically when you change the date or filters.

### Export
Parade state data can be exported for reporting or distribution (availability depends on admin configuration).

## KAH (Key Appointment Holder) Limit Engine

KAH personnel are designated key appointment holders — people who must be present for organizational continuity. The system enforces a maximum percentage of KAH personnel who can be out-of-office at the same time.

### How It Works

```
Every submit, edit, or cancel triggers:
  1. Scan all non-cancelled, current records
  2. For each KAH-relevant record:
     a. Check which custom KAH groups the user belongs to
     b. Count concurrent out-of-office personnel day-by-day
     c. Compare (maxConcurrent / totalMembers) × 100 against the KAH limit
  3. If limit crossed -> status updated + email alert sent
```

### Configuration (Admin Only)

Configured in **Admin Settings -> KAH Management**:

| Setting | Default | Description |
|---|---|---|
| KAH Limit (%) | 50% | Global threshold for concurrent out-of-office KAH personnel |
| Custom KAH Groups | (none) | Named groups with designated members (e.g., "Commanders", "Section Heads") |
| Approving Authority Email | (none) | Recipient of KAH limit alert emails |

### KAH Status Indicators

In the Parade State, KAH personnel are visually distinguished:
- **KAH badge/indicator** next to their name
- **Limit warning** when a group's out-of-office percentage exceeds the threshold
- The submitting user sees a warning if their submission pushes a KAH group over the limit

### Alert Emails

When a KAH limit is crossed:
1. An email is sent to the configured **Approving Authority**.
2. The email subject and body use the configured KAH email templates.
3. Template variables include `{Name}`, `{EventType}`, `{Unit}`, `{Location}`, `{Remarks}`.
