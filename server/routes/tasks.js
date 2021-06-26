import i18next from 'i18next';
import TaskRepository from '../repositories/TaskRepository';
import StatusRepository from '../repositories/StatusRepository';
import UserRepository from '../repositories/UserRepository';

export default (app) => {
  const tasksRepository = new TaskRepository(app);
  const statusRepository = new StatusRepository(app);
  const userRepository = new UserRepository(app);

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
      '/tasks/:id',
      { name: 'task', preValidation: app.authenticate },
      async (req, reply) => {
        const task = await tasksRepository.getById(req.params.id);
        return reply.render('tasks/task', { task });
      }
    )
    .get(
      '/tasks/new',
      { name: 'newTask', preValidation: app.authenticate },
      async (req, reply) => {
        const task = tasksRepository.createModel();
        const statuses = await statusRepository.getAll();
        const users = await userRepository.getAll();
        reply.render('tasks/new', { task, statuses, users });
      }
    )
    .get(
      '/tasks/:id/edit',
      { name: 'editTask', preValidation: app.authenticate },
      async (req, reply) => {
        const task = await tasksRepository.getById(req.params.id);
        const statuses = await statusRepository.getAll();
        const users = await userRepository.getAll();
        return reply.render('tasks/edit', { task, statuses, users });
      }
    )
    .post('/tasks', { preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { executorId, statusId, name, description } = req.body.data;

        const task = await tasksRepository.validate({
          name,
          description,
          statusId: Number(statusId),
          executorId: Number(executorId),
          creatorId: req.user.id,
        });
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
          const statuses = await statusRepository.getAll();
          const users = await userRepository.getAll();

          req.flash('error', i18next.t('flash.tasks.edit.error'));
          return reply.render('tasks/edit', {
            task,
            statuses,
            users,
            errors: error.data,
          });
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
          req.flash('error', i18next.t('flash.tasks.delete.error'));
        }

        reply.redirect(app.reverse('tasks'));
      }
    );
};
