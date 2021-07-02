/**
 * @param {Object} app
 * @param {Object} user
 * @return {Promise<{ userId: string, cookie: Object }>}
 */
export default async (app, user) => {
  const userModel = app.objection.models.user;
  const userId = (await userModel.query().insert(user)).id;

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
