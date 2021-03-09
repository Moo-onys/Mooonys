this.$ = new Object();

const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const moment = require('moment');
const clc = require('cli-color');
const clt = require('cli-table');
const uuid = require('uuid');

this.$.session = require('connect-mongodb-session')(session);

const fs = require('fs');
const path = require('path');

const Realm = require('realm');
const {
    BSON
} = require('mongodb-stitch-browser-sdk');

const client = express();
const https = require('https').createServer({
    cert: fs.readFileSync('./.env/ssl/mooonys_co.crt'),
    ca: fs.readFileSync('./.env/ssl/mooonys_co.ca-bundle'),
    key: fs.readFileSync('./.env/ssl/mooonys_co.key')
}, client);
const io = require('socket.io')(https);

const config = require('./config.json');
const init = require('./init.js');
const realm = Realm.App.getApp(config.realm._id);

realm.logIn(Realm.Credentials.emailPassword(config.realm.username, config.realm.password));

const mongodb = realm.currentUser.mongoClient(config.realm._atlas);

config.utils = {
    URL: 'https://www.mooonys.co/',
    PORT: 443,
    SECURITY: true
}

client.set('session', session({
    genid: () => {
        return uuid.v4();
    },
    secret: uuid.v4(),
    store: new this.$.session(config.mongodb),
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: true,
        secure: config.utils.SECURITY,
        maxAge: 60000 * 60
    }
}));

client.set('hbs', exphbs.create({
    extname: '.hbs',
    defaultLayout: '1',
    partialsDir: path.join(process.cwd(), '/views/partials'),
    layoutsDir: path.join(process.cwd(), '/views/layouts'),
    helpers: init.helpers()
}));

io.set('transports', ['websocket']);

io.use(require('express-socket.io-session')(client.get('session'), {
    autoSave: true
}));

client.engine('hbs', client.get('hbs').engine);
client.set('trust proxy', 1);
client.set('view engine', 'hbs');

client.use(client.get('session'));
client.use('/utils', express.static(path.join(process.cwd(), '/utils')));
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

https.listen(config.utils.PORT, async () => {
    process.stdout.write(`\nSlacks: ${config.utils.PORT}\nURL: ${config.utils.URL}`);
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

client.get('/sign-in', async (req, res, next) => {
    if (req.session._uuid) {
        return res.redirect('/dashboard');
    }

    next();
}, async (req, res) => {
    const next = async () => {
        res.render('sign-in', {
            layout: '2',
            _url: '/sign-in',
            cly: req.session.cly || false,
            users: false
        });
    }

    next();
});

client.post('/sign-in', async (req, res, next) => {
    if (req.session._uuid) {
        return res.redirect('/dashboard');
    }

    next();
}, async (req, res) => {
    const {
        username,
        password,
        remember
    } = req.body;

    const encryption = crypto.createHash('sha256').update(password).digest('base64');

    if (!await mongodb.db('slacks').collection('users').findOne({
            username: username,
            password: encryption
        })) {
        return res.json({
            err: {
                elements: ['username', 'password'],
                xhr: {
                    'username': 'You have provided an invalid username.',
                    'password': 'You have provided an invalid password.',
                },
                async: true
            }
        });
    }

    await mongodb.db('slacks').collection('users').findOne({
        username: username,
        password: encryption
    }).then(async (users) => {
        const _uuid = uuid.v4();

        res.cookie('_uuid', _uuid);

        res.locals.users = users;

        if (remember) {
            req.session.cookie.maxAge = (60000 * 60) * 3;
        } else {
            req.session.cookie.maxAge = 60000 * 60;
        }

        req.session._uuid = _uuid;
        req.session.users = {
            _id: users._id,
            _apis: users._apis,
            _clients: {
                _id: req.session.id,
                _credentials: {
                    username: users.username,
                    password: users.password
                }
            }
        }

        req.session.save();

        await mongodb.db('slacks').collection('users').updateOne({
            username: users.username
        }, {
            $set: {
                "_options.status": true
            }
        }, {
            upsert: false
        });

        console.log(`${users.username} has just logged in.`);

        return res.json({
            err: false,
            _id: users._id,
            xhr: {
                uuid: users._options._uuid,
                url: '/dashboard',
                async: true
            }
        });
    });
});

client.get('/sign-up', async (req, res, next) => {
    if (req.session._uuid) {
        return res.redirect('/dashboard');
    }

    next();
}, async (req, res) => {
    const next = async () => {
        res.render('sign-up', {
            layout: '2',
            _url: '/sign-up',
            cly: req.session.cly || false,
            users: false
        });
    }

    next();
});

client.post('/sign-up', async (req, res, next) => {
    if (req.session._uuid) {
        return res.redirect('/dashboard');
    }

    next();
}, async (req, res) => {
    const {
        firstname,
        lastname,
        email,
        username,
        password,
        _img
    } = req.body;

    if (await mongodb.db('slacks').collection('users').findOne({
            username: username
        })) {
        return res.json({
            err: {
                elements: ['username'],
                xhr: {
                    username: 'You have provided an already in-use username.'
                },
                async: true
            }
        });
    }

    if (await mongodb.db('slacks').collection('users').findOne({
            "_information.email": email
        })) {
        return res.json({
            err: {
                elements: ['email'],
                xhr: {
                    email: 'You have provided an already in-use email.'
                },
                async: true
            }
        });
    }

    const _uuid = uuid.v4();
    const _apis = uuid.v4();

    await mongodb.db('slacks').collection('users').insertOne({
        _id: new BSON.ObjectID(),
        _apis: _apis,
        _information: {
            _img: _img || 'default.svg',
            firstname: firstname,
            lastname: lastname,
            email: email,
            address: '',
            telephone: ''
        },
        _options: {
            status: false,
            clearance: 1,
            _uuid: _uuid,
            notifications: [{
                    authors: {
                        profile: 'logo.svg',
                        username: 'Slacks'
                    },
                    notification: `<i class="font-semibold">${username}</i> has just signed up.`,
                    _moment: moment().format()
                },
                {
                    authors: {
                        profile: 'logo.svg',
                        username: 'Slacks'
                    },
                    notification: `<i class="font-semibold">Olivia Saturday</i> commented on your <i class="font-semibold">"This is all it takes to improve..."</i> post.`,
                    _moment: moment().format()
                }
            ]
        },
        username: username,
        password: crypto.createHash('sha256').update(password).digest('base64')
    });

    await mongodb.db('slacks').collection('users').findOne({
        username: username
    }).then(async (users) => {
        console.log(`${users.username} has just registered!`);

        res.json({
            err: false,
            _id: users._id,
            xhr: {
                uuid: users._options._uuid,
                url: '/sign-in',
                async: true
            }
        });
    });
});

client.get('/dashboard', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.redirect('/sign-in');
    }

    next();
}, async (req, res) => {
    const {
        hbs
    } = req.query;

    if (hbs) {
        return client.render(`libraries/dashboard`, {
            layout: false,
            _url: `/dashboard?hbs=true`,
            location: req.session.location || false,
            users: res.locals.session.users || false
        }, async (err, hbs) => {
            if (err) {
                return console.error(err);
            }

            res.send(hbs);
        });
    }

    res.render(`libraries/dashboard`, {
        layout: '1',
        _url: `/dashboard`,
        location: req.session.location || false,
        users: res.locals.session.users || false
    });
});

client.get('/activity', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.redirect('/sign-in');
    }

    next();
}, async (req, res) => {
    const {
        hbs
    } = req.query;

    if (hbs) {
        return client.render(`libraries/activity`, {
            layout: false,
            _url: `/activity?hbs=true`,
            location: req.session.location || false,
            users: res.locals.session.users || false
        }, async (err, hbs) => {
            if (err) {
                return console.error(err);
            }

            res.send(hbs);
        });
    }

    res.render(`libraries/activity`, {
        layout: '1',
        _url: `/activity`,
        location: req.session.location || false,
        users: res.locals.session.users || false
    });
});

client.get('/administration', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.redirect('/sign-in');
    }

    next();
}, async (req, res) => {
    const {
        hbs
    } = req.query;

    if (hbs) {
        return client.render(`libraries/administration`, {
            layout: false,
            _url: `/administration?hbs=true`,
            location: req.session.location || false,
            users: res.locals.session.users || false
        }, async (err, hbs) => {
            if (err) {
                return console.error(err);
            }

            res.send(hbs);
        });
    }

    res.render(`libraries/administration`, {
        layout: '1',
        _url: `/administration`,
        location: req.session.location || false,
        users: res.locals.session.users || false
    });
});

client.get('/notifications', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.redirect('/sign-in');
    }

    next();
}, async (req, res) => {
    const {
        hbs
    } = req.query;

    if (hbs) {
        return client.render(`libraries/notifications`, {
            layout: false,
            _url: `/notifications?hbs=true`,
            location: req.session.location || false,
            users: res.locals.session.users || false
        }, async (err, hbs) => {
            if (err) {
                return console.error(err);
            }

            res.send(hbs);
        });
    }

    res.render(`libraries/notifications`, {
        layout: '1',
        _url: `/notifications`,
        location: req.session.location || false,
        users: res.locals.session.users || false
    });
});

client.get('/collaboration/:_uri', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.redirect('/sign-in');
    }

    next();
}, async (req, res) => {
    const {
        _uri
    } = req.params;

    const {
        hbs
    } = req.query;

    if (hbs) {
        return client.render(`libraries/collaboration/${_uri}`, {
            layout: false,
            _url: `/options/${_uri}?hbs=true`,
            location: req.session.location || false,
            users: res.locals.session.users || false
        }, async (err, hbs) => {
            if (err) {
                return console.error(err);
            }

            res.send(hbs);
        });
    }

    res.render(`libraries/collaboration/${_uri}`, {
        layout: '1',
        _url: `/options/${_uri}`,
        location: req.session.location || false,
        users: res.locals.session.users || false
    });
});

client.get('/options/:_uri', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.redirect('/sign-in');
    }

    const options = await fs.readdirSync(path.join(process.cwd(), '/views/libraries/options'));

    options.forEach(async (option, i, options) => {
        options[i] = option.replace('.hbs', '');
    });

    const {
        _uri
    } = req.params;

    if (options.indexOf(_uri) < 0) {
        return res.redirect('/404');
    }

    next();
}, async (req, res) => {
    const {
        _uri
    } = req.params;

    const {
        hbs
    } = req.query;

    if (hbs) {
        return client.render(`libraries/options/${_uri}`, {
            layout: false,
            _url: `/options/${_uri}?hbs=true`,
            location: req.session.location || false,
            users: res.locals.session.users || false
        }, async (err, hbs) => {
            if (err) {
                return console.error(err);
            }

            res.send(hbs);
        });
    }

    res.render(`libraries/options/${_uri}`, {
        layout: '1',
        _url: `/options/${_uri}`,
        location: req.session.location || false,
        users: res.locals.session.users || false
    });
});

client.get('/organization', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.redirect('/sign-in');
    }

    next();
}, async (req, res) => {
    const {
        _id,
        _$
    } = req.query;

    if (_$) {
        return await mongodb.db('slacks').collection('organizations').find({}).then(async (organizations) => {
            res.send(organizations);
        });
    }

    if (!_id) {
        return res.json({
            err: 'You must define an _id.'
        });
    }

    await mongodb.db('slacks').collection('organizations').findOne({
        _id: new BSON.ObjectID(_id)
    }).then(async (organization) => {
        res.send(organization);
    });
});

client.post('/organization', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.redirect('/sign-in');
    }

    next();
}, async (req, res) => {

});

client.get('/legals/:_uri', async (req, res, next) => {
    //if (!req.session._uuid) {
    //    return res.redirect('/sign-in');
    //}

    next();
}, async (req, res) => {
    const {
        _uri
    } = req.params;

    const {
        hbs
    } = req.query;

    if (hbs) {
        return client.render(`libraries/legals/${_uri}`, {
            layout: false,
            _url: `/legals/${_uri}?hbs=true`,
            location: req.session.location || false,
            users: res.locals.session.users || false
        }, async (err, hbs) => {
            if (err) {
                return console.error(err);
            }

            res.send(hbs);
        });
    }

    res.render(`libraries/legals/${_uri}`, {
        layout: '1',
        _url: `/legals/${_uri}`,
        location: req.session.location || false,
        users: res.locals.session.users || false
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