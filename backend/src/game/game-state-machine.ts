import { GameState } from './game.types';

export class GameStateMachine {
  private static readonly VALID_TRANSITIONS: Record<GameState, GameState[]> = {
    [GameState.LOBBY]: [GameState.BUZZER_OPEN, GameState.GAME_OVER],
    [GameState.BUZZER_OPEN]: [GameState.CARD_SELECTION, GameState.INTERMISSION, GameState.GAME_OVER],
    [GameState.CARD_SELECTION]: [GameState.QUESTION_ACTIVE, GameState.INTERMISSION, GameState.GAME_OVER],
    [GameState.QUESTION_ACTIVE]: [GameState.INTERMISSION, GameState.STEAL_OPEN, GameState.GAME_OVER],
    [GameState.STEAL_OPEN]: [GameState.QUESTION_ACTIVE, GameState.INTERMISSION, GameState.GAME_OVER],
    [GameState.INTERMISSION]: [GameState.BUZZER_OPEN, GameState.FINAL_SHOWDOWN, GameState.GAME_OVER],
    [GameState.FINAL_SHOWDOWN]: [GameState.GAME_OVER],
    [GameState.GAME_OVER]: [GameState.LOBBY, GameState.BUZZER_OPEN],
  };

  /**
   * Kiểm tra tính hợp lệ của việc chuyển đổi trạng thái
   */
  static canTransition(current: GameState, next: GameState): boolean {
    if (current === next) return true;
    const allowed = this.VALID_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  /**
   * Thực hiện chuyển đổi trạng thái nếu hợp lệ
   */
  static transition(current: GameState, next: GameState): GameState {
    if (!this.canTransition(current, next)) {
      throw new Error(`Invalid GameState transition from ${current} to ${next}`);
    }
    return next;
  }
}
