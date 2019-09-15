const express = require('express');
const router = express.Router();
const documentTypesCtrl = require('../controllers/documentTypes');

router.get('/', documentTypesCtrl.getObjects);
router.post('/', documentTypesCtrl.saveObjects);

router.get('/:id', documentTypesCtrl.getObject);
router.put('/:id', documentTypesCtrl.updateObject);
router.delete('/:id', documentTypesCtrl.deleteObject);

module.exports = router;
