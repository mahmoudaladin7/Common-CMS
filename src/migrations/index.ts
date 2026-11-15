import * as migration_20261020_064300_initial from './20261020_064300_initial';
import * as migration_20261110_081344 from './20261110_081344';
import * as migration_20261115_064104 from './20261115_064104';

export const migrations = [
  {
    up: migration_20261020_064300_initial.up,
    down: migration_20261020_064300_initial.down,
    name: '20261020_064300_initial',
  },
  {
    up: migration_20261110_081344.up,
    down: migration_20261110_081344.down,
    name: '20261110_081344',
  },
  {
    up: migration_20261115_064104.up,
    down: migration_20261115_064104.down,
    name: '20261115_064104'
  },
];
