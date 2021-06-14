import i18next from 'i18next';
import StatusRepository from '../repositories/StatusRepository';

export default (app) => {
  const statusRepository = new StatusRepository(app);

  app
    .get(
      '/statuses',
      { name: 'statuses', preValidation: app.authenticate },
      async (req, reply) => {
        const statuses = await statusRepository.getAll();
        return reply.render('statuses/index', { statuses });
      }
    )
    .get(
      '/statuses/new',
      { name: 'newStatus', preValidation: app.authenticate },
      (req, reply) => {
        const status = statusRepository.createModel();
        reply.render('statuses/new', { status });
      }
    )
    .get(
      '/statuses/:id/edit',
      {
        name: 'editStatus',
        preValidation: app.authenticate,
      },
      async (req, reply) => {
        const status = await statusRepository.getById(req.params.id);
        return reply.render('statuses/edit', { status });
      }
    )
    .post(
      '/statuses',
      { preValidation: app.authenticate },
      async (req, reply) => {
        try {
          const status = await statusRepository.validate(req.body.data);
          await statusRepository.insert(status);

          req.flash('info', i18next.t('flash.statuses.create.success'));
          reply.redirect(app.reverse('statuses'));
        } catch (error) {
          req.log.error(error);
          req.flash('error', i18next.t('flash.statuses.create.error'));
          reply.render('statuses/new', {
            status: req.body.data,
            errors: error.data,
          });
        }
      }
    )
    .patch(
      '/statuses/:id',
      { name: 'patchStatus', preValidation: app.authenticate },
      async (req, reply) => {
        try {
          const status = await statusRepository.validate(req.body.data);
          await statusRepository.patch(req.params.id, status);

          req.flash('info', i18next.t('flash.statuses.edit.success'));
          return reply.redirect(app.reverse('statuses'));
        } catch (error) {
          req.log.error(error);
          const status = await statusRepository.getById(req.params.id);

          req.flash('error', i18next.t('flash.statuses.edit.error'));
          return reply.render('statuses/edit', { status, errors: error.data });
        }
      }
    )
    .delete(
      '/statuses/:id',
      { name: 'deleteStatus', preValidation: app.authenticate },
      async (req, reply) => {
        try {
          await statusRepository.deleteById(req.params.id);

          req.flash('info', i18next.t('flash.statuses.delete.success'));
        } catch (error) {
          req.log.error(error);
          req.flash('error', i18next.t('flash.statuses.delete.error'));
        } finally {
          reply.redirect(app.reverse('statuses'));
        }
      }
    );
};
