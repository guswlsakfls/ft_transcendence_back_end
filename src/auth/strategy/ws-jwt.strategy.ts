import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from 'src/users/repository/user.repository';
import { UserEntity } from 'src/users/entities/user.entity';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'wsjwt') {
  constructor(
    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'secret',
    });
  }

  async validate(payload) {
    const { id } = payload;

    const userEntity: UserEntity = await this.userRepository.findUserById(id);
    if (!userEntity) {
      throw new WsException('user not found');
    }
    return userEntity;
  }
}
