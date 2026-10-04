# Product specification

## Problem
Web publishers need a repeatable, lightweight pre-release checklist without creating an account or sending page data to a service.

## MVP
Create named page-release entries with a page name and URL. Each entry has these fixed checks:

1. Title and description
2. Canonical URL
3. Open Graph title, description, and image
4. Image alt text
5. Same-origin links
6. Desktop, tablet, and mobile check
7. Keyboard check
8. Final approval

Users can tick checks, see completed/total and percentage, see a ready/not-ready state, filter releases by pending or complete, and delete entries. Data persists in browser `localStorage`.

## Rules
- A release is **ready** only when every fixed check is complete.
- Page name and URL are required to create a release.
- URL must be a valid absolute `http:` or `https:` URL.
- Progress is completed checks divided by all checks, rounded to a whole percent.
- “Complete” filter means ready; “Pending” means not ready.

## Out of scope
Accounts, authentication, shared workspaces, server/database storage, site crawling, link validation, AI review, notifications, import/export, and hosted deployment.

## Acceptance criteria
- Korean interface exposes creation, completion toggles, progress, filter, and delete actions.
- All eight required checks appear on every release.
- State survives reload on the same browser/device.
- The app works as static assets served over HTTP.
