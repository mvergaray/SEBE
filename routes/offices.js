const express = require('express');
const router = express.Router();
const officesCtrl = require('../controllers/offices');

router.get('/', officesCtrl.getObjects);
router.post('/', officesCtrl.saveObjects);

router.get('/:id', officesCtrl.getObject);
router.put('/:id', officesCtrl.updateObject);
router.delete('/:id', officesCtrl.deleteObject);

module.exports = router;
