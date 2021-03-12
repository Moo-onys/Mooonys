const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

this.hbs_js = () => {
    const hbs = {};

    fs.readdir('./etc/hbs', (err, files) => {
        files.forEach((hbs_) => {
            require(`./etc/hbs/${hbs_}`).forEach((_hbs, i, __hbs) => {
                if (typeof _hbs === 'function') {
                    hbs[__hbs[i - 1]] = _hbs;
                }
            });
        });
    });

    return hbs;
}

this.nodemailer = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'no-reply@mooonys.co',
        pass: 'mooonys.co3569'
    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports = this;