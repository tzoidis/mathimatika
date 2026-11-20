import { describe, expect, it } from 'vitest';
import { fitLightScale, fitScale } from './fit.ts';

describe('fitScale', () => {
  it('leaves a tablet as it is and never scales up', () => {
    expect(fitScale(1024, 768)).toBe(1);
    expect(fitScale(768, 1024)).toBe(1);
    expect(fitScale(1280, 800)).toBe(1);
    expect(fitScale(1920, 1080)).toBe(1);
  });

  it('scales a phone down so the tablet layout fits, by its narrower side', () => {
    expect(fitScale(390, 844)).toBeCloseTo(390 / 768);
    expect(fitScale(844, 390)).toBeCloseTo(390 / 768);
    expect(fitScale(360, 640)).toBeCloseTo(360 / 768);
  });

  it('scales a small tablet a little', () => {
    expect(fitScale(962, 601)).toBeCloseTo(601 / 768);
    expect(fitScale(600, 960)).toBeCloseTo(600 / 768);
  });

  it('scales the simple screens less, so their buttons stay big on a phone', () => {
    expect(fitLightScale(360, 640)).toBe(1);
    expect(fitLightScale(844, 390)).toBeCloseTo(390 / 560);
    expect(fitLightScale(1024, 768)).toBe(1);
  });
});
