const bluebird = require('bluebird');
const crypto = bluebird.promisifyAll(require('crypto'));
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const Mail = require('../models/Mail');
var randomstring = require("randomstring");
// const nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
 
var options = {
    auth: {
        api_key: process.env.SENDGRID_PASSWORD
    }
}
var mailer = nodemailer.createTransport(sgTransport(options));

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/login', {
    title: 'Login'
  });
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user || !user.verified) {
      req.flash('errors', info);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      req.flash('success', { msg: 'Success! You are logged in.' });
      res.redirect('/contact');
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/signup', {
    title: 'Create Account'
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }

  const user = new User({
    email: req.body.email,
    password: req.body.password,
    verif_token: randomstring.generate(7)
  });

  User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (err) { return next(err); }
    if (existingUser && existingUser.verified) {
      req.flash('errors', { msg: 'Account with that email address already exists.' });
      return res.redirect('/signup');
    }
    user.save((err) => {
      if (err) { return next(err); }
      var email = {
          to: user.email,
          from: 'admin@laposte.net',
          subject: 'Mail Validation',
          text: 'Veuillez accéder à cette adresse pour valider votre inscription: https://mailvalidation.herokuapp.com/verify/'+ user.verif_token,
          html: '<a href="https://mailvalidation.herokuapp.com/verify/' + user.verif_token + '">vers verification</a>'
      };
      
      mailer.sendMail(email, function(err, res) {
          if (err) { 
              console.log(err) 
          }
          console.log(res);
      });
      req.flash('success', { msg: 'A validation email has been sent.' });
      res.redirect('/signup');
    });
  });
};

/**
 * GET /verify
 * Profile page.
 */
exports.getVerify = (req, res) => {
  var token = req.params.token;

  User.findOne({'verif_token': token}, function (err, user) {
      if (user) {
          console.log('that token is correct! Verify the user');

          User.findOneAndUpdate({'verif_token': token}, {'verified': true, 'verif_token':''}, function (err, resp) {
              console.log('The user has been verified!');
          });
          req.logIn(user, (err) => {
            if (err) {
              return next(err);
            }
            res.redirect('/contact')})
      } else {
          console.log('The token is wrong!');
          res.redirect('/');
      }
  });
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
  Mail.find({'email.from':req.user.email}, function (err, mail) {
    console.log(mail);
    console.log(req.user.email);
  res.render('account/profile', {
    title: 'Historique', mails: mail
  });
  });
};
