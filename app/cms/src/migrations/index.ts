import * as migration_20260507_085451 from './20260507_085451';
import * as migration_20260507_122001 from './20260507_122001';

export const migrations = [
  {
    up: migration_20260507_085451.up,
    down: migration_20260507_085451.down,
    name: '20260507_085451',
  },
  {
    up: migration_20260507_122001.up,
    down: migration_20260507_122001.down,
    name: '20260507_122001'
  },
];
