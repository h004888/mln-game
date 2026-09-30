import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { GameState, PlayerRole } from './game.types';

describe('GameService', () => {
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should be defined and initialized with default room', () => {
    expect(service).toBeDefined();
    const room = service.getRoom();
    expect(room.status).toBe(GameState.LOBBY);
    expect(room.cards.length).toBe(16);
    expect(room.secretImageKeyword).toBeDefined();
  });

  it('should handle player join, host join and screen join', () => {
    const player1 = service.joinRoom('socket-p1', PlayerRole.PLAYER, 'Nguyen Van A');
    const host = service.joinRoom('socket-host', PlayerRole.HOST, 'MC Host');
    const screen = service.joinRoom('socket-screen', PlayerRole.SCREEN, 'Big TV');

    const room = service.getRoom();
    expect(room.players['socket-p1'].name).toBe('Nguyen Van A');
    expect(room.players['socket-p1'].role).toBe(PlayerRole.PLAYER);
    expect(room.players['socket-host'].role).toBe(PlayerRole.HOST);
    expect(room.players['socket-screen'].role).toBe(PlayerRole.SCREEN);
  });

  it('should open buzzer and handle buzz claiming atomically', () => {
    service.joinRoom('p1', PlayerRole.PLAYER, 'Player 1');
    service.joinRoom('p2', PlayerRole.PLAYER, 'Player 2');

    service.openBuzzer();
    expect(service.getRoom().status).toBe(GameState.BUZZER_OPEN);

    // First buzz claims
    const claim1 = service.claimBuzz('p1');
    expect(claim1.success).toBe(true);
    expect(service.getRoom().status).toBe(GameState.CARD_SELECTION);
    expect(service.getRoom().activePlayerId).toBe('p1');

    // Second buzz rejected
    const claim2 = service.claimBuzz('p2');
    expect(claim2.success).toBe(false);
  });

  it('should handle card selection and answering correctly with points and cooldown', () => {
    service.joinRoom('p1', PlayerRole.PLAYER, 'Player 1');
    service.openBuzzer();
    service.claimBuzz('p1');

    // Select card index 1
    const card = service.selectCard('p1', 1);
    expect(card).toBeDefined();
    expect(service.getRoom().status).toBe(GameState.QUESTION_ACTIVE);
    expect(service.getRoom().currentCardId).toBe(card.id);

    // Answer correctly
    const correctIdx = card.question.correctIndex;
    const result = service.submitAnswer('p1', correctIdx);

    expect(result.isCorrect).toBe(true);
    expect(service.getRoom().players['p1'].score).toBe(100);
    expect(service.getRoom().players['p1'].hasCooldown).toBe(true);
    expect(service.getRoom().cards.find(c => c.index === 1)?.isOpened).toBe(true);
    expect(service.getRoom().status).toBe(GameState.INTERMISSION);
  });

  it('should handle wrong answer and open steal buzzer', () => {
    service.joinRoom('p1', PlayerRole.PLAYER, 'Player 1');
    service.joinRoom('p2', PlayerRole.PLAYER, 'Player 2');
    service.openBuzzer();
    service.claimBuzz('p1');
    const card = service.selectCard('p1', 1);

    // Answer wrongly
    const wrongIdx = (card.question.correctIndex + 1) % 4;
    const result = service.submitAnswer('p1', wrongIdx);

    expect(result.isCorrect).toBe(false);
    expect(service.getRoom().players['p1'].score).toBe(-50);
    expect(service.getRoom().status).toBe(GameState.STEAL_OPEN);

    // Player 2 steals
    const stealClaim = service.claimSteal('p2');
    expect(stealClaim.success).toBe(true);
    expect(service.getRoom().status).toBe(GameState.QUESTION_ACTIVE);

    // Player 2 answers correctly
    const stealResult = service.submitAnswer('p2', card.question.correctIndex);
    expect(stealResult.isCorrect).toBe(true);
    expect(service.getRoom().players['p2'].score).toBe(150);
  });

  it('should trigger Instant Win when Ultimate Guess is correct', () => {
    service.joinRoom('p1', PlayerRole.PLAYER, 'Player 1');
    const room = service.getRoom();
    const keyword = room.secretImageKeyword;

    // Submit ultimate guess
    const guessResult = service.submitUltimateGuess('p1', keyword);
    expect(guessResult.submitted).toBe(true);

    // Host approves guess
    const review = service.reviewUltimateGuess(true);
    expect(review.isWinner).toBe(true);
    expect(service.getRoom().status).toBe(GameState.GAME_OVER);
    expect(service.getRoom().winnerId).toBe('p1');
  });

  it('should freeze player for 2 rounds when Ultimate Guess is wrong', () => {
    service.joinRoom('p1', PlayerRole.PLAYER, 'Player 1');
    service.submitUltimateGuess('p1', 'sai hoan toan');

    // Host rejects guess
    service.reviewUltimateGuess(false);
    expect(service.getRoom().players['p1'].isFrozen).toBe(2);

    // Next round: player 1 is frozen and cannot buzz
    service.openBuzzer();
    const claim = service.claimBuzz('p1');
    expect(claim.success).toBe(false);
    expect(claim.reason).toContain('frozen');
  });

  it('should generate sessionId and support reconnecting with previous state and score', () => {
    const player = service.joinRoom('socket-old', PlayerRole.PLAYER, 'Nguyen Van B');
    expect(player.sessionId).toBeDefined();
    const sessionId = player.sessionId;

    // Player scores some points
    service.openBuzzer();
    service.claimBuzz('socket-old');
    const card = service.selectCard('socket-old', 1);
    service.submitAnswer('socket-old', card.question.correctIndex);
    expect(service.getRoom().players['socket-old'].score).toBe(100);

    // Player disconnects (e.g. F5 or network drop)
    service.disconnectPlayer('socket-old');
    expect(service.getRoom().players['socket-old'].connected).toBe(false);

    // Player reconnects with new socket ID and existing sessionId
    const reconnected = service.reconnectPlayer('socket-new', sessionId);
    expect(reconnected).toBeDefined();
    expect(reconnected?.name).toBe('Nguyen Van B');
    expect(reconnected?.score).toBe(100);
    expect(reconnected?.connected).toBe(true);

    // Old socket key is updated or mapped
    const room = service.getRoom();
    expect(room.players['socket-new']).toBeDefined();
    expect(room.players['socket-new'].score).toBe(100);
  });

  it('should return null when reconnecting with invalid sessionId', () => {
    const result = service.reconnectPlayer('socket-new', 'invalid-uuid-session');
    expect(result).toBeNull();
  });

  it('should reset room with custom game config', () => {
    const customQuestions = Array.from({ length: 16 }, (_, i) => ({
      id: `q-custom-${i + 1}`,
      text: `Đề thi đặc biệt câu ${i + 1}`,
      options: ['1', '2', '3', '4'],
      correctIndex: 0,
    }));

    const config = {
      secretMedia: {
        keyword: 'Tháp Rùa Hồ Gươm',
        imageUrl: 'https://example.com/thap-rua.jpg',
      },
      questions: customQuestions,
    };

    service.resetRoomWithConfig(config);
    const room = service.getRoom();
    expect(room.status).toBe(GameState.LOBBY);
    expect(room.secretImageKeyword).toBe('Tháp Rùa Hồ Gươm');
    expect(room.secretImageUrl).toBe('https://example.com/thap-rua.jpg');
  });

  it('should enforce Role Guard and reject SCREEN or HOST from buzzing, stealing, or selecting cards', () => {
    service.joinRoom('socket-host', PlayerRole.HOST, 'MC Host');
    service.joinRoom('socket-screen', PlayerRole.SCREEN, 'Máy Chiếu Khán Phòng');
    service.joinRoom('socket-player', PlayerRole.PLAYER, 'Nguyen Van A');

    service.openBuzzer();

    // Screen attempts to buzz -> rejected by role guard
    const screenClaim = service.claimBuzz('socket-screen');
    expect(screenClaim.success).toBe(false);
    expect(screenClaim.reason).toContain('role');

    // Host attempts to buzz -> rejected by role guard
    const hostClaim = service.claimBuzz('socket-host');
    expect(hostClaim.success).toBe(false);
    expect(hostClaim.reason).toContain('role');

    // Player attempts to buzz -> accepted
    const playerClaim = service.claimBuzz('socket-player');
    expect(playerClaim.success).toBe(true);

    // Screen attempts to select card -> throws error
    expect(() => service.selectCard('socket-screen', 1)).toThrow();
  });
});


