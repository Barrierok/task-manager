import getApp from '../server/index.js';
import StatusRepository from '../server/repositories/StatusRepository';
import getFakeStatus from '../__fixtures__/getFakeStatus';
import initSession from '../__fixtures__/utils';
import getFakeUser from '../__fixtures__/getFakeUser';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  let existingStatus;
  let statusRepository;
  let cookie;

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    statusRepository = new StatusRepository(app);
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    existingStatus = await statusRepository.insert(getFakeStatus());
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

    const createdStatus = await statusRepository.getByParams({
      name: statusData.name,
    });

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

    expect(response.statusCode).toBe(200);
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

    const updatedStatus = await statusRepository.getById(existingStatus.id);

    expect(updatedStatus).toMatchObject(statusData);
  });

  it('delete status', async () => {
    const response = await app.inject({
      method: 'DELETE',
      cookies: cookie,
      url: app.reverse('deleteStatus', { id: existingStatus.id.toString() }),
    });

    expect(response.statusCode).toBe(302);

    const deletedStatus = await statusRepository.getById(existingStatus.id);

    expect(deletedStatus).toBeUndefined();
  });

  afterEach(async () => {
    await app.inject({
      method: 'DELETE',
      url: app.reverse('session'),
      cookies: cookie,
    });
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
