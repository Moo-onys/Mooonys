const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const env = require('C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys/env.json');

this.hbs_js = () => {
    const hbs = {};

    fs.readdir('C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys/utils/hbs', (err, files) => {
        files.forEach((hbs_) => {
            require(`C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys/utils/hbs/${hbs_}`).forEach((_hbs, i, __hbs) => {
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
        user: env.nodemailer.username,
        pass: env.nodemailer.password
    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports = this;