var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var fs = require('fs');
var clientCertificateAuth = require('client-certificate-auth');

var api_routes = require('./app/routes/api');

var app = express();

var opts = {
  key: fs.readFileSync('cert/server.key'),
  cert: fs.readFileSync('cert/server.crt'),
  ca: fs.readFileSync('cert/ca.crt'),
  requestCert: true,
  rejectUnauthorized: false
};

var checkAuth = function(cert) {
  return cert.subject.CN === 'Paul Chabanon';
};

// view engine setup
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
app.use('/api*', api_routes);

/*
app.get('/', function(req, res) {
  res.send('Hello world');
});
//*/
//*
app.get('/secure', clientCertificateAuth(checkAuth), function(req, res) {
  res.send('Hello authorized user');
});
//*/
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
else {
  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
          message: err.message,
          error: {}
      });
  });
}

console.log('env: '+app.get('env'));
http.createServer(app).listen(80);
https.createServer(opts,app).listen(3000);

