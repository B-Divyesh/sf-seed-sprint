export const BOARD_SIZE = 6;
export const ROUND_SECONDS = 300;

export const DIR = { n: 1, e: 2, s: 4, w: 8 } as const;
const DIRECTIONS = [
  { bit: DIR.n, opposite: DIR.s, dr: -1, dc: 0 },
  { bit: DIR.e, opposite: DIR.w, dr: 0, dc: 1 },
  { bit: DIR.s, opposite: DIR.n, dr: 1, dc: 0 },
  { bit: DIR.w, opposite: DIR.e, dr: 0, dc: -1 }
] as const;

export interface Tile {
  index: number;
  mask: number;
  startRotation: number;
  kind: 'route' | 'empty';
  marker: 'sprout' | 'seed' | null;
}

export interface Board {
  seed: string;
  tiles: Tile[];
  solution: number[];
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFrom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function rotateMask(mask: number, rotation: number): number {
  let result = mask;
  for (let count = 0; count < ((rotation % 4) + 4) % 4; count += 1) {
    result = ((result << 1) & 15) | ((result >> 3) & 1);
  }
  return result;
}

export function generateBoard(seed: string): Board {
  const random = randomFrom(seed);
  const masks = Array<number>(BOARD_SIZE * BOARD_SIZE).fill(0);
  const active = new Set<number>();
  const root = 14 + Math.floor(random() * 2);
  active.add(root);
  const target = 22 + Math.floor(random() * 5);

  while (active.size < target) {
    const candidates: Array<{ from: number; to: number; bit: number; opposite: number }> = [];
    for (const from of active) {
      const row = Math.floor(from / BOARD_SIZE);
      const col = from % BOARD_SIZE;
      for (const direction of DIRECTIONS) {
        const nextRow = row + direction.dr;
        const nextCol = col + direction.dc;
        if (nextRow < 0 || nextRow >= BOARD_SIZE || nextCol < 0 || nextCol >= BOARD_SIZE) continue;
        const to = nextRow * BOARD_SIZE + nextCol;
        if (!active.has(to)) candidates.push({ from, to, bit: direction.bit, opposite: direction.opposite });
      }
    }
    if (candidates.length === 0) break;
    const edge = candidates[Math.floor(random() * candidates.length)];
    masks[edge.from] |= edge.bit;
    masks[edge.to] |= edge.opposite;
    active.add(edge.to);
  }

  const leaves = [...active]
    .filter((index) => bitCount(masks[index]) === 1 && index !== root)
    .sort((a, b) => distanceFrom(root, b) - distanceFrom(root, a))
    .slice(0, 3);

  const tiles = masks.map((mask, index): Tile => {
    if (mask === 0) return { index, mask, startRotation: 0, kind: 'empty', marker: null };
    const changedRotations = [1, 2, 3].filter((rotation) => rotateMask(mask, rotation) !== mask);
    const rotation = changedRotations.length > 0
      ? changedRotations[Math.floor(random() * changedRotations.length)]
      : 0;
    return {
      index,
      mask,
      startRotation: rotation,
      kind: 'route',
      marker: index === root ? 'sprout' : leaves.includes(index) ? 'seed' : null
    };
  });

  return { seed, tiles, solution: Array(tiles.length).fill(0) };
}

function bitCount(value: number): number {
  let count = 0;
  for (let bit = value; bit > 0; bit >>= 1) count += bit & 1;
  return count;
}

function distanceFrom(origin: number, target: number): number {
  const originRow = Math.floor(origin / BOARD_SIZE);
  const originCol = origin % BOARD_SIZE;
  const targetRow = Math.floor(target / BOARD_SIZE);
  const targetCol = target % BOARD_SIZE;
  return Math.abs(originRow - targetRow) + Math.abs(originCol - targetCol);
}

export function getPowered(board: Board, rotations: number[]): Set<number> {
  const root = board.tiles.find((tile) => tile.marker === 'sprout')?.index;
  if (root === undefined) return new Set();
  const powered = new Set([root]);
  const queue = [root];
  while (queue.length > 0) {
    const index = queue.shift()!;
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;
    const mask = rotateMask(board.tiles[index].mask, rotations[index]);
    for (const direction of DIRECTIONS) {
      if (!(mask & direction.bit)) continue;
      const nextRow = row + direction.dr;
      const nextCol = col + direction.dc;
      if (nextRow < 0 || nextRow >= BOARD_SIZE || nextCol < 0 || nextCol >= BOARD_SIZE) continue;
      const next = nextRow * BOARD_SIZE + nextCol;
      if (powered.has(next) || board.tiles[next].kind === 'empty') continue;
      const nextMask = rotateMask(board.tiles[next].mask, rotations[next]);
      if (nextMask & direction.opposite) {
        powered.add(next);
        queue.push(next);
      }
    }
  }
  return powered;
}

export function isSolved(board: Board, rotations: number[]): boolean {
  const routedCount = board.tiles.filter((tile) => tile.kind === 'route').length;
  return getPowered(board, rotations).size === routedCount;
}

export function utcSeed(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function roomCode(seed: string): string {
  return hashSeed(`room:${seed}`).toString(36).slice(0, 5).toUpperCase().padEnd(5, 'S');
}

export function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
