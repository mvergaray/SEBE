const express = require('express');
const router = express.Router();
const documentCtrl = require('../controllers/documents');

router.post('/', documentCtrl.saveDocuments);

router.put('/list', documentCtrl.getDocuments);
router.put('/list-short', documentCtrl.getDocumentsShort);

router.get('/:id', documentCtrl.getDocument);
router.put('/:id', documentCtrl.updateDocument);
router.delete('/:id', documentCtrl.deleteDocument);

router.get('/:id/binnacle', documentCtrl.getBinnacle);

router.post('/assign', documentCtrl.assignDocument);
router.post('/discharge', documentCtrl.dischargeDocument);
router.post('/close', documentCtrl.closeDocument);

/* Legacy Records Svc */

router.get('/records/list', documentCtrl.getRecords);

module.exports = router;
