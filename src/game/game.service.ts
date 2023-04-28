import { Injectable } from '@nestjs/common';
import { GameRepository } from './repository/game.repository';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { Game } from './classes/game.class';
import { GameManager } from './classes/gameManager.class';
import { Logger } from '@nestjs/common';
import { PlayerList } from './classes/playerList.class';
import { WsException } from '@nestjs/websockets';
import * as uuid from 'uuid';
import { GameStatus } from './constants/gameVariable';

@Injectable()
export class GameService {
  constructor(
    private gameRepository: GameRepository,
    private authService: AuthService,
  ) {}
  private readonly WsLogger = new Logger('GameWsLogger');

  async createGame(server: Server, gameManager: GameManager) {
    const allSockets = await server.in(GameStatus.MATCHING).fetchSockets();
    if (allSockets.length >= 2) {
      const client1 = allSockets.shift();
      const client2 = allSockets.shift();
      const player1 = client1.data.user;
      const player2 = client2.data.user;
      const title = `${player1.name}-${player2.name}`;
      const newRoomId = uuid.v4();

      client1.leave(GameStatus.MATCHING);
      client1.join(newRoomId);
      client1.data.roomId = newRoomId;
      client1.emit('startGame');
      client2.leave(GameStatus.MATCHING);
      client2.join(newRoomId);
      client2.data.roomId = newRoomId;
      client2.emit('startGame');

      gameManager.createGame(newRoomId, title);
      const newGame = await this.gameRepository.saveGameState(
        newRoomId,
        title,
        player1,
        player2,
      );
      if (newGame) {
        client1.emit('getMatching', 'matching', newGame);
        client2.emit('getMatching', 'matching', newGame);
      }
    }
  }

  async getGameList() {
    const gameList = await this.gameRepository.getGameList();
    return gameList;
  }

  async updateGameStatus(roomId: string, status: string) {
    return await this.gameRepository.updateGameStatus(roomId, status);
  }

  async getPlayerBySocket(client: Socket, players: PlayerList) {
    const user = await this.authService.getUserBySocket(client);
    if (!user) {
      client.disconnect();
      throw new WsException('Unauthorized');
    }
    const player = players.getPlayerByUserId(user.id);
    if (!player) {
      client.disconnect();
      throw new WsException('User is not in game');
    }

    return player;
  }

  async getRoomIdByUserId(userId: string) {
    const roomId = await this.gameRepository.getRoomIdByUserId(userId);
    if (roomId) {
      return roomId.roomId;
    }
    return null;
  }

  async deleteGameByRoomId(roomId: string) {
    await this.gameRepository.deleteGameByRoomId(roomId);
  }

  async getRoomIdByTitle(title: string) {
    return await this.gameRepository.getRoomIdByTitle(title);
  }
}
