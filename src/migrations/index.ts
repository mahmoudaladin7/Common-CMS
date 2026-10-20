import * as migration_20261020_064300_initial from './20261020_064300_initial';

export const migrations = [
  {
    up: migration_20261020_064300_initial.up,
    down: migration_20261020_064300_initial.down,
    name: '20261020_064300_initial'
  },
];
