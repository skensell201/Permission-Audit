# Permission Audit — Azure DevOps Server 2022 extension

Finds **all permissions** a user or group has across a collection — direct and
inherited through (nested) group membership — with a deep link to the security
page where each permission is granted. For Project Collection Administrators.

## Build

    npm install
    npm test
    npm run package        # produces out/local.azpermission-helper-<version>.vsix

## Install on Azure DevOps Server 2022

1. Open `https://{server}/{collection}/_gallery/manage` (local collection gallery).
2. Click **Upload extension** and select the `.vsix` from `out/`.
3. Install the extension into the target collection.
4. Open **Collection Settings** → **Permission Audit** appears in the admin hub group.

## Use

1. Type a user or group name; pick from the autocomplete (USER/GROUP badge).
2. Click **Find permissions**. Progress is shown step by step; large
   collections can take 10–30 s.
3. Browse the tree (Collection → Project → Resource type → Resource). Each row
   shows Allow/Deny, the permission, its source (direct or via a group), and an
   **→ open** link to the page where the permission is managed.
4. Filter by area, project, effect, or permission name. **Export** the filtered
   list as CSV, Excel, or JSON.

## Manual integration checklist (test server)

- [ ] Search by partial user name; USER badge shown; selection works
- [ ] Search a group; GROUP badge shown; audit runs for the group
- [ ] User in a nested AD group sees inherited permissions with `via <group>`
- [ ] A Deny permission renders red and is counted in the summary strip
- [ ] "→ open" lands on the matching security page for repo / pipeline / project
- [ ] Export produces CSV, Excel, and JSON with the filtered rows
- [ ] A non-admin user gets the "Project Collection Administrator" message
