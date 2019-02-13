#target photoshop
#include "./install-generator-plugin.jsxinc"
#include "../../jsx/vendor/node-photoshop/lib/ExtendScript/index.jsxinc"

__filename = File(decodeURIComponent($.fileName))
__dirname = __filename.parent

installGeneratorPlugin(__dirname.parent.name, __dirname.parent)
