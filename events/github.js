this.$ = new Object();

const uuid = require('uuid');
const superagent = require('superagent');
const crypto = require('crypto');
const express = require('express');
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
        console.log('not signed up');
    }

    superagent
        .post('https://github.com/login/oauth/access_token')
        .send({
            client_id: req.env.github.client_id,
            client_secret: req.env.github.client_secret,
            code: code
        })
        .set('accept', 'json')
        .then(async (xhr) => {
            const {
                access_token
            } = xhr.body;

            res.send(access_token);
        });
});

module.exports = this;