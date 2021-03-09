const config = require('../../config.json');

module.exports = ['URL', (url) => {
    return config.utils.URL + url;
}];