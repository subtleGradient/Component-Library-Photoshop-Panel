var shoe = require('shoe')
var dnode = require('dnode')

module.exports = exports = function(server, path, api){
  var sock = shoe(function(stream){
      var rpc = dnode(api)
      rpc.pipe(stream).pipe(rpc)
  })
  sock.install(server, path)
}
