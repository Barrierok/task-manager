export default class BaseRepository {
  constructor(app) {
    this.app = app;
  }

  createModel() {
    return new this.model();
  }

  logging = (method, data) => {
    this.app.log.info(
      {
        model: this.model.name,
        method,
        data,
      },
      'ORM queries'
    );
  };

  async validate(data) {
    const validatedData = await this.model.fromJson(data);

    this.logging(this.validate.name, validatedData);

    return validatedData;
  }

  async getById(id) {
    const data = await this.model.query().findById(id);

    this.logging(this.getById.name, data);

    return data;
  }

  async getByParams(params) {
    const data = await this.model.query().findOne(params);

    this.logging(this.getByParams.name, data);

    return data;
  }

  async getAll() {
    const data = await this.model.query();

    this.logging(this.getAll.name, data);

    return data;
  }

  async patch(id, data) {
    const entity = await this.getById(id);
    const updatedData = await entity.$query().patchAndFetch(data);

    this.logging(this.patch.name, updatedData);

    return updatedData;
  }

  async deleteById(id) {
    await this.model.query().deleteById(id);

    this.logging(this.deleteById.name, id);

    return id;
  }

  async insert(data) {
    const insertedData = await this.model.query().insertAndFetch(data);

    this.logging(this.insert.name, insertedData);

    return insertedData;
  }
}
