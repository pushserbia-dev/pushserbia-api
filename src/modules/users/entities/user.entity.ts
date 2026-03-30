import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../enums/user-role';
import { Exclude, Expose } from 'class-transformer';
import { generateGravatar } from '../../../core/utils/generate-gravatar';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Exclude()
  @Column({ unique: true })
  firebaseUid: string;

  @Expose({ groups: ['me'] })
  @Column({ unique: true })
  email: string;

  @Column({
    type: 'char',
    length: 32, // md5 hex digest length
    nullable: true,
  })
  gravatar: string | null;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  linkedInUrl: string;

  @Column({ nullable: true })
  gitHubUrl: string;

  @Expose({ groups: ['me'] })
  @Column({ default: 1 })
  level: number;

  @Expose({ groups: ['me'] })
  @Column({ default: 'free' })
  membershipStatus: string;

  @Expose({ groups: ['me'] })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.Participant,
  })
  role: UserRole;

  @Expose({ groups: ['me'] })
  @Index()
  @Column({ default: false })
  isBlocked: boolean;

  @Expose({ groups: ['me'] })
  @Column({ default: 0 })
  projectsProposed: number;

  @Expose({ groups: ['me'] })
  @Column({ default: 0 })
  projectsSupported: number;

  @Expose({ groups: ['me'] })
  @CreateDateColumn()
  createdAt: Date;

  @Expose({ groups: ['me'] })
  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  setGravatarHash() {
    if (this.email) {
      this.gravatar = generateGravatar(this.email);
    }
  }
}
