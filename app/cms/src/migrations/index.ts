import * as migration_20260507_085451 from './20260507_085451';
import * as migration_20260507_122001 from './20260507_122001';
import * as migration_20260507_143204 from './20260507_143204';
import * as migration_20260507_143346 from './20260507_143346';

export const migrations = [
  {
    up: migration_20260507_085451.up,
    down: migration_20260507_085451.down,
    name: '20260507_085451',
  },
  {
    up: migration_20260507_122001.up,
    down: migration_20260507_122001.down,
    name: '20260507_122001',
  },
  {
    up: migration_20260507_143204.up,
    down: migration_20260507_143204.down,
    name: '20260507_143204',
  },
  {
    up: migration_20260507_143346.up,
    down: migration_20260507_143346.down,
    name: '20260507_143346'
  },
];
