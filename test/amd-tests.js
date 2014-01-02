'use strict';
var chai = require('chai');
chai.Assertion.includeStack = true;
require('chai').should();

require('../');

describe('raptor-amd/amd' , function() {

    beforeEach(function(done) {
        for (var k in require.cache) {
            if (require.cache.hasOwnProperty(k)) {
                delete require.cache[k];
            }
        }
        done();
    });

    it('should allow return', function() {
        var amd = require('../');
        var define = amd.define;
        var req = amd.require;

        define('foo', function() {
            return 'foo';
        });

        var foo = req('foo');
        foo.should.equal('foo');
    });


    it('should allow object', function() {
        var amd = require('../');
        var define = amd.define;
        var req = amd.require;

        define('foo', 'foo');

        var foo = req('foo');
        foo.should.equal('foo');
    });

    it('should allow exports', function() {
        var amd = require('../');
        var define = amd.define;
        var req = amd.require;

        define('foo', function(require, exports, module) {
            exports.bar = true;
        });

        var foo = req('foo');
        foo.bar.should.equal(true);
    });

    it('should allow module.exports', function() {
        var amd = require('../');
        var define = amd.define;
        var req = amd.require;

        define('foo', function(require, exports, module) {
            module.exports = function() {
                return 'bar';
            };
        });

        var foo = req('foo');
        foo().should.equal('bar');
    });

    it('should allow dependencies', function() {
        var amd = require('../');
        var define = amd.define;
        var req = amd.require;

        define('foo', function(require, exports, module) {
            require.should.be.a('function');
            exports.should.be.an('object');
            module.exports.should.equal(exports);
            return 'foo';
        });

        define('bar', ['foo'], function(foo, require, exports, module) {
            return foo + 'bar';
        });

        var bar = req('bar');
        bar.should.equal('foobar');
    });

    it('should allow special dependencies', function() {
        var amd = require('../');
        var define = amd.define;
        var req = amd.require;

        define('foo', function(require, exports, module) {
            return 'foo';
        });

        var foo = req('foo');

        define(
            'bar', 
            ['module', 'exports', 'require', 'foo'], 
            function(module1, exports1, require1, foo1, require2, exports2, module2) {
                require1.should.equal(require2);
                exports1.should.equal(exports2);
                module1.should.equal(module2);
                exports1.should.equal(module2.exports);
                foo1.should.equal(foo);
                return arguments;
            });

        var args = req('bar');
        args.length.should.equal(7);        
    });

    it('should cache modules', function() {
        var amd = require('../');
        var define = amd.define;
        var req = amd.require;

        define('foo', function() {
            return {};
        });

        var foo = req('foo');
        foo.modified = true;

        foo = req('foo');
        foo.modified.should.equal(true);
        req.cache.hasOwnProperty('foo').should.equal(true);
    });

    it('should allow require.resolve', function() {
        var amd = require('../');
        var define = amd.define;
        var req = amd.require;

        define("a/b/c", function(require) {
            return [
                require.resolve('../d'),
                require.resolve('./e')
            ];
        });

        var foo = req('a/b/c');
        
        foo[0].should.equal('a/d');
        foo[1].should.equal('a/b/e');
    });

    it('should handle errors', function() {
        var amd = require('../');
        var define = amd.define;
        var req = amd.require;

        define("foo", function(require) {
            throw new Error('test');
        });

        var foo;
        var error;

        try {
            foo = req('foo');
        }
        catch(e) {
            error = e;
        }
        
        error.should.be.an.instanceof(Error);
        req.cache.hasOwnProperty('foo').should.equal(false);
    });

    it('should resolve module index correctly', function() {
        var amd = require('../');
        var define = amd.define;
        var req = amd.require;

        define('foo', function(require) {
            return require('foo/index');
        });

        define('foo/index', function() {
            return 'foo';
        });

        var foo = req('foo');
        foo.should.equal('foo');
    });

});

