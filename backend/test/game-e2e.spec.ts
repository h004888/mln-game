import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { GameState, PlayerRole } from '../src/game/game.types';

describe('Buzzer Board Game E2E Integration & 30-Player Concurrency Test', () => {
  let app: INestApplication;
  let port: number;
  let hostSocket: Socket;
  let screenSocket: Socket;
  let playerSockets: Socket[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0); // Random available port
    const address = app.getHttpServer().address();
    port = typeof address === 'string' ? 3001 : address.port;
  });

  afterAll(async () => {
    // Teardown sockets
    hostSocket?.disconnect();
    screenSocket?.disconnect();
    playerSockets.forEach((s) => s.disconnect());
    await app.close();
  });

  it('should connect 30 players, 1 host and 1 screen simultaneously', (done) => {
    const backendUrl = `http://localhost:${port}`;

    hostSocket = io(backendUrl);
    screenSocket = io(backendUrl);

    hostSocket.emit('player:join', { role: PlayerRole.HOST, name: 'MC Host' });
    screenSocket.emit('player:join', { role: PlayerRole.SCREEN, name: 'Main TV' });

    let connectedPlayers = 0;
    const TOTAL_PLAYERS = 30;

    for (let i = 1; i <= TOTAL_PLAYERS; i++) {
      const pSocket = io(backendUrl);
      playerSockets.push(pSocket);

      pSocket.on('connect', () => {
        pSocket.emit('player:join', { role: PlayerRole.PLAYER, name: `Player ${i}` });
        connectedPlayers++;
        if (connectedPlayers === TOTAL_PLAYERS) {
          expect(playerSockets.length).toBe(TOTAL_PLAYERS);
          done();
        }
      });
    }
  });

  it('should authenticate host before allowing MC actions and reject unauthorized clients', (done) => {
    const unauthSocket = io(`http://localhost:${port}`);
    unauthSocket.on('connect', () => {
      // Unauthenticated socket attempts to open buzzer
      unauthSocket.emit('host:open_buzzer');
      unauthSocket.on('error', (err: any) => {
        expect(err.message).toContain('Unauthorized');

        // Authenticate hostSocket with valid PIN '8888'
        hostSocket.emit('host:authenticate', { pin: '8888' });
        hostSocket.on('host:auth_result', (res: any) => {
          expect(res.success).toBe(true);
          unauthSocket.disconnect();
          done();
        });
      });
    });
  });

  it('should simulate 30 players buzzing simultaneously: only 1 gets claimed', (done) => {
    // MC opens buzzer
    hostSocket.emit('host:open_buzzer');

    let buzzClaimedEventReceived = 0;
    let claimedPlayerId: string | null = null;

    screenSocket.on('buzzer:claimed', (data: { playerId: string; playerName: string }) => {
      buzzClaimedEventReceived++;
      claimedPlayerId = data.playerId;
    });

    setTimeout(() => {
      // 30 players buzz at the same millisecond
      playerSockets.forEach((socket) => {
        socket.emit('player:buzz');
      });

      setTimeout(() => {
        expect(buzzClaimedEventReceived).toBe(1);
        expect(claimedPlayerId).toBeDefined();
        done();
      }, 300);
    }, 100);
  });

  it('should preserve score and state when player disconnects and reconnects with sessionId', (done) => {
    const testPlayer = io(`http://localhost:${port}`);
    let savedSessionId = '';

    testPlayer.emit('player:join', { role: PlayerRole.PLAYER, name: 'Persistent Player' });
    testPlayer.on('player:joined', (player: any) => {
      savedSessionId = player.sessionId;
      expect(savedSessionId).toBeDefined();

      // Disconnect socket (simulating F5)
      testPlayer.disconnect();

      // Reconnect with new socket
      const newPlayerSocket = io(`http://localhost:${port}`);
      newPlayerSocket.emit('player:reconnect', { sessionId: savedSessionId });
      newPlayerSocket.on('player:reconnected', (reconnected: any) => {
        expect(reconnected.name).toBe('Persistent Player');
        expect(reconnected.sessionId).toBe(savedSessionId);
        newPlayerSocket.disconnect();
        done();
      });
    });
  });

  it('should create custom game with 16 questions and secret keyword via host:create_custom_game', (done) => {
    const customQuestions = Array.from({ length: 16 }, (_, i) => ({
      id: `custom-${i + 1}`,
      text: `Câu hỏi tùy chỉnh ${i + 1}`,
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
    }));

    hostSocket.once('host:custom_game_created', (res: any) => {
      expect(res.success).toBe(true);
      screenSocket.on('room:updated', (room: any) => {
        if (room.secretImageKeyword === 'Chùa Một Cột') {
          expect(room.cards[0].question.text).toBe('Câu hỏi tùy chỉnh 1');
          done();
        }
      });
    });

    hostSocket.emit('host:create_custom_game', {
      secretMedia: {
        keyword: 'Chùa Một Cột',
        imageUrl: 'https://example.com/one-pillar-pagoda.jpg',
      },
      questions: customQuestions,
    });
  });
});


