(async () => {
    const express = require('express');
    const session = require('express-session');
    const exphbs = require('express-handlebars');

    const nodemailer = require('nodemailer');
    const crypto = require('crypto');
    const moment = require('moment');
    const clc = require('cli-color');
    const clt = require('cli-table');
    const uuid = require('uuid');

    this.session = require('connect-mongodb-session')(session);

    const fs = require('fs');
    const path = require('path');

    const Realm = require('realm');
    const {
        BSON
    } = require('mongodb-stitch-browser-sdk');

    const client = express();
    const https = require('https').createServer({
        cert: fs.readFileSync('C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys/ssl/mooonys_co.crt'),
        ca: fs.readFileSync('C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys/ssl/mooonys_co.ca-bundle'),
        key: fs.readFileSync('C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys/ssl/mooonys_co.key')
    },
        client);
    const io = require('socket.io')(https);

    const env = require('C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys/env.json');
    const utils = require('C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys/utils.js');
    const realm = Realm.App.getApp(env.realm._id);

    await realm.logIn(Realm.Credentials.emailPassword(env.realm.username, env.realm.password));

    const mongodb = realm.currentUser.mongoClient(env.realm._atlas);

    process.env.PORT = 443;
    process.env.URL = `https://www.mooonys.co/`;
    process.env.SECURITY = process.env.SECURITY ? process.env.SECURITY : true;

    client.set('session', session({
        genid: () => {
            return uuid.v4();
        },
        secret: uuid.v4(),
        store: new this.session(env.mongodb),
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: true,
            secure: process.env.SECURITY,
            maxAge: 60000 * 60
        }
    }));

    client.set('views', 'C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys/views');
    client.set('hbs', exphbs.create({
        extname: '.hbs',
        defaultLayout: '1',
        partialsDir: 'C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys/views/partials',
        layoutsDir: 'C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys/views/layouts',
        helpers: utils.hbs_js()
    }));

    io.set('transports', ['websocket']);

    io.use(require('express-socket.io-session')(client.get('session'), {
        autoSave: true
    }));

    client.engine('hbs', client.get('hbs').engine);
    client.set('trust proxy', 1);
    client.set('view engine', 'hbs');

    client.use(client.get('session'));
    client.use('/utils', express.static('C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys/utils'));
    client.use(require('cookie-parser')());
    client.use(express.json());
    client.use(require('body-parser').urlencoded({
        extended: true
    }));

    client.use(async (req, res, next) => {
        req.io = io;

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
            users: await mongodb.db('slacks').collection('users').findOne({
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

    this.__init__('C:/Users/reece_barker/Desktop/_1/Mooonys/env/Mooonys/events', []).then(async (_v) => {
        const routes = [];

        _v.forEach(async (__v) => {
            const v = require(__v);
            routes.push(v.$.path);
            client.use(v.$.path, v.$.router);
        });

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

    client.get('/', async (req, res) => {
        res.redirect('/sign-in');
    });

    client.post('/post/responses', async (req, res) => {
        console.log(req.body);
        res.send('done');
    });

    client.get('/ajax', async (req, res, next) => {
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

    client.get('/sign-out', async (req, res, next) => {
        if (!req.session._uuid) {
            return res.redirect('/sign-in');
        }

        next();
    }, async (req, res) => {
        req.session.destroy(async (err) => {
            if (err) {
                return res.redirect('/dashboard');
            }
        });

        res.redirect('/sign-in');
    });

    // /- 404 -/

    client.get('/404', async (req, res) => {
        res.status(404).render('404', {
            layout: '2',
            _url: '/404',
            users: res.locals.session.users || false
        });
    });

    // /- * -/

    client.get('*', async (req, res) => {
        res.status(404).render('404', {
            layout: '2',
            _url: '/404',
            users: res.locals.session.users || false
        });
    });

})();
