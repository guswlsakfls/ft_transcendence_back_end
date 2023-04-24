import { GameStatus, GameVariable } from '../constants/gameVariable';
import { GameService } from '../game.service';
import { Game } from './game.class';
import { Server } from 'socket.io';

export class GameManager {
  gameList: Map<string, Game> = new Map<string, Game>();

  sendGame(server: Server, gameService: GameService) {
    this.gameList.forEach((game) => {
      const score = game.getScore();
      if (
        score[0] >= GameVariable.maxScore ||
        score[1] >= GameVariable.maxScore
      ) {
        // 게임 종료 뒤 결과 저장하고 방 폭파
        game.setGameStatus(GameStatus.End);
        gameService.updateGameState(game);
        this.deleteGameByRoomId(game.getRoomId());
        server.to(game.getRoomId()).emit('postLeaveGame', 'delete');
      }
      if (game.getGameStatus() !== GameStatus.Play) return;
      game.updateGame();
      server.to(game.getRoomId()).emit('updateGame', game);
    });
  }

  createGame(roomId: string, title: string): void {
    const game = new Game(roomId, title);
    this.gameList.set(roomId, game);
  }

  deleteGameByTitle(title: string): void {
    this.gameList.delete(title);
  }

  deleteGameByRoomId(roomId: string): void {
    this.gameList.delete(roomId);
  }

  getGameByRoomId(roomId: string): Game {
    return this.gameList.get(roomId);
  }

  isGameByRoomId(roomId: string): boolean {
    return this.gameList.has(roomId);
  }

  getGameRooms() {
    return this.gameList;
  }
}
