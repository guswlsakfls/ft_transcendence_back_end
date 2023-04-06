import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import emailConfig from './config/emailConfig';
import { validationSchema } from './config/validationSchema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './config/typeorm.config';
import { GameModule } from './game/game.module';
import { ChatRoomModule } from './chat-room/chat-room.module';
import authConfig from './config/authConfig';
import { AuthModule } from './auth/auth.module';
import { TwoFactorAuthModule } from './two-factor-auth/two-factor-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`${__dirname}/config/env/.${process.env.NODE_ENV}.env`],
      load: [emailConfig, authConfig],
      isGlobal: true,
      validationSchema,
    }),
    TypeOrmModule.forRoot(typeORMConfig),
    UsersModule,
    AuthModule,
    ChatRoomModule,
    GameModule,
    TwoFactorAuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
