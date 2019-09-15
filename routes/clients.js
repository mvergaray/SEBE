const express = require('express');
const router = express.Router();
const clientCtrl = require('../controllers/clients');

router.get('/', clientCtrl.getObjects);
router.post('/', clientCtrl.saveObjects);

router.get('/:id', clientCtrl.getObject);
router.put('/:id', clientCtrl.updateObject);
router.delete('/:id', clientCtrl.deleteObject);

module.exports = router;
