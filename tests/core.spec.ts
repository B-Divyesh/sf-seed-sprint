import { expect, test } from '@playwright/test';
import { generateBoard, isSolved } from '../src/core';

test('@claim:deterministic-board every seed is deterministic and verified', () => {
  for (let day = 1; day <= 366; day += 1) {
    const seed = `2026-${String(Math.ceil(day / 31)).padStart(2, '0')}-${String(((day - 1) % 31) + 1).padStart(2, '0')}`;
    const first = generateBoard(seed);
    const second = generateBoard(seed);
    expect(first).toEqual(second);
    expect(first.tiles.filter((tile) => tile.kind === 'route').length).toBeGreaterThanOrEqual(22);
    expect(first.tiles.filter((tile) => tile.marker === 'seed')).toHaveLength(3);
    expect(isSolved(first, first.solution)).toBe(true);
  }
});
