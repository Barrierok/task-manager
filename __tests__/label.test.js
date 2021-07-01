import getApp from '../server';
import initSession from '../__fixtures__/utils';
import getFakeUser from '../__fixtures__/getFakeUser';
import getFakeLabel from '../__fixtures__/getFakeLabel';
import getFakeTask from '../__fixtures__/getFakeTask';

describe('test labels CRUD', () => {
  let app;
  let knex;
  let existingLabel;
  let cookie;
  let models;

  beforeAll(async () => {
    app = await getApp();
    models = app.objection.models;
    knex = app.objection.knex;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    existingLabel = await models.label.query().insert(getFakeLabel());
    const data = await initSession(app, getFakeUser());
    cookie = data.cookie;
  });

  it('index page', async () => {
    const response = await app.inject({
      method: 'GET',
      cookies: cookie,
      url: app.reverse('labels'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('new page', async () => {
    const response = await app.inject({
      method: 'GET',
      cookies: cookie,
      url: app.reverse('newLabel'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('edit page', async () => {
    const response = await app.inject({
      method: 'GET',
      cookies: cookie,
      url: app.reverse('editLabel', { id: existingLabel.id }),
    });

    expect(response.statusCode).toBe(200);
  });

  it('create label', async () => {
    const labelData = getFakeLabel();

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labels'),
      cookies: cookie,
      payload: {
        data: labelData,
      },
    });

    expect(response.statusCode).toBe(302);

    const createdLabel = await models.label
      .query()
      .findOne({ name: labelData.name });

    expect(createdLabel).toMatchObject(labelData);
  });

  it('patch label', async () => {
    const labelData = getFakeLabel();

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('patchLabel', { id: existingLabel.id.toString() }),
      cookies: cookie,
      payload: {
        data: labelData,
      },
    });

    expect(response.statusCode).toBe(302);

    const updateLabel = await models.label.query().findById(existingLabel.id);

    expect(updateLabel).toMatchObject(labelData);
  });

  it('delete label', async () => {
    const response = await app.inject({
      method: 'DELETE',
      cookies: cookie,
      url: app.reverse('deleteLabel', { id: existingLabel.id.toString() }),
    });

    expect(response.statusCode).toBe(302);

    const deletedStatus = await models.label.query().findById(existingLabel.id);

    expect(deletedStatus).toBeUndefined();
  });

  it('delete label with task relate', async () => {
    const task = await models.task.query().insert(getFakeTask());
    await task.$relatedQuery('labels').relate(existingLabel);

    const response = await app.inject({
      method: 'DELETE',
      cookies: cookie,
      url: app.reverse('deleteLabel', { id: existingLabel.id.toString() }),
    });

    expect(response.statusCode).toBe(302);

    const notDeletedLabel = await models.label
      .query()
      .findById(existingLabel.id);

    expect(notDeletedLabel).not.toBeUndefined();
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
