import * as migration_20260507_150141 from './20260507_150141';

export const migrations = [
  {
    up: migration_20260507_150141.up,
    down: migration_20260507_150141.down,
    name: '20260507_150141'
  },
];
