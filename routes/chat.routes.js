const express = require('express');
const chatManager = require('../src/dao/db/managers/chatManager');
const router = express.Router();

router.get('/', (req, res) => {
   
    res.render('chat');
});

module.exports = router;
