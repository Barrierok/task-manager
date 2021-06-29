import i18next from 'i18next';

import UserRepository from '../repositories/UserRepository';
import TaskRepository from '../repositories/TaskRepository';

const checkRights = (app) => async (req, reply) => {
  const {
    params: { id: paramId },
    user: { id: userId },
  } = req;

  if (Number(paramId) !== userId) {
    req.flash('error', i18next.t('flash.session.edit.error'));
    reply.redirect(app.reverse('users'));
  }
};

export default (app) => {
  const userRepository = new UserRepository(app);
  const taskRepository = new TaskRepository(app);

  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await userRepository.getAll();
      return reply.render('users/index', { users });
    })
    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = userRepository.createModel();
      reply.render('users/new', { user });
    })
    .get(
      '/users/:id/edit',
      {
        name: 'editUser',
        preValidation: app.authenticate,
        preHandler: checkRights(app),
      },
      async (req, reply) => {
        const user = await userRepository.getById(req.params.id);
        return reply.render('users/edit', { user });
      },
    )
    .post('/users', async (req, reply) => {
      try {
        const user = await userRepository.validate(req.body.data);
        await userRepository.insert(user);

        req.flash('info', i18next.t('flash.users.create.success'));
        return reply.redirect(app.reverse('root'));
      } catch (error) {
        req.flash('error', i18next.t('flash.users.create.error'));
        return reply.render('users/new', { user: req.body.data, errors: error.data });
      }
    })
    .patch(
      '/users/:id',
      {
        name: 'patchUser',
        preValidation: app.authenticate,
        preHandler: checkRights(app),
      },
      async (req, reply) => {
        try {
          const userData = await userRepository.validate(req.body.data);
          await userRepository.patch(req.params.id, userData);

          req.flash('info', i18next.t('flash.users.edit.success'));
          return reply.redirect(app.reverse('users'));
        } catch (error) {
          const user = await userRepository.getById(req.params.id);

          req.flash('error', i18next.t('flash.users.edit.error'));
          return reply.render('users/edit', { user, errors: error.data });
        }
      },
    )
    .delete(
      '/users/:id',
      {
        name: 'deleteUser',
        preValidation: app.authenticate,
        preHandler: checkRights(app),
      },
      async (req, reply) => {
        const tasks = await taskRepository.findByUser(req.params.id);

        if (tasks.length === 0) {
          await userRepository.deleteById(req.params.id);
          await req.logOut();
          req.flash('info', i18next.t('flash.users.delete.success'));
        } else {
          req.flash('error', i18next.t('flash.users.delete.error'));
        }

        reply.redirect(app.reverse('users'));
      },
    );
};
