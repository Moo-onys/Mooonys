this.$ = new Object();

const uuid = require('uuid');
const crypto = require('crypto');
const express = require('express');
const router = this.$.router = express.Router();
const path = this.$.path = ['/emails'][0];

router.get('/', async (req, res, next) => {

    next();
}, async (req, res) => {
    const next = async () => {
        res.render(`emails/${req.query.email}`, {
            layout: '2',
            _url: '/sign-in',
            cly: req.session.cly || false,
            users: false
        });
    }

    next();
});

module.exports = this;