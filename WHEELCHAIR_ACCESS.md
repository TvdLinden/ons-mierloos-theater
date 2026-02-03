# Wheelchair Access Feature

## Goal

Allow customers to indicate they need wheelchair access when purchasing tickets. The system assigns their group to seats at the end of a row (next to the wheelchair spot) so they stay together. Theater staff are notified so they can accommodate.

## Seat Layout Convention

Each row has two wheelchair zones. Normal orders fill the middle. The right zone stays reserved for wheelchair orders the longest — the left zone gets donated to normal orders once the middle is full.

```
     1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20
    [WC][P] .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  [P][WC]

    [WC] = wheelchair spot (seat 1 and seat N)
    [P]  = partner seat (seat 2 and seat N-1)
    [.]  = normal fill zone (seats 3 to N-2)
```

- **Left zone:** seats 1–2
- **Right zone:** seats N-1–N
- **Normal zone:** seats 3 to N-2

## Seat Assignment Algorithm

Seat assignment happens in the worker when payment succeeds (`paymentWebhookHandler`). It queries the `tickets` table to get actually-occupied seats — the current counter-based approach (`totalCapacity - availableSeats`) cannot handle non-sequential assignment.

### Normal orders

```
Phase 1 — contiguous block in normal zone (seats 3 to N-2), rows front to back:
  - Find all contiguous blocks of available seats in the normal zone
  - Pick the best block:
      1. Exact fit (block size == quantity)        ← best
      2. Remainder >= 2 (leftover stays sellable)  ← fine
      3. Remainder == 1 (isolated single seat)     ← skip row, try next
  - Assign from the START of the chosen block (keeps remainder contiguous)

Phase 2 — expand to include left zone (seats 1–2):
  - Same block-selection logic as Phase 1, but seats 1 and 2 are now available
  - Only reached when no row has a suitable block in the normal zone alone

Phase 3 — fluid fill:
  - Venue is nearly full, no contiguous block of the right size exists anywhere
  - Assign any available seats, across rows if needed
  - Includes right zone (seats N-1, N) as last resort
```

### Wheelchair orders

```
Phase 1 — right end of row (preferred):
  - Find a row where seats N, N-1, ... (extending left) are available for the full quantity
  - Example: quantity 2 → seats 19, 20. Quantity 3 → seats 18, 19, 20.

Phase 2 — left end of row:
  - Same as Phase 1 but from seat 1 rightward
  - Only used if no row has space at the right end

Phase 3 — fallback to normal order logic:
  - No end-of-row block available at all
  - Assign any contiguous block using the normal order phases
  - Flag the line item so staff are notified (see below)
```

### Processing order

Within a single order, non-wheelchair line items are assigned first. This keeps the wheelchair zones open for wheelchair line items in the same order.

## Schema Change

Add one column to `lineItems`:

```typescript
wheelchairAccess: boolean('wheelchair_access').notNull().default(false);
```

No new tables. The wheelchair zone boundaries (2 seats per end) are a fixed convention, not stored in the database.

## Staff Visibility — Admin Sales Page

No separate notification email. Staff already checks the per-performance sales page (`admin/sales/shows/[id]`) before each show. We add the wheelchair info there:

1. **StatCard** — wheelchair booking count alongside the existing ticket/revenue/order stats.
2. **Wheelchair section** — a small block just below the stats listing the booked seats, grouped by customer. Tickets are already generated at this point so the seat numbers are available.

```
  Totaal Tickets    Totale Omzet    Bestellingen    Rolstoel
      87              €1,305           42              2

  Rolstoel plaatsen:
    A19, A20  —  Jan Jansen
    B1, B2    —  Piet de Vries
```

**Query:** fetch `lineItems` where `performanceId` matches and `wheelchairAccess = true`, join `tickets` to get `rowLetter` + `seatNumber`, join `orders` for customer name. One extra query, mapped in memory.

## Files to Change

| File                                         | What changes                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `lib/db/schema.ts`                           | Add `wheelchairAccess` column to `lineItems`                                                            |
| `lib/commands/ticketSales.ts`                | Accept `wheelchairAccess` in `createLineItems` input                                                    |
| `lib/commands/tickets.ts`                    | Rewrite `createTicketsForLineItem` — replace counter-based assignment with query-driven algorithm above |
| `components/ShoppingCart.tsx`                | Add `wheelchairAccess` to `CartItem` type                                                               |
| `components/CartContext.tsx`                 | Thread `wheelchairAccess` through cart state                                                            |
| `app/checkout/CheckoutForm.tsx`              | Render a wheelchair checkbox per cart item                                                              |
| `app/checkout/actions.ts`                    | Read `wheelchairAccess` per item from form data, pass to `createLineItems`                              |
| `lib/jobs/handlers/paymentWebhookHandler.ts` | Sort line items (non-wheelchair first), pass flag to `createTicketsForLineItem`                         |
| `app/admin/sales/shows/[id]/page.tsx`        | Add wheelchair StatCard + seat listing section below stats                                              |

## Migration

A Drizzle migration is needed for the new column. Run after schema change:

```bash
npm run db:generate   # generates migration file
npm run db:migrate    # applies it
```
