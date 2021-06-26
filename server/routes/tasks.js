import i18next from 'i18next';
import TaskRepository from '../repositories/TaskRepository';

export default (app) => {
  const tasksRepository = new TaskRepository(app);

  app
    .get(
      '/tasks',
      { name: 'tasks', preValidation: app.authenticate },
      async (req, reply) => {
        const tasks = await tasksRepository.getAll();
        return reply.render('tasks/index', { tasks });
      }
    )
    .get(
      '/tasks/new',
      { name: 'newTasks', preValidation: app.authenticate },
      (req, reply) => {
        const task = tasksRepository.createModel();
        reply.render('statuses/new', { task });
      }
    )
    .get(
      '/tasks/:id/edit',
      { name: 'editTask', preValidation: app.authenticate },
      async (req, reply) => {
        const task = await tasksRepository.getById(req.params.id);
        return reply.render('tasks/edit', { task });
      }
    )
    .post('/tasks', { preValidation: app.authenticate }, async (req, reply) => {
      try {
        const task = await tasksRepository.validate(req.body.data);
        await tasksRepository.insert(task);

        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (error) {
        req.log.error(error);
        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.render('tasks/new', {
          task: req.body.data,
          errors: error.data,
        });
      }
    })
    .patch(
      '/tasks/:id',
      { name: 'patchTask', preValidation: app.authenticate },
      async (req, reply) => {
        try {
          const task = await tasksRepository.validate(req.body.data);
          await tasksRepository.patch(req.params.id, task);

          req.flash('info', i18next.t('flash.tasks.edit.success'));
          return reply.redirect(app.reverse('tasks'));
        } catch (error) {
          req.log.error(error);
          const task = await tasksRepository.getById(req.params.id);

          req.flash('error', i18next.t('flash.tasks.edit.error'));
          return reply.render('statuses/edit', { task, errors: error.data });
        }
      }
    )
    .delete(
      '/tasks/:id',
      { name: 'deleteTask', preValidation: app.authenticate },
      async (req, reply) => {
        const task = await tasksRepository.getById(req.params.id);

        if (task.creatorId === req.user.id) {
          await tasksRepository.deleteById(req.params.id);
          req.flash('info', i18next.t('flash.tasks.delete.success'));
        } else {
          req.flash('info', i18next.t('flash.tasks.delete.error'));
        }

        reply.redirect(app.reverse('tasks'));
      }
    );
};
