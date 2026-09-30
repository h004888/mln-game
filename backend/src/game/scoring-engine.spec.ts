import { ScoringEngine } from './scoring-engine';

describe('ScoringEngine', () => {
  describe('evaluateScore', () => {
    it('should return 100 for CORRECT', () => {
      expect(ScoringEngine.evaluateScore('CORRECT')).toBe(100);
    });

    it('should return 150 for STEAL', () => {
      expect(ScoringEngine.evaluateScore('STEAL')).toBe(150);
    });

    it('should return -50 for WRONG and TIMEOUT', () => {
      expect(ScoringEngine.evaluateScore('WRONG')).toBe(-50);
      expect(ScoringEngine.evaluateScore('TIMEOUT')).toBe(-50);
    });
  });

  describe('normalizeText', () => {
    it('should remove accents, lowercase and trim extra spaces', () => {
      expect(ScoringEngine.normalizeText('  Vịnh Hạ Long  ')).toBe('vinh ha long');
      expect(ScoringEngine.normalizeText('Đà Nẵng')).toBe('da nang');
    });

    it('should return empty string for null or empty inputs', () => {
      expect(ScoringEngine.normalizeText('')).toBe('');
      expect(ScoringEngine.normalizeText('   ')).toBe('');
      expect(ScoringEngine.normalizeText('!@#$%^')).toBe('');
    });
  });

  describe('checkUltimateGuess', () => {
    const secret = 'Vịnh Hạ Long';

    it('should return false for empty, whitespace-only or special-only inputs', () => {
      expect(ScoringEngine.checkUltimateGuess('', secret)).toBe(false);
      expect(ScoringEngine.checkUltimateGuess('   ', secret)).toBe(false);
      expect(ScoringEngine.checkUltimateGuess('!@#$', secret)).toBe(false);
    });

    it('should return false for single-character or too short inputs', () => {
      expect(ScoringEngine.checkUltimateGuess('a', secret)).toBe(false);
      expect(ScoringEngine.checkUltimateGuess('v', secret)).toBe(false);
      expect(ScoringEngine.checkUltimateGuess('l', secret)).toBe(false);
    });

    it('should return true for exact and normalized matches', () => {
      expect(ScoringEngine.checkUltimateGuess('Vịnh Hạ Long', secret)).toBe(true);
      expect(ScoringEngine.checkUltimateGuess('vinh ha long', secret)).toBe(true);
      expect(ScoringEngine.checkUltimateGuess('  vịnh  hạ  long  ', secret)).toBe(true);
      expect(ScoringEngine.checkUltimateGuess('Vịnh Hạ Long tuyệt đẹp', secret)).toBe(true);
    });

    it('should return false if secret keyword itself is empty or invalid', () => {
      expect(ScoringEngine.checkUltimateGuess('Vịnh Hạ Long', '')).toBe(false);
      expect(ScoringEngine.checkUltimateGuess('Vịnh Hạ Long', '   ')).toBe(false);
    });
  });
});
