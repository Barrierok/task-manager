import BaseRepository from './BaseRepository';
import User from '../models/User';

export default class UserRepository extends BaseRepository {
  constructor(app) {
    super(app);
    this.model = User;
  }
}
