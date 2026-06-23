# Permission Audit

**Permission Audit** answers a question that the built-in security pages cannot: *exactly which permissions does this user or group have across the whole collection, and where is each one granted?*

Given any identity, it walks every security namespace and resolves the **effective** permission set — both rights granted **directly** and rights **inherited** through nested group membership (transitively, cycle-safe). Every result links straight to the security page where the permission lives, so you can review or change it in one click.

## What it does

- **Find by user or group** — type-ahead search over collection identities.
- **Direct + inherited** — expands nested group membership so you see the full picture, not just direct grants.
- **Every namespace** — projects, repositories, build/release definitions, wikis, and collection-level security.
- **Deep links** — each row links to the page where the permission is actually set.
- **Allow / Deny breakdown** — Deny grants are highlighted; filter by namespace, project, effect, or permission name.
- **Export** — CSV / JSON of the flat result set (formula-injection hardened for safe spreadsheet opening).

## Who can use it

Admin-only. The hub appears under **Collection Settings** and requires **Project Collection Administrators** membership.

## Supported versions

On-premises **Azure DevOps Server** only (this is not an Azure DevOps Services / cloud extension).

| Product | Application version | Supported |
| --- | --- | --- |
| Azure DevOps Server 2022 | 19.x | ✅ Developed and tested on this version |
| Azure DevOps Server 2020 | 18.x | ✅ (manifest target `[17.0,)`) |
| Azure DevOps Server 2019 | 17.x | ✅ (manifest target `[17.0,)`) |
| TFS 2018 and earlier | ≤ 16.x | ❌ Not supported |
| Azure DevOps Services (cloud) | — | ❌ Not supported |

Install it through the local collection gallery (`{server}/_gallery/manage`).

## Known limitations (v1)

- No project pagination past 1000 projects.
- Area-path permission links resolve to the project level.
- No keyboard navigation in the result tree or export menu.

## Compatibility

- Azure DevOps Server **2022** and **2020** (on-premises) — built and tested.
- Loads on application version **17.0+** (`Microsoft.TeamFoundation.Server [17.0,)`), including Azure DevOps Server 2019.
- Pure client-side (REST `api-version=6.0`, SDK-injected token); no server components.

## Author

By **iksoftware**.
