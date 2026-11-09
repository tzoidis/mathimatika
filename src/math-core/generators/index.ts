// Every generator the app has. skills.<grade>.json names them by id.

import { addGenerator, countGenerator, houseGenerator } from './number.ts';
import { playable, type PlayableGenerator } from './types.ts';

export const COUNT_GENERATORS = [
  countGenerator('count.to5', '1.num.count.to5', 1, 5),
  countGenerator('count.to10', '1.num.count.to10', 6, 10),
  countGenerator('count.to20', '1.num.count.to20', 11, 20),
];
export const ADD_GENERATORS = [addGenerator('add.to5', '1.add.within5', 2, 5), addGenerator('add.to10', '1.add.within10.nocarry', 6, 10)];
export const HOUSE_GENERATORS = [houseGenerator('house.to5', '1.num.split.to5', 2, 5), houseGenerator('house.to10', '1.num.split.to10', 6, 10)];

export const GENERATORS: PlayableGenerator[] = [...COUNT_GENERATORS.map(playable), ...ADD_GENERATORS.map(playable), ...HOUSE_GENERATORS.map(playable)];

export const generatorById = (id: string): PlayableGenerator | undefined => GENERATORS.find((g) => g.id === id);
