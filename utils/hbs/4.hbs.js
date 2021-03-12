const config = require('../../env.json');

module.exports = ['URL', (url) => {
    return config.utils.URL + url;
}];