var express = require('express');
var router = express.Router();
var http = require('http');
var rest = require('restler');

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
  
  var options = {
      headers: {
          'Accept': '*/*',
          'User-Agent': 'Restling for node.js',
          'Authorization': 'Bearer ' + sess.user.token
      }
  };
  rest.get('http://127.0.0.1:8081'+req.originalUrl, options).on('complete', function(result) {
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
