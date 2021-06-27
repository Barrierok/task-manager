import BaseRepository from './BaseRepository';

export default class LabelRepository extends BaseRepository {
  constructor(app) {
    super();
    this.app = app;
    this.model = app.objection.models.label;
  }
}
