import { calculateHealthScore } from '../../src/modules/health/health-calculator.js';

describe('Health Calculator', () => {
  it('returns HEALTHY for good inputs', () => {
    const result = calculateHealthScore(50, 60, 100);
    expect(result).toEqual({ score: 100, status: 'HEALTHY' });
  });

  it('returns WARNING for moderate inputs', () => {
    const result = calculateHealthScore(56, 70, 250);
    expect(result).toEqual({ score: 65, status: 'WARNING' });
  });

  it('returns CRITICAL for poor inputs', () => {
    const result = calculateHealthScore(60, 80, 320);
    expect(result).toEqual({ score: 35, status: 'CRITICAL' });
  });
});
