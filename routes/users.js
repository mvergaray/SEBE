/**
 * GET    /Users/  GET USERS LIST ARRAY ** Resource.query() in angular
 * POST   /Users/  SAVE A NEW USER OBJECT IN {REQ.BODY} ** instance.$save() in angular
 *
 * GET    /Users/:ID GET USER ID OBJECT {req.params.id} /Users/3 ** Resource.get({user_id: 3}) in angular
 * PUT    /Users/:ID GET USER ID OBJECT TO MODIFY IT {req.params.id} - req.body.data...
          /Users/3 ** instance.$update({id: 3}) in angular
 * DELETE /Users/:ID GET USER ID OBJECT  TO REMOVE IT {req.params.id} /Users/3 ** Resource.delete({id: 3}) in angular
 *
 */

const express = require('express');
const router = express.Router();

const authCtrl = require('../controllers/auth');
const userCtrl = require('../controllers/users');

/* GET user profile. */
router.get('/profile', authCtrl.getUser);

router.get('/', userCtrl.getUsers);
router.post('/', userCtrl.saveUsers);

// Used In profile feature , password type
router.put('/profile/password', userCtrl.updatePasswords);
router.put('/:id/password', userCtrl.updatePasswordById);

router.get('/:id', userCtrl.getUserById);
router.put('/:id', userCtrl.updateUserById);
router.delete('/:id', userCtrl.deleteUserById);

router.get('/list/short', userCtrl.getUsersShort);

module.exports = router;
