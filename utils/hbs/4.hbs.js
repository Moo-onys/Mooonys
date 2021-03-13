const config = require('../../env.json');

module.exports = ['URL', (url) => {
    return process.env.URL + url;
}];