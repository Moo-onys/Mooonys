const express = require(`express`);
const session = require(`express-session`);
const exphbs = require(`express-handlebars`);

const nodemailer = require(`nodemailer`);
const crypto = require(`crypto`);
const moment = require(`moment`);
const cors = require(`cors`);
const clc = require(`cli-color`);
const clt = require(`cli-table`);
const uuid = require(`uuid`);

this.session = require(`connect-mongodb-session`)(session);

const fs = require(`fs`);
const path = require(`path`);
const pkgs = [];

const Realm = require(`realm`);
const {
    BSON
} = require(`mongodb-stitch-browser-sdk`);

if (process.platform === `win32`) {
    process.env.DIR = `C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys`;
    process.env.PORT = 443;
    process.env.URL = `https://www.mooonys.co/`;
    process.env.SECURITY = true;
}

if (process.platform === `darwin`) {
    process.env.DIR = `/Volumes/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys`;
    process.env.PORT = 443;
    process.env.URL = `https://www.mooonys.co/`;
    process.env.SECURITY = true;
}

if (!process.env.DIR) {
    process.env.DIR = `.`;
    process.env.PORT = 443;
    process.env.URL = `https://www.mooonys.co/`;
    process.env.SECURITY = true;
}

const client = express();
const https = require('https').createServer({
    cert: fs.readFileSync(`${process.env.DIR}/ssl/mooonys_co.crt`, {
        encoding: 'utf8'
    }),
    ca: fs.readFileSync(`${process.env.DIR}/ssl/mooonys_co.ca-bundle`, {
        encoding: 'utf8'
    }),
    key: fs.readFileSync(`${process.env.DIR}/ssl/mooonys_co.key`, {
        encoding: 'utf8'
    })
},
    client);
const io = require(`socket.io`)(https);

const env = require(`${process.env.DIR}/env.json`);
const utils = require(`${process.env.DIR}/utils.js`);
const realm = Realm.App.getApp(env.realm._id);

this.mongodb = async () => {
    const user = await realm.logIn(Realm.Credentials.emailPassword(env.realm.username, env.realm.password));

    return user.mongoClient(env.realm._atlas);
}

client.set(`session`, session({
    genid: () => {
        return uuid.v4();
    },
    secret: uuid.v4(),
    store: new this.session(env.mongodb),
    resave: true,
    saveUninitialized: false,
    cookie: {
        sameSite: true,
        secure: process.env.SECURITY,
        maxAge: 60000 * 60
    }
}));

client.set(`views`, `${process.env.DIR}/views`);
client.set(`hbs`, exphbs.create({
    extname: `.hbs`,
    defaultLayout: `1`,
    partialsDir: `${process.env.DIR}/views/partials`,
    layoutsDir: `${process.env.DIR}/views/layouts`,
    helpers: utils.hbs_js()
}));

io.set(`transports`, [`websocket`]);

io.use(require(`express-socket.io-session`)(client.get(`session`), {
    autoSave: true
}));

client.set('hosts', {
    www: 'www',
    api: 'api'
});

client.set(`contributors`, 0);
client.set(`viewers`, 0);

io.on(`connection`, async (socket) => {
    socket.on(`viewers`, async (args) => {
        io.emit(`viewers`, {
            viewers: client.get(`viewers`) + args,
            contributors: client.get(`contributors`)
        });
        client.set(`viewers`, client.get(`viewers`) + args);

        if (args > 0) {
            pkgs.forEach(async (args) => {
                args.ts = moment(args._ts).fromNow();

                socket.emit(`submit`, args);
            });
        }
    });

    socket.on(`contributors`, async (args) => {
        io.emit(`contributors`, {
            contributors: client.get(`contributors`) + args,
            viewers: client.get(`viewers`),
        });
        client.set(`contributors`, client.get(`contributors`) + args);

        if (args > 0) {
            pkgs.forEach(async (args) => {
                args.ts = moment(args._ts).fromNow();

                socket.emit(`submit`, args);
            });
        }
    });

    socket.on(`submit`, async (args) => {
        args.ts = moment(args._ts).fromNow();

        pkgs.push({
            pkg: args.pkg,
            author: args.author,
            ts: args.ts,
            type: args.type,
            _ts: args._ts,
            sound: false
        });

        socket.broadcast.emit(`submit`, args);
    });

    socket.on(`disconnect`, async (args) => {
        if (socket.contributors) {
            io.emit(`contributors`, client.get(`contributors`) + -1);
            client.set(`contributors`, client.get(`contributors`) + -1);
        }

        if (socket.viewers) {
            io.emit(`viewers`, client.get(`viewers`) + -1);
            client.set(`viewers`, client.get(`viewers`) + -1);
        }
    });
});

client.engine(`hbs`, client.get(`hbs`).engine);
client.set(`trust proxy`, 1);
client.set(`view engine`, `hbs`);

const _ev = [];

client.use(client.get(`session`));
client.use(cors({ origin: process.env.URL }));
client.use(`/utils`, express.static(`${process.env.DIR}/utils`));
client.use(require(`cookie-parser`)());
client.use(express.json());
client.use(require(`body-parser`).urlencoded({
    extended: true
}));

client.use(async (req, res, next) => {
    req.io = io;
    req.env = env;
    req.mongodb = await this.mongodb();
    req.utils = utils;

    next();
});

client.use(async (req, res, next) => {
    if (!req.cookies[`_uuid`] && req.session._uuid) {
        await req.session.regenerate(async (err) => {
            if (err) {
                console.error(err);
            }
        });
    } else if (req.cookies[`_uuid`] !== req.session._uuid) {
        await req.session.regenerate(async (err) => {
            if (err) {
                console.error(err);
            }
        });
    }

    next();
});

client.use(async (req, res, next) => {
    res.locals.session = req.session._uuid ? {
        _id: req.session.users._id,
        _uuid: req.session._uuid,
        status: true,
        users: await req.mongodb.db(`slacks`).collection(`users`).findOne({
            _id: req.session.users._id
        })
    } : false;

    next();
});

process.stdout.write(clc.reset);

https.listen(process.env.PORT, async () => {
    process.stdout.write(`\n${process.env.URL}`);
});

this.__init__ = async (dir, files) => {
    let _dir = await fs.readdirSync(dir);

    for (let i in _dir) {
        let v = `${dir}/${_dir[i]}`;

        if (fs.statSync(v).isDirectory()) {
            await this.__init__(v, files);
        } else {
            files.push(v);
        }
    }

    return files;
}

this.__init__(`${process.env.DIR}/events`, _ev).then(async (_v) => {
    const routes = [];

    (async () => {
        _v.forEach(async (__v) => {
            const v = require(__v);

            routes.push(v.$.path);
            client.use(v.$.path, v.$.router);
        });
    })().then(async () => {
        client.get(`*`, async (req, res, next) => {
            if (routes.indexOf(req.path) >= 0) return;

            next();
        }, async (req, res) => {
            res.status(404).render(`404`, {
                layout: `2`,
                _url: `/404`,
                users: res.locals.session.users || false
            });
        });
    });
});

/*(async () => {
    const icns = require(`${process.env.DIR}/icns.json`);

    const iconns = [];
    const _icns = [
        `fa`,
        `fa6`,
        `fa6l`,
        `fa6r`,
        `fa6s`,
        `fa6t`,
        `fab`,
        `fac`,
        `fad`,
        `fal`,
        `far`,
        `fas`
    ]

    _icns.forEach(async (icns_) => {
        Object.entries(icns[`${icns_}`]).forEach(async (icn) => {
            iconns.push(`"<img src=\"{{URL 'utils/img/icons/${icns_}/${icn[0]}'}}\" width=\"64\" height=\"64\" alt=\"${icn[0]}\" />"`);
            iconns.push('\n');
        });
    });

    await fs.writeFileSync('./icons.txt', iconns);
})();*/

client.get(`/`, async (req, res) => {
    res.redirect(`/sign-in`);
});

client.get(`/api/ts`, async (req, res) => {
    res.json({
        ts: moment().fromNow(),
        _ts: moment().format()
    });
});

client.get(`/ajax`, async (req, res, next) => {
    const {
        _is
    } = req.query;

    if (_is && !req.session._uuid) {
        return res.json({
            $: true
        });
    }

    next();
}, async (req, res) => {
    res.json({
        $: false
    });
});