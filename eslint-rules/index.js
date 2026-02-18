/**
 * MFC custom ESLint rules.
 * Load via "plugins" + "rules" in .eslintrc.json.
 */
const noRoundedCorners = require('./no-rounded-corners');
const noRawFetchInComponents = require('./no-raw-fetch-in-components');

module.exports = {
  rules: {
    'no-rounded-corners': noRoundedCorners,
    'no-raw-fetch-in-components': noRawFetchInComponents,
  },
};
