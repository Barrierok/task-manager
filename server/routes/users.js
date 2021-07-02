import i18next from 'i18next';

export default (app) => {
  const userModel = app.objection.models.user;
  const taskModel = app.objection.models.task;

  const checkRights = async (req, reply) => {
    const {
      params: { id: paramId }, user: { id: userId },
    } = req;

    if (Number(paramId) !== userId) {
      req.flash('error', i18next.t('flash.session.edit.error'));
      reply.redirect(app.reverse('users'));
    }
  };

  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await userModel.query();
      return reply.render('users/index', { users });
    })
    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = new app.objection.models.user();
      reply.render('users/new', { user });
    })
    .get('/users/:id/edit', {
      name: 'editUser', preValidation: app.authenticate, preHandler: checkRights,
    }, async (req, reply) => {
      const user = await userModel.query().findById(req.params.id);
      return reply.render('users/edit', { user });
    })
    .post('/users', async (req, reply) => {
      try {
        const user = await userModel.fromJson(req.body.data);
        await userModel.query().insertAndFetch(user);

        req.flash('info', i18next.t('flash.users.create.success'));
        return reply.redirect(app.reverse('root'));
      } catch (error) {
        req.flash('error', i18next.t('flash.users.create.error'));
        return reply.code(422).render('users/new', { user: req.body.data, errors: error.data });
      }
    })
    .patch('/users/:id', {
      name: 'patchUser', preValidation: app.authenticate, preHandler: checkRights,
    }, async (req, reply) => {
      try {
        const userData = await userModel.fromJson(req.body.data);
        const user = await userModel.query().findById(req.params.id);
        await user.$query().patch(userData);

        req.flash('info', i18next.t('flash.users.edit.success'));
        return reply.redirect(app.reverse('users'));
      } catch (error) {
        const user = await userModel.query().findById(req.params.id);

        req.flash('error', i18next.t('flash.users.edit.error'));
        return reply.code(422).render('users/edit', { user, errors: error.data });
      }
    })
    .delete('/users/:id', {
      name: 'deleteUser', preValidation: app.authenticate, preHandler: checkRights,
    }, async (req, reply) => {
      const { id } = req.params;
      const tasks = await taskModel.query().where('executorId', id).orWhere('creatorId', id);

      if (tasks.length === 0) {
        await userModel.query().deleteById(id);
        await req.logOut();
        req.flash('info', i18next.t('flash.users.delete.success'));
      } else {
        req.flash('error', i18next.t('flash.users.delete.error'));
      }

      reply.redirect(app.reverse('users'));
    });
};
