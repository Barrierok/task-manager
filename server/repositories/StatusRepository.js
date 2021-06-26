import BaseRepository from './BaseRepository';

export default class StatusRepository extends BaseRepository {
  constructor(app) {
    super();
    this.app = app;
    this.model = app.objection.models.status;
  }
}
