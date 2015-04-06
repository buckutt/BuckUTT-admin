var express = require('express');
var router = express.Router();
var http = require('http');
var httpProxy = require('http-proxy');
var config = require('../configManager');
var proxy = httpProxy.createProxyServer();

router.all('/', function(req, res) {
  console.log('API '+req.originalUrl)
  var sess=req.session;
  var r = {};
  
  if (!sess.user){
    r.error = {"type":"AUTH_ERROR","code":2,"message":"No user logged in"};
    res.send(r);
    return;
  }
  
  console.log('VERIFY '+req.buckutt_server.name);
  console.log(req.buckutt_server.api_access_profiles);
  //verify rights here...
  
  req.headers['Accept'] = '*/*';
  req.headers['Authorization'] = 'Bearer ' + sess.user.token;
  
  var base_url = req.buckutt_server.backend.base_url;
  delete req.buckutt_server;
  req.url = req.originalUrl;
  
  try {
    proxy.web(req, res, {
      target: base_url
    }, function(e) {
			console.log("Connection to API failed");
		});
  } catch(err) {
    console.log('----- PROXY ERROR -----');
    console.log(err);
  }
});

module.exports = router;
