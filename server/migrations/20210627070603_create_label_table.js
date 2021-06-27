
exports.up = (knex) =>
  knex.schema
    .createTable('labels', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('tasks_labels', (table) => {
      table.increments('id').primary();
      table
        .integer('taskId')
        .unsigned()
        .references('id')
        .inTable('tasks')
        .onDelete('RESTRICT')
      table
        .integer('labelId')
        .unsigned()
        .references('id')
        .inTable('labels')
        .onDelete('RESTRICT')
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

exports.down = (knex) => knex.schema
  .dropTable('tasks_labels')
  .dropTable('labels');
