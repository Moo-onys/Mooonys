const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
<<<<<<< HEAD
const env = require('/Volumes/Macintosh/_2/Mooonys/env/Mooonys/env.json');
=======
>>>>>>> parent of d910b3f (11)

this.hbs_js = () => {
    const hbs = {};

<<<<<<< HEAD
    fs.readdir('/Volumes/Macintosh/_2/Mooonys/env/Mooonys/utils/hbs', (err, files) => {
        files.forEach((hbs_) => {
            require(`/Volumes/Macintosh/_2/Mooonys/env/Mooonys/utils/hbs/${hbs_}`).forEach((_hbs, i, __hbs) => {
=======
    fs.readdir('./utils/hbs', (err, files) => {
        files.forEach((hbs_) => {
            require(`./utils/hbs/${hbs_}`).forEach((_hbs, i, __hbs) => {
>>>>>>> parent of d910b3f (11)
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
        user: '',
        pass: ''
    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports = this;