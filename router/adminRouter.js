const express = require('express');
const controller = require('../controller/adminController');
const router = express.Router();

router.route('/login')
.get(controller.getLogin)
.post(controller.postLogin)

router.route('/index')
.get(controller.getIndex)

router.route('/userList')
.get(controller.getUserList);

router.get('/userList/:id',controller.blockUser);








module.exports = router;
