import { Injectable } from '@nestjs/common';
import { Card, GameRoom, GameState, Player, PlayerRole, Question } from './game.types';
import { GameStateMachine } from './game-state-machine';
import { ScoringEngine } from './scoring-engine';

@Injectable()
export class GameService {
  private room: GameRoom;
  private isStealRound = false;
  private initialCardsCount = 16;

  constructor() {
    this.resetRoom();
  }

  /**
   * Khởi tạo hoặc Reset lại toàn bộ phòng game về trạng thái ban đầu
   */
  resetRoom(secretKeyword = 'Vịnh Hạ Long', secretImageUrl = 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80') {
    const cards: Card[] = [];
    const sampleQuestions: Question[] = [
      { id: 'q1', text: 'Thủ đô của Việt Nam là thành phố nào?', options: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Huế'], correctIndex: 0 },
      { id: 'q2', text: 'Núi cao nhất Việt Nam và Đông Dương là?', options: ['Bạch Mộc Lương Tử', 'Fansipan', 'Pu Si Lung', 'Tây Côn Lĩnh'], correctIndex: 1 },
      { id: 'q3', text: 'Vịnh nào của Việt Nam được UNESCO 2 lần công nhận là Di sản thiên nhiên thế giới?', options: ['Vịnh Nha Trang', 'Vịnh Xuân Đài', 'Vịnh Hạ Long', 'Vịnh Lan Hạ'], correctIndex: 2 },
      { id: 'q4', text: 'Sông nào dài nhất chảy qua lãnh thổ Việt Nam?', options: ['Sông Hồng', 'Sông Đồng Nai', 'Sông Cửu Long', 'Sông Mê Kông'], correctIndex: 2 },
      { id: 'q5', text: 'Ngày Quốc khánh của nước CHXHCN Việt Nam là ngày nào?', options: ['30/4', '2/9', '1/5', '19/8'], correctIndex: 1 },
      { id: 'q6', text: 'Đơn vị tiền tệ chính thức của Việt Nam là?', options: ['USD', 'Yên', 'Đồng', 'Baht'], correctIndex: 2 },
      { id: 'q7', text: 'Trang phục truyền thống nổi tiếng của phụ nữ Việt Nam là gì?', options: ['Áo dài', 'Kimono', 'Hanbok', 'Sari'], correctIndex: 0 },
      { id: 'q8', text: 'Nhà sàn, cồng chiêng là nét văn hóa đặc sắc của vùng nào?', options: ['Tây Nguyên', 'Đồng bằng sông Hồng', 'Đông Nam Bộ', 'Tây Nam Bộ'], correctIndex: 0 },
      { id: 'q9', text: 'Tết Nguyên Đán theo âm lịch đánh dấu sự khởi đầu của mùa nào?', options: ['Mùa Hạ', 'Mùa Thu', 'Mùa Đông', 'Mùa Xuân'], correctIndex: 3 },
      { id: 'q10', text: 'Cây cầu quay đầu tiên tại Việt Nam nằm ở thành phố nào?', options: ['Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'TP. Hồ Chí Minh'], correctIndex: 1 },
      { id: 'q11', text: 'Địa đạo Củ Chi nằm ở tỉnh/thành phố nào?', options: ['Tây Ninh', 'Bình Dương', 'TP. Hồ Chí Minh', 'Đồng Nai'], correctIndex: 2 },
      { id: 'q12', text: 'Chùa Một Cột ở Hà Nội có hình dáng mô phỏng loài hoa nào?', options: ['Hoa Sen', 'Hoa Mai', 'Hoa Đào', 'Hoa Cúc'], correctIndex: 0 },
      { id: 'q13', text: 'Hồ nước ngọt tự nhiên lớn nhất Việt Nam là hồ nào?', options: ['Hồ Tây', 'Hồ Ba Bể', 'Hồ Tơ Nưng', 'Hồ Trị An'], correctIndex: 1 },
      { id: 'q14', text: 'Quần đảo Hoàng Sa và Trường Sa thuộc chủ quyền của quốc gia nào?', options: ['Việt Nam', 'Thái Lan', 'Malaysia', 'Philippines'], correctIndex: 0 },
      { id: 'q15', text: 'Bánh chưng truyền thống của người Việt có hình dạng gì?', options: ['Hình tròn', 'Hình vuông', 'Hình tam giác', 'Hình trụ'], correctIndex: 1 },
      { id: 'q16', text: 'Đại thi hào Nguyễn Du là tác giả của kiệt tác văn học nào?', options: ['Lục Vân Tiên', 'Truyện Kiều', 'Tắt Đèn', 'Chí Phèo'], correctIndex: 1 },
    ];

    for (let i = 1; i <= this.initialCardsCount; i++) {
      cards.push({
        id: `card-${i}`,
        index: i,
        isOpened: false,
        question: sampleQuestions[i - 1],
      });
    }

    this.room = {
      roomId: 'DEFAULT_ROOM',
      status: GameState.LOBBY,
      players: {},
      cards,
      activePlayerId: null,
      currentCardId: null,
      secretImageKeyword: secretKeyword,
      secretImageUrl: secretImageUrl,
      winnerId: null,
      winnerName: null,
      pendingUltimateGuess: null,
      timer: {
        duration: 0,
        remaining: 0,
        type: null,
      },
      totalRounds: 0,
    };
    this.isStealRound = false;
  }

  /**
   * Khởi tạo lại phòng đấu với cấu hình tùy biến (Bộ câu hỏi và hình ảnh mới)
   */
  resetRoomWithConfig(config: { secretMedia: { keyword: string; imageUrl: string; hint?: string }; questions: Question[] }) {
    if (!config || !config.questions || config.questions.length !== 16) {
      this.resetRoom();
      return;
    }

    const cards: Card[] = config.questions.map((q, idx) => ({
      id: `card-${idx + 1}`,
      index: idx + 1,
      isOpened: false,
      question: q,
    }));

    this.room = {
      roomId: 'DEFAULT_ROOM',
      status: GameState.LOBBY,
      players: {},
      cards,
      activePlayerId: null,
      currentCardId: null,
      secretImageKeyword: config.secretMedia?.keyword || 'Vịnh Hạ Long',
      secretImageUrl: config.secretMedia?.imageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      winnerId: null,
      winnerName: null,
      pendingUltimateGuess: null,
      timer: {
        duration: 0,
        remaining: 0,
        type: null,
      },
      totalRounds: 0,
    };
    this.isStealRound = false;
  }

  private sessionToPlayerMap: Map<string, Player> = new Map();
  private socketToSessionMap: Map<string, string> = new Map();

  getRoom(): GameRoom {
    return this.room;
  }

  /**
   * Người chơi, Host hoặc TV kết nối vào phòng
   */
  joinRoom(id: string, role: PlayerRole, name: string): Player {
    if (this.room.players[id]) {
      this.room.players[id].connected = true;
      this.room.players[id].name = name;
      return this.room.players[id];
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newPlayer: Player = {
      id,
      sessionId,
      name: name || (role === PlayerRole.HOST ? 'MC Host' : role === PlayerRole.SCREEN ? 'Big Screen' : 'Người chơi'),
      score: 0,
      isFrozen: 0,
      hasCooldown: false,
      role,
      connected: true,
    };
    this.room.players[id] = newPlayer;
    this.sessionToPlayerMap.set(sessionId, newPlayer);
    this.socketToSessionMap.set(id, sessionId);
    return newPlayer;
  }

  private authenticatedHostSockets: Set<string> = new Set();
  private hostPin: string = process.env.HOST_PIN || '8888';

  disconnectPlayer(id: string) {
    if (this.room.players[id]) {
      this.room.players[id].connected = false;
    }
    this.authenticatedHostSockets.delete(id);
  }

  /**
   * Xác thực mã PIN Host
   */
  authenticateHost(socketId: string, pin: string): boolean {
    if (pin === this.hostPin) {
      this.authenticatedHostSockets.add(socketId);
      return true;
    }
    return false;
  }

  /**
   * Kiểm tra quyền Host của một socket
   */
  isHostAuthenticated(socketId: string): boolean {
    return this.authenticatedHostSockets.has(socketId);
  }

  /**
   * Khôi phục kết nối cho người chơi khi tải lại trang (F5) hoặc rớt mạng
   */
  reconnectPlayer(newSocketId: string, sessionId: string): Player | null {
    if (!sessionId || !this.sessionToPlayerMap.has(sessionId)) {
      return null;
    }

    const player = this.sessionToPlayerMap.get(sessionId)!;
    const oldSocketId = player.id;

    // Dọn dẹp key socket cũ trong room.players nếu khác socket mới
    if (oldSocketId !== newSocketId) {
      delete this.room.players[oldSocketId];
      this.socketToSessionMap.delete(oldSocketId);
    }

    // Cập nhật socket id mới cho player
    player.id = newSocketId;
    player.connected = true;

    this.room.players[newSocketId] = player;
    this.socketToSessionMap.set(newSocketId, sessionId);

    // Cập nhật activePlayerId nếu người chơi đang trong lượt thao tác
    if (this.room.activePlayerId === oldSocketId) {
      this.room.activePlayerId = newSocketId;
    }

    return player;
  }

  /**
   * MC bấm mở chuông cho vòng chơi mới
   */
  openBuzzer(): { success: boolean; status: GameState } {
    // Giảm thời gian freeze và gỡ cooldown của người chơi ở đầu lượt mới
    Object.values(this.room.players).forEach((player) => {
      if (player.hasCooldown) {
        player.hasCooldown = false; // Gỡ cooldown sau 1 lượt
      }
      if (player.isFrozen > 0) {
        player.isFrozen -= 1; // Giảm 1 lượt đóng băng
      }
    });

    this.room.activePlayerId = null;
    this.room.currentCardId = null;
    this.isStealRound = false;
    this.room.totalRounds++;
    this.room.status = GameStateMachine.transition(this.room.status, GameState.BUZZER_OPEN);

    return { success: true, status: this.room.status };
  }

  /**
   * Reset trạng thái chuông về Intermission
   */
  resetBuzzer(): { success: boolean } {
    this.room.activePlayerId = null;
    this.room.currentCardId = null;
    this.isStealRound = false;
    this.room.status = GameState.INTERMISSION;
    return { success: true };
  }

  /**
   * Xử lý tranh chấp mili-giây khi người chơi bấm chuông
   */
  claimBuzz(playerId: string): { success: boolean; reason?: string } {
    if (this.room.status !== GameState.BUZZER_OPEN) {
      return { success: false, reason: 'Buzzer is not open' };
    }
    const player = this.room.players[playerId];
    if (!player) {
      return { success: false, reason: 'Player not found' };
    }
    if (player.role !== PlayerRole.PLAYER) {
      return { success: false, reason: 'Chỉ người chơi (player role) mới có quyền bấm chuông' };
    }
    if (player.isFrozen > 0) {
      return { success: false, reason: `Player is frozen for ${player.isFrozen} more rounds` };
    }
    if (player.hasCooldown) {
      return { success: false, reason: 'Player is in cooldown after winning previous round' };
    }

    this.room.activePlayerId = playerId;
    this.room.status = GameStateMachine.transition(this.room.status, GameState.CARD_SELECTION);
    return { success: true };
  }

  /**
   * Người chơi chọn ô thẻ
   */
  selectCard(playerId: string, cardIndex: number): Card {
    if (this.room.status !== GameState.CARD_SELECTION || this.room.activePlayerId !== playerId) {
      throw new Error('Not authorized to select card');
    }
    const player = this.room.players[playerId];
    if (!player || player.role !== PlayerRole.PLAYER) {
      throw new Error('Not authorized to select card: invalid role');
    }
    const card = this.room.cards.find((c) => c.index === cardIndex);
    if (!card) {
      throw new Error('Card not found');
    }
    if (card.isOpened) {
      throw new Error('Card already opened');
    }

    this.room.currentCardId = card.id;
    this.room.status = GameStateMachine.transition(this.room.status, GameState.QUESTION_ACTIVE);
    return card;
  }

  /**
   * Người chơi gửi đáp án trắc nghiệm (0, 1, 2, 3)
   */
  submitAnswer(playerId: string, selectedIndex: number): { isCorrect: boolean; correctIndex: number; pointsAwarded: number } {
    if (this.room.status !== GameState.QUESTION_ACTIVE || this.room.activePlayerId !== playerId) {
      throw new Error('Not authorized to submit answer');
    }
    const player = this.room.players[playerId];
    if (!player || player.role !== PlayerRole.PLAYER) {
      throw new Error('Not authorized to submit answer: invalid role');
    }
    const card = this.room.cards.find((c) => c.id === this.room.currentCardId);
    if (!card) {
      throw new Error('Current question not found');
    }
    const isCorrect = card.question.correctIndex === selectedIndex;
    let pointsAwarded = 0;

    if (isCorrect) {
      pointsAwarded = this.isStealRound
        ? ScoringEngine.evaluateScore('STEAL')
        : ScoringEngine.evaluateScore('CORRECT');

      player.score += pointsAwarded;
      card.isOpened = true;
      card.openedBy = player.name;
      player.hasCooldown = true; // Thưởng điểm + áp dụng cooldown lượt sau

      this.room.status = GameStateMachine.transition(this.room.status, GameState.INTERMISSION);
      this.checkAllCardsOpened();
    } else {
      pointsAwarded = ScoringEngine.evaluateScore('WRONG');
      player.score += pointsAwarded;

      if (!this.isStealRound) {
        // Mở chuông cướp lượt cho các người chơi còn lại
        this.room.status = GameStateMachine.transition(this.room.status, GameState.STEAL_OPEN);
        this.room.activePlayerId = null;
      } else {
        // Lượt cướp cũng sai -> chuyển về Intermission
        this.room.status = GameStateMachine.transition(this.room.status, GameState.INTERMISSION);
      }
    }

    return {
      isCorrect,
      correctIndex: card.question.correctIndex,
      pointsAwarded,
    };
  }

  /**
   * Giành quyền cướp lượt khi người đầu tiên trả lời sai
   */
  claimSteal(playerId: string): { success: boolean; reason?: string } {
    if (this.room.status !== GameState.STEAL_OPEN) {
      return { success: false, reason: 'Steal buzzer is not open' };
    }
    const player = this.room.players[playerId];
    if (!player || player.role !== PlayerRole.PLAYER || player.isFrozen > 0) {
      return { success: false, reason: 'Player cannot steal (invalid role or frozen)' };
    }

    this.isStealRound = true;
    this.room.activePlayerId = playerId;
    this.room.status = GameStateMachine.transition(this.room.status, GameState.QUESTION_ACTIVE);
    return { success: true };
  }

  /**
   * Xử lý hết giờ (Timeout) khi chọn ô hoặc trả lời
   */
  handleTimeout(): { penalty: number } {
    if (this.room.activePlayerId && this.room.players[this.room.activePlayerId]) {
      const player = this.room.players[this.room.activePlayerId];
      player.score += ScoringEngine.evaluateScore('TIMEOUT');
    }
    this.room.status = GameStateMachine.transition(this.room.status, GameState.INTERMISSION);
    this.room.activePlayerId = null;
    return { penalty: ScoringEngine.evaluateScore('TIMEOUT') };
  }

  /**
   * Gửi từ khóa Đoán ảnh gốc (Ultimate Guess)
   */
  submitUltimateGuess(playerId: string, keyword: string): { submitted: boolean; autoMatch: boolean } {
    const player = this.room.players[playerId];
    if (!player || player.role !== PlayerRole.PLAYER || player.isFrozen > 0) {
      throw new Error('Player cannot make ultimate guess');
    }

    const autoMatch = ScoringEngine.checkUltimateGuess(keyword, this.room.secretImageKeyword);
    this.room.pendingUltimateGuess = {
      playerId,
      playerName: player.name,
      keyword,
    };
    return { submitted: true, autoMatch };
  }

  /**
   * Host duyệt kết quả đoán ảnh gốc
   */
  reviewUltimateGuess(isApproved: boolean): { isWinner: boolean; winnerName?: string } {
    if (!this.room.pendingUltimateGuess) {
      throw new Error('No pending ultimate guess');
    }
    const { playerId, playerName } = this.room.pendingUltimateGuess;
    const player = this.room.players[playerId];

    if (isApproved) {
      // LUẬT 1: ĐOÁN TRÚNG ẢNH GỐC LÀ THẮNG NGAY LẬP TỨC (INSTANT WIN)
      this.room.winnerId = playerId;
      this.room.winnerName = playerName;
      this.room.cards.forEach((c) => (c.isOpened = true));
      this.room.status = GameState.GAME_OVER;
      this.room.pendingUltimateGuess = null;
      return { isWinner: true, winnerName: playerName };
    } else {
      // ĐOÁN SAI: BỊ ĐÓNG BĂNG 2 LƯỢT
      if (player) {
        player.isFrozen = ScoringEngine.FREEZE_ROUNDS_ON_WRONG_ULTIMATE_GUESS;
      }
      this.room.pendingUltimateGuess = null;
      return { isWinner: false };
    }
  }

  /**
   * Kiểm tra nếu đã mở hết toàn bộ 16 ô mà chưa ai đoán ảnh gốc -> Chuyển sang 30s Final Showdown
   */
  private checkAllCardsOpened() {
    const allOpened = this.room.cards.every((c) => c.isOpened);
    if (allOpened && this.room.status !== GameState.GAME_OVER) {
      this.room.status = GameState.FINAL_SHOWDOWN;
    }
  }

  /**
   * Host ép buộc kết thúc hoặc công bố người cao điểm nhất
   */
  forceEnd(): { success: boolean; winner: Player | null } {
    const res = this.forceEndGame();
    return { success: true, winner: res.winner };
  }

  /**
   * Host ép buộc kết thúc hoặc công bố người cao điểm nhất
   */
  forceEndGame(): { winner: Player | null } {
    this.room.cards.forEach((c) => (c.isOpened = true));
    this.room.status = GameState.GAME_OVER;

    // Tìm người điểm cao nhất
    const playersList = Object.values(this.room.players).filter((p) => p.role === PlayerRole.PLAYER);
    if (playersList.length > 0) {
      playersList.sort((a, b) => b.score - a.score);
      this.room.winnerId = playersList[0].id;
      this.room.winnerName = playersList[0].name;
      return { winner: playersList[0] };
    }
    return { winner: null };
  }
}
