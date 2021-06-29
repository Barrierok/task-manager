import i18next from 'i18next';
import LabelRepository from '../repositories/LabelRepository';

export default (app) => {
  const labelRepository = new LabelRepository(app);

  app
    .get(
      '/labels',
      { name: 'labels', preValidation: app.authenticate },
      async (req, reply) => {
        const labels = await labelRepository.getAll();
        return reply.render('labels/index', { labels });
      },
    )
    .get(
      '/labels/new',
      { name: 'newLabel', preValidation: app.authenticate },
      async (req, reply) => {
        const label = labelRepository.createModel();
        return reply.render('labels/new', { label });
      },
    )
    .get(
      '/labels/:id/edit',
      { name: 'editLabel', preValidation: app.authenticate },
      async (req, reply) => {
        const label = await labelRepository.getById(req.params.id);
        return reply.render('labels/edit', { label });
      },
    )
    .post(
      '/labels',
      { preValidation: app.authenticate },
      async (req, reply) => {
        const { data } = req.body;

        try {
          const label = await labelRepository.validate(data);
          await labelRepository.insert(label);

          req.flash('info', i18next.t('flash.labels.create.success'));
          return reply.redirect(app.reverse('labels'));
        } catch (error) {
          req.flash('error', i18next.t('flash.labels.create.error'));
          return reply.render('labels/new', { status: data, errors: error.data });
        }
      },
    )
    .patch(
      '/labels/:id',
      { name: 'patchLabel', preValidation: app.authenticate },
      async (req, reply) => {
        const { data } = req.body;

        try {
          const label = await labelRepository.validate(data);
          await labelRepository.patch(req.params.id, label);

          req.flash('info', i18next.t('flash.labels.edit.success'));
          return reply.redirect(app.reverse('labels'));
        } catch (error) {
          req.flash('error', i18next.t('flash.labels.edit.error'));
          return reply.render('labels/edit', {
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
        const tasks = await labelRepository.getRelatedData(
          req.params.id,
          'tasks',
        );

        if (tasks.length > 0) {
          req.flash('error', i18next.t('flash.labels.delete.error'));
        } else {
          await labelRepository.deleteById(req.params.id);
          req.flash('info', i18next.t('flash.labels.delete.success'));
        }

        reply.redirect(app.reverse('labels'));
      },
    );
};
