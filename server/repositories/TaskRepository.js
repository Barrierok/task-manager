import BaseRepository from './BaseRepository';

export default class TaskRepository extends BaseRepository {
  constructor(app) {
    super();
    this.app = app;
    this.model = app.objection.models.task;
  }
}
