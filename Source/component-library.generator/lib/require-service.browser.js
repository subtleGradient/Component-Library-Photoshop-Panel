var shoe = require('shoe')
var dnode = require('dnode')

module.exports = exports = function(path, callback){
  var stream = shoe(path)
  var d = dnode()
  d.on('remote', function(remote){ callback(null, remote) })
  d.on('error', callback)
  d.pipe(stream).pipe(d)
}
