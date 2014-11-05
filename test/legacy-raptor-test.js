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

var legacyAmd = require('../');
var client = require('raptor-modules/client');
client.ready();

var raptor = legacyAmd.raptor;

raptor.define('foo.bar', function(raptor) {
    return {
        name: 'FOOBAR'
    };
});

raptor.defineClass('hello.World', function(raptor) {
    var fooBar = raptor.require('foo.bar');

    function World() {
        this.raptor = raptor;
        this.fooBar = fooBar;
    }

    return World;
});

describe('raptor-amd/legacy-raptor' , function() {

    beforeEach(function(done) {
        for (var k in require.cache) {
            if (require.cache.hasOwnProperty(k)) {
                delete require.cache[k];
            }
        }
        done();
    });

    it('should allow raptor.define', function() {
        var fooBar = raptor.require('foo.bar');
        expect(fooBar.name).to.equal('FOOBAR');
    });

    it('should allow raptor.defineClass', function() {
        var World = raptor.require('hello.World');
        var world = new World();
        expect(World).to.be.a('function');
        expect(world.raptor).to.equal(raptor);
        expect(world.fooBar.name).to.equal('FOOBAR');
    });
});

