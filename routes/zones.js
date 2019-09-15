const express = require('express');
const router = express.Router();
const controller = require('../controllers/zones');

router.post('/department', controller.saveDepartment);
router.get('/department/:id', controller.getDepartment);
router.delete('/department/:id', controller.deleteDepartment);
router.put('/department/:id', controller.updateDepartment);

router.post('/province', controller.saveProvince);
router.get('/province/:id', controller.getProvince);
router.delete('/province/:id', controller.deleteProvince);
router.put('/province/:id', controller.updateProvince);

router.post('/district', controller.saveDistrict);
router.get('/district/:id', controller.getDistrict);
router.delete('/district/:id', controller.deleteDistrict);
router.put('/district/:id', controller.updateDistrict);

module.exports = router;
