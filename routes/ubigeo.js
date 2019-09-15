const express = require('express');
const router = express.Router();
const controller = require('../controllers/ubigeo');

router.get('/', controller.getUbigeo);
router.post('/', controller.saveUbigeo);

module.exports = router;
