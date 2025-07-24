export const USER_VALIDATIONS = {
  password: {
    minLength: 8,
    maxLength: 32,
    matches: /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
  },
  username: {
    minLength: 3,
    maxLength: 32,
  },
  firstName: {
    minLength: 1,
    maxLength: 50,
  },
  lastName: {
    minLength: 1,
    maxLength: 50,
  },
  bio: {
    maxLength: 500,
  },
};
