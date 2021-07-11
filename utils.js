const fs = require(`fs`);
const path = require(`path`);
const nodemailer = require(`nodemailer`);
const env = require(`./env.json`);

this.hbs_js = () => {
    const hbs = {};

    fs.readdir(`./utils/hbs`, (err, files) => {
        files.forEach((hbs_) => {
            require(`./utils/hbs/${hbs_}`).forEach((_hbs, i, __hbs) => {
                if (typeof _hbs === `function`) {
                    hbs[__hbs[i - 1]] = _hbs;
                }
            });
        });
    });

    return hbs;
}

this.pkgs = [];

this.ev = [];

this.env = env;

const realm = Realm.App.getApp(env.realm._id);

realm.logIn(Realm.Credentials.emailPassword(env.realm.username, env.realm.password)).then(async (user) => {
    this.db = user.mongoClient(env.realm._atlas);
});

this.nodemailer = nodemailer.createTransport({
    host: `mail.privateemail.com`,
    port: 465,
    secure: true,
    auth: {
        user: env.tls.username,
        pass: env.tls.password
    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports = this;