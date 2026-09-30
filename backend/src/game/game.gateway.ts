import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { GameState, PlayerRole } from './game.types';
import { TimerManager } from './timer-manager';
import {
  sanitizeRoomForPlayer,
  sanitizeRoomForHost,
} from './game-sanitizer';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private timerManager = new TimerManager();

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
    // Gửi trạng thái phòng đã sanitize an toàn cho client mới kết nối
    client.emit('room:state', sanitizeRoomForPlayer(this.gameService.getRoom()));
  }

  handleDisconnect(client: Socket) {
    this.gameService.disconnectPlayer(client.id);
    this.broadcastRoomState();
  }

  private broadcastRoomState() {
    if (this.server) {
      const room = this.gameService.getRoom();
      // Mặc định phát tán trạng thái an toàn không lộ đáp án cho toàn bộ người chơi/màn hình
      this.server.emit('room:updated', sanitizeRoomForPlayer(room));
      // Riêng phòng MC/Host nhận trạng thái đầy đủ phục vụ điều khiển
      if (typeof this.server.to === 'function') {
        this.server.to('host-room').emit('room:updated', sanitizeRoomForHost(room));
      }
    }
  }

  @SubscribeMessage('player:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { role: PlayerRole; name: string },
  ) {
    const player = this.gameService.joinRoom(client.id, data.role, data.name);
    client.emit('player:joined', player);
    this.broadcastRoomState();
  }

  @SubscribeMessage('player:reconnect')
  handleReconnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const player = this.gameService.reconnectPlayer(client.id, data.sessionId);
    if (player) {
      client.emit('player:reconnected', player);
      this.broadcastRoomState();
    } else {
      client.emit('session:invalid', { message: 'Phiên chơi không tồn tại hoặc đã hết hạn' });
    }
  }

  @SubscribeMessage('host:authenticate')
  handleHostAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pin: string },
  ) {
    const isSuccess = this.gameService.authenticateHost(client.id, data?.pin || '');
    if (isSuccess) {
      if (typeof client.join === 'function') {
        client.join('host-room');
      }
      client.emit('host:auth_result', { success: true });
      client.emit('room:state', sanitizeRoomForHost(this.gameService.getRoom()));
    } else {
      client.emit('host:auth_result', { success: false, message: 'Invalid Host PIN' });
    }
  }

  private checkHostAuth(client: Socket): boolean {
    if (!this.gameService.isHostAuthenticated(client.id)) {
      client.emit('error', { message: 'Unauthorized: Host authentication required' });
      return false;
    }
    return true;
  }

  @SubscribeMessage('host:open_buzzer')
  handleOpenBuzzer(@ConnectedSocket() client: Socket) {
    if (!this.checkHostAuth(client)) return;
    this.timerManager.clear();
    const result = this.gameService.openBuzzer();
    if (result.success) {
      if (this.server) {
        this.server.emit('buzzer:opened', { status: GameState.BUZZER_OPEN });
      }
      this.broadcastRoomState();
    }
  }

  @SubscribeMessage('player:buzz')
  handleBuzz(@ConnectedSocket() client: Socket) {
    const claim = this.gameService.claimBuzz(client.id);
    if (claim.success) {
      const room = this.gameService.getRoom();
      const player = room.players[client.id];

      if (this.server) {
        this.server.emit('buzzer:claimed', {
          playerId: client.id,
          playerName: player?.name,
        });
      }
      this.broadcastRoomState();

      // Bắt đầu đếm ngược 5 giây chọn ô thẻ
      this.timerManager.start(
        5,
        (remaining) => {
          if (this.server) {
            this.server.emit('timer:tick', { type: 'SELECT_CARD', remaining });
          }
        },
        () => {
          try {
            // Timeout chọn ô -> phạt và chuyển lượt
            this.gameService.handleTimeout();
            if (this.server) {
              this.server.emit('timer:expired', { reason: 'Timeout selecting card' });
            }
            this.broadcastRoomState();
          } catch (err) {
            console.error('Error on select card timeout', err);
          }
        },
      );
    } else {
      client.emit('buzzer:rejected', { reason: claim.reason });
    }
  }

  @SubscribeMessage('player:select_card')
  handleSelectCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { cardIndex: number },
  ) {
    try {
      const card = this.gameService.selectCard(client.id, data.cardIndex);
      this.timerManager.clear();
      this.broadcastRoomState();

      // Bắt đầu đếm ngược 15 giây trả lời câu hỏi trắc nghiệm
      const timeLimit = card.question.timeLimit || 15;
      this.timerManager.start(
        timeLimit,
        (remaining) => {
          if (this.server) {
            this.server.emit('timer:tick', { type: 'ANSWER_QUESTION', remaining });
          }
        },
        () => {
          try {
            // Timeout trả lời câu hỏi -> phạt và chuyển lượt cướp
            const result = this.gameService.submitAnswer(client.id, -1);
            if (this.server) {
              this.server.emit('question:result', result);
              this.server.emit('timer:expired', { reason: 'Timeout answering question' });
            }
            this.broadcastRoomState();
          } catch (err) {
            console.error('Error on answer timeout', err);
          }
        },
      );
    } catch (err: any) {
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('player:submit_answer')
  handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { selectedIndex: number },
  ) {
    try {
      if (typeof data?.selectedIndex !== 'number') {
        throw new Error('Invalid selectedIndex');
      }
      const result = this.gameService.submitAnswer(client.id, data.selectedIndex);
      this.timerManager.clear();
      if (this.server) {
        this.server.emit('question:result', result);
      }
      this.broadcastRoomState();
    } catch (err: any) {
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('player:steal_buzz')
  handleStealBuzz(@ConnectedSocket() client: Socket) {
    const claim = this.gameService.claimSteal(client.id);
    if (claim.success) {
      const room = this.gameService.getRoom();
      const player = room.players[client.id];
      if (this.server) {
        this.server.emit('steal:claimed', { playerId: client.id, playerName: player?.name });
      }
      this.broadcastRoomState();

      // Đếm ngược 15 giây cho người cướp trả lời
      this.timerManager.start(
        15,
        (remaining) => {
          if (this.server) {
            this.server.emit('timer:tick', { type: 'ANSWER_QUESTION', remaining });
          }
        },
        () => {
          try {
            const result = this.gameService.submitAnswer(client.id, -1);
            if (this.server) {
              this.server.emit('question:result', result);
              this.server.emit('timer:expired', { reason: 'Timeout answering steal question' });
            }
            this.broadcastRoomState();
          } catch (err) {
            console.error('Error on steal timeout', err);
          }
        },
      );
    } else {
      client.emit('steal:rejected', { reason: claim.reason });
    }
  }

  @SubscribeMessage('player:ultimate_guess')
  handleUltimateGuess(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { keyword: string },
  ) {
    try {
      const result = this.gameService.submitUltimateGuess(client.id, data.keyword);
      const room = this.gameService.getRoom();
      if (this.server) {
        this.server.emit('ultimate_guess:received', {
          playerId: client.id,
          playerName: room.players[client.id]?.name,
          keyword: data.keyword,
          autoMatch: result.autoMatch,
        });
      }
      this.broadcastRoomState();
    } catch (err: any) {
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('host:review_ultimate_guess')
  handleReviewUltimateGuess(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { isApproved: boolean },
  ) {
    if (!this.checkHostAuth(client)) return;
    try {
      const review = this.gameService.reviewUltimateGuess(data.isApproved);
      if (this.server) {
        this.server.emit('ultimate_guess:reviewed', review);
      }
      this.broadcastRoomState();
    } catch (err: any) {
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('host:reset_buzzer')
  handleResetBuzzer(@ConnectedSocket() client: Socket) {
    if (!this.checkHostAuth(client)) return;
    this.timerManager.clear();
    const result = this.gameService.resetBuzzer();
    if (result.success) {
      this.broadcastRoomState();
    }
  }

  @SubscribeMessage('host:force_end')
  handleForceEnd(@ConnectedSocket() client: Socket) {
    if (!this.checkHostAuth(client)) return;
    this.timerManager.clear();
    const result = this.gameService.forceEnd();
    if (result.success) {
      this.broadcastRoomState();
    }
  }

  @SubscribeMessage('host:reset_game')
  handleResetGame(@ConnectedSocket() client: Socket) {
    if (!this.checkHostAuth(client)) return;
    this.timerManager.clear();
    this.gameService.resetRoom();
    this.broadcastRoomState();
  }

  @SubscribeMessage('host:create_custom_game')
  handleCreateCustomGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    if (!this.checkHostAuth(client)) return;
    try {
      this.timerManager.clear();
      this.gameService.resetRoomWithConfig(data);
      this.broadcastRoomState();
      client.emit('host:custom_game_created', { success: true });
    } catch (err: any) {
      client.emit('error', { message: 'Lỗi cấu hình game: ' + err.message });
    }
  }
}
