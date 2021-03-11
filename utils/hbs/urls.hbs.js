const config = require('../../.env/env.json');

module.exports = ['URL', (url) => {
    return config.utils.URL + url;
}];