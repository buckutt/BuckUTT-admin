var express = require('express');
var router = express.Router();
var session = require('express-session');
var form = require("express-form");
var field = form.field;
var rest = require('restler');
var config = require('../configManager');

router.post('/login', 
  form(
    field("username").trim().required().is(/^\w[\w_]{2,8}\d?$/i),
    field("password").trim().required().is(/^.{2,24}$/)
  ),
  function(req, res){
    var sess=req.session;
    var r = {};
    
    if (!req.form.isValid) {
      r.error = {"type":"AUTH_ERROR","code":1,"message":req.form.errors};
      res.send(r);
      return;
    }
    else {
      var credentials = {
        'MeanOfLoginId': config.get('MeanOfLoginId'),
        'data': req.body.username,
        'password': req.body.password
      };
      
      rest.postJson(router.backend.base_url+router.backend.http_prefix+'/services/login', credentials).on('complete', function(re) {
        console.log(re);
        if(!re.token){ //user id not found
          r.error = {"type":"AUTH_ERROR","code":1,"message":"Wrong username or password"};
          res.send(r);
          return;
        }

        sess.user = re.user;
        sess.user.login = req.body.username;
        sess.user.token = re.token;
        r.user = sess.user;
        
        res.send(r);
      });
    }
  }
);

router.get('/user', function(req, res){
  var sess=req.session;
  var r = {};
  
  if (sess.user)
    r.user = sess.user;
  else
    r.error = {"type":"AUTH_ERROR","code":2,"message":"No user logged in"};
  
  res.send(r);
});

router.post('/logout', function(req, res){
  var sess=req.session;
  var r = {};
  
  req.session.destroy(function(err){
    if(err){
      console.log(err);
      r.error = {"type":"AUTH_ERROR","code":666,"message":"Could not destroy session"};
    }
    res.send(r);
  });
});

module.exports = router;
