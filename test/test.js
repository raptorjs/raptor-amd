'use strict';
var chai = require('chai');
chai.Assertion.includeStack = true;
var expect = chai.expect;

for (var k in require.cache) {
    if (require.cache.hasOwnProperty(k)) {
        delete require.cache[k];
    }
}
require('../');

function createDefineRequire() {
    var legacyAmd = require('../');
    var client = require('raptor-modules/client');
    client.ready();
    var define = legacyAmd.define;
    var amdRequire = legacyAmd.require;

    return {
        define: define,
        require: amdRequire
    };
}

describe('raptor-legacy-amd' , function() {

    beforeEach(function(done) {
        for (var k in require.cache) {
            if (require.cache.hasOwnProperty(k)) {
                delete require.cache[k];
            }
        }
        done();
    });

    it('should allow return', function() {
        var defineRequire = createDefineRequire();
        var define = defineRequire.define;
        var amdRequire = defineRequire.require;

        define('foo', function() {
            return 'foo';
        });

        var foo = amdRequire('foo');
        expect(foo).equal('foo');
    });


    it('should allow object', function() {
        var defineRequire = createDefineRequire();
        var define = defineRequire.define;
        var amdRequire = defineRequire.require;

        define('foo', 'foo');

        var foo = amdRequire('foo');
        expect(foo).equal('foo');
    });

    it('should allow exports', function() {
        var defineRequire = createDefineRequire();
        var define = defineRequire.define;
        var amdRequire = defineRequire.require;

        define('foo', function(require, exports, module) {
            exports.bar = true;
        });

        var foo = amdRequire('foo');
        expect(foo.bar).to.equal(true);
    });

    it('should allow module.exports', function() {
        var defineRequire = createDefineRequire();
        var define = defineRequire.define;
        var amdRequire = defineRequire.require;

        define('foo', function(require, exports, module) {
            module.exports = function() {
                return 'bar';
            };
        });

        var foo = amdRequire('foo');
        expect(foo()).to.equal('bar');
    });

    it('should allow dependencies', function() {
        var defineRequire = createDefineRequire();
        var define = defineRequire.define;
        var amdRequire = defineRequire.require;

        define('foo', function(require, exports, module) {
            expect(require).be.a('function');
            expect(exports).be.an('object');
            expect(module.exports).to.equal(exports);
            return 'foo';
        });

        define('bar', ['foo'], function(foo, require, exports, module) {
            return foo + 'bar';
        });

        var bar = amdRequire('bar');
        expect(bar).to.equal('foobar');
    });

    it('should allow special dependencies', function() {
        var defineRequire = createDefineRequire();
        var define = defineRequire.define;
        var amdRequire = defineRequire.require;

        define('foo', function(require, exports, module) {
            return 'foo';
        });

        var foo = amdRequire('foo');

        define(
            'bar', 
            ['module', 'exports', 'require', 'foo'], 
            function(module1, exports1, require1, foo1, require2, exports2, module2) {
                expect(require1).to.equal(require2);
                expect(exports1).to.equal(exports2);
                expect(module1).to.equal(module2);
                expect(exports1).to.equal(module2.exports);
                expect(foo1).to.equal(foo);
                return arguments;
            });

        var args = amdRequire('bar');
        expect(args.length).to.equal(7);        
    });

    it('should cache modules', function() {
        var defineRequire = createDefineRequire();
        var define = defineRequire.define;
        var amdRequire = defineRequire.require;

        define('foo', function() {
            return {};
        });

        var foo = amdRequire('foo');
        foo.modified = true;

        foo = amdRequire('foo');
        expect(foo.modified).to.equal(true);
    });

    it('should handle errors', function() {
        var defineRequire = createDefineRequire();
        var define = defineRequire.define;
        var amdRequire = defineRequire.require;

        define("foo", function(require) {
            throw new Error('test');
        });

        var foo;
        var error;

        try {
            foo = amdRequire('foo');
        }
        catch(e) {
            error = e;
        }
        
        expect(error).to.be.an.instanceof(Error);
    });

    it('should resolve module index correctly', function() {
        var defineRequire = createDefineRequire();
        var define = defineRequire.define;
        var amdRequire = defineRequire.require;

        define('foo', function(require) {
            return require('foo/index');
        });

        define('foo/index', function() {
            return 'foo';
        });

        var foo = amdRequire('foo');
        expect(foo).to.equal('foo');
    });

    it('should handle simple AMD require and define', function() {
        var defineRequire = createDefineRequire();
        var define = defineRequire.define;
        var amdRequire = defineRequire.require;

        define('foo', function() {
            return {
                name: 'foo'
            };
        });

        define('bar', ['foo'], function(foo, require, exports, module) {
            exports.name = 'bar';
            exports.foo = foo;
        });

        var foo = amdRequire('foo');
        var bar = amdRequire('bar');

        expect(foo.name).to.equal('foo');
        expect(bar.name).to.equal('bar');
        expect(bar.foo.name).to.equal('foo');
    });
});

