var express = require('express');
var router = express.Router();
var session = require('express-session');
var form = require("express-form");
var field = form.field;
var rest = require('restler');
var md5 = require('MD5');
var config = require('../configManager');

router.post('/login', 
  form(
    field("username").trim().required().is(/^\w[\w_]{2,8}\d?$/i),
    field("password").trim().required().is(/^.{2,16}$/)
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
      var uid = 9180;
      
      var base_url = 'http'+(req.buckutt_server.backend.https ? 's' : '')+'://';
      base_url    += req.buckutt_server.backend.host+':';
      base_url    += req.buckutt_server.backend.port;
      base_url    += req.buckutt_server.backend.http_prefix;

      rest.postJson(base_url+'/services/login', { 'UserId': uid }).on('complete', function(re) {
        if(!re.token){ //user id not found
          r.error = {"type":"AUTH_ERROR","code":1,"message":"Wrong username or password"};
          res.send(r);
          return;
        }
        
        var utoken = re.token;
        
        //check rights using token here ?
        
        var options = {
            headers: {
                'Accept': '*/*',
                'User-Agent': 'Restling for node.js',
                'Authorization': 'Bearer ' + utoken
            }
        };
        
        rest.get(base_url+'/users?id='+uid, options).on('complete', function(re) {
          console.log(re);
          if(!re.data){ //no rights to read this info ^^
            r.error = {"type":"AUTH_ERROR","code":1,"message":"Wrong username or password"};
            res.send(r);
            return;
          }
          sess.user = {};
          sess.user.id = re.data.id;
          sess.user.firstname = re.data.firstname;
          sess.user.lastname = re.data.lastname;
          sess.user.nickname = re.data.nickname;
          sess.user.mail = re.data.mail;
          sess.user.login = req.body.username;
          sess.user.token = utoken;
          r.user = sess.user;
          
          res.send(r);
        });
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
