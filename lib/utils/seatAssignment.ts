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
 *   [1, 2]     = left wheelchair zone
 *   [3 .. N-2] = normal fill zone
 *   [N-1, N]   = right wheelchair zone (preferred for wheelchair orders)
 *
 * Normal orders fill the normal zone first, then left zone, then right zone as last resort.
 * Wheelchair orders get the right end first, then left end, then fall back to normal logic.
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
  const leftAndNormalMax = seatsPerRow - 2; // seats 1 to N-2 (excludes right zone)

  // --- WHEELCHAIR PATH ---
  if (wheelchairAccess) {
    // Phase 1: right end of row — seats (N-Q+1) to N
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

    // Phase 2: left end of row — seats 1 to Q
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

  // Phase 2: expand to include left zone (1 to N-2), no remainder == 1
  if (leftAndNormalMax >= 1) {
    for (let row = 0; row < rows; row++) {
      const blocks = getContiguousBlocks(occupiedSeats, row, 1, leftAndNormalMax);
      const block = pickBestBlock(blocks, quantity, false);
      if (block) return block.map((s) => ({ rowIndex: row, seatNumber: s }));
    }
  }

  // Phase 3: left + normal zone, accept remainder == 1
  if (leftAndNormalMax >= 1) {
    for (let row = 0; row < rows; row++) {
      const blocks = getContiguousBlocks(occupiedSeats, row, 1, leftAndNormalMax);
      const block = pickBestBlock(blocks, quantity, true);
      if (block) return block.map((s) => ({ rowIndex: row, seatNumber: s }));
    }
  }

  // Phase 4: full row including right zone, accept remainder == 1
  for (let row = 0; row < rows; row++) {
    const blocks = getContiguousBlocks(occupiedSeats, row, 1, seatsPerRow);
    const block = pickBestBlock(blocks, quantity, true);
    if (block) return block.map((s) => ({ rowIndex: row, seatNumber: s }));
  }

  // Phase 5: fluid fill — grab any available seats across rows
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
