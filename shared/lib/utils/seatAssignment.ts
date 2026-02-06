export type Seat = { rowIndex: number; seatNumber: number };

/**
 * Find contiguous blocks of available seats within a seat range in a row.
 */
export function getContiguousBlocks(
  occupiedSeats: Set<string>,
  rowIndex: number,
  minSeat: number,
  maxSeat: number,
): number[][] {
  const blocks: number[][] = [];
  let current: number[] = [];
  for (let s = minSeat; s <= maxSeat; s++) {
    if (!occupiedSeats.has(`${rowIndex}-${s}`)) {
      current.push(s);
    } else {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
    }
  }
  if (current.length > 0) blocks.push(current);
  return blocks;
}

/**
 * Try to fit seats in a rectangular block across consecutive rows.
 * For example, 4 seats could be placed as 2 seats × 2 rows (seats at the same
 * column positions in each row).  Prefers fewer rows (= wider blocks) so the
 * group stays close together.
 */
export function findAdjacentBlock(
  occupiedSeats: Set<string>,
  rows: number,
  seatsPerRow: number,
  quantity: number,
): Seat[] | null {
  for (let numRows = 2; numRows <= Math.min(quantity, rows); numRows++) {
    const width = Math.ceil(quantity / numRows);
    if (width * numRows < quantity) continue;

    for (let startRow = 0; startRow <= rows - numRows; startRow++) {
      for (let startSeat = 1; startSeat <= seatsPerRow - width + 1; startSeat++) {
        let allFree = true;
        outer: for (let r = startRow; r < startRow + numRows; r++) {
          for (let s = startSeat; s < startSeat + width; s++) {
            if (occupiedSeats.has(`${r}-${s}`)) {
              allFree = false;
              break outer;
            }
          }
        }

        if (allFree) {
          const seats: Seat[] = [];
          for (let r = startRow; r < startRow + numRows && seats.length < quantity; r++) {
            for (let s = startSeat; s < startSeat + width && seats.length < quantity; s++) {
              seats.push({ rowIndex: r, seatNumber: s });
            }
          }
          if (seats.length === quantity) return seats;
        }
      }
    }
  }

  return null;
}

/**
 * Pick the best block from candidates for a given quantity.
 * Preference: exact fit > remainder >= 2 > remainder == 1 (if allowed).
 * Returns the seats to assign (from the start of the block), or null.
 */
export function pickBestBlock(
  blocks: number[][],
  quantity: number,
  acceptRemainder1: boolean,
): number[] | null {
  let best: number[] | null = null;
  let bestRemainder = Infinity;

  for (const block of blocks) {
    if (block.length < quantity) continue;
    const remainder = block.length - quantity;
    if (remainder === 1 && !acceptRemainder1) continue;
    if (remainder < bestRemainder) {
      best = block.slice(0, quantity);
      bestRemainder = remainder;
    }
  }
  return best;
}

/**
 * Assign seats for a line item based on wheelchair access needs.
 *
 * Seat layout per row:
 *   [1, 2]     = left wheelchair zone (preferred for wheelchair orders)
 *   [3 .. N-2] = normal fill zone
 *   [N-1, N]   = right wheelchair zone
 *
 * Normal orders fill the normal zone first, then right zone, then left zone as last resort.
 * Wheelchair orders get the left end first, then right end, then fall back to normal logic.
 */
export function assignSeats(
  occupiedSeats: Set<string>,
  rows: number,
  seatsPerRow: number,
  quantity: number,
  wheelchairAccess: boolean,
): Seat[] {
  const normalMin = 3;
  const normalMax = seatsPerRow - 2;
  const rightAndNormalMin = 3; // seats 3 to N (excludes left zone)

  // --- WHEELCHAIR PATH ---
  if (wheelchairAccess) {
    // Phase 1: left end of row — seats 1 to Q
    for (let row = 0; row < rows; row++) {
      let allFree = true;
      for (let s = 1; s <= quantity; s++) {
        if (occupiedSeats.has(`${row}-${s}`)) {
          allFree = false;
          break;
        }
      }
      if (allFree) {
        const seats: Seat[] = [];
        for (let s = 1; s <= quantity; s++) seats.push({ rowIndex: row, seatNumber: s });
        return seats;
      }
    }

    // Phase 2: right end of row — seats (N-Q+1) to N
    for (let row = 0; row < rows; row++) {
      const startSeat = seatsPerRow - quantity + 1;
      if (startSeat < 1) continue;
      let allFree = true;
      for (let s = startSeat; s <= seatsPerRow; s++) {
        if (occupiedSeats.has(`${row}-${s}`)) {
          allFree = false;
          break;
        }
      }
      if (allFree) {
        const seats: Seat[] = [];
        for (let s = startSeat; s <= seatsPerRow; s++) seats.push({ rowIndex: row, seatNumber: s });
        return seats;
      }
    }

    // Phase 3: fall through to normal seat logic below
  }

  // --- NORMAL PATH (or wheelchair fallback) ---
  // Phase 1: normal zone only (3 to N-2), no remainder == 1
  if (normalMax >= normalMin) {
    for (let row = 0; row < rows; row++) {
      const blocks = getContiguousBlocks(occupiedSeats, row, normalMin, normalMax);
      const block = pickBestBlock(blocks, quantity, false);
      if (block) return block.map((s) => ({ rowIndex: row, seatNumber: s }));
    }
  }

  // Phase 2: expand to include right zone (3 to N), no remainder == 1
  if (seatsPerRow >= rightAndNormalMin) {
    for (let row = 0; row < rows; row++) {
      const blocks = getContiguousBlocks(occupiedSeats, row, rightAndNormalMin, seatsPerRow);
      const block = pickBestBlock(blocks, quantity, false);
      if (block) return block.map((s) => ({ rowIndex: row, seatNumber: s }));
    }
  }

  // Phase 3: right + normal zone, accept remainder == 1
  if (seatsPerRow >= rightAndNormalMin) {
    for (let row = 0; row < rows; row++) {
      const blocks = getContiguousBlocks(occupiedSeats, row, rightAndNormalMin, seatsPerRow);
      const block = pickBestBlock(blocks, quantity, true);
      if (block) return block.map((s) => ({ rowIndex: row, seatNumber: s }));
    }
  }

  // Phase 4: full row including left zone, accept remainder == 1
  for (let row = 0; row < rows; row++) {
    const blocks = getContiguousBlocks(occupiedSeats, row, 1, seatsPerRow);
    const block = pickBestBlock(blocks, quantity, true);
    if (block) return block.map((s) => ({ rowIndex: row, seatNumber: s }));
  }

  // Phase 5: adjacent block — fit across consecutive rows in a rectangle (e.g. 2×2)
  const adjacentResult = findAdjacentBlock(occupiedSeats, rows, seatsPerRow, quantity);
  if (adjacentResult) return adjacentResult;

  // Phase 6: fluid fill — grab any available seats across rows
  const seats: Seat[] = [];
  for (let row = 0; row < rows && seats.length < quantity; row++) {
    for (let s = 1; s <= seatsPerRow && seats.length < quantity; s++) {
      if (!occupiedSeats.has(`${row}-${s}`)) {
        seats.push({ rowIndex: row, seatNumber: s });
      }
    }
  }
  return seats;
}
