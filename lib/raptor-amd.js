(function(global) {

var cache = {};
var separator = "/";
var defs = {}; //Registered module definitions are added to this object

function Module(id, require, exports) {
    this.id = exports;
    this.require = require;
    this.exports = exports;
}

function resolve(id, baseName) {
    if (id.charAt(0) == separator) {
        id = id.substring(1);
    }

    if (!baseName) {
        return id;
    }

    if (id.charAt(0) == '.') {
        if (!baseName) {
            return id;
        }

        var baseNameParts = baseName.split(separator).slice(0, -1);

        id.split(separator).forEach(function(part) {
            if (part == '..') {
                baseNameParts.splice(baseNameParts.length-1, 1); //Remove the last element
            }
            else if (part != '.') {
                baseNameParts.push(part);
            }
        });

        return baseNameParts.join(separator);
    }

    return id;
}

function build(id, deps, factory) {
    var exports = {};
    if (typeof factory === 'function') {
        var require = createRequire(id);
        var module = new Module(id, require, exports);

        var local = { //Map local functions and objects to names so that the names can be explicitly used. For example: define(['require', 'exports', 'module'], function(require, exports, module) {})
            require: require,
            exports: exports,
            module: module
        };
        

        cache[id] = exports;

        if (!deps) {
            deps = [];
        }

        for (var i=0, len=deps.length, depId; i<len; i++) {
            depId = deps[i];

            if (typeof depId == 'string') {
                deps[i] = local[depId] || requireSync(resolve(depId));
            }
        }

        deps = deps.concat(require, exports, module);

        var failed = 1;
        var result;

        try {
            result = factory.apply(global, deps);
            if (result != null) {
                exports = result;
            }
            else {
                exports = module.exports;
            }

            cache[id] = exports;
            failed = 0;
        }
        finally {
            if (failed) {
                delete cache[id];
            }
        }
    }
    else {
        cache[id] = factory;
    }

    return exports;
}

function requireSync(id) {
    if (cache.hasOwnProperty(id)) {
        return cache[id];
    }
    
    var def = defs[id];

    if (def) {
        return build.call(global, id, def[0], def[1]);
    }
    else {
        throw new Error(id + ' not found');
    }
}

function createRequire(baseName) {
    function require(id) {
        if (arguments.length > 1) {
            throw new Error('Invalid arguments');
        }

        return requireSync(resolve(id, baseName));
    }

    // Mirror the require API for Node.js
    require.cache = cache;
    require.resolve = function(id) {
        return resolve(id, baseName);
    };

    return require;
}

function define(id, deps, factory) {
    if (arguments.length === 2) {
        factory = deps;
        deps = null;
    }
    if (typeof factory === 'function') {
        defs[id] = [deps, factory];    
    }
    else {
        cache[id] = factory;
    }
    
}

define.amd = {};

global.define = define;
global.require = createRequire();
global.Module = Module;

}( typeof module === "object" && module && typeof module.exports === "object" ? exports : window));
