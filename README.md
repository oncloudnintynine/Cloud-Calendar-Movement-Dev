# ☁️ Cloudy

Cloudy is a serverless, Progressive Web App (PWA) built to manage company personnel, leave/event records, and Key Appointment Holder (KAH) constraints. It uses a static front-end hosted on GitHub Pages communicating with a backend powered by Google Apps Script (GAS) and Google Workspace APIs (Drive, Sheets, Contacts, Calendar, Gmail).

## Documentation

| Section | Description |
|---|---|
| [Architecture](docs/architecture.md) | System overview, components, auth flow, environments |
| [Setup Guide](docs/setup.md) | Step-by-step deployment: backend, frontend, CI/CD, admin init |
| **User Guide** | |
| [Dashboard](docs/user-guide/dashboard.md) | Combined org-wide view: agenda, calendar, widgets, search |
| [My Calendar](docs/user-guide/my-calendar.md) | Submit/edit/cancel leaves & events, approval workflow, two-way sync |
| [Parade State](docs/user-guide/parade-state.md) | Real-time personnel status, KAH out-of-office tracking |
| [Duty Planner](docs/user-guide/duty-planner.md) | Monthly roster scheduling, roles, shifts, personnel assignment |
| **Admin Guide** | |
| [Settings](docs/admin-guide/settings.md) | Event types, templates, app mode, users, org structure |
| [KAH Management](docs/admin-guide/kah-management.md) | KAH groups, calendars, limit enforcement, email alerts |
| [GCal Access Rights](docs/admin-guide/gcal-access.md) | Calendar sharing, user permissions, public access |
| [Backup & Restore](docs/admin-guide/backup-restore.md) | Code backup, data migration, database reset |
| [Fail-Safe Updater](docs/admin-guide/fail-safe.md) | Manual patching, VCF contacts sync, G-Contact fixes |
| **Reference** | |
| [Features](docs/features.md) | External booking portal, meeting room, offline sync, two-way sync |
| [UI Features](docs/ui-features.md) | Dark mode, env banner, cache busting, PWA |
| [Maintenance](docs/maintenance.md) | Long-term upkeep, code modification, template variables |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and solutions |

## License

This project is proprietary. All rights reserved.
