import i18next from 'i18next';
import TaskRepository from '../repositories/TaskRepository';
import StatusRepository from '../repositories/StatusRepository';
import UserRepository from '../repositories/UserRepository';
import LabelRepository from '../repositories/LabelRepository';

const parseQuery = (querystring) =>
  Object.entries(querystring).reduce((acc, [key, value]) => {
    if (value) {
      return { ...acc, [key]: value };
    }
    return acc;
  }, {});

const parseLabels = (labels = []) =>
  Array.isArray(labels)
    ? labels.map((label) => ({ id: Number(label) }))
    : [{ id: Number(labels) }];

export default (app) => {
  const tasksRepository = new TaskRepository(app);
  const statusRepository = new StatusRepository(app);
  const userRepository = new UserRepository(app);
  const labelRepository = new LabelRepository(app);

  app
    .get(
      '/tasks',
      { name: 'tasks', preValidation: app.authenticate },
      async (req, reply) => {
        const tasks = await tasksRepository.getAll(
          parseQuery({
            ...req.query,
            creator: req.query.isCreatorUser ? req.user.id : '',
          })
        );

        const statuses = await statusRepository.getAll();
        const users = await userRepository.getAll();
        const labels = await labelRepository.getAll();

        return reply.render('tasks/index', {
          tasks,
          statuses,
          users,
          labels,
          filters: req.query,
        });
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
        const labels = await labelRepository.getAll();

        return reply.render('tasks/new', { task, statuses, users, labels });
      }
    )
    .get(
      '/tasks/:id/edit',
      { name: 'editTask', preValidation: app.authenticate },
      async (req, reply) => {
        const task = await tasksRepository.getById(req.params.id);
        const statuses = await statusRepository.getAll();
        const users = await userRepository.getAll();
        const labels = await labelRepository.getAll();

        return reply.render('tasks/edit', { task, statuses, users, labels });
      }
    )
    .post('/tasks', { preValidation: app.authenticate }, async (req, reply) => {
      const { data } = req.body;

      try {
        const { labels, ...taskData } = data;

        const task = await tasksRepository.validate({
          ...taskData,
          creatorId: req.user.id,
        });

        await tasksRepository.insert({
          ...task,
          labels: parseLabels(labels),
        });

        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (error) {
        const statuses = await statusRepository.getAll();
        const users = await userRepository.getAll();
        const labels = await labelRepository.getAll();

        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.render('tasks/new', {
          task: { ...data, labels: parseLabels(data.labels) },
          statuses,
          users,
          labels,
          errors: error.data,
        });
      }
    })
    .patch(
      '/tasks/:id',
      { name: 'patchTask', preValidation: app.authenticate },
      async (req, reply) => {
        const id = Number(req.params.id);
        const { data } = req.body;

        try {
          const { labels = [], ...taskData } = data;

          const task = await tasksRepository.validate(taskData);

          await tasksRepository.patch({
            id,
            ...task,
            labels: parseLabels(labels),
          });

          req.flash('info', i18next.t('flash.tasks.edit.success'));
          return reply.redirect(app.reverse('tasks'));
        } catch (error) {
          const statuses = await statusRepository.getAll();
          const users = await userRepository.getAll();
          const labels = await labelRepository.getAll();

          req.flash('error', i18next.t('flash.tasks.edit.error'));
          return reply.render('tasks/edit', {
            task: { id, ...data, labels: parseLabels(data.labels) },
            statuses,
            users,
            labels,
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
          await task.$relatedQuery('labels').unrelate();
          await tasksRepository.deleteById(req.params.id);
          req.flash('info', i18next.t('flash.tasks.delete.success'));
        } else {
          req.flash('error', i18next.t('flash.tasks.delete.error'));
        }

        reply.redirect(app.reverse('tasks'));
      }
    );
};
