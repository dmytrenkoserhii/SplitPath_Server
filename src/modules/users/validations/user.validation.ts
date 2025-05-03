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
};
