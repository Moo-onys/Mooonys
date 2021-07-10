this.$ = new Object();

const express = require('express');
const moment = require('moment');
const router = this.$.router = express.Router();
const path = this.$.path = ['/api/utils/ts'][0];

router.get('/', async (req, res) => {
    res.json({
        ts: moment().fromNow(),
        _ts: moment().format()
    });
});

module.exports = this;