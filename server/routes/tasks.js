import _ from 'lodash';
import i18next from 'i18next';

const filterQuery = (querystring) => _.omitBy(querystring, _.isEmpty);

const parseLabels = (labels = []) => [labels].flat().map((label) => ({ id: Number(label) }));

export default (app) => {
  const taskModel = app.objection.models.task;
  const statusModel = app.objection.models.status;
  const labelModel = app.objection.models.label;
  const userModel = app.objection.models.user;

  app
    .get(
      '/tasks',
      { name: 'tasks', preValidation: app.authenticate },
      async (req, reply) => {
        const {
          status, executor, label, creator,
        } = filterQuery({
          ...req.query,
          creator: req.query.isCreatorUser === 'on' ? `${req.user.id}` : '',
        });

        const tasks = await taskModel
          .query()
          .skipUndefined()
          .withGraphJoined('[status, creator, executor, labels]')
          .where('executorId', executor)
          .where('creatorId', creator)
          .where('labelId', label)
          .where('statusId', status);

        const statuses = await statusModel.query();
        const users = await userModel.query();
        const labels = await labelModel.query();

        return reply.render('tasks/index', {
          tasks,
          statuses,
          users,
          labels,
          filters: req.query,
        });
      },
    )
    .get(
      '/tasks/:id',
      { name: 'task', preValidation: app.authenticate },
      async (req, reply) => {
        const task = await taskModel
          .query()
          .withGraphFetched('[status, creator, executor, labels]')
          .findById(req.params.id);

        return reply.render('tasks/task', { task });
      },
    )
    .get(
      '/tasks/new',
      { name: 'newTask', preValidation: app.authenticate },
      async (req, reply) => {
        const task = new app.objection.models.task();
        const statuses = await statusModel.query();
        const users = await userModel.query();
        const labels = await labelModel.query();

        return reply.render('tasks/new', {
          task, statuses, users, labels,
        });
      },
    )
    .get(
      '/tasks/:id/edit',
      { name: 'editTask', preValidation: app.authenticate },
      async (req, reply) => {
        const task = await taskModel
          .query()
          .withGraphFetched('[status, creator, executor, labels]')
          .findById(req.params.id);

        const statuses = await statusModel.query();
        const users = await userModel.query();
        const labels = await labelModel.query();

        return reply.render('tasks/edit', {
          task, statuses, users, labels,
        });
      },
    )
    .post('/tasks', { preValidation: app.authenticate }, async (req, reply) => {
      const { data } = req.body;

      try {
        const { labels, ...taskData } = data;

        const task = await taskModel.fromJson({
          ...taskData,
          creatorId: req.user.id,
        });

        await taskModel.transaction((trx) => (
          taskModel.query(trx).upsertGraphAndFetch(
            {
              ...task,
              labels: parseLabels(labels),
            },
            {
              relate: true,
              unrelate: true,
              noUpdate: ['labels'],
            },
          )
        ));

        req.flash('info', i18next.t('flash.tasks.create.success'));
        return reply.redirect(app.reverse('tasks'));
      } catch (error) {
        const statuses = await statusModel.query();
        const users = await userModel.query();
        const labels = await labelModel.query();

        req.flash('error', i18next.t('flash.tasks.create.error'));
        return reply.code(422).render('tasks/new', {
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

          const task = await taskModel.fromJson(taskData);

          await taskModel.transaction((trx) => (
            taskModel.query(trx).upsertGraphAndFetch(
              {
                id,
                ...task,
                labels: parseLabels(labels),
              },
              {
                relate: true,
                unrelate: true,
                noUpdate: ['labels'],
              },
            )
          ));

          req.flash('info', i18next.t('flash.tasks.edit.success'));
          return reply.redirect(app.reverse('tasks'));
        } catch (error) {
          const statuses = await statusModel.query();
          const users = await userModel.query();
          const labels = await labelModel.query();

          req.flash('error', i18next.t('flash.tasks.edit.error'));
          return reply.code(422).render('tasks/edit', {
            task: { id, ...data, labels: parseLabels(data.labels) },
            statuses,
            users,
            labels,
            errors: error.data,
          });
        }
      },
    )
    .delete(
      '/tasks/:id',
      { name: 'deleteTask', preValidation: app.authenticate },
      async (req, reply) => {
        const task = await taskModel
          .query()
          .withGraphFetched('[status, creator, executor, labels]')
          .findById(req.params.id);

        if (task.creatorId === req.user.id) {
          await task.$relatedQuery('labels').unrelate();
          await taskModel.query().deleteById(req.params.id);
          req.flash('info', i18next.t('flash.tasks.delete.success'));
        } else {
          req.flash('error', i18next.t('flash.tasks.delete.error'));
        }

        reply.redirect(app.reverse('tasks'));
      },
    );
};
