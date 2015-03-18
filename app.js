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
var config = require('./app/configManager');

var api_routes = require('./app/routes/backend');
var login_routes = require('./app/routes/login');

var backend = config.get('backend');
backend.base_url  = 'http'+(backend.https ? 's' : '')+'://';
backend.base_url += backend.host+':';
backend.base_url += backend.port;

var create_server = function(serv_name) {
  var serv = config.get(serv_name);
  
  if (!serv)
    return;
  
  var app = express();

  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
   
  if (serv.serving_static)
    app.use(express.static(path.join(__dirname, config.get('static_dir_path'))));
  
  app.use(session({
    secret: config.get('cookie_secret'), 
    resave: false, 
    saveUninitialized: false
  }));
  
  //middleware adding server info on each request
  app.use(function(req, res, next) {
    req.buckutt_server = serv;
    req.buckutt_server.name = serv_name;
    req.buckutt_server.backend = backend;
    next();
  });
  
  login_routes.backend = backend;
  app.use(backend.http_prefix+'*', api_routes);
  app.use('/', login_routes);
  
  http.createServer(app).listen(serv.port);
};

//start public_server
create_server('public_server');

//start root_server
create_server('root_server');