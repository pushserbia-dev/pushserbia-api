import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectStatus } from '../enums/project-status.enum';
import { User } from '../../users/entities/user.entity';
import { ProjectMember } from '../../project-members/entities/project-member.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  shortDescription: string;

  @Column({ type: 'text' })
  description: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PENDING,
  })
  status: ProjectStatus;

  @Index()
  @Column({ type: 'int', default: 0 })
  totalVotes: number;

  @Column({ type: 'int', default: 0 })
  totalVoters: number;

  @Column({ nullable: true })
  github: string;

  @Column({ nullable: true })
  image: string;

  @Index()
  @Column({ default: false })
  isBanned: boolean;

  @Column({ nullable: true })
  banNote: string;

  @Index()
  @Column({ type: 'uuid' })
  creatorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members: ProjectMember[];

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
