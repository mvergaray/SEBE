const express = require('express');
const router = express.Router();
const controller = require('../controllers/employees');

router.get('/', controller.getObjects);
router.post('/', controller.saveObjects);

router.get('/:id', controller.getObject);
router.put('/:id', controller.updateObject);
router.delete('/:id', controller.deleteObject);

module.exports = router;
