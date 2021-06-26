import UserRepository from '../server/repositories/UserRepository';

/**
 * @param {Object} app
 * @param {Object} user
 * @return {Promise<{ userId: string, cookie: Object }>}
 */
export default async (app, user) => {
  const userRepository = new UserRepository(app);
  const userId = (await userRepository.insert(user)).id;

  const responseSignIn = await app.inject({
    method: 'POST',
    url: app.reverse('session'),
    payload: {
      data: user,
    },
  });

  const [sessionCookie] = responseSignIn.cookies;
  const { name, value } = sessionCookie;
  const cookie = { [name]: value };

  return { userId, cookie };
};
