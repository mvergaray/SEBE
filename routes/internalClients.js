const express = require('express');
const router = express.Router();
const internalClientCtrl = require('../controllers/internalClients');

router.get('/', internalClientCtrl.getClients);
router.post('/', internalClientCtrl.saveClients);

router.get('/:id', internalClientCtrl.getClient);
router.put('/:id', internalClientCtrl.updateClient);
router.delete('/:id', internalClientCtrl.deleteClient);

module.exports = router;
