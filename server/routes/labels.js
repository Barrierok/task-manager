import i18next from 'i18next';

export default (app) => {
  const labelModel = app.objection.models.label;

  app
    .get(
      '/labels',
      { name: 'labels', preValidation: app.authenticate },
      async (req, reply) => {
        const labels = await labelModel.query();
        return reply.render('labels/index', { labels });
      },
    )
    .get(
      '/labels/new',
      { name: 'newLabel', preValidation: app.authenticate },
      async (req, reply) => {
        const label = new app.objection.models.label();
        return reply.render('labels/new', { label });
      },
    )
    .get(
      '/labels/:id/edit',
      { name: 'editLabel', preValidation: app.authenticate },
      async (req, reply) => {
        const label = await labelModel.query().findById(req.params.id);
        return reply.render('labels/edit', { label });
      },
    )
    .post(
      '/labels',
      { preValidation: app.authenticate },
      async (req, reply) => {
        const { data } = req.body;

        try {
          const label = await labelModel.fromJson(data);
          await labelModel.query().insert(label);

          req.flash('info', i18next.t('flash.labels.create.success'));
          return reply.redirect(app.reverse('labels'));
        } catch (error) {
          req.flash('error', i18next.t('flash.labels.create.error'));
          return reply.code(422).render('labels/new', { status: data, errors: error.data });
        }
      },
    )
    .patch(
      '/labels/:id',
      { name: 'patchLabel', preValidation: app.authenticate },
      async (req, reply) => {
        const { data } = req.body;

        try {
          const labelData = await labelModel.fromJson(data);
          const label = await labelModel.query().findById(req.params.id);
          await label.$query().patch(labelData);

          req.flash('info', i18next.t('flash.labels.edit.success'));
          return reply.redirect(app.reverse('labels'));
        } catch (error) {
          req.flash('error', i18next.t('flash.labels.edit.error'));
          return reply.code(422).render('labels/edit', {
            label: data,
            errors: error.data,
          });
        }
      },
    )
    .delete(
      '/labels/:id',
      { name: 'deleteLabel', preValidation: app.authenticate },
      async (req, reply) => {
        const tasks = await labelModel.relatedQuery('tasks').for(req.params.id);

        if (tasks.length > 0) {
          req.flash('error', i18next.t('flash.labels.delete.error'));
        } else {
          await labelModel.query().deleteById(req.params.id);
          req.flash('info', i18next.t('flash.labels.delete.success'));
        }

        reply.redirect(app.reverse('labels'));
      },
    );
};
