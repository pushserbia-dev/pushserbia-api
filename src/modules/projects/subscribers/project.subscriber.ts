import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { Project } from '../entities/project.entity';
import { User } from '../../users/entities/user.entity';

@EventSubscriber()
export class ProjectSubscriber implements EntitySubscriberInterface<Project> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Project;
  }

  async afterInsert(event: InsertEvent<Project>) {
    await event.manager
      .getRepository(User)
      .increment({ id: event.entity.creatorId }, 'projectsProposed', 1);
  }
}
