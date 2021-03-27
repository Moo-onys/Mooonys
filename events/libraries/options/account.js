this.$ = new Object();

const express = require('express');
const router = this.$.router = express.Router();
const path = this.$.path = ['/options/account'][0];

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
        return req.app.render(`libraries${path}`, {
            layout: false,
            _url: `${path}?hbs=true`,
            location: req.session.location || false,
            users: res.locals.session.users || false
        }, async (err, hbs) => {
            if (err) {
                return console.error(err);
            }

            res.send(hbs);
        });
    }

    res.render(`libraries${path}`, {
        layout: '1',
        _url: `${path}`,
        location: req.session.location || false,
        users: res.locals.session.users || false
    });
});

router.post('/', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.redirect('/sign-in');
    }

    next();
}, async (req, res) => {
    const {
        img,
        fn,
        ln,
        address,
        bio,
        employed,
        telephone,
        birthday
    } = req.body;

    req.mongodb.db(req.env.realm.db).collection('users').updateOne({
        _id: req.session.users._id
    }, {
        _information: {
            img: `${img}`,
            fn: `${fn}`,
            ln: `${ln}`,
            address: `${address}`,
            bio: `${bio}`,
            employed: `${employed}`,
            telephone: `${telephone}`,
            birthday: `${birthday}`
        }
    }).then(async () => {
        res.json({
            err: false,
            _id: req.session.users._id,
            xhr: {
                uuid: req.session.users._options._uuid,
                url: '/options/account',
                async: true
            }
        });
    });
});

module.exports = this;