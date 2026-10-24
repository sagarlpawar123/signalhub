export type HelpArticle = {
  slug: string;
  title: string;
  summary: string;
  body: HelpSection[];
};

export type HelpSection = { heading: string; paragraphs: string[]; list?: string[]; code?: string };

export type HelpCategory = {
  slug: string;
  label: string;
  icon: string;
  articles: HelpArticle[];
};

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: "overview",
    label: "Getting started",
    icon: "◧",
    articles: [
      {
        slug: "getting-started",
        title: "How SignalHub works",
        summary: "The model behind the console: organizations, hubs, status pages, services, monitors, and the background worker.",
        body: [
          {
            heading: "The building blocks",
            paragraphs: [
              "An organization owns everything you see in the console. Inside it you create status pages. A status page lists services (the systems whose health you report) and publishes incidents, maintenance, metrics, and a subscribe option to visitors.",
              "A hub is a landing page that groups several status pages. Hubs never own services directly; they summarize the status pages assigned to them.",
            ],
            list: [
              "Services are what customers care about, such as API, Website, or Payments. Each service has a public status and can have a monitor attached.",
              "Monitors check a target on a schedule (HTTP, keyword, TCP, TLS, ICMP, DNS, or heartbeat) and can update a service's status, record a response-time metric, open incidents, and notify subscribers.",
              "Events is the console's single home for incidents and scheduled maintenance.",
              "Subscribers receive updates by email or SMS; feeds (RSS and Atom) and signed webhooks cover everything else.",
            ],
          },
          {
            heading: "Two processes, one database",
            paragraphs: [
              "SignalHub runs as a web application and a separate worker process that share one PostgreSQL database. The web application serves the console, public pages, and API. The worker runs monitor checks, automatic maintenance transitions, queued notifications, exports, audit delivery, and retention.",
              "If the worker is stopped, pages and the console keep working but checks stop, scheduled maintenance does not start on its own, and queued notifications wait. Monitors and notification screens warn you when the worker looks offline.",
            ],
          },
          {
            heading: "A first useful setup",
            paragraphs: [],
            list: [
              "Pages: create a status page, give it a name, and choose its visibility.",
              "Content: add your services and optional groups.",
              "Monitors: attach a monitor to each service you can check automatically.",
              "Publish: use Publish page on the page Overview; the page stays a private draft until you do.",
              "Notifications: confirm email or SMS delivery is ready so visitors can subscribe.",
            ],
          },
        ],
      },
      {
        slug: "dashboard",
        title: "Dashboard",
        summary: "Overall health, key counts, open incidents, and your pages at a glance.",
        body: [
          {
            heading: "What you see here",
            paragraphs: [
              "The top banner shows the worst current status across your pages. Below it, four tiles count Pages, Components (services), Subscribers, and Upcoming maintenance. Tiles that lead somewhere are links, shown only when your role may open that screen.",
              "Open incidents lists everything not yet resolved across all pages, with an All events link. Your pages lists each page with a status dot for quick access.",
            ],
          },
          {
            heading: "Common tasks",
            paragraphs: [
              "Open an incident to post an update, click a page to manage it, or use New page. What you can do depends on your role; see Users and roles.",
            ],
          },
        ],
      },
      {
        slug: "console-basics",
        title: "Using the console",
        summary: "Navigation, quick search, organization switching, confirmations, and feedback messages.",
        body: [
          {
            heading: "Navigation",
            paragraphs: [
              "The sidebar groups screens into Workspace (Dashboard, Pages), Operate (Events, Monitors, Metrics), Audience (Subscribers, Destinations, Analytics, SignalHub Embed), and Platform administration. API Keys sit in Platform administration next to Security. Items you are not permitted to use are hidden.",
              "The Help center is the question-mark button beside the search box at the top of every screen. Press Ctrl+K (Cmd+K on macOS) to open the command palette. Type to jump to a screen or a page; use the arrow keys and Enter, and Escape to close.",
              "If your account belongs to more than one organization, the organization switcher in the shell changes the active organization.",
            ],
          },
          {
            heading: "Feedback and confirmations",
            paragraphs: [
              "Results appear as short toasts at the top of the screen and dismiss themselves. Errors stay visible a little longer and name the problem.",
              "Risky actions ask first. A small confirmation appears next to the button you clicked; press Escape to dismiss only that confirmation. Permanent deletions of pages ask you to type a phrase, such as the page name or delete 3 pages, and offer a copy button for the phrase.",
              "Row actions are icon buttons with a colored tint (view, edit, publish, unpublish, delete). Hover or focus an icon to see its label.",
            ],
          },
        ],
      },
      {
        slug: "analytics",
        title: "Analytics",
        summary: "Page views, incident views, and subscription conversion for each status page.",
        body: [
          {
            heading: "Reading the dashboard",
            paragraphs: [
              "Choose a page to see Page views, Incident views, Subscription starts, and Conversion (completed subscriptions as a share of starts). Daily activity lists the most recent 30 days that have recorded activity, and the totals above cover those same days.",
              "Analytics are privacy-friendly operational signals, not billing-grade measurements. Blocked scripts, caching, and page-level analytics settings can change counts.",
            ],
          },
          {
            heading: "Using the data",
            paragraphs: ["Look for traffic spikes during incidents, verify that the subscribe option converts, and compare engagement before and after a redesign. Viewing analytics is available to every role."],
          },
        ],
      },
    ],
  },
  {
    slug: "pages",
    label: "Pages & hubs",
    icon: "▦",
    articles: [
      {
        slug: "pages",
        title: "Pages",
        summary: "Create, list, publish, group, and delete the status pages and hubs your organization runs.",
        body: [
          {
            heading: "The Pages list",
            paragraphs: [
              "Pages shows a summary of how many pages are published, draft, or hidden. Hubs appear as collapsible groups with their status pages inside; pages that belong to no hub sit under Standalone pages. A hub starts collapsed unless something inside it has an active incident or maintenance.",
              "Each row has icon actions: Continue setup (drafts), View live page, Publish or Unpublish, Move to hub (standalone pages), Edit, and Delete.",
            ],
          },
          {
            heading: "Creating a page",
            paragraphs: [
              "Choose Create page, then set a name, a page type (Status page or Hub), a visibility, an optional URL slug, and optionally the hub to add it to. The first save creates a draft that only your team can see.",
              "Draft, published, and hidden are separate states: a draft has never been published, a published page is visible according to its access setting, and a hidden page was published earlier but is currently unpublished.",
            ],
          },
          {
            heading: "Visibility",
            paragraphs: [],
            list: [
              "Public: anyone with the URL can view the page.",
              "Private (password protected): visitors enter one shared password of at least 12 characters.",
              "Audience-specific (per-user login): each visitor signs in and sees only the services assigned to them or their group.",
            ],
          },
          {
            heading: "Bulk actions",
            paragraphs: [
              "Select rows with the checkboxes to Publish, Unpublish, Remove from hub, or Delete up to 100 pages at once. Bulk delete asks you to type the phrase shown, such as delete 3 pages. Pages that are already in the target state or still in setup are skipped for publish and unpublish.",
              "Deleting a page permanently removes its services, incidents, subscribers, metrics, monitors, and uploaded assets.",
            ],
          },
        ],
      },
      {
        slug: "hubs",
        title: "Hubs",
        summary: "Group several status pages under one landing page and keep access rules independent.",
        body: [
          {
            heading: "What a hub is",
            paragraphs: [
              "A hub is a page whose content is the list of status pages assigned to it. It shows their combined health and links to each one. Services always belong to the status pages, never directly to the hub. A hub's public address is /hub/<slug>.",
            ],
          },
          {
            heading: "Managing hub members",
            paragraphs: [
              "On a hub, the Content tab lists its status pages. Use Create status page in this hub to start a new one, or choose a standalone page and Add to hub. From the Pages list, a standalone page can also be moved into a hub with the Move to hub icon, and selected members can be removed from the hub in bulk.",
              "Removing a page from a hub leaves the page itself intact; it becomes standalone again.",
            ],
          },
          {
            heading: "Access and deletion",
            paragraphs: [
              "A hub has its own visibility. Visitors who may open the hub still meet each member page's own access rules, so a private member stays private.",
              "A hub that still contains pages cannot be deleted. Remove or delete its pages first.",
            ],
          },
        ],
      },
      {
        slug: "page-overview",
        title: "Page overview",
        summary: "The home of a single page: setup progress, current status, events, subscribers, and quick actions.",
        body: [
          {
            heading: "Page tabs",
            paragraphs: [
              "Every page has Overview, Content, Appearance, Access, Notifications, and Settings tabs. Access appears only for private and audience-specific pages.",
            ],
          },
          {
            heading: "Setup and publishing",
            paragraphs: [
              "A new page shows three steps: Name your page, Add services, and Publish. Publishing needs at least one visible service. After publishing, the main action becomes Hide page, and the Overview stat cards show Current status, Open incidents, Maintenance, and Subscribers, each linking to the relevant screen.",
              "Preview public page opens the live page in a new tab and is available once the page is published. Page details shows the public address with copy and open buttons, access type, time zone, the published design version, and creation date.",
            ],
          },
          {
            heading: "Quick actions",
            paragraphs: ["Report an incident, Schedule maintenance, Customize appearance, and Page settings are one click away. Reporting and scheduling require a role that can manage incidents."],
          },
        ],
      },
      {
        slug: "components",
        title: "Services & groups",
        summary: "Add, order, group, publish, and change the status of the services a page reports on.",
        body: [
          {
            heading: "Adding and editing services",
            paragraphs: [
              "Open the Content tab. Add service asks for a Name, an optional Group, and an optional Description shown to visitors. Editing also offers Show uptime. Use the plus control beside Group to create or manage groups; related services appear together on the public page.",
              "Drag rows to reorder them; numeric order fields are not used.",
            ],
          },
          {
            heading: "Status changes",
            paragraphs: [
              "Each row has a status selector: Operational, Degraded Performance, Partial Outage, Major Outage, or Under Maintenance. Changes are published immediately. The effective public status combines this manual value with open incidents, maintenance windows, and linked monitors; the worst of them wins, and recovering from one source never clears another that is still active.",
              "Status history feeds the uptime bars on the public page.",
            ],
          },
          {
            heading: "Publish, unpublish, delete",
            paragraphs: [
              "The eye icon publishes or unpublishes a single service after a confirmation. Unpublished services carry an Unpublished badge and disappear from the public page until published again.",
              "Deleting a service is permanent and also affects incidents and monitors that referenced it.",
            ],
          },
        ],
      },
      {
        slug: "designer-and-saving",
        title: "Appearance and publishing",
        summary: "Pick a layout and style, set brand color and assets, add footer links, and publish deliberately.",
        body: [
          {
            heading: "Layout, style, and brand",
            paragraphs: [
              "Layout offers Standard (a clear overview for most pages), Banner (leads with a cover image and page identity), and Compact (more service detail in less space). Style presets such as Default, Ocean, Emerald, Sunset, Violet, Slate, High contrast, and Warm paper preview colors, corners, and depth on each card.",
              "The singtel-status page uses a dedicated light dashboard. Published logo, cover and support settings apply; layout and style presets do not rearrange it. Component groups provide service categories.",
              "Choosing a layout changes the page header, spacing, content width, and how services are laid out, so the public page looks different once you publish. Choose a Brand color; if it is too light for white button text, the editor asks for a darker one. Brand assets are a Logo (public page header), a Site icon (browser tab), and an optional Cover image, which is shown in full by default.",
            ],
          },
          {
            heading: "Visitor links and search",
            paragraphs: [
              "Add a Support link (an https URL or a mailto: address), Terms of service, and Privacy policy links for the public footer. Links that are empty are not shown. Search title and Search description control how the page appears in search results and link previews; they default to the page name, headline, and about text.",
            ],
          },
          {
            heading: "Draft versus live",
            paragraphs: [
              "Changes autosave to a private draft after a short pause. The public page does not change until you press Publish changes. The editor shows Unpublished changes or No unpublished changes, and publishing an unchanged draft does not create another version.",
              "If someone else changes the draft or live page while you are editing, the editor stops and asks you to reload instead of overwriting their work.",
            ],
          },
        ],
      },
      {
        slug: "access-groups",
        title: "Audience access",
        summary: "Control who can open a private or audience-specific page and which services they see.",
        body: [
          {
            heading: "Shared password (Private)",
            paragraphs: ["Private pages use one shared password. Replace it from the Access tab; the new password applies the next time anyone opens the page and the old one is never displayed."],
          },
          {
            heading: "Per-user access (Audience-specific)",
            paragraphs: [
              "Create access groups, each with a set of services, then add access users with an email address and a temporary password of at least 12 characters, optionally assigned to a group. A user sees the union of the services assigned to them directly and through their group.",
              "On a hub, each visitor signs in to the hub, and member pages continue to enforce their own rules. Deleting a group or user takes effect immediately.",
            ],
          },
          {
            heading: "Feeds and embeds on protected pages",
            paragraphs: ["RSS, Atom, the badge, and the embed script need a revocable feed token on non-public pages. Create tokens under Platform administration, API Keys."],
          },
        ],
      },
      {
        slug: "settings",
        title: "Page settings",
        summary: "Page name, headline, about text, time zone, SMS defaults, and permanent deletion.",
        body: [
          {
            heading: "Page details",
            paragraphs: [
              "Settings holds the Page name, Headline (the large title on the public page), About this page (also the default search description), Organization name, Company website, Timezone (an IANA name such as Europe/Berlin, used for public dates and maintenance windows), and the Default SMS country code. Changes apply to this page only.",
            ],
          },
          {
            heading: "Delete page",
            paragraphs: ["Delete permanently removes the page with its services, incidents, subscribers, metrics, monitors, and assets. Type the page name to confirm. This cannot be undone."],
          },
        ],
      },
      {
        slug: "public-page-experience",
        title: "What visitors see",
        summary: "How a published page, its incident pages, history, and hub appear to your customers.",
        body: [
          {
            heading: "The status page",
            paragraphs: [
              "A status page is at /<slug>. It shows an overall status banner, active incidents and upcoming or in-progress maintenance, the services with daily uptime bars (hover a segment for date, status, duration, and notes), published metric charts, and a Subscribe button.",
              "Past incidents are listed on the history page at /<slug>/history, and each incident has its own page at /<slug>/incidents/<id> with a chronological timeline and, if published, a postmortem.",
            ],
          },
          {
            heading: "Metric charts",
            paragraphs: [
              "Visitors can switch the time range (24h, 7d, 30d, 90d, plus quick and custom windows), the lens (Trend, Percentiles, Distribution, Uptime, Responses), and the chart style (Line, Area, Bars, Step, Scatter, Min / avg / max, Gauge, Heatmap). A metric only appears once it has data.",
            ],
          },
          {
            heading: "Subscribing",
            paragraphs: [
              "Visitors subscribe by email or SMS after verifying a one-time code, can follow all services or only chosen ones, and manage or cancel from the preferences page linked in every message. RSS and Atom feeds are offered on public pages.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "incidents",
    label: "Incidents & maintenance",
    icon: "!",
    articles: [
      {
        slug: "events",
        title: "Events",
        summary: "One list for incidents and scheduled maintenance: active now, upcoming, and history.",
        body: [
          {
            heading: "Reading the list",
            paragraphs: [
              "Events shows Active now (open incidents and maintenance in progress, which visitors can see), Upcoming (scheduled maintenance, soonest first), and History (resolved incidents and completed maintenance, newest first with paging).",
              "Filter by kind (all, incidents, or maintenance) and, if you have several pages, by page. Hubs hold no events of their own. Opening a row shows its detail page.",
            ],
          },
          {
            heading: "Who can do what",
            paragraphs: [
              "Anyone who can update incidents (Incident Manager, Responder, Admin) can open Events, post updates, and move maintenance through its statuses. Declaring incidents, scheduling maintenance, publishing postmortems, and deleting events require the Incident Manager or Admin role.",
            ],
          },
        ],
      },
      {
        slug: "incidents",
        title: "Incidents",
        summary: "Declare, update, and resolve incidents, the core of what your status page communicates.",
        body: [
          {
            heading: "The lifecycle",
            paragraphs: ["An incident moves through Investigating, Identified, Monitoring, and Resolved. Every status change is a timestamped update shown publicly."],
          },
          {
            heading: "Declaring an incident",
            paragraphs: [
              "Use Report an incident (from the page Overview or Events). Pick the page, name the incident, write the Message, choose Status and Impact (None, Minor, Major, or Critical), then mark affected components and the status each should show. Tick This incident affects the page as a whole when it is not tied to specific services.",
              "Notify subscribers sends the first update. Backfill (past incident, no notification) records something that is already over without notifying anyone.",
            ],
          },
          {
            heading: "Posting updates and resolving",
            paragraphs: [
              "Open the incident and use Post an update to add a timeline entry and move to the next status, optionally notifying subscribers. When you resolve, affected components are reconciled against every remaining incident, maintenance window, monitor, and manual override rather than blindly set to Operational.",
              "Monitors with Auto open/close incident create and resolve incidents on their own; these appear in Events like any other.",
            ],
          },
        ],
      },
      {
        slug: "timeline-and-postmortems",
        title: "Timeline and postmortems",
        summary: "Correct public updates and publish a retrospective after resolution.",
        body: [
          {
            heading: "Editing the timeline",
            paragraphs: [
              "The incident detail page lists the timeline. Edit an entry's status or message to correct it; editing history does not change the incident's current state, and edited entries are attributed.",
            ],
          },
          {
            heading: "Writing a postmortem",
            paragraphs: [
              "Postmortem is plain text with line breaks preserved. Tick Publish to the public page when it is ready (drafts stay private) and optionally Notify subscribers when publishing.",
            ],
            list: [
              "State customer impact before internal technical detail.",
              "Use exact times and avoid unsupported certainty.",
              "List owned follow-up actions with expected completion windows.",
            ],
          },
          {
            heading: "Deleting",
            paragraphs: ["The Danger zone deletes an incident or maintenance permanently with its full update history. Only Incident Managers and Admins see it."],
          },
        ],
      },
      {
        slug: "maintenance",
        title: "Maintenance",
        summary: "Schedule planned work with a start and end time, optional reminders, and automatic transitions.",
        body: [
          {
            heading: "Scheduling a window",
            paragraphs: [
              "Use Schedule maintenance. Enter a Title, a Message, a Start and an End (the end must be after the start), then select affected components or tick This maintenance affects the page as a whole.",
              "Automatically start/complete based on the window moves the maintenance to In Progress at the start and Completed at the end; the worker performs the transition. Notify subscribers also enables Send one reminder before maintenance starts, set between 5 minutes and 7 days ahead.",
            ],
          },
          {
            heading: "Statuses",
            paragraphs: [
              "Maintenance is Scheduled, In Progress, Verifying, or Completed. Post a maintenance update from the detail page to move between them manually. Affected services show Under Maintenance while it is in progress.",
            ],
          },
          {
            heading: "Where it shows up",
            paragraphs: ["Upcoming windows appear on the public page ahead of time; once in progress they behave like an active event with a maintenance badge."],
          },
        ],
      },
    ],
  },
  {
    slug: "monitoring",
    label: "Monitoring & metrics",
    icon: "◉",
    articles: [
      {
        slug: "monitors",
        title: "Monitors",
        summary: "Check services on a schedule and keep component status, metrics, and incidents up to date automatically.",
        body: [
          {
            heading: "The Monitors screen",
            paragraphs: [
              "Choose a page, then use Add monitor (a side drawer) to create one. The list is grouped by Monitor group, shows problems first, and can be filtered by status (All, Down, Up, Pending, Paused), by tag, and by a search of name or target. Each row shows recent check results as small bars, the last latency, and the last error.",
              "Row actions: Check on next poll, Pause or Resume, open the status page, Check history, Edit, and Delete (which removes the monitor's history). A banner warns when the worker looks offline.",
            ],
          },
          {
            heading: "Monitor types",
            paragraphs: [],
            list: [
              "HTTP: request a URL (GET, POST, or HEAD) and check the response status against an expected range such as 200-299.",
              "Keyword: HTTP plus a text the body must contain and/or must not contain.",
              "TCP: open a connection to a host and port.",
              "TLS: connect and warn when the certificate expires within a number of days.",
              "ICMP: ping a host.",
              "DNS: resolve A, AAAA, CNAME, MX, TXT, or NS records, optionally asserting the expected value.",
              "Heartbeat: your own job calls a generated URL; the monitor goes down if no call arrives within its interval plus a grace period.",
            ],
          },
          {
            heading: "Settings that matter",
            paragraphs: [
              "Interval is 10 to 86400 seconds and Timeout is 100 to 60000 ms. Fails before down and OKs before recovered (1 to 20) stop one transient result from flipping status. Component status on failure chooses Degraded Performance, Partial Outage, or Major Outage.",
              "Optional sections cover the HTTP request (custom headers as a JSON object, request body), authentication (Basic, Bearer token, or Custom header; secrets are write-only), Verify TLS certificate, Monitor group (existing groups are suggested), and up to 20 tags.",
              "Targets that resolve to private or internal addresses are blocked unless the installation explicitly allows them.",
            ],
          },
          {
            heading: "Linking and automated actions",
            paragraphs: [
              "Linked to a component, a monitor updates that component's public status. Not linked, it only records checks and alerts. Automated actions are Flip component status, Record response-time metric (creates a metric you can chart), Auto open/close incident, and Notify subscribers.",
              "Start with a linked monitor and only the metric enabled, watch the check history, then turn on automation once thresholds behave. Incidents, maintenance, manual status, and other monitors are reconciled together, so one recovery never hides another outage.",
            ],
          },
        ],
      },
      {
        slug: "monitor-history",
        title: "Check history",
        summary: "Inspect every check a monitor has run, filter and sort it, and open a single result.",
        body: [
          {
            heading: "Browsing history",
            paragraphs: [
              "The history icon on a monitor row opens a drawer with Checked, Result, Latency, and Response columns, 25 checks per page. Filter by All results, Up only, or Down only, and sort Newest first, Oldest first, Slowest first, or Fastest first. Use First, Previous, Next, and Last to page through results.",
              "Click a row to open the full check detail, including the complete response text or error.",
            ],
          },
          {
            heading: "Retention",
            paragraphs: ["Checks are stored in monthly partitions. The worker drops whole partitions once they pass every organization's retention window, so history length follows the retention policy set by the platform administrator."],
          },
        ],
      },
      {
        slug: "metrics",
        title: "Metrics",
        summary: "Publish numeric time series, such as response time or error rate, on your status page.",
        body: [
          {
            heading: "Creating a metric",
            paragraphs: [
              "Pick a page, then Add a metric: a name, an optional unit suffix (ms, %, req/s, any text), a description, an optional linked component, and 0 to 10 Decimal places. You can change precision later from the metric card, which also shows the latest value.",
              "Monitors with Record response-time metric create and feed their own metric automatically.",
            ],
          },
          {
            heading: "Pushing data",
            paragraphs: [
              "Enter a value under Push data point on the card, or automate it with POST /api/v1/manage/metrics/<id>/points and a key with the metrics.write scope. An optional timestamp backfills history.",
              "A metric appears on the public page once it has at least one point. Visitors can change the range, lens, and chart style; see What visitors see.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "communicate",
    label: "Communicate",
    icon: "@",
    articles: [
      {
        slug: "subscribers",
        title: "Subscribers",
        summary: "Manage who receives email and SMS updates, with verification, import, quarantine, and export.",
        body: [
          {
            heading: "Channels",
            paragraphs: [],
            list: [
              "Email: verified with a one-time code sent to the inbox.",
              "SMS: verified with a one-time code to the phone number, in international format.",
              "RSS and Atom: public feeds, or revocable signed feed URLs for protected pages.",
              "Slack, Microsoft Teams, and generic webhooks are not subscriber channels; they are configured as destinations.",
            ],
          },
          {
            heading: "Managing the list",
            paragraphs: [
              "Subscribers is per page and per channel, with counts for Active, Quarantined, and Unconfirmed. Add subscriber takes a channel and contact and requires you to confirm the person agreed to receive updates; admin-added contacts skip verification.",
              "Bulk import (CSV) accepts up to 5,000 email addresses separated by commas or new lines, skips existing subscribers including quarantined ones, and treats imports as verified. Export CSV downloads the list.",
              "Quarantine stops notifications without deleting the subscriber. The delivery state panel shows delivery readiness and lets you retry now.",
            ],
          },
          {
            heading: "Preferences and unsubscribing",
            paragraphs: [
              "Every message links to a preferences page, where a subscriber follows all services or chosen ones, or unsubscribes. Mail clients also show a one-click Unsubscribe.",
              "If an address is permanently refused by the receiving server, delivery stops and the subscriber is quarantined automatically. Subscribing again releases the quarantine.",
            ],
          },
        ],
      },
      {
        slug: "destinations",
        title: "Notifications and destinations",
        summary: "Check delivery readiness, brand outgoing email, connect team tools, and register signed webhooks per page.",
        body: [
          {
            heading: "Where to find it",
            paragraphs: ["Per-page settings are on the page's Notifications tab; the Destinations item in the sidebar opens the same screen for a chosen page."],
          },
          {
            heading: "Delivery readiness",
            paragraphs: [
              "Subscriber channels shows whether Email, SMS, and RSS/Atom are Available or Need setup. Email and SMS need a platform-configured provider and a healthy worker; feeds work without the worker.",
              "Email branding sets the sender name, reply-to address, and a plain-text footer for subscriber emails; the page logo and brand color are applied automatically.",
            ],
          },
          {
            heading: "Team and on-call destinations",
            paragraphs: ["Only providers enabled by a platform administrator are offered (for example Slack, Microsoft Teams, and others). Each destination is tested before its credentials are stored."],
          },
          {
            heading: "Signed status-event webhooks",
            paragraphs: [
              "Register an HTTPS endpoint to receive incident, maintenance, and postmortem events. SignalHub verifies the endpoint first, signs each delivery, retries transient failures, and lets you send a test and rotate the secret. See Outbound webhook verification.",
            ],
          },
          {
            heading: "Troubleshooting",
            paragraphs: ["If delivery is paused, check the worker status, then provider readiness, destination verification, and the last recorded error. Deliveries that exhaust their retries show in Platform operations as dead letters."],
          },
        ],
      },
      {
        slug: "embed",
        title: "SignalHub Embed",
        summary: "Add an incident banner or a live status badge to your own website.",
        body: [
          {
            heading: "Incident banner",
            paragraphs: [
              "Choose a page and copy the script tag. It is invisible during normal operation and shows a banner while there is an active incident or maintenance.",
            ],
            code: "<script async src=\"https://status.example.com/api/v1/embed/<slug>\"></script>",
          },
          {
            heading: "Live status badge",
            paragraphs: ["The badge snippet links an image of the current status to your page. For private and audience-specific pages, append ?feed_token=<token> using a token from API Keys."],
            code: "<a href=\"https://status.example.com/<slug>\"><img src=\"https://status.example.com/api/v1/badge/<slug>\" alt=\"Status\"></a>",
          },
        ],
      },
    ],
  },
  {
    slug: "organization",
    label: "Organization",
    icon: "◐",
    articles: [
      {
        slug: "team",
        title: "Users and roles",
        summary: "Create organization users, assign a role, and limit access to selected pages.",
        body: [
          {
            heading: "Roles",
            paragraphs: [],
            list: [
              "Admin: every capability, including pages, integrations, users, organization settings, and the Platform administration entry.",
              "Incident Manager: declare and delete incidents and maintenance, publish postmortems, post updates, change component status, manage subscribers, view analytics.",
              "Responder: post incident and maintenance updates, manage monitors and metrics, change component status, view analytics. Cannot declare incidents or schedule maintenance.",
              "Viewer: read-only analytics.",
            ],
          },
          {
            heading: "Creating and managing users",
            paragraphs: [
              "On Users and roles, enter the full name, User ID, email, role, and a temporary password for a new local identity, and optionally limit the user to selected pages (leave empty for all pages). Admins always have organization-wide access. A new local user must change the temporary password at first sign-in; existing SSO or password identities keep their current authentication.",
              "Each member row lets an Admin change the role or revoke access. Creating the same email again reactivates a revoked user.",
            ],
          },
        ],
      },
      {
        slug: "security",
        title: "Security",
        summary: "Authenticator-app MFA, recovery codes, and the devices signed in to your account.",
        body: [
          {
            heading: "Multi-factor authentication",
            paragraphs: [
              "Enroll an authenticator app under Security by entering a verification code. You receive one-time recovery codes: save them, because you are signed out after enrollment. When MFA is required for your installation you must finish enrollment before other console actions are available.",
            ],
          },
          {
            heading: "Sessions",
            paragraphs: ["Active sessions lists signed-in devices. Revoke suspicious or stale sessions, and rotate affected API keys and webhook secrets if an account may be compromised."],
          },
          {
            heading: "SSO and SCIM",
            paragraphs: ["OIDC or SAML single sign-on and SCIM provisioning are configured by platform administrators under Platform administration, Identity. Ask them to test a connection before enforcing it."],
          },
        ],
      },
      {
        slug: "api-keys",
        title: "API Keys",
        summary: "Scoped bearer tokens for the management API, and revocable feed tokens for protected pages.",
        body: [
          {
            heading: "Creating a key",
            paragraphs: [
              "Give the key a name and tick only the scopes it needs, optionally restrict it to chosen pages, set an expiry, and restrict allowed IPv4 addresses or CIDRs. The secret is shown once; copy it immediately. Keys can be rotated and revoked, and either takes effect immediately.",
            ],
            list: [
              "status.read",
              "components.read, components.write",
              "incidents.read, incidents.write",
              "metrics.read, metrics.write",
              "analytics.read",
            ],
          },
          {
            heading: "Feed tokens",
            paragraphs: ["For private and audience-specific pages, create a named feed token (with an optional expiry) to get revocable RSS and Atom URLs that can also unlock the badge and embed script."],
          },
        ],
      },
      {
        slug: "org-settings",
        title: "Organization settings",
        summary: "Where the organization name, contact, and deletion are managed.",
        body: [
          {
            heading: "General settings",
            paragraphs: ["Organization settings now live on Platform administration, Organizations (it is reachable from the old Settings address, which redirects there). Admins can update the display name and operational contact email."],
          },
          {
            heading: "Deleting the organization",
            paragraphs: ["Deletion is a platform operation: the organization is suspended, the administrator reauthenticates, and a retryable purge job is queued. Request, job, and tombstone audit evidence are kept."],
          },
        ],
      },
    ],
  },
  {
    slug: "developers",
    label: "Developer guides",
    icon: "</>",
    articles: [
      {
        slug: "api-quickstart",
        title: "Management API quickstart",
        summary: "Authenticate with scoped API keys and automate incidents, component status, and metric points.",
        body: [
          {
            heading: "Authenticate",
            paragraphs: [
              "Create a key under API Keys with the smallest scopes and page access the integration needs, and store the secret in a secret manager. Send it as a Bearer token. /api/openapi is the machine-readable reference.",
            ],
            code: "curl -H 'Authorization: Bearer $SIGNALHUB_API_KEY' \\\n  'https://status.example.com/api/v1/manage/incidents?pageId=<page-id>'",
          },
          {
            heading: "Endpoints",
            paragraphs: [],
            list: [
              "GET and POST /api/v1/manage/incidents: list or create incidents.",
              "POST /api/v1/manage/incidents/<id>/updates: add an incident update.",
              "PATCH /api/v1/manage/components/<id>: change a component's status.",
              "POST /api/v1/manage/metrics/<id>/points: publish a metric point.",
              "GET /api/v1/status/<slug>: read a public status page.",
              "POST or GET /api/v1/heartbeat/<token>: record a heartbeat.",
            ],
          },
          {
            heading: "Error handling",
            paragraphs: ["Errors return a stable code and message. Treat 401 as an invalid credential, 404 as missing or out of scope, 400 as invalid input, 429 as rate limiting (honor Retry-After), and retry 5xx with bounded exponential backoff."],
          },
        ],
      },
      {
        slug: "component-automation",
        title: "Component status automation",
        summary: "Update component health from your tooling with a scoped API key or a per-component automation token.",
        body: [
          {
            heading: "Management API",
            paragraphs: ["Use PATCH /api/v1/manage/components/<component-id> with a components.write key. One integration can manage many components."],
            code: "curl -X PATCH 'https://status.example.com/api/v1/manage/components/<component-id>' \\\n  -H 'Authorization: Bearer $SIGNALHUB_API_KEY' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"status\":\"OPERATIONAL\"}'",
          },
          {
            heading: "Per-component webhook",
            paragraphs: [
              "Every component also has an automation token for tools that can only send a simple JSON POST. The token is the credential, so keep the URL secret. The console does not display it; an Admin can issue a fresh one by calling POST /api/admin/components/<id>/rotate-token while signed in, which returns the new token once and invalidates the old one. Requests are rate limited to 120 per minute per client.",
            ],
            code: "curl -X POST 'https://status.example.com/api/v1/webhook-component/<token>' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"status\":\"MAJOR_OUTAGE\"}'",
          },
          {
            heading: "Supported statuses",
            paragraphs: [],
            list: ["OPERATIONAL", "DEGRADED_PERFORMANCE", "PARTIAL_OUTAGE", "MAJOR_OUTAGE", "UNDER_MAINTENANCE"],
          },
        ],
      },
      {
        slug: "heartbeats",
        title: "Heartbeat monitors",
        summary: "Let cron jobs and workers report in, and alert when they stop.",
        body: [
          {
            heading: "Setup",
            paragraphs: [
              "Create a monitor of type Heartbeat, open it, and choose Create or rotate heartbeat URL. Set the interval and the grace period; the monitor turns down once the interval plus grace passes without a call.",
              "Call the URL with GET or POST at the end of each successful run. Rotating the URL invalidates the previous one.",
            ],
            code: "curl -fsS -X POST 'https://status.example.com/api/v1/heartbeat/<token>'",
          },
        ],
      },
      {
        slug: "public-status-api",
        title: "Public status API and feeds",
        summary: "Read page health as JSON, RSS, Atom, badges, or an embed, with page access rules enforced.",
        body: [
          {
            heading: "JSON status",
            paragraphs: [
              "GET /api/v1/status/<slug> returns the page summary, components, active incidents, and canonical URL. Public pages are CORS-enabled and cached for about 15 seconds; protected pages return private, no-store responses and enforce their access policy. Requests are rate limited.",
            ],
            code: "curl 'https://status.example.com/api/v1/status/<slug>'",
          },
          {
            heading: "Feeds, badge, and embed",
            paragraphs: [
              "RSS is at /api/v1/feeds/<slug>/rss and Atom at /api/v1/feeds/<slug>/atom. The badge is /api/v1/badge/<slug> and the banner script is /api/v1/embed/<slug>. Protected pages use revocable feed tokens; never publish a token in public source code, and revoke and recreate it if it leaks.",
            ],
          },
        ],
      },
      {
        slug: "webhook-verification",
        title: "Outbound webhook verification",
        summary: "Register an endpoint, validate HMAC signatures, handle retries safely, and rotate secrets.",
        body: [
          {
            heading: "Registering an endpoint",
            paragraphs: [
              "Endpoints must be public HTTPS URLs. When you register one, SignalHub POSTs a JSON body of type signalhub.webhook.verify containing a challenge, and the endpoint must respond with JSON that echoes the same challenge. Copy the secret when it is shown; it is not displayed again.",
            ],
          },
          {
            heading: "Verifying deliveries",
            paragraphs: [
              "Each delivery carries x-status-event, x-status-timestamp, x-status-delivery, and x-status-signature headers. The signature is sha256= followed by the hex HMAC-SHA256 of the timestamp, a dot, and the raw request body, using your endpoint secret. Compute it over the raw bytes before parsing, compare in constant time, and reject stale timestamps.",
            ],
            code: "expected = 'sha256=' + hmac_sha256_hex(secret, timestamp + '.' + raw_body)",
          },
          {
            heading: "Operational checklist",
            paragraphs: [],
            list: [
              "Return 2xx only after the event is accepted; make processing idempotent using x-status-delivery, because retries can repeat an event.",
              "Queue slow downstream work instead of blocking the response.",
              "Store the secret outside source control and rotate it if it may be exposed; use Send test to check the endpoint.",
              "Alert on sustained non-2xx results rather than a single retry.",
            ],
          },
        ],
      },
      {
        slug: "operations-cli",
        title: "Running and operating SignalHub",
        summary: "Processes, health endpoints, and the signalhubctl command.",
        body: [
          {
            heading: "Processes",
            paragraphs: [
              "Run the web application and the worker as separate processes against the same database. In development, npm run dev:all starts both; npm run worker:dev starts only the worker. In production the worker runs from the bundled dist-runtime/worker.mjs (npm run start:worker).",
            ],
          },
          {
            heading: "Health endpoints",
            paragraphs: ["Use /api/health/live for liveness and /api/health/ready for readiness probes. Treat a stale worker heartbeat as degradation even when the web application still responds."],
          },
          {
            heading: "signalhubctl",
            paragraphs: ["The operator command supports doctor, preflight, migrate (optionally --check), backup, restore, audit, export --org <id>, and rotate-encryption-key. statusctl remains as an alias for existing automation."],
            code: "npm run signalhubctl -- doctor",
          },
        ],
      },
    ],
  },
  {
    slug: "platform",
    label: "Platform administration",
    icon: "◆",
    articles: [
      {
        slug: "platform-operations",
        title: "Platform operations",
        summary: "Tenant state, worker readiness, queued work, and dead-letter deliveries across the installation.",
        body: [
          {
            heading: "Screens",
            paragraphs: [
              "Platform administration has tabs for Overview, Organizations, Users, Operations, Audit, Configuration, and Identity, plus links to Security, API Keys, and Users and roles. Overview shows live counts straight from the installation database.",
              "Operations lists platform jobs, dead-letter deliveries that exhausted their retries, worker heartbeats, platform retention defaults, and a migration-state warning when the schema needs attention. Only safe, idempotent retries are offered.",
            ],
          },
          {
            heading: "Organization lifecycle",
            paragraphs: [
              "Organizations lets you provision, open, freeze (suspend), and queue the purge of tenants, and edit the settings of the organization you are signed in to. Suspension fences tenant mutations and automation immediately. Deletion is reauthenticated, queued, and retryable, and keeps request, job, tombstone, and audit evidence.",
              "Users shows cross-organization membership and can apply emergency account freezes.",
            ],
          },
        ],
      },
      {
        slug: "platform-identity",
        title: "Platform identity and access",
        summary: "Organization OIDC and SAML connections with SCIM provisioning into fixed roles and page scopes.",
        body: [
          {
            heading: "Connections",
            paragraphs: [
              "Identity manages OIDC and SAML connections per organization. Provider credentials are encrypted. For SAML, configure the generated metadata URL at your identity provider. Test a connection before enforcing it and keep a recoverable local Admin path.",
            ],
          },
          {
            heading: "SCIM",
            paragraphs: ["SCIM provisioning maps users and groups into fixed roles and page scopes. SCIM tokens are shown once, can be rotated, and should be rotated after any exposure."],
          },
          {
            heading: "Separation of duties",
            paragraphs: ["Platform roles and organization roles are separate. Grant platform access only to operators who need cross-tenant administration, and use organization roles for everyday status work."],
          },
        ],
      },
      {
        slug: "platform-configuration",
        title: "Platform configuration and governance",
        summary: "Runtime readiness, delivery providers, destination providers, and installation-wide audit.",
        body: [
          {
            heading: "Configuration",
            paragraphs: [
              "Configuration reports readiness for the public application URL, the delivery worker, email, SMS, asset storage (local filesystem or S3), and telemetry export. Subscriber email and SMS providers and team destination providers are configured here; provider secrets are encrypted and write-only. Encryption keys and storage access stay deployment-managed.",
              "Enable only providers that are actually configured; provider readiness in each organization reflects these settings and the worker's health.",
            ],
          },
          {
            heading: "Audit",
            paragraphs: [
              "Platform audit is an append-only record of operator, authentication, support, lifecycle, and worker job activity, exportable on demand. External SIEM sinks forward sealed audit entries to your security tooling with retries.",
            ],
          },
        ],
      },
    ],
  },
];

export function findHelpArticle(categorySlug: string, articleSlug: string) {
  const category = HELP_CATEGORIES.find((c) => c.slug === categorySlug);
  const article = category?.articles.find((a) => a.slug === articleSlug);
  return { category, article };
}
