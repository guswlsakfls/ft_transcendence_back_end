import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FriendShipStatus } from '../enum/friendShipStatus.enum';
import { UserEntity } from './user.entity';

@Entity({ name: 'friendships' })
export class FriendShipEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.friendships, {
    onDelete: 'CASCADE',
  })
  // @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.friendOf, {
    onDelete: 'CASCADE',
  })
  // @JoinColumn({ name: 'friend_id', referencedColumnName: 'id' })
  friend: UserEntity;

  @Column()
  status: FriendShipStatus; // or enum: ['pending', 'accepted', 'rejected']
}
