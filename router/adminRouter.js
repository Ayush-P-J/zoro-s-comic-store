const express = require('express');
const controller = require('../controller/adminController');
const router = express.Router();

router.route('/login')
.get(controller.getLogin)
.post(controller.postLogin)

router.route('/index')
.get(controller.getIndex)




module.exports = router;
