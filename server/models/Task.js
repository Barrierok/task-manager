import { Model } from 'objection';
import path from 'path';

export default class Task extends Model {
  static get tableName() {
    return 'tasks';
  }

  $parseJson(json, opt) {
    // eslint-disable-next-line no-param-reassign
    json = super.$parseJson(json, opt);

    return {
      ...json,
      creatorId: Number(json.creatorId) || null,
      statusId: Number(json.statusId) || null,
      executorId: Number(json.executorId) || null,
    };
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'statusId', 'creatorId'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        statusId: { type: 'integer' },
        creatorId: { type: 'integer' },
        executorId: { type: ['integer', 'null'] },
      },
    };
  }

  static relationMappings = {
    executor: {
      relation: Model.BelongsToOneRelation,
      modelClass: path.join(__dirname, 'User'),
      join: {
        from: 'tasks.executorId',
        to: 'users.id',
      },
    },
    creator: {
      relation: Model.BelongsToOneRelation,
      modelClass: path.join(__dirname, 'User'),
      join: {
        from: 'tasks.creatorId',
        to: 'users.id',
      },
    },
    status: {
      relation: Model.BelongsToOneRelation,
      modelClass: path.join(__dirname, 'Status'),
      join: {
        from: 'tasks.statusId',
        to: 'statuses.id',
      },
    },
    labels: {
      relation: Model.ManyToManyRelation,
      modelClass: path.join(__dirname, 'Label'),
      join: {
        from: 'tasks.id',
        through: {
          from: 'tasks_labels.taskId',
          to: 'tasks_labels.labelId',
        },
        to: 'labels.id',
      },
    },
  };
}
