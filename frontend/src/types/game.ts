export enum GameState {
  LOBBY = 'LOBBY',
  BUZZER_OPEN = 'BUZZER_OPEN',
  CARD_SELECTION = 'CARD_SELECTION',
  QUESTION_ACTIVE = 'QUESTION_ACTIVE',
  STEAL_OPEN = 'STEAL_OPEN',
  INTERMISSION = 'INTERMISSION',
  FINAL_SHOWDOWN = 'FINAL_SHOWDOWN',
  GAME_OVER = 'GAME_OVER',
}

export enum PlayerRole {
  PLAYER = 'PLAYER',
  HOST = 'HOST',
  SCREEN = 'SCREEN',
}

export interface Player {
  id: string;
  sessionId?: string;
  name: string;
  score: number;
  isFrozen: number;
  hasCooldown: boolean;
  role: PlayerRole;
  connected: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  timeLimit?: number;
}

export interface Card {
  id: string;
  index: number;
  isOpened: boolean;
  openedBy?: string;
  question: Question;
}

export interface GameRoom {
  roomId: string;
  status: GameState;
  players: Record<string, Player>;
  cards: Card[];
  activePlayerId: string | null;
  currentCardId: string | null;
  secretImageKeyword: string;
  secretImageUrl: string;
  winnerId: string | null;
  winnerName: string | null;
  pendingUltimateGuess: {
    playerId: string;
    playerName: string;
    keyword: string;
  } | null;
  timer: {
    duration: number;
    remaining: number;
    type: 'SELECT_CARD' | 'ANSWER_QUESTION' | 'STEAL_BUZZER' | 'FINAL_30S' | null;
  };
  totalRounds: number;
}
