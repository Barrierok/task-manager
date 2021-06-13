import BaseRepository from './BaseRepository';

export default class UserRepository extends BaseRepository {
  constructor(app) {
    super(app);
    this.model = app.objection.models.user;
  }
}
