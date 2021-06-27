import _ from 'lodash';
import getApp from '../server';
import initSession from '../__fixtures__/utils';
import getFakeUser from '../__fixtures__/getFakeUser';
import getFakeTask from '../__fixtures__/getFakeTask';
import getFakeStatus from '../__fixtures__/getFakeStatus';
import getFakeLabel from '../__fixtures__/getFakeLabel';

describe('test tasks CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
  let existingStatus;
  let existingTask;
  let existingLabel;
  let userId;

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    models = app.objection.models;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    const data = await initSession(app, getFakeUser());
    cookie = data.cookie;
    userId = data.userId;

    existingStatus = await models.status.query().insert(getFakeStatus());
    existingLabel = await models.label.query().insert(getFakeLabel());
    existingTask = await models.task.query().insert({
      ...getFakeTask(),
      creatorId: userId,
      executorId: userId,
      statusId: existingStatus.id,
    });
  });

  it('index page', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('tasks'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('new page', async () => {
    const response = await app.inject({
      method: 'GET',
      cookies: cookie,
      url: app.reverse('newTask'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('task page', async () => {
    const response = await app.inject({
      method: 'GET',
      cookies: cookie,
      url: app.reverse('task', { id: existingTask.id.toString() }),
    });

    expect(response.statusCode).toBe(200);
  });

  it('edit page', async () => {
    const response = await app.inject({
      method: 'GET',
      cookies: cookie,
      url: app.reverse('editTask', { id: existingTask.id.toString() }),
    });

    expect(response.statusCode).toBe(200);
  });

  it('create task', async () => {
    const taskData = {
      ...getFakeTask(),
      executorId: userId,
      creatorId: userId,
      statusId: existingStatus.id,
      labels: [existingLabel.id],
    };

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('tasks'),
      cookies: cookie,
      payload: {
        data: taskData,
      },
    });

    expect(response.statusCode).toBe(302);

    const createdTask = await models.task.query().findOne({
      name: taskData.name,
    });

    expect(createdTask).toMatchObject(_.omit(taskData, 'labels'));

    const relatedLabel = await createdTask
      .$relatedQuery('labels')
      .where('labelId', existingLabel.id)
      .first();

    expect(relatedLabel).toMatchObject(existingLabel);
  });

  it('patch task', async () => {
    const taskData = {
      ...getFakeTask(),
      executorId: userId,
      creatorId: userId,
      statusId: existingStatus.id,
      labels: [existingLabel.id],
    };

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('patchTask', { id: existingTask.id.toString() }),
      cookies: cookie,
      payload: {
        data: taskData,
      },
    });

    expect(response.statusCode).toBe(302);

    const updatedTask = await models.task.query().findById(existingTask.id);

    expect(updatedTask).toMatchObject(_.omit(taskData, 'labels'));

    const relatedLabel = await updatedTask
      .$relatedQuery('labels')
      .where('labelId', existingLabel.id)
      .first();

    expect(relatedLabel).toMatchObject(existingLabel);
  });

  it('delete task', async () => {
    const response = await app.inject({
      method: 'DELETE',
      cookies: cookie,
      url: app.reverse('deleteTask', { id: existingTask.id.toString() }),
    });

    expect(response.statusCode).toBe(302);

    const deletedTask = await models.task.query().findById(existingTask.id);

    expect(deletedTask).toBeUndefined();
  });

  it('delete task created by other user', async () => {
    const otherUserTask = await models.task.query().insert({
      ...getFakeTask(),
      executorId: 2,
      creatorId: 2,
      statusId: existingStatus.id,
    });

    const response = await app.inject({
      method: 'DELETE',
      cookies: cookie,
      url: app.reverse('deleteTask', { id: otherUserTask.id.toString() }),
    });

    expect(response.statusCode).toBe(302);

    const notDeletedTask = await models.task.query().findById(otherUserTask.id);

    expect(notDeletedTask).toMatchObject(otherUserTask);
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
