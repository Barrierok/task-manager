import faker from 'faker';

export default () => ({
  name: faker.lorem.word(),
  description: faker.lorem.paragraph(),
  statusId: 1,
  executorId: 1,
  creatorId: 1,
});
