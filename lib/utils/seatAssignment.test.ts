import { describe, it, expect } from 'vitest';
import { getContiguousBlocks, pickBestBlock, assignSeats } from '@/lib/utils/seatAssignment';
import type { Seat } from '@/lib/utils/seatAssignment';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert seat labels like "A1", "B5" to the occupied-set key format. */
function occupied(...labels: string[]): Set<string> {
  return new Set(
    labels.map((label) => {
      const row = label.charCodeAt(0) - 65;
      const seat = parseInt(label.slice(1), 10);
      return `${row}-${seat}`;
    }),
  );
}

/** Convert a Seat[] result back to readable labels for assertions. */
function labels(seats: Seat[]): string[] {
  return seats.map((s) => String.fromCharCode(65 + s.rowIndex) + s.seatNumber);
}

/** Add assigned seats into an occupied set (for simulation tests). */
function markOccupied(set: Set<string>, seats: Seat[]): void {
  for (const s of seats) set.add(`${s.rowIndex}-${s.seatNumber}`);
}

// ---------------------------------------------------------------------------
// getContiguousBlocks
// ---------------------------------------------------------------------------

describe('getContiguousBlocks', () => {
  it('returns one block when the row is entirely available', () => {
    expect(getContiguousBlocks(new Set(), 0, 3, 8)).toEqual([[3, 4, 5, 6, 7, 8]]);
  });

  it('returns empty array when every seat in the range is occupied', () => {
    const occ = occupied('A3', 'A4', 'A5', 'A6', 'A7', 'A8');
    expect(getContiguousBlocks(occ, 0, 3, 8)).toEqual([]);
  });

  it('splits around occupied seats in the middle', () => {
    const occ = occupied('A4', 'A6');
    // available in 3-8: 3, 5, 7, 8
    expect(getContiguousBlocks(occ, 0, 3, 8)).toEqual([[3], [5], [7, 8]]);
  });

  it('handles occupied seats at both edges of the range', () => {
    const occ = occupied('A3', 'A8');
    expect(getContiguousBlocks(occ, 0, 3, 8)).toEqual([[4, 5, 6, 7]]);
  });

  it('returns single-seat blocks for isolated available seats', () => {
    const occ = occupied('A3', 'A5', 'A7');
    // available: 4, 6, 8
    expect(getContiguousBlocks(occ, 0, 3, 8)).toEqual([[4], [6], [8]]);
  });

  it('only considers the specified row index', () => {
    // Row B occupied — querying row A should see nothing occupied
    const occ = occupied('B3', 'B4', 'B5');
    expect(getContiguousBlocks(occ, 0, 3, 5)).toEqual([[3, 4, 5]]);
  });

  it('works with a single-seat range', () => {
    expect(getContiguousBlocks(new Set(), 0, 5, 5)).toEqual([[5]]);
  });

  it('returns empty when min > max', () => {
    expect(getContiguousBlocks(new Set(), 0, 8, 3)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// pickBestBlock
// ---------------------------------------------------------------------------

describe('pickBestBlock', () => {
  it('returns the block on an exact fit', () => {
    expect(pickBestBlock([[3, 4, 5]], 3, false)).toEqual([3, 4, 5]);
  });

  it('prefers exact fit over a larger block', () => {
    // [3..8] remainder 3; [10,11,12] exact fit
    expect(
      pickBestBlock(
        [
          [3, 4, 5, 6, 7, 8],
          [10, 11, 12],
        ],
        3,
        false,
      ),
    ).toEqual([10, 11, 12]);
  });

  it('prefers the smallest sufficient remainder when no exact fit', () => {
    // [3..7] remainder 2; [10..15] remainder 3
    expect(
      pickBestBlock(
        [
          [3, 4, 5, 6, 7],
          [10, 11, 12, 13, 14, 15],
        ],
        3,
        false,
      ),
    ).toEqual([3, 4, 5]);
  });

  it('skips blocks with remainder == 1 when not accepted', () => {
    // [3,4,5,6] → remainder 1 for qty 3
    expect(pickBestBlock([[3, 4, 5, 6]], 3, false)).toBeNull();
  });

  it('accepts remainder == 1 when the flag is set', () => {
    expect(pickBestBlock([[3, 4, 5, 6]], 3, true)).toEqual([3, 4, 5]);
  });

  it('returns null when every block is too small', () => {
    expect(
      pickBestBlock(
        [
          [3, 4],
          [6, 7],
        ],
        3,
        false,
      ),
    ).toBeNull();
  });

  it('returns null for an empty blocks array', () => {
    expect(pickBestBlock([], 2, false)).toBeNull();
  });

  it('takes seats from the start of the block', () => {
    // [5,6,7,8,9] qty 2 → [5,6], remainder stays contiguous at [7,8,9]
    expect(pickBestBlock([[5, 6, 7, 8, 9]], 2, false)).toEqual([5, 6]);
  });
});

// ---------------------------------------------------------------------------
// assignSeats — normal orders
// ---------------------------------------------------------------------------

describe('assignSeats — normal orders', () => {
  // Standard venue for most tests: 3 rows (A/B/C), 10 seats per row.
  // Left zone: 1-2 | Normal zone: 3-8 | Right zone: 9-10
  const ROWS = 3;
  const SEATS = 10;

  it('assigns from the start of the normal zone on an empty venue', () => {
    expect(labels(assignSeats(new Set(), ROWS, SEATS, 2, false))).toEqual(['A3', 'A4']);
  });

  it('skips to next row when continuing would leave a single-seat gap', () => {
    // Row A normal zone available: [5,6,7,8] — taking 3 leaves seat 8 isolated (remainder==1).
    // Algorithm skips row A and assigns from row B instead.
    const occ = occupied('A3', 'A4');
    expect(labels(assignSeats(occ, ROWS, SEATS, 3, false))).toEqual(['B3', 'B4', 'B5']);
  });

  it('moves to the next row when the current normal zone is full', () => {
    const occ = occupied('A3', 'A4', 'A5', 'A6', 'A7', 'A8');
    expect(labels(assignSeats(occ, ROWS, SEATS, 2, false))).toEqual(['B3', 'B4']);
  });

  it('skips a row to avoid leaving a single-seat gap', () => {
    // Row A normal: [3,4,5,6,7] (A8 taken) → remainder 1 for qty 4 → skip
    // Row B normal: [3,4,5,6,7,8]          → remainder 2 for qty 4 → use
    const occ = occupied('A8');
    expect(labels(assignSeats(occ, ROWS, SEATS, 4, false))).toEqual(['B3', 'B4', 'B5', 'B6']);
  });

  it('spills into the left zone when every row has remainder == 1 in normal zone', () => {
    // Normal zone is 6 seats (3-8). qty 5 → remainder 1 in every row → all skipped.
    // Phase 2 includes left zone: block [1..8] = 8, remainder 3 → accepted.
    expect(labels(assignSeats(new Set(), ROWS, SEATS, 5, false))).toEqual([
      'A1',
      'A2',
      'A3',
      'A4',
      'A5',
    ]);
  });

  it('accepts remainder == 1 in phase 3 when no better option exists', () => {
    // 1 row, 6 seats.  Normal zone: 3-4 (2 seats). Left+normal: 1-4 (4 seats).
    // qty 3 → normal too small, left+normal remainder 1 → phase 2 skips, phase 3 accepts.
    expect(labels(assignSeats(new Set(), 1, 6, 3, false))).toEqual(['A1', 'A2', 'A3']);
  });

  it('uses the right zone only when left + normal cannot fit the group', () => {
    // 1 row, 6 seats.  Available: seats 4, 5 only.
    // Normal (3-4): [4] too small.  Left+normal (1-4): [4] too small.
    // Full row (1-6): [4,5] exact fit for qty 2.
    const occ = occupied('A1', 'A2', 'A3', 'A6');
    expect(labels(assignSeats(occ, 1, 6, 2, false))).toEqual(['A4', 'A5']);
  });

  it('prefers the left zone over the right zone when normal is full', () => {
    // All normal zones full; left zones still available.
    const occ = occupied(
      'A3',
      'A4',
      'A5',
      'A6',
      'A7',
      'A8',
      'B3',
      'B4',
      'B5',
      'B6',
      'B7',
      'B8',
      'C3',
      'C4',
      'C5',
      'C6',
      'C7',
      'C8',
    );
    expect(labels(assignSeats(occ, ROWS, SEATS, 2, false))).toEqual(['A1', 'A2']);
  });

  it('fluid-fills non-contiguous seats when the venue is nearly full', () => {
    // Only A2, B5, C1 available across 3 rows of 6.
    const occ = occupied(
      'A1',
      'A3',
      'A4',
      'A5',
      'A6',
      'B1',
      'B2',
      'B3',
      'B4',
      'B6',
      'C2',
      'C3',
      'C4',
      'C5',
      'C6',
    );
    expect(labels(assignSeats(occ, 3, 6, 3, false))).toEqual(['A2', 'B5', 'C1']);
  });
});

// ---------------------------------------------------------------------------
// assignSeats — wheelchair orders
// ---------------------------------------------------------------------------

describe('assignSeats — wheelchair orders', () => {
  const ROWS = 3;
  const SEATS = 10;

  it('assigns the right end of the first row on an empty venue', () => {
    expect(labels(assignSeats(new Set(), ROWS, SEATS, 2, true))).toEqual(['A9', 'A10']);
  });

  it('moves to the next row when the right end is taken', () => {
    const occ = occupied('A9', 'A10');
    expect(labels(assignSeats(occ, ROWS, SEATS, 2, true))).toEqual(['B9', 'B10']);
  });

  it('falls back to the left end when all right ends are taken', () => {
    const occ = occupied('A9', 'A10', 'B9', 'B10', 'C9', 'C10');
    expect(labels(assignSeats(occ, ROWS, SEATS, 2, true))).toEqual(['A1', 'A2']);
  });

  it('falls back to the normal zone when both ends of every row are taken', () => {
    const occ = occupied('A1', 'A2', 'A9', 'A10', 'B1', 'B2', 'B9', 'B10', 'C1', 'C2', 'C9', 'C10');
    expect(labels(assignSeats(occ, ROWS, SEATS, 2, true))).toEqual(['A3', 'A4']);
  });

  it('extends inward from the right end for a group of 3', () => {
    // startSeat = 10 - 3 + 1 = 8
    expect(labels(assignSeats(new Set(), ROWS, SEATS, 3, true))).toEqual(['A8', 'A9', 'A10']);
  });

  it('extends inward from the left end for a group of 3 when right ends are full', () => {
    const occ = occupied('A8', 'A9', 'A10', 'B8', 'B9', 'B10', 'C8', 'C9', 'C10');
    expect(labels(assignSeats(occ, ROWS, SEATS, 3, true))).toEqual(['A1', 'A2', 'A3']);
  });

  it('assigns a single wheelchair seat at the last position in the row', () => {
    // startSeat = 10 - 1 + 1 = 10
    expect(labels(assignSeats(new Set(), ROWS, SEATS, 1, true))).toEqual(['A10']);
  });
});

// ---------------------------------------------------------------------------
// assignSeats — edge cases
// ---------------------------------------------------------------------------

describe('assignSeats — edge cases', () => {
  it('returns an empty array when the venue is completely full', () => {
    const occ = occupied('A1', 'A2', 'A3', 'A4');
    expect(assignSeats(occ, 1, 4, 1, false)).toEqual([]);
  });

  it('returns the single remaining seat via fluid fill', () => {
    const occ = occupied('A1', 'A2', 'A4');
    expect(labels(assignSeats(occ, 1, 4, 1, false))).toEqual(['A3']);
  });

  it('handles a small venue where the normal zone is empty (seatsPerRow = 4)', () => {
    // normalMax = 4 - 2 = 2, normalMin = 3 → normal zone skipped entirely.
    // Phase 2: left + normal scans seats 1-2 → block [1,2], exact fit for qty 2.
    expect(labels(assignSeats(new Set(), 2, 4, 2, false))).toEqual(['A1', 'A2']);
  });

  it('wheelchair on a small venue (seatsPerRow = 4) uses the right end', () => {
    // Right zone: seats 3, 4
    expect(labels(assignSeats(new Set(), 2, 4, 2, true))).toEqual(['A3', 'A4']);
  });

  it('quantity larger than seatsPerRow falls back to fluid fill across rows', () => {
    // 3 rows of 4 seats, qty 5. No single row can hold 5 contiguous seats.
    // Fluid fill picks A1, A2, A3, A4, B1.
    expect(labels(assignSeats(new Set(), 3, 4, 5, false))).toEqual(['A1', 'A2', 'A3', 'A4', 'B1']);
  });
});

// ---------------------------------------------------------------------------
// assignSeats — sequential booking simulation
// ---------------------------------------------------------------------------

describe('assignSeats — sequential booking simulation', () => {
  it('simulates a realistic evening of bookings without conflicts', () => {
    // 3 rows, 10 seats.  Left: 1-2 | Normal: 3-8 | Right: 9-10
    const occ = new Set<string>();

    // Order 1 — normal, 4 tickets → fills start of normal zone in row A
    const o1 = assignSeats(occ, 3, 10, 4, false);
    expect(labels(o1)).toEqual(['A3', 'A4', 'A5', 'A6']);
    markOccupied(occ, o1);

    // Order 2 — normal, 2 tickets → continues in row A normal zone
    const o2 = assignSeats(occ, 3, 10, 2, false);
    expect(labels(o2)).toEqual(['A7', 'A8']);
    markOccupied(occ, o2);

    // Order 3 — wheelchair, 2 tickets → right end of row A (untouched by normals)
    const o3 = assignSeats(occ, 3, 10, 2, true);
    expect(labels(o3)).toEqual(['A9', 'A10']);
    markOccupied(occ, o3);

    // Order 4 — normal, 3 tickets → row A normal full, goes to row B
    const o4 = assignSeats(occ, 3, 10, 3, false);
    expect(labels(o4)).toEqual(['B3', 'B4', 'B5']);
    markOccupied(occ, o4);

    // Order 5 — wheelchair, 2 tickets → row A right taken, goes to row B right
    const o5 = assignSeats(occ, 3, 10, 2, true);
    expect(labels(o5)).toEqual(['B9', 'B10']);
    markOccupied(occ, o5);

    // Order 6 — normal, 6 tickets → row B normal has 3 left (6,7,8), not enough.
    //   Row C normal has 6 (3-8), remainder 0 — exact fit.
    const o6 = assignSeats(occ, 3, 10, 6, false);
    expect(labels(o6)).toEqual(['C3', 'C4', 'C5', 'C6', 'C7', 'C8']);
    markOccupied(occ, o6);

    // Order 7 — wheelchair, 2 tickets → rows A & B right taken, row C right free
    const o7 = assignSeats(occ, 3, 10, 2, true);
    expect(labels(o7)).toEqual(['C9', 'C10']);
    markOccupied(occ, o7);

    // Verify: left zones (A1,A2 / B1,B2 / C1,C2) are all still free — never
    // touched by any normal order because normal + right zones were sufficient.
    expect(occ.has('0-1')).toBe(false); // A1
    expect(occ.has('0-2')).toBe(false); // A2
    expect(occ.has('1-1')).toBe(false); // B1
    expect(occ.has('1-2')).toBe(false); // B2
    expect(occ.has('2-1')).toBe(false); // C1
    expect(occ.has('2-2')).toBe(false); // C2
  });
});
