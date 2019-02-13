var spawn = require('child_process').spawn;
var URL = require('url');

module.exports = exports = function(url){
  
  if (typeof url == 'string') url = URL.parse(url);
  
  url.pathname = url.pathname.split('/').map(encodeURIComponent).join('/');
  if (!url.protocol) url.protocol = 'http:';
  
  var webview = spawn(__dirname + '/../../../MacOS/appify-ui-webview', ['-url', URL.format(url)]);
  webview.url = url;
  
  return webview;
}

if (!module.parent) exports('http://m.facebook.com/');
