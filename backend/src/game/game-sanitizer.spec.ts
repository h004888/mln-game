import { sanitizeRoomForPlayer, sanitizeRoomForScreen, sanitizeRoomForHost } from './game-sanitizer';
import { GameRoom, GameState, PlayerRole } from './game.types';

describe('GameSanitizer', () => {
  let sampleRoom: GameRoom;

  beforeEach(() => {
    sampleRoom = {
      roomId: 'room-1',
      status: GameState.QUESTION_ACTIVE,
      players: {
        'p1': {
          id: 'p1',
          sessionId: 'secret-session-p1',
          name: 'Player One',
          score: 100,
          isFrozen: 0,
          hasCooldown: false,
          role: PlayerRole.PLAYER,
          connected: true,
        },
        'p2': {
          id: 'p2',
          sessionId: 'secret-session-p2',
          name: 'Player Two',
          score: 50,
          isFrozen: 0,
          hasCooldown: false,
          role: PlayerRole.PLAYER,
          connected: true,
        },
      },
      cards: [
        {
          id: 'card-1',
          index: 1,
          isOpened: false,
          question: {
            id: 'q1',
            text: 'Question 1?',
            options: ['A', 'B', 'C', 'D'],
            correctIndex: 2,
          },
        },
        {
          id: 'card-2',
          index: 2,
          isOpened: true,
          question: {
            id: 'q2',
            text: 'Question 2?',
            options: ['A', 'B', 'C', 'D'],
            correctIndex: 0,
          },
        },
      ],
      activePlayerId: 'p1',
      currentCardId: 'card-1',
      secretImageKeyword: 'Vịnh Hạ Long',
      secretImageUrl: 'https://example.com/secret.jpg',
      winnerId: null,
      winnerName: null,
      pendingUltimateGuess: null,
      timer: {
        duration: 15,
        remaining: 10,
        type: 'ANSWER_QUESTION',
      },
      totalRounds: 1,
    };
  });

  describe('sanitizeRoomForPlayer', () => {
    it('should hide correctIndex for unopened cards, keep for opened cards, hide other sessionIds and secret media before GAME_OVER', () => {
      const sanitized = sanitizeRoomForPlayer(sampleRoom, 'p1');

      // Card 1 unopened -> correctIndex hidden
      expect(sanitized.cards[0].question.correctIndex).toBe(-1);
      // Card 2 opened -> correctIndex visible
      expect(sanitized.cards[1].question.correctIndex).toBe(0);

      // Secret keyword & image hidden
      expect(sanitized.secretImageKeyword).toBe('');
      expect(sanitized.secretImageUrl).toBe('');

      // Own sessionId retained, other player's sessionId stripped
      expect(sanitized.players['p1'].sessionId).toBe('secret-session-p1');
      expect(sanitized.players['p2'].sessionId).toBeUndefined();
    });

    it('should reveal secret keyword and image when game status is GAME_OVER', () => {
      sampleRoom.status = GameState.GAME_OVER;
      const sanitized = sanitizeRoomForPlayer(sampleRoom, 'p1');
      expect(sanitized.secretImageKeyword).toBe('Vịnh Hạ Long');
      expect(sanitized.secretImageUrl).toBe('https://example.com/secret.jpg');
    });
  });

  describe('sanitizeRoomForScreen', () => {
    it('should hide correctIndex for unopened cards, strip all sessionIds, and hide secret media before GAME_OVER', () => {
      const sanitized = sanitizeRoomForScreen(sampleRoom);

      expect(sanitized.cards[0].question.correctIndex).toBe(-1);
      expect(sanitized.cards[1].question.correctIndex).toBe(0);
      expect(sanitized.secretImageKeyword).toBe('');
      expect(sanitized.players['p1'].sessionId).toBeUndefined();
      expect(sanitized.players['p2'].sessionId).toBeUndefined();
    });
  });

  describe('sanitizeRoomForHost', () => {
    it('should preserve all correctIndex, secret keyword/image and strip sessionIds for security', () => {
      const sanitized = sanitizeRoomForHost(sampleRoom);

      expect(sanitized.cards[0].question.correctIndex).toBe(2);
      expect(sanitized.cards[1].question.correctIndex).toBe(0);
      expect(sanitized.secretImageKeyword).toBe('Vịnh Hạ Long');
      expect(sanitized.secretImageUrl).toBe('https://example.com/secret.jpg');
      expect(sanitized.players['p1'].sessionId).toBeUndefined();
    });
  });
});
