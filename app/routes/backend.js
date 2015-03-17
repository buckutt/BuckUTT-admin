var express = require('express');
var router = express.Router();
var http = require('http');
var rest = require('restler');
var config = require('../configManager');

router.get('/', function(req, res) {
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
  
  var options = {
      headers: {
          'Accept': '*/*',
          'User-Agent': 'Restling for node.js',
          'Authorization': 'Bearer ' + sess.user.token
      }
  };
  var url = 'http'+(req.buckutt_server.backend.https ? 's' : '')+'://';
  url    += req.buckutt_server.backend.host+':';
  url    += req.buckutt_server.backend.port;
  url    += req.buckutt_server.backend.http_prefix;
  url    += req.originalUrl;
  
  rest.get(url, options).on('complete', function(result) {
    if (result instanceof Error) {
      console.log("Got error: " + result.message);
      var r = {};
      r.error = {"type":"API_ERROR","code":1,"message":"Could not connect to api"};
      res.send(r);
    } else {
      res.send(result);
    }
  });
});

module.exports = router;
