---
name: add-admin-page
description: Scaffold a new admin CRUD page following the project's established conventions
disable-model-invocation: true
argument-hint: <resource-name>
---

Scaffold a new admin CRUD page for the given resource. The argument is the plural resource name (e.g. "sponsors", "coupons").

Resource: $ARGUMENTS

---

## Directory structure to create

```
app/admin/{resource}/
├── page.tsx                  # List page
├── add/page.tsx              # Create form
└── edit/[id]/page.tsx        # Edit form

lib/queries/{resource}.ts     # Read operations (if not existing)
lib/commands/{resource}.ts    # Write operations (if not existing)
```

If filtering or pagination is needed on the list page, also create:
```
app/admin/{resource}/{Resource}TableClient.tsx   # Client component
app/api/admin/{resource}/search/route.ts         # Search API endpoint
```

---

## Conventions to follow

### Layout
The shared `app/admin/layout.tsx` already provides fullscreen padding and role checks.
- Do NOT wrap content in `max-w-*`, `container`, or `mx-auto`.
- Do NOT call `requireRole()` again — it runs in the layout.

### Page header
Every page starts with `AdminPageHeader`:

```tsx
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

<AdminPageHeader
  title="Resource Title"
  breadcrumbs={[
    { label: 'Resource', href: '/admin/{resource}' },
    { label: 'Current page label' },  // last item has no href
  ]}
  action={{ href: '/admin/{resource}/add', label: 'Nieuw item toevoegen' }}  // list page only
/>
```

The first breadcrumb item is always the list page with a link. The last item is the current page with no `href`.

### Data table — simple (no filters/pagination)
Use `DataTable` directly with static data from a server query:

```tsx
import { DataTable, EmptyRow } from '@/components/admin/DataTable';

<DataTable
  title="Resource"
  headers={['Kolom 1', 'Kolom 2', 'Acties']}
>
  {items.length === 0 ? (
    <EmptyRow colSpan={3} message="Nog geen items" />
  ) : (
    items.map((item) => (
      <tr key={item.id} className="hover:bg-zinc-50">
        <td className="px-6 py-4">{item.name}</td>
        ...
      </tr>
    ))
  )}
</DataTable>
```

### Data table — with filters and pagination
Follow the pattern in `app/admin/sales/OrderSearchClient.tsx` and `app/admin/shows/ShowsTableClient.tsx`:

1. Create an API endpoint at `app/api/admin/{resource}/search/route.ts` that accepts query params (`search`, `status`, `offset`, `limit`, etc.) and returns `{ data, total, totalPages }`.
2. Create a client component that:
   - Uses `usePagination` from `@/hooks/usePagination`
   - Uses `useDebouncedValue` from `@/hooks/useDebounce` for text/date inputs
   - Fetches from the API on filter/page change
   - Passes `filterDefinitions`, `filters`, `onFiltersChangeAction`, `currentPage`, `totalPages`, `onPageChangeAction` to `DataTable`
3. Import the client component into the list `page.tsx` and render it.

### Data access layer
- **Queries** (reads): `lib/queries/{resource}.ts` — functions like `getAll{Resource}()`, `get{Resource}ById(id)`
- **Commands** (writes): `lib/commands/{resource}.ts` — functions like `create{Resource}(data)`, `update{Resource}(id, data)`, `delete{Resource}(id)`
- Import db types from `@/lib/db`
- Import table definitions from `@/lib/db/schema`

### Add / Edit pages
Both use `AdminPageHeader` with appropriate breadcrumbs. The form can be a shared component (e.g. `{Resource}Form.tsx`) or inline server actions — match the pattern used by similar resources in the project.

### Language
All UI text must be in Dutch. Common terms:

| English | Dutch |
|---|---|
| Add | Toevoegen |
| Edit | Bewerken |
| Delete | Verwijderen |
| Save | Opslaan |
| Cancel | Annuleren |
| Search | Zoeken |
| All | Alle |
| No items found | Geen items gevonden |
| Created | Aangemaakt |
| Updated | Bijgewerkt |

---

## After scaffolding

Run `/quality` to verify everything compiles and passes lint before committing.
