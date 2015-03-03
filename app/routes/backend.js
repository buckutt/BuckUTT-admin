var express = require('express');
var router = express.Router();
var http = require('http');

router.get('/', function(req, res) {
  console.log('API '+req.originalUrl)
  var sess=req.session;
  var r = {};

  if (!sess.user){
    r.error = {"type":"AUTH_ERROR","code":2,"message":"No user logged in"};
    res.send(r);
    return;
  }
  
  //verify rights here...
  

  http.get('http://127.0.0.1:8081'+req.originalUrl, function(api_res) {
    console.log('http://127.0.0.1:8081'+req.originalUrl);
    console.log("Got response: " + api_res.statusCode);
    var body = '';
    api_res.on('data', function(chunk) {
      body += chunk;
    });
    api_res.on('end', function() {
      res.send(body);
    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    var r = {};
    r.error = {"type":"API_ERROR","code":1,"message":"Could not connect to api"};
    res.send(r);
  });
});

module.exports = router;
