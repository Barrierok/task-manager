import BaseRepository from './BaseRepository';

export default class TaskRepository extends BaseRepository {
  constructor(app) {
    super();
    this.app = app;
    this.model = app.objection.models.task;
  }

  async getAll({
    status, executor, label, creator,
  }) {
    const data = await this.model
      .query()
      .skipUndefined()
      .withGraphJoined('[status, creator, executor, labels]')
      .where('executorId', executor)
      .where('creatorId', creator)
      .where('labels:id', label)
      .where('statusId', status);

    this.logging(this.getAll, data);

    return data;
  }

  async getById(id) {
    const [data] = await this.model
      .query()
      .where('id', id)
      .withGraphFetched('[status, creator, executor, labels]');

    this.logging(this.getById, data);

    return data;
  }

  async findByUser(userId) {
    const data = await this.model
      .query()
      .where('executorId', userId)
      .orWhere('creatorId', userId);

    this.logging(this.findByUser, data);

    return data;
  }

  async insert(data) {
    const options = {
      relate: true,
      unrelate: true,
      noUpdate: ['labels'],
    };

    const upsertedData = await this.model.transaction((trx) => (
      this.model.query(trx).upsertGraphAndFetch(data, options)
    ));

    this.logging(this.insert, upsertedData);

    return upsertedData;
  }

  async patch(data) {
    const options = {
      relate: true,
      unrelate: true,
      noUpdate: ['labels'],
    };

    const upsertedData = await this.model.transaction((trx) => (
      this.model.query(trx).upsertGraphAndFetch(data, options)
    ));

    this.logging(this.patch, upsertedData);

    return upsertedData;
  }
}
