const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const config = require('../core/config.js');

const router  = express.Router();
const RSA_PRIVATE_KEY = (config.PRIVATE_KEY_PATH);

/* POST login. */
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {session: false},(err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: info ? info.message : 'Login failed',
        user: user
      });
    }

    req.login(user, {session: false}, (err) => {
      var userPayload = {};

      if (err) {
          res.send(err);
      }

      userPayload.id = user.id;
      userPayload.status = user.status;
      userPayload.role_id = user.role_id;
      userPayload.username = user.username;

      const token = jwt.sign(userPayload, RSA_PRIVATE_KEY);

      return res.json({user, token});
    });
  })
  (req, res, next);

});

module.exports = router;