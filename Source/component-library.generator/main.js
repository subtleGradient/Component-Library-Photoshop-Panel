var dnode = require('dnode')
var shoe = require('shoe')
var http = require('http')
var StaticMiddleware = require('./lib/static-middleware')
var fs = require('fs')
var path = require('path')
var url = require('url')

exports.init = function(generator, config){
  process.nextTick(function(){
    exports.initReal(generator, config)
  })
}
exports.initReal = function(generator, config){
  
  generator.ao_invoke_jsx = require('generator-invoke-jsx')(generator);
  
  var model;
  
  var LayerOwner_prototype = {
    
  }
  
  var PSD_prototype = {
    __proto__: LayerOwner_prototype,
    imageChanged: function(imageChanged){
      var document = this;
      
      var changes = document.changes || (document.changes = []);
      
      if ('active' in imageChanged) document.active = imageChanged.active; delete imageChanged.active;
      if ('closed' in imageChanged) document.closed = imageChanged.closed; delete imageChanged.closed;
      if ('timeStamp' in imageChanged) document.timeStamp = imageChanged.timeStamp; delete imageChanged.timeStamp;
      
      if ('file' in imageChanged) document.file = imageChanged.file; delete imageChanged.file;
      if ('selection' in imageChanged) document.selection = imageChanged.selection; delete imageChanged.selection;
      
      // if ('layers' in imageChanged) document.layers = (imageChanged, document.layersById || (document.layersById = {}));
      // delete imageChanged.layers;
      
      delete imageChanged.metaDataOnly;
      delete imageChanged.version;
      if (Object.keys(imageChanged).length > 1) changes.push(imageChanged);
    }
  }
  
  var Layer_prototype = {
    
    __proto__: LayerOwner_prototype,
    
    getDeepBounds: function(){
      return generator.getDeepBounds(this)
    },
    
    getPixmap: function(callback){
      var layer = this;
      if (!layer.pixmapSettings) layer.pixmapSettings = {};
      generator.getPixmap(layer.documentId, layer.id, layer.pixmapSettings)
      .then(function(pixmap){callback(null,pixmap)}, callback)
      .done()
    },
    
    save: function(callback){
      var layer = this
      if (!layer.saveSettings) layer.saveSettings = {format:'png'};
      if (!layer.file) layer.file = process.env.HOME + '/Desktop/' + layer.id + '.png';
      layer.getPixmap(function(error, pixmap){
        if (error) return callback(error);
        generator.savePixmap(pixmap, layer.file, layer.saveSettings)
        .then(function(result){
          layer.saveTimeStamp = Date.now();
          callback(null, result);
        }, callback)
        .done()
      })
    },
    
  }
  
  ////////////////////////////////////////////////////////////////////////////////
  
  console.log(__filename);
  process.nextTick(function(){
    var rootPath = __dirname + '/static'
    
    var streamBackStaticFile = StaticMiddleware(rootPath)
    var assetServers = {};
    
    var server = http.createServer(streamBackStaticFile)
/*
    server.on('request', function(request, response){
      var requestUrl = url.parse(request.url, true);
      if (!(requestUrl.pathname.indexOf('/aops/') === 0 && requestUrl.query && requestUrl.query.file)) return streamBackStaticFile(request, response);
      
      var documentId = requestUrl.query.documentId
      if (!assetServers[documentId]) return streamBackStaticFile(request, response);
      
      request.url = request.url.replace('/aops','');
      console.log(request)
      assetServers[documentId](request, response);
      
      // var callback = requestUrl.query.callback
      
      // if (callback) {
      //   response.write(callback.replace(/[a-z0-9$_.]/ig,'{{INVALID}}'));
      //   response.write('(');
      // }
      // 
      // model.updateDocumentInfo()
      // 
      // var document = model.documents[request.query.documentId];
      // if (callback) response.write(')');
      // response.end();
    })
*/
    
    server.on('listening', function(){
      var uri = 'http://' + this.address().address + ':' + this.address().port + '?_=' + Date.now().toString(36);
      var uriFile = process.env.HOME + '/.component-library-rpc.uri';
      fs.writeFile(uriFile, uri, function(error){
        if (error) console.error(error);
        console.log(uri, uriFile);
      });
      fs.writeFile(process.env.HOME + '/Public/Photoshop Component Library Panel.html', '<!doctype html><meta charset=utf-8><title>Component Library</title><script>location=' + JSON.stringify(uri) + '<\/script>', function(error){
        if (error) console.error(error);
      });
    })
    
    model = {
      currentDocumentId:null,
      currentDocument:null,
      documents:{
        // __proto__:
      },
    }
    model.lastModifiedTimeStamp = Date.now();
    
    global.model = model
    
    model.injectScreenshot = function(uri, settings, callback){
      if (!settings && typeof settings == 'object') settings = {};
      
      if (!settings.type) settings.type = '.pdf';
      if (settings.type.charAt(0) != '.') settings.type = '.' + settings.type;
      var layerName = settings.layerName || 'My Awesome New Layer!';
      var fileName = encodeURIComponent(uri).substring(100,0);
      fileName += Date.now().toString(36);
      
      if (settings.zoomFactor) settings.zoomFactor = +settings.zoomFactor;
      if (settings.viewportSize){
        if (settings.viewportSize.width) settings.viewportSize.width = +settings.viewportSize.width * settings.zoomFactor;
        if (settings.viewportSize.height) settings.viewportSize.height = +settings.viewportSize.height * settings.zoomFactor;
      }
      
      function jsx_placeSmartObject(sourcePath, sourceURI, layerName){
        if (app.documents.length === 0) PSFakeDOM.makeDocument();
        return FakeDocument.$0().doWriteTransaction(function(doc){
          PSFakeDOM.makeLayer()
          PSFakeDOM.newPlacedLayer()
          var layerRef = PSFakeDOM.layerRefForActiveLayer()
          PSFakeDOM.setLayer_source(layerRef, sourcePath)
          PSFakeDOM.setLayer_sourceMeta(layerRef, sourceURI)
          app.activeDocument.activeLayer.name = layerName
          return layerRef
        }, layerName || 'Insert Layer')
      }
      URI_TO_IMAGE(uri, settings, process.env.TMPDIR + '/' + fileName + settings.type, function(error, filename, uri){
        generator.ao_invoke_jsx(jsx_placeSmartObject, [filename, uri, layerName], callback)
      })
    }
    
    function phantomPage(callback){
      if (phantomPage.page) return callback(null, phantomPage.page);
      var phantom = require('node-phantom').create(function(error, phantom){
        if (error) return callback(error);
        phantom.on('exit', function(){delete phantomPage.page});
        phantom.createPage(function(error, page){
          if (error) return callback(error);
          phantomPage.page = page;
          callback(null, page)
        })
      }, {phantomPath:require('phantomjs').path})
      process.on('exit', function(){
        phantom.exit()
      })
    }
    
    function URI_TO_IMAGE(URI, SETTINGS, FILENAME, Callback){
      if (arguments.length === 3){
        Callback = FILENAME
        FILENAME = SETTINGS
        SETTINGS = null
      }
      var CALLBACK = function(error, result){
        console.log('URI_TO_IMAGE', error, result);
        Callback(error, result);
      }
      phantomPage(function(error, page){
        page.open(URI, function(error, status){
          if (error) return CALLBACK(error);
          if (SETTINGS && SETTINGS.viewportSize) page.set('viewportSize', SETTINGS.viewportSize);
          if (SETTINGS && SETTINGS.zoomFactor) page.set('zoomFactor', SETTINGS.zoomFactor);
          page.render(FILENAME, function(error){
            if (error) return CALLBACK(error);
            CALLBACK(null, FILENAME, URI);
          })
        })
      })
    }
    
    global.URI_TO_IMAGE = URI_TO_IMAGE
    
    generator.ao_invoke_jsx('1+1', function(error, result){
      console.assert(error == null)
      console.assert(result === 2)
    })
    
/*
    model.executeFramerPS = function(callback){
      model.executeFramerPS_progress = {started:Date.now()}
      generator.evaluateJSXFile(__dirname + '/static/vendor/Framer/FramerPS.jsx')
      .then(
        function(result){
          model.executeFramerPS_progress = {ended:Date.now(), result:result}
          callback(null, result)
        },
        function(error){
          model.executeFramerPS_progress = {ended:Date.now(), error:error}
        }
      )
      .done()
    }
*/
    
    model.exportCurrentDocumentJSON = function(callback){
      model.updateDocumentInfo(function(){
        if (!(model.currentDocument && model.currentDocument.file && fs.existsSync(model.currentDocument.file))) return callback(Error('currentDocument.file "' + model.currentDocument.file + '" is invalid'));
        var jsonFile = model.currentDocument.file + '.json'
        model.currentDocument.jsonFile = jsonFile;
        model.currentDocument.jsonFile_lastModifiedTimeStamp = model.lastModifiedTimeStamp = Date.now();
        fs.writeFile(jsonFile, JSON.stringify(model.currentDocument, null, 2), function(error){
          callback(error, jsonFile)
        })
      })
    }
    
/*
    model.exportToFramer = function(callback){
      if (!(model.currentDocument && model.currentDocument.file && fs.existsSync(model.currentDocument.file))) return callback(Error('currentDocument.file is invalid'));
      var framerRoot = model.currentDocument.file.replace(path.extname(model.currentDocument.file), ' Framer');
      if (!fs.existsSync(framerRoot)) fs.mkdir(framerRoot, withDir);
      else withDir(null);
      function withDir(){
        var Convert = require('uiir-to-psd')
        var layersFile = path.join(framerRoot, 'layers.framer.js')
        var layersWriteStream = fs.createWriteStream(layersFile)
        
        Convert(model.currentDocument, {
          push: function(code){
            if (code == null) layersWriteStream.
            layersWriteStream.write(code)
          }
        })
      }
    }
*/
    
    model.setDocumentInfo = function(documentInfo){
      model.setDocumentInfo_lastRan = Date.now();
      var document = model.documents[documentInfo.id] || {};
      document.__proto__ = PSD_prototype;
      
      Object.keys(documentInfo).forEach(function(key){
        document[key] = documentInfo[key];
      });
      
      model.documents[documentInfo.id] = document;
      model.lastModifiedTimeStamp = Date.now();
      
      if (model.currentDocumentId == null) model.currentDocumentId = documentInfo.id;
      if (model.currentDocumentId == documentInfo.id) model.currentDocument = document;
      
      document.version = (document.version||'') + '-ao-1.0.0';
    }
    
    function updateLayer(config, state){
      if (state == null) state = {};
      for (var key in config) {
        if (!config.hasOwnProperty(key)) continue;
        if (key == 'atRootOfChange') continue;
        if (key == 'layers') continue;
        if (key == 'added') continue;
        if (key == 'id') continue;
        if (key == 'parentId' && config.atRootOfChange) continue;
        state[key] = config[key]
      }
      state.__proto__ = Layer_prototype;
      if (!state.hasOwnProperty('save')) state.save = state.save.bind(state); // exports to remote
      return state;
    }
    
    model.updateDocumentInfo = function(documentId, callback){
      if (typeof documentId == 'function'){
        callback = documentId
        documentId = undefined
      }
      if (documentId == null) documentId = model.currentDocumentId;
      generator.getDocumentInfo(documentId, {
        compInfo:           false,
        imageInfo:          false,
        layerInfo:          false,
        expandSmartObjects: false,
        getTextStyles:      false,
        selectedLayers:     false,
        getCompSettings:    false
      })
      .then(model.setDocumentInfo)
      .then(function(){
        generator.getDocumentSettingsForPlugin(documentId, 'framer').then(function(settings){
          var document = model.documents[documentId||model.currentDocumentId];
          if (!(document && document.generatorSettings)) return;
          document.generatorSettings.framer = settings;
        });
      })
      
      var promise = generator.getDocumentInfo(documentId, {
        compInfo:           true,
        imageInfo:          true,
        layerInfo:          true,
        expandSmartObjects: false,
        getTextStyles:      true,
        selectedLayers:     false,
        getCompSettings:    true
      })
      promise.then(model.setDocumentInfo)
      if (typeof callback == 'function') promise.then(function(){callback(null)},callback);
    }
    
    generator.onPhotoshopEvent("currentDocumentChanged", function(currentDocumentId){
      if (!model.documents) model.documents = {};
      if (!model.documents[currentDocumentId]) model.documents[currentDocumentId] = {};
      model.documents[currentDocumentId].active = true;
      
      if (model.documents[model.currentDocumentId]) model.documents[model.currentDocumentId].active = false;
      model.currentDocumentId = currentDocumentId;
      model.lastModifiedTimeStamp = Date.now();
      
      model.updateDocumentInfo(model.currentDocumentId);
    });
    
    generator.onPhotoshopEvent("toolChanged", function(currentTool){
      model.currentTool = currentTool
      model.lastModifiedTimeStamp = Date.now();
    });
    
    generator.onPhotoshopEvent("imageChanged", function(imageChanged){
      model.imageChanged = imageChanged;
      if (!model.documents) model.documents = {};
      if (!model.documents[imageChanged.id]) model.documents[imageChanged.id] = {__proto__:PSD_prototype, id:imageChanged.id};
      var document = model.documents[imageChanged.id];
      document.__proto__ = PSD_prototype;
      if (document.imageChanged) document.imageChanged(imageChanged);
      else console.warn('document.imageChanged is missing, ignoring an imageChanged event');
      model.lastModifiedTimeStamp = Date.now();
    });
    
/*
    var api = require('observable-service').create(model)
    
    api.observe('currentDocument.file', function(file){
      if (typeof file != 'string') return;
      fs.exists(file, function(exists){
        if (model.currentDocument.file != file) return;
        api.set('currentDocument.uri', exists ? 'file://' + file : null, function(){})
        var assetsFolder = model.currentDocument.file.replace(path.extname(model.currentDocument.file), ' Assets')
        api.set('currentDocument.assetsFolder', exists ? assetsFolder : null);
      })
      // api.set('currentDocument.uri', 'file://' + file, function(){})
      // api.set('currentDocument.jsonURI', staticURIFor(model.currentDocument), function(){})
    })
    api.observe('currentDocument.assetsFolder', function(assetsFolder){
      if (model.currentDocument) delete model.currentDocument.assetsFolderURI;
      if (typeof assetsFolder != 'string') return;
      // if (!fs.existsSync(assetsFolder)) return;
      assetServers[model.currentDocument.id] = StaticMiddleware(assetsFolder)
      model.currentDocument.assetsFolderURI = 'http://' + server.address().address + ':' + server.address().port + '/aops?documentId=' + model.currentDocument.id
    })
    
    var interval = setInterval(function(){
      api && api.deliver && api.deliver();
    }, 100);
*/
    
    server.on('close', function(){
      api.close()
      api = null
      clearInterval(interval)
    })
    
    var sock = shoe(function(stream){
      var api = require('observable-service').create(model)
      
      model.updateDocumentInfo()
      
      var rpc = dnode(api)
      rpc.pipe(stream).pipe(rpc)
        
      var interval = setInterval(function(){
        api && api.deliver && api.deliver();
      }, 100);
        
      stream.on('end', function(){
        api.close()
        api = null
        clearInterval(interval)
      })
    })
    sock.install(server, '/component-library.generator')
    
    server.listen(0)
  })
}
