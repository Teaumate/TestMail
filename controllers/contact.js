const nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
 
// api key https://sendgrid.com/docs/Classroom/Send/api_keys.html 
var options = {
    auth: {
        api_key: process.env.SENDGRID_PASSWORD
    }
}

var mailer = nodemailer.createTransport(sgTransport(options));

/**
 * GET /contact
 * Contact form page.
 */
exports.getContact = (req, res) => {
  res.render('contact', {
    title: 'Contact'
  });
};

/**
 * POST /contact
 * Send a contact form via Nodemailer.
 */
exports.postContact = (req, res) => {
  req.assert('name', 'Name cannot be blank').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('message', 'Message cannot be blank').notEmpty();

  const errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/contact');
  }
  var requested = req;
  var email = {
      to: req.body.email,
      from: requested.user.email,
      subject: 'Hi there',
      text: req.body.message,
      html: req.body.message
  };
  
  mailer.sendMail(email, function(err, res) {
      if (err) { 
          console.log(err) 
      }
      console.log(res);
  });
  req.flash('succes', { msg: 'Message bien envoyé.' });
  return res.redirect('/contact');
};
