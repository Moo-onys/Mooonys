this.$ = new Object();

const express = require('express');
const router = this.$.router = express.Router();
const path = this.$.path = ['/administration'][0];

router.get('/', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.redirect('/sign-in');
    }

    next();
}, async (req, res) => {
    const {
        hbs
    } = req.query;

    if (hbs) {
        return req.app.render(`libraries/administration`, {
            layout: false,
            _url: `/administration?hbs=true`,
            location: req.session.location || false,
            users: res.locals.session.users || false,
            _users: await req.db.db(req.env.realm.db).collection('users').find({})
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
        users: res.locals.session.users || false,
        _users: await req.db.db(req.env.realm.db).collection('users').find({})
    });
});

module.exports = this;