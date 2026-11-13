// Every generator the app has. skills.<grade>.json names them by id.

import { addGenerator, countGenerator, doublesGenerator, houseGenerator, tenPlusGenerator } from './number.ts';
import { compareGenerator, linePlaceGenerator, lineStepGenerator, putGenerator, subitizeGenerator } from './sense.ts';
import {
  balanceGenerator,
  coinsGenerator,
  countTensGenerator,
  exchangeGenerator,
  floorGenerator,
  jarGenerator,
  missingGenerator,
  quantityGenerator,
  signChoiceGenerator,
  subGenerator,
} from './operations.ts';
import { randInt } from '../../engine/rng.ts';
import { storyGenerator } from './story.ts';
import { heavierGenerator, shareGenerator, tenStepGenerator, walletGenerator } from './hundred.ts';
import { measureGenerator, neighbourGenerator, tensCalcGenerator, timesGenerator } from './grow.ts';
import { bigDoublesGenerator, fivesGenerator, inverseGenerator, subBridgeGenerator, twoDigitGenerator } from './calc.ts';
import { bridgeGenerator, buildTensGenerator, daysGenerator, groupsGenerator, manyTermsGenerator, readTensGenerator, regroupGenerator } from './tens.ts';
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
  compareGenerator('cmp.sign.to50', '1.cmp.to50', 20, 50, false),
  quantityGenerator('qty.to5', '1.cmp.qty.to5', 1, 5),
  quantityGenerator('qty.to10', '1.cmp.qty.to10', 2, 10),
  jarGenerator('jar.to5', '1.num.estimate.to5', 2, 5, 10, 1),
  jarGenerator('jar.to10', '1.num.estimate.to10', 6, 10, 15, 2),
  balanceGenerator('balance.missing', '1.add.within10.missing', 3, 10),
  missingGenerator('missing.to10', '1.sub.complement', 5, 10),
  subGenerator('sub.small', '1.sub.within10.small', 3, 10, (_a, rng) => randInt(1, 2, rng), (p) => p.b <= 2),
  subGenerator('sub.large', '1.sub.within10.large', 5, 10, (a, rng) => randInt(a - 3, a - 1, rng), (p) => p.a - p.b <= 3),
  signChoiceGenerator('sign.choice', '1.sub.symbols', 10),
  countTensGenerator('count.to50', '1.num.count.to50', 21, 50),
  floorGenerator('floor.to10', '1.num.ordinal', 10),
  coinsGenerator('money.total', '1.money.to10', 10),
  exchangeGenerator('money.exchange', '1.money.to10'),
  storyGenerator('story.add.to5', '1.problem.add.to5'),
  storyGenerator('story.add.to10', '1.problem.add.to10'),
  storyGenerator('story.addsub.to10', '1.problem.addsub.to10'),
  storyGenerator('story.addsub.to20', '1.problem.addsub.to20'),
  storyGenerator('story.mixed', '1.problem.mixed'),
  groupsGenerator('groups.to50', '1.num.group.tens', 21, 50),
  readTensGenerator('tens.read.to50', '1.place.tens-units.to50', 11, 50),
  buildTensGenerator('tens.build.to50', '1.place.tens-units.to50', 11, 50),
  regroupGenerator('tens.regroup', '1.place.exchange', 49),
  manyTermsGenerator('add.three', '1.add.many-terms'),
  daysGenerator('days.week', '1.time.sequence'),
  bridgeGenerator('add.bridge', '1.add.within20.bridge'),
  twoDigitGenerator('calc.2d1d', '1.calc.2d1d.nobridge', false, 49),
  inverseGenerator('calc.inverse', '1.calc.inverse'),
  subBridgeGenerator('sub.bridge', '1.sub.within20.bridge'),
  fivesGenerator('add.fives', '1.add.back-to-5'),
  bigDoublesGenerator('add.doubles20', '1.add.within20.doubles'),
  twoDigitGenerator('calc.2d1d.bridge', '1.calc.2d1d.bridge', true, 50),
  readTensGenerator('rods.read.to50', '1.num.represent.to50', 21, 50),
  readTensGenerator('tens.read.to70', '1.num.represent.to70', 51, 70),
  buildTensGenerator('tens.build.to70', '1.num.represent.to70', 51, 70),
  neighbourGenerator('next.to70', '1.num.represent.to70', 50, 70),
  compareGenerator('cmp.sign.to70', '1.cmp.to70', 50, 70, false),
  timesGenerator('times.intro', '1.mult.intro', [2, 5, 10], 5, 50),
  measureGenerator('measure.clips', '1.len.measure'),
  tensCalcGenerator('calc.tens', '1.calc.tens', 70),
  readTensGenerator('tens.read.to100', '1.num.to100', 71, 99),
  buildTensGenerator('tens.build.to100', '1.num.to100', 71, 99),
  tenStepGenerator('tens.step.to100', '1.num.to100', 100),
  walletGenerator('money.wallet', '1.money.to100', 100),
  timesGenerator('times.groups', '1.mult.empirical', [2, 3, 4, 5], 5, 25),
  shareGenerator('share.plates', '1.div.sharing'),
  heavierGenerator('weight.heavier', '1.weight.scale'),
] as Generator<unknown>[];

export const GENERATORS: PlayableGenerator[] = ALL_GENERATORS.map(playable);

export const generatorById = (id: string): PlayableGenerator | undefined => GENERATORS.find((g) => g.id === id);
