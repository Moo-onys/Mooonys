this.$ = new Object();

const express = require('express');
const router = this.$.router = express.Router();
const path = this.$.path = ['/api/utils/ajax'][0];

router.get('/', async (req, res, next) => {
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

module.exports = this;