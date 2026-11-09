// Every generator the app has. skills.<grade>.json names them by id.

import { addGenerator, countGenerator, doublesGenerator, houseGenerator, tenPlusGenerator } from './number.ts';
import { compareGenerator, linePlaceGenerator, lineStepGenerator, putGenerator, subitizeGenerator } from './sense.ts';
import { playable, type Generator, type PlayableGenerator } from './types.ts';

export const ALL_GENERATORS = [
  countGenerator('count.to5', '1.num.count.to5', 1, 5),
  countGenerator('count.to10', '1.num.count.to10', 6, 10),
  countGenerator('count.to20', '1.num.count.to20', 11, 20),
  addGenerator('add.to5', '1.add.within5', 2, 5),
  addGenerator('add.to10', '1.add.within10.nocarry', 6, 10),
  tenPlusGenerator('add.ten-plus', '1.add.ten-plus'),
  doublesGenerator('add.doubles', '1.add.doubles.to10'),
  houseGenerator('house.to5', '1.num.split.to5', 2, 5),
  houseGenerator('house.to10', '1.num.split.to10', 6, 10),
  houseGenerator('pairs10', '1.add.pairs10', 10, 10),
  putGenerator('put.to5', '1.num.represent.to5', 1, 5),
  putGenerator('put.to10', '1.num.represent.to10', 6, 10),
  putGenerator('put.to20', '1.num.represent.to20', 11, 20),
  subitizeGenerator('subitize.to5', '1.num.subitize.to5', 1, 5),
  subitizeGenerator('subitize.to10', '1.num.subitize.to10', 6, 10),
  subitizeGenerator('subitize.to20', '1.num.subitize.to20', 11, 20),
  lineStepGenerator('line.step.to10', '1.line.to10', 10),
  linePlaceGenerator('line.place.to10', '1.line.to10', 10),
  lineStepGenerator('line.step.to20', '1.line.to20', 20),
  linePlaceGenerator('line.place.to20', '1.line.to20', 20),
  compareGenerator('cmp.sign.to10', '1.cmp.sign.to10', 1, 10, true),
  compareGenerator('cmp.sign.to20', '1.cmp.to20', 10, 20, false),
] as Generator<unknown>[];

export const GENERATORS: PlayableGenerator[] = ALL_GENERATORS.map(playable);

export const generatorById = (id: string): PlayableGenerator | undefined => GENERATORS.find((g) => g.id === id);
