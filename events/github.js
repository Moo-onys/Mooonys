this.$ = new Object();

const uuid = require('uuid');
const superagent = require('superagent');
const crypto = require('crypto');
const express = require('express');
const moment = require('moment');
const router = this.$.router = express.Router();
const path = this.$.path = ['/github'][0];

router.get('/', async (req, res, next) => {
    if (req.session._uuid) {
        return res.redirect('/dashboard');
    }

    next();
}, async (req, res) => {
    const {
        code
    } = req.query;

    if (!code) {
        return res.send('no code');
    }

    if (!await req.mongodb.db(req.env.realm.db).collection('users').findOne({
        '_apis.github': code,
    })) {
        superagent
            .post('https://github.com/login/oauth/access_token')
            .send({
                client_id: req.env.github.client_id,
                client_secret: req.env.github.client_secret,
                code: code
            })
            .set('Accept', 'application/json')
            .then((_) => {
                const {
                    access_token,
                    token_type,
                    scope
                } = _.body;

                superagent
                    .get('https://api.github.com/user')
                    .set('Authorization', `token ${access_token}`)
                    .then((_) => {
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
                            two_factor_authentication,
                            plan: {
                                name,
                                space,
                                collaborators,
                                private_repos
                            }
                        } = _.body;

                        const encryption = crypto.createHash('sha256').update(access_token).digest('base64');

                        if (await req.mongodb.db(req.env.realm.db).collection('users').findOne({
                            '_apis.github': encryption
                        })) {
                            return res.redirect('/sign-in')
                        }

                        const _uuid = uuid.v4();
                        const _apis = {
                            _: uuid.v4(),
                            github: crypto.createHash('sha256').update(access_token).digest('base64'),
                            twitter: false
                        };

                        await req.mongodb.db(req.env.realm.db).collection('users').insertOne({
                            _id: new BSON.ObjectID(),
                            _apis: _apis,
                            _information: {
                                img: avatar_url,
                                fn: name,
                                ln: '',
                                address: email,
                                bio: bio,
                                employed: hireable,
                                telephone: false,
                                birthday: false
                            },
                            _options: {
                                status: false,
                                clearance: 1,
                                _uuid: _uuid,
                                notifications: [{
                                    authors: {
                                        profile: 'logo.svg',
                                        username: 'Mooonys'
                                    },
                                    notification: `<i class="font-semibold">${login}</i> has just signed up.`,
                                    _moment: moment().format()
                                }]
                            },
                            username: login,
                            password: false
                        });

                        await req.mongodb.db(req.env.realm.db).collection('users').findOne({
                            username: login
                        }).then(async (users) => {
                            console.log(`${users.username} has just registered!`);

                            req.app.render('emails/registration', {
                                layout: false,
                                fullname: users.username,
                                username: users.username,
                                address: users._information.address
                            }, async (err, html) => {
                                if (err) {
                                    return console.error(err);
                                }

                                await req.utils.nodemailer.sendMail({
                                    from: req.env.nodemailer.username,
                                    to: users._information.address,
                                    subject: `Thank you for registering on our site, ${users.username}.`,
                                    html: html
                                });
                            });

                            res.redirect('/sign-in');
                        });
                    });
            });
    }

    superagent
        .post('https://github.com/login/oauth/access_token')
        .send({
            client_id: req.env.github.client_id,
            client_secret: req.env.github.client_secret,
            code: code
        })
        .set('Accept', 'application/json')
        .then((_) => {
            const {
                access_token,
                token_type,
                scope
            } = _.body;

            superagent
                .get('https://api.github.com/user')
                .set('Authorization', `token ${access_token}`)
                .then((_) => {
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
                        two_factor_authentication,
                        plan: {
                            name,
                            space,
                            collaborators,
                            private_repos
                        }
                    } = _.body;

                    const encryption = crypto.createHash('sha256').update(access_token).digest('base64');

                    if (!await req.mongodb.db(req.env.realm.db).collection('users').findOne({
                        username: login,
                        '_apis.github': encryption
                    })) {
                        return res.redirect('/sign-up')
                    }

                    await req.mongodb.db(req.env.realm.db).collection('users').findOne({
                        username: login,
                        '_apis.github': encryption
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
                                    password: users._apis.github
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

                        return res.redirect('/dashboard');
                    });
                });
        });
});

module.exports = this;