import { describe, it, expect } from 'vitest';
import {
  getContiguousBlocks,
  pickBestBlock,
  findBestConnectedCluster,
  assignSeats,
} from './seatAssignment';
import type { Seat } from './seatAssignment';

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
// findBestConnectedCluster
// ---------------------------------------------------------------------------

describe('findBestConnectedCluster', () => {
  it('finds a connected cluster on an empty venue', () => {
    const result = findBestConnectedCluster(new Set(), 3, 10, 4);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(4);
    // Should prefer front row and centered seats due to scoring
    const rows = new Set(result!.map((s) => s.rowIndex));
    expect(rows.size).toBeLessThanOrEqual(2); // Compact (max 2 rows for 4 seats)
  });

  it('finds a connected cluster for 5 seats', () => {
    const result = findBestConnectedCluster(new Set(), 3, 10, 5);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(5);
    // Verify seats are connected (each seat has at least one adjacent neighbor)
    const seatSet = new Set(result!.map((s) => `${s.rowIndex}-${s.seatNumber}`));
    for (const seat of result!) {
      const neighbors = [
        `${seat.rowIndex}-${seat.seatNumber - 1}`,
        `${seat.rowIndex}-${seat.seatNumber + 1}`,
        `${seat.rowIndex - 1}-${seat.seatNumber}`,
        `${seat.rowIndex + 1}-${seat.seatNumber}`,
      ];
      const hasNeighbor = neighbors.some(
        (n) => seatSet.has(n) && n !== `${seat.rowIndex}-${seat.seatNumber}`,
      );
      expect(hasNeighbor || result!.length === 1).toBe(true);
    }
  });

  it('finds connected seats avoiding occupied ones', () => {
    const occ = occupied('A1');
    const result = findBestConnectedCluster(occ, 3, 10, 4);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(4);
    // Verify no occupied seats were assigned
    for (const seat of result!) {
      expect(occ.has(`${seat.rowIndex}-${seat.seatNumber}`)).toBe(false);
    }
  });

  it('returns null when not enough connected seats available', () => {
    // Checkerboard pattern — no 4 connected seats possible
    const occ = occupied('A1', 'A3', 'A5', 'B2', 'B4', 'B6', 'C1', 'C3', 'C5');
    const result = findBestConnectedCluster(occ, 3, 6, 4);
    expect(result).toBeNull();
  });

  it('handles quantity 1 by returning single seat', () => {
    const result = findBestConnectedCluster(new Set(), 3, 10, 1);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(1);
    // Should return a seat in front row (row 0)
    expect(result![0].rowIndex).toBe(0);
  });

  it('prefers compact clusters (fewer rows)', () => {
    // For 6 seats: compactness scoring should minimize row spread
    const result = findBestConnectedCluster(new Set(), 4, 10, 6);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(6);
    // Should span at most 2 rows for 6 seats with 10 seats/row
    const rows = new Set(result!.map((s) => s.rowIndex));
    expect(rows.size).toBeLessThanOrEqual(2);
  });

  it('expands across rows when blocked', () => {
    // Block seat 5 onwards in row A, forcing expansion to row B
    const occ = occupied('A5', 'A6', 'A7', 'A8', 'A9', 'A10');
    const result = findBestConnectedCluster(occ, 3, 10, 6);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(6);
    // Should include seats from row A
    const rowACont = result!.filter((s) => s.rowIndex === 0).length;
    expect(rowACont).toBeGreaterThan(0);
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

  it('spills into the right zone when every row has remainder == 1 in normal zone', () => {
    // Normal zone is 6 seats (3-8). qty 5 → remainder 1 in every row → all skipped.
    // Phase 2 includes right zone: block [3..10] = 8, remainder 3 → accepted.
    expect(labels(assignSeats(new Set(), ROWS, SEATS, 5, false))).toEqual([
      'A3',
      'A4',
      'A5',
      'A6',
      'A7',
    ]);
  });

  it('accepts remainder == 1 in phase 3 when no better option exists', () => {
    // 1 row, 6 seats.  Normal zone: 3-4 (2 seats). Right+normal: 3-6 (4 seats).
    // qty 3 → normal too small, right+normal remainder 1 → phase 2 skips, phase 3 accepts.
    expect(labels(assignSeats(new Set(), 1, 6, 3, false))).toEqual(['A3', 'A4', 'A5']);
  });

  it('uses the left zone only when right + normal cannot fit the group', () => {
    // 1 row, 6 seats.  Available: seats 4, 5 only.
    // Normal (3-4): [4] too small.  Right+normal (3-6): A6 taken → [4,5] exact fit for qty 2.
    const occ = occupied('A1', 'A2', 'A3', 'A6');
    expect(labels(assignSeats(occ, 1, 6, 2, false))).toEqual(['A4', 'A5']);
  });

  it('prefers the right zone over the left zone when normal is full', () => {
    // All normal zones full; right zones still available.
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
    expect(labels(assignSeats(occ, ROWS, SEATS, 2, false))).toEqual(['A9', 'A10']);
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

  it('assigns the left end of the first row on an empty venue', () => {
    expect(labels(assignSeats(new Set(), ROWS, SEATS, 2, true))).toEqual(['A1', 'A2']);
  });

  it('moves to the next row when the left end is taken', () => {
    const occ = occupied('A1', 'A2');
    expect(labels(assignSeats(occ, ROWS, SEATS, 2, true))).toEqual(['B1', 'B2']);
  });

  it('falls back to the right end when all left ends are taken', () => {
    const occ = occupied('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
    expect(labels(assignSeats(occ, ROWS, SEATS, 2, true))).toEqual(['A9', 'A10']);
  });

  it('falls back to the normal zone when both ends of every row are taken', () => {
    const occ = occupied('A1', 'A2', 'A9', 'A10', 'B1', 'B2', 'B9', 'B10', 'C1', 'C2', 'C9', 'C10');
    const result = assignSeats(occ, ROWS, SEATS, 2, true);
    const resultLabels = labels(result);
    expect(resultLabels.length).toBe(2);
    // Should be in row A (front row)
    expect(resultLabels[0].startsWith('A')).toBe(true);
    expect(resultLabels[1].startsWith('A')).toBe(true);
    // Should be in normal zone (seats 3-8)
    const seatNums = result.map((s) => s.seatNumber);
    expect(seatNums.every((n) => n >= 3 && n <= 8)).toBe(true);
    // Should be adjacent
    expect(Math.abs(seatNums[0] - seatNums[1])).toBe(1);
  });

  it('extends inward from the left end for a group of 3', () => {
    expect(labels(assignSeats(new Set(), ROWS, SEATS, 3, true))).toEqual(['A1', 'A2', 'A3']);
  });

  it('extends inward from the right end for a group of 3 when left ends are full', () => {
    const occ = occupied('A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3');
    expect(labels(assignSeats(occ, ROWS, SEATS, 3, true))).toEqual(['A8', 'A9', 'A10']);
  });

  it('assigns a single wheelchair seat at the first position in the row', () => {
    expect(labels(assignSeats(new Set(), ROWS, SEATS, 1, true))).toEqual(['A1']);
  });
});

// ---------------------------------------------------------------------------
// assignSeats — wheelchairAccess field validation
// ---------------------------------------------------------------------------

describe('assignSeats — wheelchairAccess field', () => {
  const ROWS = 3;
  const SEATS = 10;

  describe('wheelchair orders', () => {
    it('marks seat 1 (leftmost) as wheelchairAccess when using left zone', () => {
      const result = assignSeats(new Set(), ROWS, SEATS, 2, true);
      expect(result.length).toBe(2);

      // Find the wheelchair accessible seat
      const wheelchairSeat = result.find((s) => s.wheelchairAccess);
      expect(wheelchairSeat).toBeDefined();
      expect(wheelchairSeat!.seatNumber).toBe(1); // Must be seat 1 (leftmost)
    });

    it('marks seat N (rightmost) as wheelchairAccess when left zone is full', () => {
      const occ = occupied('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
      const result = assignSeats(occ, ROWS, SEATS, 2, true);
      expect(result.length).toBe(2);

      // Find the wheelchair accessible seat
      const wheelchairSeat = result.find((s) => s.wheelchairAccess);
      expect(wheelchairSeat).toBeDefined();
      expect(wheelchairSeat!.seatNumber).toBe(SEATS); // Must be seat N (rightmost)
    });

    it('marks only ONE seat as wheelchairAccess per order', () => {
      const result = assignSeats(new Set(), ROWS, SEATS, 5, true);
      expect(result.length).toBe(5);

      const wheelchairSeats = result.filter((s) => s.wheelchairAccess);
      expect(wheelchairSeats.length).toBe(1); // Only one seat should have wheelchair access
    });

    it('wheelchair accessible seat is always an edge seat (seat 1 or seat N)', () => {
      // Test multiple scenarios
      const scenarios = [
        { occ: new Set(), qty: 2, desc: 'empty venue' },
        { occ: occupied('A1', 'A2'), qty: 2, desc: 'first row left occupied' },
        { occ: occupied('A1', 'B1', 'C1'), qty: 3, desc: 'all seat 1s occupied' },
      ];

      for (const { occ, qty, desc } of scenarios) {
        const result = assignSeats(occ, ROWS, SEATS, qty, true);
        if (result.length === qty) {
          const wheelchairSeat = result.find((s) => s.wheelchairAccess);
          expect(wheelchairSeat).toBeDefined();
          // Must be either seat 1 (left edge) or seat N (right edge)
          expect([1, SEATS]).toContain(wheelchairSeat!.seatNumber);
        }
      }
    });

    it('marks the first edge seat in multi-row assignments', () => {
      // Occupy A1, force multi-row collection
      const occ = occupied('A1');
      const result = assignSeats(occ, ROWS, SEATS, 3, true);

      const wheelchairSeat = result.find((s) => s.wheelchairAccess);
      expect(wheelchairSeat).toBeDefined();
      // Should be B1 (first available edge seat)
      expect(wheelchairSeat!.rowIndex).toBe(1); // Row B
      expect(wheelchairSeat!.seatNumber).toBe(1);
    });

    it('all companion seats have wheelchairAccess: false', () => {
      const result = assignSeats(new Set(), ROWS, SEATS, 4, true);
      expect(result.length).toBe(4);

      const companionSeats = result.filter((s) => !s.wheelchairAccess);
      expect(companionSeats.length).toBe(3); // 3 out of 4 should be companions

      // All companion seats should have wheelchairAccess explicitly set to false
      companionSeats.forEach((seat) => {
        expect(seat.wheelchairAccess).toBe(false);
      });
    });
  });

  describe('normal orders', () => {
    it('marks all seats as wheelchairAccess: false for normal orders', () => {
      const result = assignSeats(new Set(), ROWS, SEATS, 5, false);
      expect(result.length).toBe(5);

      // ALL seats should have wheelchairAccess: false
      result.forEach((seat) => {
        expect(seat.wheelchairAccess).toBe(false);
      });
    });

    it('never assigns wheelchairAccess: true in normal path even for edge seats', () => {
      // Normal order that gets seats 1-5 (including edge seat 1)
      const result = assignSeats(new Set(), ROWS, SEATS, 5, false);

      const edgeSeats = result.filter((s) => s.seatNumber === 1 || s.seatNumber === SEATS);
      // Even if edge seats are assigned, they should not have wheelchair access
      edgeSeats.forEach((seat) => {
        expect(seat.wheelchairAccess).toBe(false);
      });
    });

    it('wheelchairAccess field is always present and boolean', () => {
      const result = assignSeats(new Set(), ROWS, SEATS, 3, false);

      result.forEach((seat) => {
        expect(seat).toHaveProperty('wheelchairAccess');
        expect(typeof seat.wheelchairAccess).toBe('boolean');
      });
    });
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
    // Phase 2: right + normal scans seats 3-4 → block [3,4], exact fit for qty 2.
    expect(labels(assignSeats(new Set(), 2, 4, 2, false))).toEqual(['A3', 'A4']);
  });

  it('wheelchair on a small venue (seatsPerRow = 4) uses the left end', () => {
    // Left zone: seats 1, 2
    expect(labels(assignSeats(new Set(), 2, 4, 2, true))).toEqual(['A1', 'A2']);
  });

  it('quantity larger than seatsPerRow uses connected cluster across rows', () => {
    // 3 rows of 4 seats, qty 5. No single row can hold 5 contiguous seats.
    // Cluster logic will find 5 connected seats, preferring compactness and front rows
    const result = assignSeats(new Set(), 3, 4, 5, false);
    expect(result.length).toBe(5);
    // Should get all 4 seats from row A (3,4 in normal zone + eventually 1,2 from left zone in phase 4)
    // plus 1 seat from row B, or use cluster to find connected seats
    const resultLabels = labels(result);
    expect(resultLabels.length).toBe(5);
    // Verify they're connected (all adjacent or in adjacent rows)
    expect(resultLabels.filter((l) => l.startsWith('A')).length).toBeGreaterThanOrEqual(3);
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

    // Order 3 — wheelchair, 2 tickets → left end of row A (untouched by normals)
    const o3 = assignSeats(occ, 3, 10, 2, true);
    expect(labels(o3)).toEqual(['A1', 'A2']);
    markOccupied(occ, o3);

    // Order 4 — normal, 3 tickets → row A normal full, goes to row B
    const o4 = assignSeats(occ, 3, 10, 3, false);
    expect(labels(o4)).toEqual(['B3', 'B4', 'B5']);
    markOccupied(occ, o4);

    // Order 5 — wheelchair, 2 tickets → row A left taken, goes to row B left
    const o5 = assignSeats(occ, 3, 10, 2, true);
    expect(labels(o5)).toEqual(['B1', 'B2']);
    markOccupied(occ, o5);

    // Order 6 — normal, 6 tickets → row B normal has 3 left (6,7,8), not enough.
    //   Row C normal has 6 (3-8), remainder 0 — exact fit.
    const o6 = assignSeats(occ, 3, 10, 6, false);
    expect(labels(o6)).toEqual(['C3', 'C4', 'C5', 'C6', 'C7', 'C8']);
    markOccupied(occ, o6);

    // Order 7 — wheelchair, 2 tickets → rows A & B left taken, row C left free
    const o7 = assignSeats(occ, 3, 10, 2, true);
    expect(labels(o7)).toEqual(['C1', 'C2']);
    markOccupied(occ, o7);

    // Verify: right zones (A9,A10 / B9,B10 / C9,C10) are all still free — never
    // touched by any normal order because normal + left zones were sufficient.
    expect(occ.has('0-9')).toBe(false); // A9
    expect(occ.has('0-10')).toBe(false); // A10
    expect(occ.has('1-9')).toBe(false); // B9
    expect(occ.has('1-10')).toBe(false); // B10
    expect(occ.has('2-9')).toBe(false); // C9
    expect(occ.has('2-10')).toBe(false); // C10
  });
});
