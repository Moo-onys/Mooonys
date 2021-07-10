const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const cors = require('cors');

const crypto = require('crypto');
const moment = require('moment');
const uuid = require('uuid');

const clc = require('cli-color');
const clt = require('cli-table');

this.session = require('connect-mongodb-session')(session);

const fs = require('fs');
const path = require('path');

const Realm = require('realm');
const {
    BSON
} = require('mongodb-stitch-browser-sdk');

const client = express();
const https = require('https').createServer({
    cert: fs.readFileSync(`./ssl/mooonys_co.crt`, {
        encoding: 'utf8'
    }),
    ca: fs.readFileSync(`./ssl/mooonys_co.ca-bundle`, {
        encoding: 'utf8'
    }),
    key: fs.readFileSync(`./ssl/mooonys_co.key`, {
        encoding: 'utf8'
    })
},
    client);
const io = require('socket.io')(https);

const utils = require(`./utils.js`);

client.set('session', session({
    genid: () => {
        return uuid.v4();
    },
    secret: uuid.v4(),
    store: new this.session(utils.env.mongodb),
    resave: true,
    saveUninitialized: false,
    cookie: {
        sameSite: true,
        secure: true,
        maxAge: 60000 * 60
    }
}));

client.set('views', `./views`);
client.set('hbs', exphbs.create({
    extname: '.hbs',
    defaultLayout: '1',
    partialsDir: `./views/partials`,
    layoutsDir: `./views/layouts`,
    helpers: utils.hbs_js()
}));

io.set('transports', ['websocket']);

io.use(require('express-socket.io-session')(client.get('session'), {
    autoSave: true
}));

client.set('contributors', 0);
client.set('viewers', 0);

io.on('connection', async (socket) => {
    socket.on('viewers', async (args) => {
        io.emit('viewers', {
            viewers: client.get('viewers') + args,
            contributors: client.get('contributors')
        });
        client.set('viewers', client.get('viewers') + args);

        if (args > 0) {
            utils.pkgs.forEach(async (args) => {
                args.ts = moment(args._ts).fromNow();

                socket.emit('submit', args);
            });
        }
    });

    socket.on('contributors', async (args) => {
        io.emit('contributors', {
            contributors: client.get('contributors') + args,
            viewers: client.get('viewers'),
        });
        client.set('contributors', client.get('contributors') + args);

        if (args > 0) {
            utils.pkgs.forEach(async (args) => {
                args.ts = moment(args._ts).fromNow();

                socket.emit('submit', args);
            });
        }
    });

    socket.on('submit', async (args) => {
        args.ts = moment(args._ts).fromNow();

        utils.pkgs.push({
            pkg: args.pkg,
            author: args.author,
            ts: args.ts,
            type: args.type,
            _ts: args._ts,
            sound: false
        });

        socket.broadcast.emit('submit', args);
    });

    socket.on('disconnect', async (args) => {
        if (socket.contributors) {
            io.emit('contributors', client.get('contributors') + -1);
            client.set('contributors', client.get('contributors') + -1);
        }

        if (socket.viewers) {
            io.emit('viewers', client.get('viewers') + -1);
            client.set('viewers', client.get('viewers') + -1);
        }
    });
});

client.engine('hbs', client.get('hbs').engine);
client.set('trust proxy', 1);
client.set('view engine', 'hbs');

client.use(client.get('session'));
client.use(express.json());

client.use(cors({
    origin: 'https://www.mooonys.co/'
}));

client.use('/utils', express.static(`./utils`));

client.use(require('cookie-parser')());
client.use(require('body-parser').urlencoded({
    extended: true
}));

client.use(async (req, res, next) => {
    req.io = io;
    req.env = utils.env;
    req.db = utils.db;
    req.tls = utils.tls;
    req.utils = utils;
    req.ev = utils.ev;

    next();
});

client.use(async (req, res, next) => {
    if (!req.cookies['_uuid'] && req.session._uuid) {
        await req.session.regenerate(async (err) => {
            if (err) {
                console.error(err);
            }
        });
    } else if (req.cookies['_uuid'] !== req.session._uuid) {
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
        users: await req.db.db(req.env.realm.db).collection('users').findOne({
            _id: req.session.users._id
        })
    } : false;

    next();
});

process.stdout.write(clc.reset);

https.listen(443, async () => {
    process.stdout.write(`\nhttps://www.mooonys.co/`);
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

this.__init__(`./bin`, utils.ev).then(async (_v) => {
    const routes = [];

    (async () => {
        _v.forEach(async (__v) => {
            const v = require(__v);

            routes.push(v.$.path);
            client.use(v.$.path, v.$.router);
        });
    })().then(async () => {
        client.get('*', async (req, res, next) => {
            if (routes.indexOf(req.path) >= 0) return;

            next();
        }, async (req, res) => {
            res.status(404).render('404', {
                layout: '2',
                _url: '/404',
                users: res.locals.session.users || false
            });
        });
    });
});

client.get('/', async (req, res) => {
    res.redirect('/sign-in');
});