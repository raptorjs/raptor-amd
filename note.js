define('hello-world') --> 
    raptorAMD.resolveDefine('hello-world') --> 'raptor/raptor-amd/hello-world' -->
    define('raptor/raptor-amd/hello-world');

require('hello-world') --> 
    raptorAMD.findModule('hello-world', module) --> 'raptor/raptor-amd/hello-world'

    require('raptor/raptor-amd/hello-world.amd');

var path = require('path');

raptorAMD._resolveDefine = function(id, define) {
    var module = define._module;
    var moduleRoot = findRootDir(module);
    return moduleRoot + '|' + id;
};

raptorAMD._findModule = function(id, define) {
    var module = define._module;

    for (var i = 0, PL = paths.length; i < PL; i++) {
        var basePath = path.resolve(paths[i], request);
        var filename;

        if (!trailingSlash) {
          // try to join the request to the path
          filename = tryFile(basePath);

          if (!filename && !trailingSlash) {
            // try it with each of the extensions
            filename = tryExtensions(basePath, exts);
          }
        }

        if (!filename) {
          filename = tryPackage(basePath, exts);
        }

        if (!filename) {
          // try it with each of the extensions at "index"
          filename = tryExtensions(path.resolve(basePath, 'index'), exts);
        }

        if (filename) {
          Module._pathCache[cacheKey] = filename;
          return filename;
        }
      }

    var curDir = path.dirname(options.source.filename)

    var moduleRoot = findRootDir(module);
    return moduleRoot + '|' + id;
};