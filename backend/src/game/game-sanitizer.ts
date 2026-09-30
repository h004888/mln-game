  import { GameRoom, GameState, Card, Player } from './game.types';

/**
 * Lọc thông tin phòng chơi theo vai trò để ngăn lộ đáp án và token phiên
 */

function sanitizeCards(cards: Card[], isGameOver: boolean): Card[] {
  return cards.map((c) => ({
    ...c,
    question: {
      ...c.question,
      options: [...c.question.options],
      // Nếu chưa lật mở và chưa Game Over -> giấu đáp án đúng
      correctIndex: c.isOpened || isGameOver ? c.question.correctIndex : -1,
    },
  }));
}

function sanitizePlayers(
  players: Record<string, Player>,
  keepSessionForPlayerId?: string,
): Record<string, Player> {
  const result: Record<string, Player> = {};
  for (const [id, player] of Object.entries(players)) {
    result[id] = {
      ...player,
      sessionId: keepSessionForPlayerId && id === keepSessionForPlayerId ? player.sessionId : undefined,
    };
  }
  return result;
}

export function sanitizeRoomForPlayer(room: GameRoom, playerId?: string): GameRoom {
  const isGameOver = room.status === GameState.GAME_OVER;
  return {
    ...room,
    players: sanitizePlayers(room.players, playerId),
    cards: sanitizeCards(room.cards, isGameOver),
    secretImageKeyword: isGameOver ? room.secretImageKeyword : '',
    secretImageUrl: isGameOver ? room.secretImageUrl : '',
  };
}

export function sanitizeRoomForScreen(room: GameRoom): GameRoom {
  const isGameOver = room.status === GameState.GAME_OVER;
  return {
    ...room,
    players: sanitizePlayers(room.players),
    cards: sanitizeCards(room.cards, isGameOver),
    secretImageKeyword: isGameOver ? room.secretImageKeyword : '',
    secretImageUrl: isGameOver ? room.secretImageUrl : '',
  };
}

export function sanitizeRoomForHost(room: GameRoom): GameRoom {
  return {
    ...room,
    players: sanitizePlayers(room.players),
    // Host được nhìn thấy toàn bộ đáp án và secret keyword
    cards: room.cards.map((c) => ({
      ...c,
      question: {
        ...c.question,
        options: [...c.question.options],
      },
    })),
  };
}
