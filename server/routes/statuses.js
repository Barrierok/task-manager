import i18next from 'i18next';

export default (app) => {
  const statusModel = app.objection.models.status;

  app
    .get(
      '/statuses',
      { name: 'statuses', preValidation: app.authenticate },
      async (req, reply) => {
        const statuses = await statusModel.query();
        return reply.render('statuses/index', { statuses });
      },
    )
    .get(
      '/statuses/new',
      { name: 'newStatus', preValidation: app.authenticate },
      (req, reply) => {
        const status = new app.objection.models.status();
        reply.render('statuses/new', { status });
      },
    )
    .get(
      '/statuses/:id/edit',
      {
        name: 'editStatus',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const status = await statusModel.query().findById(req.params.id);
        return reply.render('statuses/edit', { status });
      },
    )
    .post(
      '/statuses',
      { preValidation: app.authenticate },
      async (req, reply) => {
        const { data } = req.body;

        try {
          const status = await statusModel.fromJson(data);
          await statusModel.query().insert(status);

          req.flash('info', i18next.t('flash.statuses.create.success'));
          return reply.redirect(app.reverse('statuses'));
        } catch (error) {
          req.flash('error', i18next.t('flash.statuses.create.error'));
          return reply.code(422).render('statuses/new', {
            status: data,
            errors: error.data,
          });
        }
      },
    )
    .patch(
      '/statuses/:id',
      { name: 'patchStatus', preValidation: app.authenticate },
      async (req, reply) => {
        const { data } = req.body;

        try {
          const statusData = await statusModel.fromJson(data);
          const status = await statusModel.query().findById(req.params.id);
          await status.$query().patch(statusData);

          req.flash('info', i18next.t('flash.statuses.edit.success'));
          return reply.redirect(app.reverse('statuses'));
        } catch (error) {
          req.flash('error', i18next.t('flash.statuses.edit.error'));
          return reply.code(422).render('statuses/edit', {
            status: data,
            errors: error.data,
          });
        }
      },
    )
    .delete(
      '/statuses/:id',
      { name: 'deleteStatus', preValidation: app.authenticate },
      async (req, reply) => {
        const tasks = await statusModel.relatedQuery('tasks').for(req.params.id);

        if (tasks.length > 0) {
          req.flash('error', i18next.t('flash.statuses.delete.error'));
        } else {
          await statusModel.query().deleteById(req.params.id);
          req.flash('info', i18next.t('flash.statuses.delete.success'));
        }

        reply.redirect(app.reverse('statuses'));
      },
    );
};
