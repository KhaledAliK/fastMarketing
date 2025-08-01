const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.BASE_URL_PROD
    : process.env.BASE_URL_DEV;

module.exports = {
  BASE_URL,
};
