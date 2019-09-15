
const passport    = require('passport');
const passportJWT = require("passport-jwt");
const LocalStrategy = require('passport-local').Strategy;
const config = require('./config.js');

const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy   = passportJWT.Strategy;

const RSA_PUBLIC_KEY = (config.PUBLIC_KEY_PATH);

var authCtrl = require('../controllers/auth');

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (user, done) {
  done(null, user.id);
});

passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    },
    authCtrl.authUser
));

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: RSA_PUBLIC_KEY,
    passReqToCallback: true
  },
  function (req, jwtPayload, cb) {
      req.user = jwtPayload;
      cb(null, jwtPayload);
    }
));