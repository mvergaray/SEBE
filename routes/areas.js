const express = require('express');
const router = express.Router();
const areaCtrl = require('../controllers/areas');

router.get('/', areaCtrl.getObjects);
router.post('/', areaCtrl.saveObjects);

router.get('/:id', areaCtrl.getObject);
router.put('/:id', areaCtrl.updateObject);
router.delete('/:id', areaCtrl.deleteObject);

module.exports = router;
