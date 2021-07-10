this.$ = new Object();

const express = require('express');
const router = this.$.router = express.Router();
const path = this.$.path = ['/api/notifications'][0];

router.get('/', async (req, res, next) => {

    next();
}, async (req, res) => {

});

router.options('/', async (req, res, next) => {

    next();
}, async (req, res) => {

});

router.delete('/', async (req, res, next) => {

    next();
}, async (req, res) => {

});

router.post('/', async (req, res, next) => {

    next();
}, async (req, res) => {

});

module.exports = this;