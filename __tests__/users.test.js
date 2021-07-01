import _ from 'lodash';

import getApp from '../server/index.js';
import encrypt from '../server/lib/secure.js';
import getFakeUser from '../__fixtures__/getFakeUser';
import initSession from '../__fixtures__/utils';
import getFakeTask from '../__fixtures__/getFakeTask';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  let existingUser;
  let testData;

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    models = app.objection.models;
    existingUser = getFakeUser();
    testData = getFakeUser();
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await knex('users').insert({
      ..._.omit(existingUser, 'password'),
      passwordDigest: encrypt(existingUser.password),
    });
  });

  describe('without auth', () => {
    it('index', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('users'),
      });

      expect(response.statusCode).toBe(200);
    });

    it('new', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('newUser'),
      });

      expect(response.statusCode).toBe(200);
    });

    it('create', async () => {
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('users'),
        payload: {
          data: testData,
        },
      });

      expect(response.statusCode).toBe(302);

      const expected = {
        ..._.omit(testData, 'password'),
        passwordDigest: encrypt(testData.password),
      };
      const user = await models.user.query().findOne({ email: testData.email });

      expect(user).toMatchObject(expected);
    });

    it('create with not unique email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: app.reverse('users'),
        payload: {
          data: existingUser,
        },
      });

      expect(response.statusCode).toBe(422);
    });
  });

  describe('with auth', () => {
    let cookie;
    let userId;

    beforeEach(async () => {
      const data = await initSession(app, testData);
      cookie = data.cookie;
      userId = data.userId;
    });

    it('edit user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editUser', { id: userId }),
        cookies: cookie,
      });

      expect(response.statusCode).toBe(200);
    });

    it('edit other user', async () => {
      const otherUser = await models.user.query().findOne({
        email: existingUser.email,
      });

      const response = await app.inject({
        method: 'GET',
        url: app.reverse('editUser', { id: otherUser.id.toString() }),
        cookies: cookie,
        payload: {
          data: getFakeUser(),
        },
      });

      expect(response.statusCode).toBe(302);
    });

    it('patch user', async () => {
      const newUserData = getFakeUser();

      const response = await app.inject({
        method: 'PATCH',
        cookies: cookie,
        url: app.reverse('patchUser', { id: userId.toString() }),
        payload: {
          data: newUserData,
        },
      });

      expect(response.statusCode).toBe(302);

      const expected = {
        ..._.omit(newUserData, 'password'),
        passwordDigest: encrypt(newUserData.password),
      };

      const updatedUser = await models.user.query().findById(userId);

      expect(updatedUser).toMatchObject(expected);
    });

    it('patch other user', async () => {
      const newUserData = getFakeUser();

      const otherUser = await models.user.query().findOne({
        email: existingUser.email,
      });

      const response = await app.inject({
        method: 'PATCH',
        cookies: cookie,
        url: app.reverse('patchUser', { id: otherUser.id.toString() }),
        payload: {
          data: newUserData,
        },
      });

      expect(response.statusCode).toBe(302);

      const updatedUser = await models.user.query().findById(otherUser.id);

      expect(updatedUser).toMatchObject(otherUser);
    });

    it('delete user', async () => {
      const response = await app.inject({
        method: 'DELETE',
        cookies: cookie,
        url: app.reverse('deleteUser', { id: userId.toString() }),
      });

      expect(response.statusCode).toBe(302);

      const deletedUser = await models.user.query().findById(userId);

      expect(deletedUser).toBeUndefined();
    });

    it('delete user related with tasks', async () => {
      await models.task.query().insert({
        ...getFakeTask(),
        creatorId: userId,
      });

      const response = await app.inject({
        method: 'DELETE',
        cookies: cookie,
        url: app.reverse('deleteUser', { id: userId.toString() }),
      });

      expect(response.statusCode).toBe(302);

      const notDeletedUser = await models.user.query().findById(userId);

      expect(notDeletedUser).not.toBeUndefined();
    });

    it('delete other user', async () => {
      const otherUser = await models.user.query().findOne({
        email: existingUser.email,
      });

      const response = await app.inject({
        method: 'DELETE',
        cookies: cookie,
        url: app.reverse('deleteUser', { id: otherUser.id.toString() }),
      });

      expect(response.statusCode).toBe(302);

      const foundUser = await models.user.query().findById(otherUser.id);

      expect(foundUser).toMatchObject(otherUser);
    });
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
