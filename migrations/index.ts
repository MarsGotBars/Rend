import * as migration_20260430_110327 from './20260430_110327';

export const migrations = [
  {
    up: migration_20260430_110327.up,
    down: migration_20260430_110327.down,
    name: '20260430_110327'
  },
];
