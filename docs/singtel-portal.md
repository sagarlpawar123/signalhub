### Singtel local portal presentation

The status page whose slug is `singtel-status` uses a dedicated light dashboard:
a navy health banner, live service totals, searchable service directory with
category filters, active incidents, upcoming/active maintenance, and quick links.
Component groups supply categories. Published Appearance logo/cover assets and
support links are reused; visible announcement, rich-text, metrics and link-card
blocks are preserved. The dashboard layout and light palette are defined in
`components/public/SingtelStatusPortal.tsx` and its CSS module, so Appearance
layout/style presets do not rearrange this page. Other slugs retain their normal
designer layouts. Planned totals count scheduled maintenance windows, not
services. Empty states never use sample incidents or counts. After source edits,
rebuild the local installation with `docker compose up -d --build`.
