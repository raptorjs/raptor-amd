/* jshint strict:false */
require('raptor-polyfill/array/isArray');

var win = typeof window === 'undefined' ? exports : window;
var CLIENT_PATH = 'raptor-modules/client';
var raptorModulesClient = win.$rmod || require(CLIENT_PATH);

var defs = {}; //Registered module definitions are added to this object
var isArray = Array.isArray; //Helper function to check if an object is an Array object
var extend = require('raptor-util/extend');
var forEach = require('raptor-util/forEach');
var forEachEntry = require('raptor-util/forEachEntry');
var inherit = require('raptor-util/inherit');
var arrayFromArguments = require('raptor-util/arrayFromArguments');
var createError  = require('raptor-util/createError');

function isString(s) {
    return typeof s == 'string';
}

function isFunction(f) {
    return typeof f == 'function';
}

function registerCommonJSModule(id) {

    var firstSlash = id.indexOf('/');
    var parentModule;
    var subPath;

    if (firstSlash === -1) {
        parentModule = id;
        subPath = '';
    } else {
        parentModule = id.substring(0, firstSlash);
        subPath = id.substring(firstSlash);
    }

    var basePath = '/' + parentModule + '@AMD';
    var realPath = basePath + subPath;

    raptorModulesClient.dep('', parentModule, 'AMD');
    raptorModulesClient.def(realPath, function(require, exports, module, __filename, __dirname) {
        var def = defs[id];
        var factory = def.factory;
        var postCreate = def.postCreate;
        var dependencies = def.dependencies;
        var superclass = def.superclass;

        function gather(dependencies) {
            var out = [];

            for (var i=0, len=dependencies.length; i<len; i++) {
                var d = dependencies[i];
                if (d === 'require') {
                    d = require;
                } else if (d === 'exports') {
                    d = exports;
                } else if (d === 'module') {
                    d = module;
                } else if (d === 'super') {
                    d = typeof superclass === 'string' ? require(superclass) : superclass;
                    if (d) {
                        d = d.prototype;
                    }
                } else if (d === 'raptor') {
                    d = win.raptor;
                } else {
                    d = require(d);
                }

                out.push(d);
            }

            return out;
        }

        if (dependencies) {
            dependencies = gather(dependencies);
        } else{
            dependencies = [];
        }

        var defaultDependencies = def.legacy ? [win.raptor, exports, module] : [require, exports, module];

        var instance = isFunction(factory) ? factory.apply(this, dependencies.concat(defaultDependencies)) : factory;
        var o;

        if (postCreate) {
            forEach(postCreate, function(postCreateFunc) {
                if ((o = postCreateFunc(instance, require, gather))) { //Check if the postCreate function produced a new function...
                    instance = o; //if so, use that instead
                }
            });
        }

        if (instance === undefined) {
            instance = module.exports;
        } else {
            module.exports = instance;
        }

        def.instance = instance;
    });
}

function getOrCreateDef(id) { //Returns the module definition entry for the given ID or creates one of one does not exist
    var def = defs[id];
    if (!def) {
        def = defs[id] = {postCreate: []};
        registerCommonJSModule(id);
    }
    return def;
}

function _makeClass(clazz, superclass, name) {
    if (!isFunction(clazz)) {
        var o = clazz;
        clazz = o.init || function() {};
        extend(clazz.prototype, o);
    }

    if (superclass) {
        inherit(clazz, superclass, true);
        clazz.superclass = superclass.prototype;
    }

    clazz.getName = clazz.getName || function() {
        return name;
    };

    var proto = clazz.prototype;
    proto.constructor = clazz;
    proto.getClass = function() {
        return clazz;
    };

    return clazz;
}

function _enumValueOrdinal() {
    return this._ordinal;
}

function _enumValueName() {
    return this._name;
}

function _enumValueCompareTo(other) {
    return this._ordinal - other._ordinal;
}

/**
 * This functions takes in the arguments to define, define.Class and define.extend
 * calls and does the hard work of handling optional arguments.
 *
 * @param   {arguments}  args The arguments object for the define, define.Class or define.extend
 * @param   {Boolean} isClass Should only be true if this is define.Class call
 * @param   {Boolean} isExtend Should only be true if this is a define.extend call
 * @return  {Object|undefined} If no id is provided then the anonymous object is immediately built and returned. Otherwise, undefined is returned.
 * @private
 */
function _define(args, isExtend, isClass, isEnum, isLegacy) {
    var i=0;
    var last = args.length-1;
    var arg;
    var id; //The object id (optional)
    var superclass; //The superclass (optional, should only be allowed for define.Class but that is not enforced currently...less code)
    var enumValues;
    var dependencies = []; //The dependencies arguments... defaults to an empty array
    var postCreate; //A function that should be invoked after the object is created for the first time...Used to handle inheritance and to apply an extension
    var factory; //The factory function or object definition (required, always the last argument)

    /*
     Loop through the arguments to sort things out...
     */
    for (; i<last; i++) {
        arg = args[i];
        if (isString(arg)) { //We found a string argument
            if (id) { //If we already found an "id" then this string must be the superclass
                superclass = arg;
            } else { //Otherwise it is the module ID
                id = arg;
            }
        } else if (isArray(arg)) { //We found an array...The argument must be the array of dependency IDs
            dependencies = arg;
        } else if (isEnum) {
            enumValues = arg;
        } else {
            superclass = arg.superclass;
        }
    }

    factory = args[last]; //The factory function is always the last argument


    if (isExtend) { //If define.extend then we need to register a "post create" function to modify the target module
        var extendDependencies = dependencies;
        var extendFactory = factory;

        dependencies = null;
        factory = null;

        postCreate = function(target, require, gather) {
            if (isFunction(extendFactory)) {
                extendFactory = extendFactory.apply(this, gather(extendDependencies).concat([require, target]));
            }

            if (extendFactory) {
                extend(isFunction(target) ? target.prototype : target, extendFactory);
            }
        };
    } else {
        if (isClass || superclass) {
            postCreate = function(instance, require) {
                superclass = isString(superclass) ? require(superclass) : superclass;
                return _makeClass(instance, superclass, id);
            };
        } else if (isEnum) {

            if (isArray(factory)) {
                enumValues = factory;
                factory = null;
            }

            postCreate = function(EnumClass) {
                if (EnumClass) {
                    if (typeof EnumClass == 'object') {
                        EnumClass = _makeClass(EnumClass, 0, id); // Convert the class object definition to
                                                                  // a class constructor function
                    }
                } else {
                    EnumClass = function() {};
                }

                var proto = EnumClass.prototype,
                    count = 0,
                    _addEnumValue = function(name, EnumCtor) {
                        return extend(
                            EnumClass[name] = new EnumCtor(),
                            {
                                _ordinal: count++,
                                _name: name
                            });
                    };

                if (isArray(enumValues)) {
                    forEach(enumValues, function(name) {
                        _addEnumValue(name, EnumClass);
                    });
                }
                else if (enumValues) {
                    var EnumCtor = function() {};
                    EnumCtor.prototype = proto;

                    forEachEntry(enumValues, function(name, args) {
                        EnumClass.apply(_addEnumValue(name, EnumCtor), args || []);
                    });
                }

                EnumClass.valueOf = function(name) {
                    return EnumClass[name];
                };

                extend(proto, {
                    name : _enumValueName,
                    ordinal : _enumValueOrdinal,
                    compareTo : _enumValueCompareTo
                });

                if (proto.toString == Object.prototype.toString) {
                    proto.toString = _enumValueName;
                }

                return EnumClass;
            };
        }
    }

    if (!id) {
        throw new Error('"id" is required');
    }

    var def = getOrCreateDef(id);
    if (factory) {
        def.factory = factory;
    }

    if (dependencies) {
        def.dependencies = dependencies;
    }

    if (superclass) {
        def.superclass = superclass;
    }

    def.legacy = isLegacy === 1;

    if (postCreate) {
        def.postCreate.push(postCreate);
        var instance = def.instance;

        if (instance) {
            postCreate(instance);
        }
    }
}

function raptorDefine() {
    _define(arguments);
}

raptorDefine.extend = function() {
    return _define(arguments, 1);
};

raptorDefine.Class = function() {
    return _define(arguments, 0, 1);
};

raptorDefine.Enum = function() {
    return _define(arguments, 0, 0, 1);
};

function raptorRequire(id) {
    return raptorModulesClient.require(id, '');
}

if (!win.raptorDefine) {
    // always export raptorDefine function to global scope (this should not cause a conflict)
    win.raptorDefine = raptorDefine;
    win.raptorRequire = raptorRequire;

    if (win.raptorNoConflict !== true) {
        // We are not in no-conflict mode so expose define and require.
        // Put AMD-style define and require functions in the global window scope.
        win.define = raptorDefine;
        win.require = raptorRequire;
    }

    raptorDefine.amd = {};

    raptorDefine('raptor', {
        inherit: inherit,
        extend: extend,
        forEach: forEach,
        arrayFromArguments: arrayFromArguments,
        forEachEntry: forEachEntry,
        createError: createError
    });

    win.raptor = {
        require: function(id) {
            return raptorRequire(id.replace(/\./g, '/'));
        },
        define: function(id) {
            id = id.replace(/\./g, '/');
            _define(arguments, 0, 0, 0, 1 /*legacy*/);
        },
        defineClass: function(id) {
            id = id.replace(/\./g, '/');
            _define(arguments, 0, 1, 0, 1 /*legacy*/);
        },
        extend: function(id) {
            if (typeof id === 'string') {
                id = id.replace(/\./g, '/');
                _define(arguments, 1, 0, 0, 1 /*legacy*/);
            } else {
                extend.apply(this, arguments);
            }
        }
    };
}
