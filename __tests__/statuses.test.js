import getApp from '../server/index.js';
import getFakeStatus from '../__fixtures__/getFakeStatus';
import initSession from '../__fixtures__/utils';
import getFakeUser from '../__fixtures__/getFakeUser';
import getFakeTask from '../__fixtures__/getFakeTask';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  let existingStatus;
  let cookie;
  let models;

  beforeAll(async () => {
    app = await getApp();
    models = app.objection.models;
    knex = app.objection.knex;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    existingStatus = await models.status.query().insert(getFakeStatus());
    const data = await initSession(app, getFakeUser());
    cookie = data.cookie;
  });

  it('index page', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('new page', async () => {
    const response = await app.inject({
      method: 'GET',
      cookies: cookie,
      url: app.reverse('newStatus'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('edit page', async () => {
    const response = await app.inject({
      method: 'GET',
      cookies: cookie,
      url: app.reverse('editStatus', { id: existingStatus.id }),
    });

    expect(response.statusCode).toBe(200);
  });

  it('create status', async () => {
    const statusData = getFakeStatus();

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statuses'),
      cookies: cookie,
      payload: {
        data: statusData,
      },
    });

    expect(response.statusCode).toBe(302);

    const createdStatus = await models.status
      .query()
      .findOne({ name: statusData.name });

    expect(createdStatus).toMatchObject(statusData);
  });

  it('create with not unique name', async () => {
    const response = await app.inject({
      method: 'POST',
      cookies: cookie,
      url: app.reverse('statuses'),
      payload: {
        data: existingStatus,
      },
    });

    expect(response.statusCode).toBe(422);
  });

  it('patch status', async () => {
    const statusData = getFakeStatus();

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('patchStatus', { id: existingStatus.id.toString() }),
      cookies: cookie,
      payload: {
        data: statusData,
      },
    });

    expect(response.statusCode).toBe(302);

    const updatedStatus = await models.status
      .query()
      .findById(existingStatus.id);

    expect(updatedStatus).toMatchObject(statusData);
  });

  it('delete status', async () => {
    const response = await app.inject({
      method: 'DELETE',
      cookies: cookie,
      url: app.reverse('deleteStatus', { id: existingStatus.id.toString() }),
    });

    expect(response.statusCode).toBe(302);

    const deletedStatus = await models.status
      .query()
      .findById(existingStatus.id);

    expect(deletedStatus).toBeUndefined();
  });

  it('delete status with task relate', async () => {
    await models.task.query().insert({
      ...getFakeTask(),
      statusId: existingStatus.id,
    });

    const response = await app.inject({
      method: 'DELETE',
      cookies: cookie,
      url: app.reverse('deleteStatus', { id: existingStatus.id.toString() }),
    });

    expect(response.statusCode).toBe(302);

    const notDeletedStatus = await models.status
      .query()
      .findById(existingStatus.id);

    expect(notDeletedStatus).not.toBeUndefined();
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(async () => {
    app.close();
  });
});
