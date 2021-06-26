export default class BaseRepository {
  createModel() {
    return new this.model();
  }

  logging = (method, data) => {
    this.app.log.info(
      {
        model: this.model.name,
        method: method.name,
        data,
      },
      'ORM queries'
    );
  };

  async validate(data) {
    const validatedData = await this.model.fromJson(data);

    this.logging(this.validate, validatedData);

    return validatedData;
  }

  async getById(id) {
    const data = await this.model.query().findById(id);

    this.logging(this.getById, data);

    return data;
  }

  async getByParams(params) {
    const data = await this.model.query().findOne(params);

    this.logging(this.getByParams, data);

    return data;
  }

  async getAll() {
    const data = await this.model.query();

    this.logging(this.getAll, data);

    return data;
  }

  async patch(id, data) {
    const entity = await this.getById(id);
    const updatedData = await entity.$query().patchAndFetch(data);

    this.logging(this.patch, updatedData);

    return updatedData;
  }

  async deleteById(id) {
    await this.model.query().deleteById(id);

    this.logging(this.deleteById, id);

    return id;
  }

  async insert(data) {
    const insertedData = await this.model.query().insertAndFetch(data);

    this.logging(this.insert, insertedData);

    return insertedData;
  }
}
