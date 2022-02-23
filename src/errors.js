class DoesntExistError extends Error {}
class AlreadyPaidError extends Error {}
class NotEnoughMoneyError extends Error {}

module.exports = {
  DoesntExistError,
  AlreadyPaidError,
  NotEnoughMoneyError,
};
