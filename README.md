# Permission Audit — Azure DevOps Server 2022 extension

Finds **all permissions** a user or group has across a collection — direct and
inherited through (nested) group membership — with a deep link to the security
page where each permission is granted. For Project Collection Administrators.

**[Русская версия ниже ↓](#permission-audit--расширение-для-azure-devops-server-2022)**

## Features

- Single search box with autocomplete over users **and** groups (USER/GROUP badges)
- Full effective-permission scan: every security namespace (Git, Build, Release, Project, Area paths, Wiki, Dashboards, Service connections, …)
- Transitive group expansion — permissions inherited through nested AD groups, each row labeled `direct` or `via <group>`
- Results tree: Collection → Project → Resource type → Resource, with a **→ open** deep link to the exact security page for every permission
- Summary strip with a highlighted **Deny** counter, filters by area / project / effect / permission name
- Export of the filtered list to CSV, Excel, or JSON (formula-injection hardened)
- Resilient: per-area failures become warnings instead of crashing the scan; 429/503 retries

## Install (download a release)

1. Download the `.vsix` from the [latest release](../../releases/latest).
2. Open `https://{server}/{collection}/_gallery/manage` (the local collection gallery).
3. Click **Upload extension** and select the `.vsix`.
4. Install the extension into the target collection.
5. Open **Collection Settings** — **Permission Audit** appears in the sidebar (Extensions group). Hard-refresh (Ctrl+F5) if it does not show up immediately.

> If the page shows `Error issuing session token: HostAuthorizationNotFound`,
> uninstall the extension from the collection and install it again from the
> gallery — this recreates the host authorization record.

## Use

1. Type a user or group name (2+ characters); pick from the autocomplete.
   The **Find permissions** button stays disabled until a suggestion is selected.
2. Click **Find permissions**. Progress is shown step by step; large
   collections can take 10–30 s.
3. Browse the tree. Each row shows Allow/Deny, the permission, its source
   (direct or via a group), and an **→ open** link to the page where the
   permission is managed. The summary shows whose results are displayed.
4. Filter by area, project, effect, or permission name. **Export** the filtered
   list as CSV, Excel, or JSON.

Only Project Collection Administrators can use the tool — others get a clear
permission message.

## Build from source

    npm install
    npm test
    npm run package        # produces out/local.azpermission-helper-<version>.vsix

## Known limitations (v1)

- Collections with more than 1,000 projects are truncated (no pagination yet).
- Area/Iteration path links point to the project security page, not the node itself.
- Tree expansion and the export menu are mouse-only (no keyboard navigation yet).

---

# Permission Audit — расширение для Azure DevOps Server 2022

Находит **все права** пользователя или группы во всей коллекции — назначенные
напрямую и унаследованные через (вложенные) группы — со ссылкой на страницу
безопасности, где каждое право выдано. Для администраторов коллекции
(Project Collection Administrators).

## Возможности

- Единый поиск с автокомплитом по пользователям **и** группам (бейджи USER/GROUP)
- Полный скан эффективных прав: все security namespaces (Git, Build, Release, Project, Area paths, Wiki, Dashboards, Service connections, …)
- Транзитивное раскрытие групп — права через вложенные AD-группы; каждая строка помечена `direct` или `via <группа>`
- Дерево результатов: Коллекция → Проект → Тип ресурса → Ресурс, у каждого права ссылка **→ open** на страницу, где его можно изменить
- Сводка с выделенным счётчиком **Deny**, фильтры по области / проекту / эффекту / названию права
- Экспорт отфильтрованного списка в CSV, Excel или JSON
- Отказоустойчивость: ошибка одной области превращается в предупреждение, скан продолжается; retry на 429/503

## Установка

1. Скачайте `.vsix` из [последнего релиза](../../releases/latest).
2. Откройте `https://{server}/{collection}/_gallery/manage` (локальная галерея коллекции).
3. Нажмите **Upload extension** и выберите `.vsix`.
4. Установите расширение в нужную коллекцию.
5. Откройте **Collection Settings** — пункт **Permission Audit** появится в сайдбаре (группа Extensions). Если не появился сразу — обновите страницу с Ctrl+F5.

> Если страница показывает `Error issuing session token: HostAuthorizationNotFound` —
> удалите расширение из коллекции и установите заново из галереи: это пересоздаёт
> запись host authorization.

## Использование

1. Введите имя пользователя или группы (от 2 символов) и выберите вариант из
   автокомплита. Кнопка **Find permissions** активируется только после выбора.
2. Нажмите **Find permissions**. Прогресс показывается по шагам; на больших
   коллекциях скан занимает 10–30 секунд.
3. Изучайте дерево. В каждой строке: Allow/Deny, название права, источник
   (напрямую или через группу) и ссылка **→ open** на страницу управления этим
   правом. В сводке указано, чьи права отображены.
4. Фильтруйте по области, проекту, эффекту или названию права. **Export** —
   выгрузка отфильтрованного списка в CSV, Excel или JSON.

Инструментом могут пользоваться только Project Collection Administrators —
остальные увидят понятное сообщение о нехватке прав.
