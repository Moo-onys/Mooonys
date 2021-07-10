this.$ = new Object();

const {
    BSON
} = require('mongodb-stitch-browser-sdk');

const moment = require('moment');

const express = require('express');
const router = this.$.router = express.Router();
const path = this.$.path = ['/api/utils/articles'][0];

router.get('/', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.status(403).json({
            err: true
        });
    }

    next();
}, async (req, res) => {
    const {
        _id
    } = req.body;

    if (_id) {
        if (!await req.db.db(req.env.realm.db).collection('articles').findOne({
            _id: _id
        })) {
            return res.json({
                err: {
                    elements: ['#_id'],
                    xhr: {
                        '_id': 'You have provided an invalid _id.',
                    },
                    async: true
                }
            });
        }

        return await req.db.db(req.env.realm.db).collection('articles').findOne({
            _id: _id
        }).then(async (articles) => {
            return res.json({
                err: false,
                xhr: articles
            });
        }).catch(async (err) => {
            return res.json({
                err: err,
                xhr: false
            });
        });
    }

    await req.db.db(req.env.realm.db).collection('articles').find({

    }).then(async (articles) => {
        return res.json({
            err: false,
            xhr: articles
        });
    }).catch(async (err) => {
        return res.json({
            err: err,
            xhr: false
        });
    });
});

router.post('/', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.status(403).json({
            err: true
        });
    }

    next();
}, async (req, res) => {
    const {
        title,
        description,
        genre
    } = req.body;

    await req.db.db(req.env.realm.db).collection('articles').insertOne({
        _id: new BSON.ObjectID(),
        _information: {
            author: req.session.users._id,
            title: title,
            description: description,
            genre: genre,
            _moment: moment().format()
        },
        _options: {
            rating: false,
            replies: [],
            status: true,
        }
    }).then(async (articles) => {
        return res.json({
            err: false,
            xhr: true
        });
    }).catch(async (err) => {
        return res.json({
            err: err,
            xhr: false
        });
    });
});

router.delete('/', async (req, res, next) => {
    if (!req.session._uuid) {
        return res.status(403).json({
            err: true
        });
    }

    next();
}, async (req, res) => {
    const {
        _id
    } = req.body;

    await req.db.db(req.env.realm.db).collection('articles').deleteOne({
        _id: _id
    }).then(async () => {
        return res.json({
            err: false,
            xhr: true
        });
    }).catch(async (err) => {
        return res.json({
            err: err,
            xhr: false
        });
    });
});

module.exports = this;