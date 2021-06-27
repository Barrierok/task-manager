import BaseRepository from './BaseRepository';

export default class TaskRepository extends BaseRepository {
  constructor(app) {
    super();
    this.app = app;
    this.model = app.objection.models.task;
  }

  async getAll() {
    const data = await this.model.query().withGraphFetched({
      status: true,
      executor: true,
      creator: true,
    });

    this.logging(this.getAll, data);

    return data;
  }

  async getById(id) {
    const [data] = await this.model.query().where('id', id).withGraphFetched({
      status: true,
      executor: true,
      creator: true,
      labels: true,
    });

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

    const upsertedData = await this.model.transaction(async (trx) => {
      const task = await this.model
        .query(trx)
        .upsertGraphAndFetch(data, options);
      return task;
    });

    this.logging(this.insert, upsertedData);

    return upsertedData;
  }

  async patch(data) {
    const options = {
      relate: true,
      unrelate: true,
      noUpdate: ['labels'],
    };

    const upsertedData = await this.model.transaction(async (trx) => {
      const task = await this.model
        .query(trx)
        .upsertGraphAndFetch(data, options);
      return task;
    });

    this.logging(this.patch, upsertedData);

    return upsertedData;
  }
}
