export type Seat = { rowIndex: number; seatNumber: number; wheelchairAccess: boolean };

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

export function findBestConnectedCluster(
  occupiedSeats: Set<string>,
  rows: number,
  seatsPerRow: number,
  quantity: number,
): Seat[] | null {
  let bestCluster: Seat[] | null = null;
  let bestScore = -Infinity;

  const isValid = (r: number, s: number) =>
    r >= 0 && r < rows && s >= 1 && s <= seatsPerRow && !occupiedSeats.has(`${r}-${s}`);

  const scoreCluster = (cluster: Seat[]) => {
    let score = 0;

    // 1. Prefer Front Rows (Lower Index = Higher Score)
    // We subtract the row indices from a large constant.
    const rowSum = cluster.reduce((sum, seat) => sum + seat.rowIndex, 0);
    score += rows * quantity * 1000 - rowSum * 1000;

    // 2. Prefer Compactness (Minimize row spread)
    const distinctRows = new Set(cluster.map((s) => s.rowIndex)).size;
    score -= distinctRows * 5000;

    // 3. Prefer Centering
    const avgSeatNum = cluster.reduce((sum, s) => sum + s.seatNumber, 0) / cluster.length;
    const rowCenter = (seatsPerRow + 1) / 2;
    score -= Math.abs(avgSeatNum - rowCenter) * 10;

    return score;
  };

  // --- SEARCH FROM FRONT TO BACK ---
  for (let r = 0; r < rows; r++) {
    for (let s = 1; s <= seatsPerRow; s++) {
      if (!isValid(r, s)) continue;

      const currentCluster: Seat[] = [];
      const visited = new Set<string>();
      const queue: Seat[] = [
        { rowIndex: r, seatNumber: s, wheelchairAccess: s === 1 || s === seatsPerRow },
      ];
      visited.add(`${r}-${s}`);

      while (queue.length > 0 && currentCluster.length < quantity) {
        const current = queue.shift()!;
        currentCluster.push(current);

        const neighbors = [
          {
            rowIndex: current.rowIndex,
            seatNumber: current.seatNumber - 1,
            wheelchairAccess: current.seatNumber - 1 === 1,
          }, // Left
          {
            rowIndex: current.rowIndex,
            seatNumber: current.seatNumber + 1,
            wheelchairAccess: current.seatNumber + 1 === seatsPerRow,
          }, // Right
          {
            rowIndex: current.rowIndex + 1,
            seatNumber: current.seatNumber,
            wheelchairAccess: current.seatNumber === 1 || current.seatNumber === seatsPerRow,
          }, // Down
          {
            rowIndex: current.rowIndex - 1,
            seatNumber: current.seatNumber,
            wheelchairAccess: current.seatNumber === 1 || current.seatNumber === seatsPerRow,
          }, // Up
        ];

        // Priority within the cluster: Stay in the same row first
        neighbors.sort((a, b) => {
          const aRowDiff = Math.abs(a.rowIndex - current.rowIndex);
          const bRowDiff = Math.abs(b.rowIndex - current.rowIndex);
          return aRowDiff - bRowDiff;
        });

        for (const n of neighbors) {
          const key = `${n.rowIndex}-${n.seatNumber}`;
          if (isValid(n.rowIndex, n.seatNumber) && !visited.has(key)) {
            visited.add(key);
            queue.push(n);
          }
        }
      }

      if (currentCluster.length === quantity) {
        const score = scoreCluster(currentCluster);
        if (score > bestScore) {
          bestScore = score;
          bestCluster = currentCluster;
        }
      }
    }
  }

  return bestCluster;
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
    const leftZoneMax = 2;
    const rightZoneMin = seatsPerRow - 1;

    // Phase 1: single row - left end (seats 1 to Q)
    if (quantity <= seatsPerRow) {
      for (let row = 0; row < rows; row++) {
        const blocks = getContiguousBlocks(occupiedSeats, row, 1, quantity);
        const block = pickBestBlock(blocks, quantity, true);
        if (block) {
          return block.map((s, index) => ({
            rowIndex: row,
            seatNumber: s,
            wheelchairAccess: index === 0 && s === 1, // Only first seat if it's seat 1
          }));
        }
      }

      // Phase 2: single row - right end (seats N-Q+1 to N)
      for (let row = 0; row < rows; row++) {
        const startSeat = seatsPerRow - quantity + 1;
        if (startSeat < 1) continue;
        const blocks = getContiguousBlocks(occupiedSeats, row, startSeat, seatsPerRow);
        const block = pickBestBlock(blocks, quantity, true);
        if (block) {
          return block.map((s, index) => ({
            rowIndex: row,
            seatNumber: s,
            wheelchairAccess: index === block.length - 1 && s === seatsPerRow, // Only last seat if it's seat N
          }));
        }
      }
    }

    // Phase 3: multi-row - collect from left edge seats (seat 1 only - actual wheelchair access)
    const leftSeats: Seat[] = [];
    for (let row = 0; row < rows && leftSeats.length < quantity; row++) {
      if (!occupiedSeats.has(`${row}-1`)) {
        leftSeats.push({ rowIndex: row, seatNumber: 1, wheelchairAccess: leftSeats.length === 0 }); // Only first seat gets wheelchair access
      }
    }
    if (leftSeats.length === quantity) return leftSeats;

    // Phase 4: multi-row - collect from right edge seats (seat N only - actual wheelchair access)
    const rightSeats: Seat[] = [];
    for (let row = 0; row < rows && rightSeats.length < quantity; row++) {
      if (!occupiedSeats.has(`${row}-${seatsPerRow}`)) {
        rightSeats.push({
          rowIndex: row,
          seatNumber: seatsPerRow,
          wheelchairAccess: rightSeats.length === 0, // Only first seat gets wheelchair access
        });
      }
    }
    if (rightSeats.length === quantity) return rightSeats;

    // Phase 5: use cluster approach for wheelchair (better than falling through)
    const cluster = findBestConnectedCluster(occupiedSeats, rows, seatsPerRow, quantity);
    if (cluster) {
      // Mark only the first edge seat (seat 1 or seat N) as wheelchair accessible
      const hasEdgeSeat = cluster.find((s) => s.seatNumber === 1 || s.seatNumber === seatsPerRow);
      return cluster.map((s) => ({
        ...s,
        wheelchairAccess: hasEdgeSeat && s === hasEdgeSeat,
      }));
    }

    // Phase 6: fluid fill with left-side priority for wheelchair
    const seats: Seat[] = [];
    let wheelchairSeatAssigned = false;
    // First collect from left zone across all rows
    for (let row = 0; row < rows && seats.length < quantity; row++) {
      for (let s = 1; s <= leftZoneMax && seats.length < quantity; s++) {
        if (!occupiedSeats.has(`${row}-${s}`)) {
          const isWheelchairSeat = !wheelchairSeatAssigned && s === 1;
          seats.push({ rowIndex: row, seatNumber: s, wheelchairAccess: isWheelchairSeat });
          if (isWheelchairSeat) wheelchairSeatAssigned = true;
        }
      }
    }
    // Then center zone
    for (let row = 0; row < rows && seats.length < quantity; row++) {
      for (let s = 3; s <= seatsPerRow - 2 && seats.length < quantity; s++) {
        if (!occupiedSeats.has(`${row}-${s}`)) {
          seats.push({ rowIndex: row, seatNumber: s, wheelchairAccess: false });
        }
      }
    }
    // Finally right zone
    for (let row = 0; row < rows && seats.length < quantity; row++) {
      for (let s = rightZoneMin; s <= seatsPerRow && seats.length < quantity; s++) {
        if (!occupiedSeats.has(`${row}-${s}`)) {
          const isWheelchairSeat = !wheelchairSeatAssigned && s === seatsPerRow;
          seats.push({ rowIndex: row, seatNumber: s, wheelchairAccess: isWheelchairSeat });
          if (isWheelchairSeat) wheelchairSeatAssigned = true;
        }
      }
    }
    if (seats.length === quantity) return seats;

    // Phase 7: fall through to normal seat logic below
  }

  // --- NORMAL PATH (or wheelchair fallback) ---
  // Phase 1: normal zone only (3 to N-2), no remainder == 1
  if (normalMax >= normalMin) {
    for (let row = 0; row < rows; row++) {
      const blocks = getContiguousBlocks(occupiedSeats, row, normalMin, normalMax);
      const block = pickBestBlock(blocks, quantity, false);
      if (block)
        return block.map((s) => ({
          rowIndex: row,
          seatNumber: s,
          wheelchairAccess: false,
        }));
    }
  }

  // Phase 2: expand to include right zone (3 to N), no remainder == 1
  if (seatsPerRow >= rightAndNormalMin) {
    for (let row = 0; row < rows; row++) {
      const blocks = getContiguousBlocks(occupiedSeats, row, rightAndNormalMin, seatsPerRow);
      const block = pickBestBlock(blocks, quantity, false);
      if (block)
        return block.map((s) => ({
          rowIndex: row,
          seatNumber: s,
          wheelchairAccess: s === seatsPerRow,
        }));
    }
  }

  // Phase 3: right + normal zone, accept remainder == 1
  if (seatsPerRow >= rightAndNormalMin) {
    for (let row = 0; row < rows; row++) {
      const blocks = getContiguousBlocks(occupiedSeats, row, rightAndNormalMin, seatsPerRow);
      const block = pickBestBlock(blocks, quantity, true);
      if (block)
        return block.map((s) => ({
          rowIndex: row,
          seatNumber: s,
          wheelchairAccess: s === seatsPerRow,
        }));
    }
  }

  // Phase 4: full row including left zone, accept remainder == 1
  for (let row = 0; row < rows; row++) {
    const blocks = getContiguousBlocks(occupiedSeats, row, 1, seatsPerRow);
    const block = pickBestBlock(blocks, quantity, true);
    if (block)
      return block.map((s) => ({
        rowIndex: row,
        seatNumber: s,
        wheelchairAccess: s === 1 || s === seatsPerRow,
      }));
  }

  // Phase 5: adjacent block — fit across consecutive rows in a rectangle (e.g. 2×2)
  const cluster = findBestConnectedCluster(occupiedSeats, rows, seatsPerRow, quantity);
  if (cluster) {
    // Normal path: no wheelchair access for any seat
    return cluster.map((s) => ({ ...s, wheelchairAccess: false }));
  }

  // Phase 6: fluid fill — grab any available seats across rows
  const seats: Seat[] = [];
  for (let row = 0; row < rows && seats.length < quantity; row++) {
    for (let s = 1; s <= seatsPerRow && seats.length < quantity; s++) {
      if (!occupiedSeats.has(`${row}-${s}`)) {
        seats.push({
          rowIndex: row,
          seatNumber: s,
          wheelchairAccess: s === 1 || s === seatsPerRow,
        });
      }
    }
  }
  return seats;
}
