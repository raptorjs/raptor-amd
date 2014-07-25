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

var define = legacyAmd.define;
var amdRequire = legacyAmd.require;

define.Enum(
    'test/enums/simple/Day',
    [
        "SUN",
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
        "SAT"
    ]);

define.Enum(
    'test/enums/complex/Day',
    {
        SUN: [false, "Sunday"],
        MON: [true, "Monday"],
        TUE: [true, "Tuesday"],
        WED: [true, "Wednesday"],
        THU: [true, "Thursday"],
        FRI: [true, "Friday"],
        SAT: [false, "Saturday"]
    },
    function(require) {
        return {
            init: function(isWeekday, longName) {
                this._isWeekday = isWeekday;
                this._longName = longName;
            },
             
            getLongName: function() {
                return this._longName;
            },
             
            isWeekday: function() {
                return this._isWeekday;
            }
        };
    });
 
define.Enum(
        'test/enums/complex/Day2',
        {
            SUN: [false, "Sunday"],
            MON: [true, "Monday"],
            TUE: [true, "Tuesday"],
            WED: [true, "Wednesday"],
            THU: [true, "Thursday"],
            FRI: [true, "Friday"],
            SAT: [false, "Saturday"]
        },
        function(require) {
            var Day2 = function(isWeekday, longName) {
                this._isWeekday = isWeekday;
                this._longName = longName;
            };
            
            Day2.TEST_STATIC = true;
            
            Day2.prototype = {
                getLongName: function() {
                    return this._longName;
                },
                 
                isWeekday: function() {
                    return this._isWeekday;
                },
                
                toString: function() {
                    return this._longName;
                }
            };
            
            return Day2;
        });

describe('raptor-legacy-amd/enums' , function() {

    beforeEach(function(done) {
        done();
    });

    it('should allow simple enums', function() {
        var Day = amdRequire('test/enums/simple/Day');
        expect(Day.SUN).to.not.equal(null);
    });
    
    it('should allow instanceof to be used with enum vales', function() {
        var SimpleDay = amdRequire('test/enums/simple/Day');
        expect(SimpleDay.SUN instanceof SimpleDay).to.equal(true);
        
        
        var ComplexDay = amdRequire('test/enums/complex/Day');
        expect(ComplexDay.SUN instanceof ComplexDay).to.equal(true);
        expect(ComplexDay.SUN instanceof SimpleDay).to.equal(false);
        
        
        var ComplexDay2 = amdRequire('test/enums/complex/Day2');
        expect(ComplexDay2.SUN instanceof ComplexDay2).to.equal(true);
    });
    
    it('should allow enums to have static properties', function() {

        var ComplexDay2 = amdRequire('test/enums/complex/Day2');
        expect(ComplexDay2.TEST_STATIC).to.not.equal(null);
    });
    
    it('should support "valueOf" method for enum classes', function() {
        var SimpleDay = amdRequire('test/enums/simple/Day');
        expect(SimpleDay.valueOf("SUN")).to.equal(SimpleDay.SUN);
    });

    it('should support "ordinal" method for enum values', function() {
        var SimpleDay = amdRequire('test/enums/simple/Day');
        expect(SimpleDay.SUN.ordinal()).to.equal(0);
        expect(SimpleDay.MON.ordinal()).to.equal(1);
        expect(SimpleDay.TUE.ordinal()).to.equal(2);
        
    });
    
    it('should support "name" method for enum values', function() {
        var SimpleDay = amdRequire('test/enums/simple/Day');
        expect(SimpleDay.SUN.name()).to.equal("SUN");
    });

    it('should support "toString" method for enum values', function() {
        var SimpleDay = amdRequire('test/enums/simple/Day');
        expect(SimpleDay.SUN.toString()).to.equal("SUN");
        
        var ComplexDay2 = amdRequire('test/enums/complex/Day2');
        expect(ComplexDay2.SUN.toString()).to.equal("Sunday");
    });

    it('should support "compareTo" method for enum values', function() {
        var SimpleDay = amdRequire('test/enums/simple/Day');
        expect(SimpleDay.SUN.compareTo(SimpleDay.MON) < 0).to.equal(true);
        expect(SimpleDay.MON.compareTo(SimpleDay.SUN) > 0).to.equal(true);
        expect(SimpleDay.MON.compareTo(SimpleDay.MON) === 0).to.equal(true);
        expect(SimpleDay.MON.compareTo(SimpleDay.THU) < 0).to.equal(true);
        expect(SimpleDay.THU.compareTo(SimpleDay.MON) > 0).to.equal(true);
    });

});

