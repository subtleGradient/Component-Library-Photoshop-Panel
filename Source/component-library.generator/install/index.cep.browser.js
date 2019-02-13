function setGeneratorEnabled_jsx(generatorEnabled){
  return setGeneratorEnabled(generatorEnabled)
}
function installGeneratorPlugin_jsx(name, mainPath){
  return installGeneratorPlugin(name, mainPath)
}
function restartGenerator(callback){
  invoke(setGeneratorEnabled_jsx, [false], function(error){
    if (error) return callback(error);
    setTimeout(function(){
      invoke(setGeneratorEnabled_jsx, [true], function(error){
        if (error) return callback(error);
        callback(null);
      })
    }, 2000);
  })
}
function installGeneratorPlugin(name, mainPath, callback){
  invoke(installGeneratorPlugin_jsx, [name, mainPath], function(error, needsRestart){
    if (error) callback(error);
    else if (needsRestart) restartGenerator(callback);
    else callback(null);
  })
}
