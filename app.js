var express = require('express');
var session = require('express-session');
var form = require("express-form");
var field = form.field;
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var fs = require('fs');
var rest = require('restler');
var md5 = require('MD5');

var api_routes = require('./app/routes/backend');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'ssshhhhh', 
  resave: false, 
  saveUninitialized: false
}));

app.use('/api*', api_routes);

app.post('/login', 
  form(
    field("username").trim().required().is(/^\w[\w_]{2,8}\d?$/i),
    field("password").trim().required().is(/^.{2,16}$/)
  ),
  function(req, res){
    var sess=req.session;
    var r = {};
    


    if (!req.form.isValid) {
      r.error = {"type":"AUTH_ERROR","code":1,"message":req.form.errors};
    }
    else {
      rest.get('http://127.0.0.1:8081/api/meanofloginsusers?data='+req.body.username).on('complete', function(re) {
        if(!re.data){// username not found
          r.error = {"type":"AUTH_ERROR","code":1,"message":"Wrong username or password"};
          res.send(r);
          return;
        }
        
        var uid = re.data.UserId;
        var pwd = md5(req.body.password);
        rest.get('http://127.0.0.1:8081/api/users?id='+uid+'&password='+pwd).on('complete', function(re) {
          if(!re.data){// wrong password
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
          r.user = sess.user;
          
          res.send(r);
        });
      });
    }
  }
);

app.get('/user', function(req, res){
  var sess=req.session;
  var r = {};
  
  if (sess.user)
    r.user = sess.user;
  else
    r.error = {"type":"AUTH_ERROR","code":2,"message":"No user logged in"};
  
  res.send(r);
});

app.post('/logout', function(req, res){
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

console.log('env: '+app.get('env'));
http.createServer(app).listen(80);

