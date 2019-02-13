var photoshop = require('photoshop')

module.exports = exports = FakePSD

function FakePSD(config){
  if (!(this instanceof FakePSD)) return FakePSD.from(config);
  this.config = config
  this.doStuff = this.doStuff.bind(this)
}

FakePSD.from = function(config){
  if (config instanceof FakePSD) return config;
  return new FakePSD(config);
}

FakePSD.fromPath = function(path){
  return new FakePSD({path:path});
}

FakePSD.getRecent = function(callback){
  photoshop.invoke(recentFilesThatExist_jsx, function(error, files){
    if (error) return callback(error);
    callback(null, files.map(FakePSD.fromPath))
  })
}

FakePSD.getOpenFiles = function(callback){
  photoshop.invoke(openFilePaths_jsx, function(error, files){
    if (error) return callback(error);
    callback(null, files.map(FakePSD.fromPath))
  })
}

////////////////////////////////////////////////////////////////////////////////

FakePSD.prototype = {
  
  constructor:FakePSD,
  
  doStuff: function(){}
  
}

////////////////////////////////////////////////////////////////////////////////

function runArgs_jsx(){
  return Array.prototype.slice.call(arguments).map(function(fn){return eval(fn)()})
}
function recentFilesThatExist_jsx(){
  return app.recentFiles.map(File).filter(function(file){return file.exists})
}
function openFilePaths_jsx(){
  return [].map.call(app.documents, function(document){return document.fullName})
}

////////////////////////////////////////////////////////////////////////////////

if (!module.parent) require('tap').test('FakePSD.getRecent', function tap(t){
  
  t.test('works', function tap(t){
    FakePSD.getRecent(function(error, psds){
      t.notOk(error)
      t.ok(psds)
      psds.forEach(function(psd){
        t.ok(psd instanceof FakePSD)
      })
      t.end()
    })
  })
  
})
