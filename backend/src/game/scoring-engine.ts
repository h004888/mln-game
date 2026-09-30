export class ScoringEngine {
  static readonly POINTS_CORRECT = 100;
  static readonly POINTS_STEAL = 150;
  static readonly POINTS_WRONG = -50;
  static readonly POINTS_TIMEOUT = -50;
  static readonly FREEZE_ROUNDS_ON_WRONG_ULTIMATE_GUESS = 2;

  /**
   * Tính toán điểm thưởng/phạt dựa trên hành vi
   */
  static evaluateScore(action: 'CORRECT' | 'STEAL' | 'WRONG' | 'TIMEOUT'): number {
    switch (action) {
      case 'CORRECT':
        return this.POINTS_CORRECT;
      case 'STEAL':
        return this.POINTS_STEAL;
      case 'WRONG':
        return this.POINTS_WRONG;
      case 'TIMEOUT':
        return this.POINTS_TIMEOUT;
      default:
        return 0;
    }
  }

  /**
   * Chuẩn hóa từ khóa tiếng Việt (bỏ dấu, lowercase, bỏ khoảng trắng thừa) để fuzzy match
   */
  static normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * So khớp từ khóa đoán ảnh bí ẩn
   */
  static checkUltimateGuess(guess: string, secretKeyword: string): boolean {
    const normGuess = this.normalizeText(guess);
    const normSecret = this.normalizeText(secretKeyword);

    if (!normGuess || !normSecret || normGuess.length < 2 || normSecret.length < 2) {
      return false;
    }

    return (
      normGuess === normSecret ||
      normGuess.includes(normSecret) ||
      (normGuess.length >= normSecret.length && normGuess.includes(normSecret))
    );
  }
}
