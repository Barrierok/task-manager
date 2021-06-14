import BaseRepository from './BaseRepository';
import Status from '../models/Status';

export default class StatusRepository extends BaseRepository {
  constructor(app) {
    super(app, Status);
  }
}
