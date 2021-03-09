const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

this.$ = new Object();

this.$['sign-in'] = async (args) => {
    const {
        client,
        mongodb,
        uuid,
        crypto
    } = args;

    client.get('/sign-in', async (req, res, next) => {
        if (req.session._uuid) {
            return res.redirect('/dashboard');
        }

        next();
    }, async (req, res) => {
        const next = async () => {
            res.render('sign-in', {

            });
        }

        next();
    });

    client.post('/sign-in', async (req, res, next) => {

    }, async (req, res) => {

    });
}

module.exports.helpers = () => {
    const _hbs = {};

    fs.readdir(path.join(process.cwd(), 'utils/hbs'), (err, files) => {
        files.forEach((hbs) => {
            const hbs_ = require(path.join(process.cwd(), `utils/hbs/${hbs}`));

            hbs_.forEach((hbs, i, __hbs) => {
                if (typeof hbs === 'function') {
                    _hbs[__hbs[i - 1]] = hbs;
                }
            });
        });
    });

    return _hbs;
}

module.exports.nodemailer = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: require('./config.json').nodemailer.user,
        pass: require('./config.json').nodemailer.pass
    },
    tls: {
        rejectUnauthorized: false
    }
});