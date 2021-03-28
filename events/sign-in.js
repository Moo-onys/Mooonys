this.$ = new Object();

const uuid = require('uuid');
const crypto = require('crypto');
const express = require('express');
const router = this.$.router = express.Router();
const path = this.$.path = ['/sign-in'][0];

router.get('/', async (req, res, next) => {
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

router.get('/github', async (req, res, next) => {
    const {
        access_token
    } = req.query;

    if (!access_token) return res.redirect('/sign-in');

    next();
}, async (req, res) => {
    const {
        access_token
    } = req.query;

    const {
        login,
        id,
        node_id,
        avatar_url,
        gravatar_id,
        type,
        site_admin,
        name,
        company,
        blog,
        location,
        email,
        hireable,
        bio,
        twitter_username,
        public_repos,
        public_gists,
        followers,
        following,
        created_at,
        updated_at,
        private_gists,
        total_private_repos,
        owned_private_repos,
        disk_usage,
        collaborators,
        two_factor_authentication
    } = (await superagent
        .get('https://api.github.com/user')
        .set('User-Agent', 'PostmanRuntime/7.26.8')
        .set('Authorization', `token ${access_token}`)).body;

    const encryption = await crypto.createHash('sha256').update(`${id}`).digest('base64');

    if (!await req.mongodb.db(req.env.realm.db).collection('users').findOne({
        username: login,
        '_apis.github': encryption
    })) {
        return res.redirect(`/sign-up/github?access_token=${access_token}`);
    }

    await req.mongodb.db(req.env.realm.db).collection('users').findOne({
        username: login,
        '_apis.github': encryption
    }).then(async (users) => {
        const _uuid = uuid.v4();

        res.cookie('_uuid', _uuid);

        res.locals.users = users;

        req.session.cookie.maxAge = 60000 * 60;

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

        await req.mongodb.db(req.env.realm.db).collection('users').updateOne({
            username: users.username
        }, {
            $set: {
                "_options.status": true
            }
        }, {
            upsert: false
        });

        res.redirect('/dashboard');
    });
});

router.post('/', async (req, res, next) => {
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

    if (!await req.mongodb.db(req.env.realm.db).collection('users').findOne({
        username: username,
        password: encryption
    })) {
        return res.json({
            err: {
                elements: ['#username', '#password'],
                xhr: {
                    'username': 'You have provided an invalid username.',
                    'password': 'You have provided an invalid password.',
                },
                async: true
            }
        });
    }

    await req.mongodb.db(req.env.realm.db).collection('users').findOne({
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

        await req.mongodb.db(req.env.realm.db).collection('users').updateOne({
            username: users.username
        }, {
            $set: {
                "_options.status": true
            }
        }, {
            upsert: false
        });

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

module.exports = this;