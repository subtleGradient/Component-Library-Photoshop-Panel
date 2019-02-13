var http = require('http')
var url = require('url')
var path = require('path')
var ecstatic = require('ecstatic')

module.exports = exports = function createServer(generator){
  var server = http.createServer(function(request, response){
    var requestURL = url.parse(request.url, true);
    // 
  })
}
