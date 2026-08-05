# Duty Planner (Roster Scheduler)

The Duty Planner is a full-featured personnel roster scheduling module for planning monthly duty assignments. It lives in the same backend database (Google Sheets) as the rest of Cloudy.

## Overview

The Duty Planner enables roster managers to:
- Define roles and shifts
- Schedule personnel to shifts on a monthly calendar
- Track seniority and qualification requirements
- Tag personnel by the roles they're qualified for

## Page Layout

### Sidebar (left)
Configuration panel showing:
- **Roles** — List of defined roles with their shift patterns (24/7 or weekday-only)
- **Seniority Levels** — Ranked list of seniority tiers (default: Junior, Mid, Senior)
- **Personnel Tags** — Personnel assigned to each role

### Calendar (right)
A month-view roster grid where:
- **Column headers** show dates
- **Row headers** show roles and shifts
- **Day cells** show assigned personnel for each shift
- **Today** is highlighted
- Navigation arrows move between months

## Setting Up the Duty Planner

### Step 1: Define Seniority Levels
Default levels are created automatically when `dpSetupDatabase()` runs:
- **Junior** (priority 1)
- **Mid** (priority 2)
- **Senior** (priority 3)

Reorder or add levels by adjusting the priority values.

### Step 2: Define Roles
Create roles that need scheduling (e.g., Duty Officer, Ops Room, Guard Commander).

Each role has:
- **Name** — Display name for the role
- **24/7 Mode** — Toggle between full-week coverage and weekday-only
- **Shifts** — One or more shifts per role

### Step 3: Define Shifts per Role
For each role, add one or more shifts with:
- **Shift Name** — e.g., "Morning", "Afternoon", "Night"
- **Start Time / End Time** — Time range for the shift
- **Minimum Seniority** — Required seniority level for personnel filling this shift

### Step 4: Tag Personnel to Roles
Assign personnel to the roles they are qualified to fill:
- Select a role
- Search and add personnel from the company directory
- Personnel can be tagged to multiple roles

### Step 5: Schedule the Month
For each day in the month:
1. Click on a day cell (or drag from the sidebar).
2. The cell shows available personnel qualified for that role/shift.
3. Select a person to assign them to that day's shift.
4. Assignments are saved immediately to the backend.

## Data Storage

All duty planner data is stored in separate sheets within `Company_Leaves_DB`:

| Sheet | Content |
|---|---|
| `Seniorities` | Seniority levels and priorities |
| `Roles` | Role definitions and 24/7 flags |
| `Shifts` | Shift configurations per role |
| `Personnel` | Personnel records with tags |
| `Tags` | Personnel-to-role tag assignments |
| `Schedule` | Monthly scheduling data |

## Access

The Duty Planner tab appears in the sidebar menu. On first access:
1. The frontend calls `dpSetupDatabase()` to ensure the backend schema is initialized.
2. Default seniority levels are created if they don't exist.
3. Data is loaded and saved via the same GAS API as all other modules.

## Backend Commands

| Function | Purpose |
|---|---|
| `dpSetupDatabase()` | Initialize/verify duty planner schema and default seniorities |
| `dpRunMigration()` | Reset or migrate duty planner data |
