import { Inject, Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './repository/user.repository';
import { UserEntity } from './entities/user.entity';
import { FtUserDto } from 'src/auth/dto/ft-user.dto';
import { Status } from './enum/status.enum';
import { GameStatsEntity } from 'src/game/entities/gameStats.entity';
import { ConfigType } from '@nestjs/config';
import authConfig from 'src/config/authConfig';

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    @Inject(authConfig.KEY) private config: ConfigType<typeof authConfig>,
  ) {}

  async setTwoFactorAuthSecret(user: UserEntity, secret: string, type: string) {
    this.userRepository.saveTwoFactorAuthCode(user, secret, type);
  }

  async updateUserStatus(user: UserEntity, status: Status) {
    await this.userRepository.saveUserStatus(user, status);
  }

  async turnOnTwoFactorAuth(user: UserEntity) {
    await this.userRepository.turnOnTwoFactorAuth(user);
  }

  async createUser(ftUser: FtUserDto) {
    return await this.userRepository.saveUser(ftUser);
  }

  async getUserByName(name: string): Promise<UserEntity> {
    return await this.userRepository.findUserByName(name);
  }

  async getUserById(userId: string): Promise<UserEntity> {
    return await this.userRepository.findUserById(userId);
  }

  async getUserByEmail(emailAddress: string): Promise<UserEntity> {
    return await this.userRepository.findUserByEmail(emailAddress);
  }

  async getAllUserExceptMeAndFriend(me: UserEntity): Promise<UserEntity[]> {
    return await this.userRepository.findUserExceptMeAndFriend(me);
  }

  async updateUserInfo(
    updateUserDto: UpdateUserDto,
    user: UserEntity,
    newAvatarImageUrl: string,
  ) {
    return await this.userRepository.updateUserInfo(
      updateUserDto,
      user,
      newAvatarImageUrl,
    );
  }

  async update2FA(user: UserEntity) {
    return await this.userRepository.update2FA(user);
  }

  async getGameHistory(
    userId: string,
    userName: string,
  ): Promise<[GameStatsEntity[], Array<number>]> {
    const user = await this.userRepository.getGameHistory(userId);

    const combinedGameStats = [
      ...user.gameStatsAsPlayer1,
      ...user.gameStatsAsPlayer2,
    ];

    const countWinLose = [0, 0];
    combinedGameStats.forEach((gameStats) => {
      if (gameStats.winnerName === userName) {
        countWinLose[0] += 1;
      } else {
        countWinLose[1] += 1;
      }
    });

    combinedGameStats
      .sort((a, b) => {
        // 날짜 순으로 정렬 (최근날짜부터)
        return b.createAt.getTime() - a.createAt.getTime();
      })
      .slice(0, 10);
    return [combinedGameStats, countWinLose];
  }

  async updateUserRating(
    player1Name: string,
    player2Name: string,
    score: number[],
  ) {
    const [player1, player2] = await Promise.all([
      this.getUserByName(player1Name),
      this.getUserByName(player2Name),
    ]);

    if (score[0] === score[1]) return;

    const isPlayer1Winner = score[0] > score[1];
    const ratingChange = 10;

    player1.rating = Math.max(
      0,
      Math.min(
        10000,
        player1.rating + (isPlayer1Winner ? ratingChange : -ratingChange),
      ),
    );
    player2.rating = Math.max(
      0,
      Math.min(
        10000,
        player2.rating + (isPlayer1Winner ? -ratingChange : ratingChange),
      ),
    );

    await Promise.all([
      this.userRepository.updateUserRating(player1),
      this.userRepository.updateUserRating(player2),
    ]);
  }

  async uploadAvatarImage(file: Express.Multer.File): Promise<string> {
    const serverAddr = this.config.serverAddress;
    const generatedFile = `${serverAddr}/${file.filename}`;

    return generatedFile;
  }
}
