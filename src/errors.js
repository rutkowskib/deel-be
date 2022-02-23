class DoesntExistError extends Error {}
class AlreadyPaidError extends Error {}
class NotEnoughMoneyError extends Error {}
class UserDoesNotExistError extends Error {}
class ToBigDepositError extends Error {}

module.exports = {
  DoesntExistError,
  AlreadyPaidError,
  NotEnoughMoneyError,
  UserDoesNotExistError,
  ToBigDepositError
};
