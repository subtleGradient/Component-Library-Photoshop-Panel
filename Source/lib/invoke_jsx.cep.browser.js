invoke.templateWrapper = '($$CODE$$)({})';

invoke.template = function(exports){
  try{
    exports.result = ($$JSX_FUNCTION$$).apply(null, [].concat($$ARGS$$));
  }catch(e){
    exports.error = e;
  }
  try{
    return JSON.stringify(exports);
  }catch(e){
    return '{"error":"' + e + '"}'
  }
}

invoke.defaultCallback = function(error, result){
  if (error) console.error(error);
  else console.log(result);
}

function invoke(jsx, args, callback){
  if (arguments.length < 3){
    callback = args
    args = undefined
  }
  if (!callback) callback = invoke.defaultCallback;
  if (typeof jsx == 'string') jsx = Function('return eval(' + JSON.stringify(jsx) + ')');
  if (typeof jsx != 'function') throw TypeError('expected function');
  var code = invoke.templateWrapper.replace('$$CODE$$', invoke.template.toString().replace('$$JSX_FUNCTION$$', jsx.toString()).replace('$$ARGS$$',JSON.stringify(args)));
  console.debug(jsx);
  // console.debug(code);
  __adobe_cep__.evalScript(code, function(response){
    if (typeof response != 'object'){try { response = JSON.parse(response) }catch(e){}}
    if (typeof response == 'object'){
      callback(response.error, response.result);
    } else {
      callback(response.indexOf('rror') != -1 ? response : null, response);
    }
  });
}

__filename = decodeURIComponent(location.pathname)
__dirname = __filename.split('/').reverse().slice(1).reverse().join('/')

function jsxInclude(paths){
  if (!Array.isArray(paths)) paths = [paths];
  var code = paths.map(function(path){
    path = path.replace(/^(?=\.)/, __dirname + '/')
    return '#include ' + JSON.stringify(path)
  })
  invoke(code.join('\n'))
}

jsxInclude('./jsx/vendor/node-photoshop/lib/ExtendScript/vendor/json2.js')
