import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { GameState, PlayerRole } from './game.types';

describe('GameGateway', () => {
  let gateway: GameGateway;
  let service: GameService;

  const mockServer = {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameGateway, GameService],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
    service = module.get<GameService>(GameService);
    gateway.server = mockServer as any;
  });

  afterEach(() => {
    (gateway as any).timerManager.clear();
  });

  it('should handle player join and broadcast room update', () => {
    const mockSocket = { id: 's1', emit: jest.fn() } as any;
    gateway.handleJoin(mockSocket, { role: PlayerRole.PLAYER, name: 'An Nguyen' });

    expect(mockServer.emit).toHaveBeenCalledWith('room:updated', expect.any(Object));
  });

  it('should handle buzzer race condition atomically: first wins, second rejected', () => {
    service.joinRoom('p1', PlayerRole.PLAYER, 'Player 1');
    service.joinRoom('p2', PlayerRole.PLAYER, 'Player 2');
    service.openBuzzer();

    const socket1 = { id: 'p1', emit: jest.fn() } as any;
    const socket2 = { id: 'p2', emit: jest.fn() } as any;

    gateway.handleBuzz(socket1);
    gateway.handleBuzz(socket2);

    expect(mockServer.emit).toHaveBeenCalledWith('buzzer:claimed', expect.objectContaining({ playerId: 'p1' }));
  });

  it('should reject buzz from frozen or cooldown player', () => {
    service.joinRoom('p1', PlayerRole.PLAYER, 'Player 1');
    service.getRoom().players['p1'].isFrozen = 2;
    service.openBuzzer();

    const socket1 = { id: 'p1', emit: jest.fn() } as any;
    gateway.handleBuzz(socket1);

    expect(socket1.emit).toHaveBeenCalledWith('buzzer:rejected', expect.any(Object));
  });

  it('should handle player reconnect with valid session and broadcast update', () => {
    const player = service.joinRoom('old-socket', PlayerRole.PLAYER, 'Player Reconnect');
    const sessionId = player.sessionId!;

    const newSocket = { id: 'new-socket', emit: jest.fn() } as any;
    gateway.handleReconnect(newSocket, { sessionId });

    expect(newSocket.emit).toHaveBeenCalledWith('player:reconnected', expect.objectContaining({ name: 'Player Reconnect' }));
    expect(mockServer.emit).toHaveBeenCalledWith('room:updated', expect.any(Object));
  });

  it('should reject reconnect with invalid sessionId', () => {
    const newSocket = { id: 'new-socket', emit: jest.fn() } as any;
    gateway.handleReconnect(newSocket, { sessionId: 'invalid-session' });

    expect(newSocket.emit).toHaveBeenCalledWith('session:invalid', expect.any(Object));
  });

  it('should authenticate host with correct PIN and reject incorrect PIN', () => {
    const hostSocket = { id: 'host-socket', emit: jest.fn() } as any;
    
    // Authenticate with wrong PIN
    gateway.handleHostAuthenticate(hostSocket, { pin: '0000' });
    expect(hostSocket.emit).toHaveBeenCalledWith('host:auth_result', { success: false, message: 'Invalid Host PIN' });

    // Authenticate with correct PIN
    gateway.handleHostAuthenticate(hostSocket, { pin: '8888' });
    expect(hostSocket.emit).toHaveBeenCalledWith('host:auth_result', { success: true });
  });

  it('should reject host actions if socket is not authenticated', () => {
    const unauthSocket = { id: 'unauth-socket', emit: jest.fn() } as any;
    gateway.handleOpenBuzzer(unauthSocket);

    expect(unauthSocket.emit).toHaveBeenCalledWith('error', { message: 'Unauthorized: Host authentication required' });
  });

  it('should allow host actions after authentication', () => {
    const hostSocket = { id: 'host-socket-2', emit: jest.fn() } as any;
    gateway.handleHostAuthenticate(hostSocket, { pin: '8888' });
    gateway.handleOpenBuzzer(hostSocket);

    expect(service.getRoom().status).toBe(GameState.BUZZER_OPEN);
    expect(mockServer.emit).toHaveBeenCalledWith('buzzer:opened', expect.any(Object));
  });
});

