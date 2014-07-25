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

define.Class(
    'test/classes/Bird', 
    function(require) {
        return {
            init: function(species) {
                this.species = species;
            },
            
            getSpecies: function() {
                return this.species;
            },
            
            isFlighted: function() {
                return true;
            },
            
            toString: function() {
                return '[Bird: ' + this.getSpecies() + ']';
            }
        };
    });
    
define.Class(
    'test/classes/Ostrich',
    {
        superclass: 'test/classes/Bird'
    },
    function(require) {
        var Ostrich = function() {
            Ostrich.superclass.init.call(this, 'ostrich');
        };
        
        Ostrich.prototype = {
            isFlighted: function() {
                return false;
            },
            
            isOstrich: function() {
                return true;
            },
            
            toString: function() {
                return Ostrich.superclass.toString.call(this);
            }
        };
        
        return Ostrich;
    });

define.Class(
    'test/classes/Ostrich2',
    'test/classes/Bird',
    ['super'],
    function($super, require) {

        var Ostrich = function() {
            $super.constructor.call(this, 'ostrich');
        };
        
        Ostrich.prototype = {
            isFlighted: function() {
                return false;
            },
            
            isOstrich: function() {
                return true;
            },
            
            toString: function() {
                return $super.toString.call(this);
            }
        };
        
        return Ostrich;
    });

define.Class('test/syntax/AlternativeSuperClass', function(require) {
    var Type = function(message) {
        this.initMessage = message;
        this.initB = true;
    };
    
    Type.prototype = {
        myMethod: function(message) {
            this.b = true;
            this.methodMessage = message;
        }
    };
    
    Type.mySuperStatic = true;
    
    return Type;
});

define.Class(
    'test/syntax/AlternativeClass', 
    {
        superclass: 'test/syntax/AlternativeSuperClass'
    },
    function(require) {
        var Type = function(message) {
            
            Type.superclass.constructor.call(this, message);
            this.initA = true;
        };
        
        
        Type.prototype = {
            myMethod: function(message) {
                this.a = true;
                Type.superclass.myMethod.call(this, message);
            },
            
            myMethod2: function(message) {
                this.a = true;
                Type.superclass.myMethod.call(this, message);
            }
        };
        
        Type.myStatic = true;
        
        return Type;
    });

define(
    'test/mixins/BirdMixins',
    function(require) {
        return {
            fly: function() {
                
            }
        };
    });

define(
    'test/mixins/Ostrich',
    ['raptor'],
    function(raptor, require) {
        var Ostrich = function() {
            
        };
        
        Ostrich.prototype = {
            isFlighted: function() {
                return false;
            },
            
            isOstrich: function() {
                return true;
            },
            
            toString: function() {
                return Ostrich.superclass.toString.call(this);
            }
        };
        
        raptor.extend(
            Ostrich.prototype, 
            require('test/mixins/BirdMixins'));
        
        return Ostrich;
    });

var Ostrich = amdRequire('test/classes/Ostrich');
var ostrich = new Ostrich();

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

describe('raptor-legacy-amd/classes' , function() {

    beforeEach(function(done) {
        for (var k in require.cache) {
            if (require.cache.hasOwnProperty(k)) {
                delete require.cache[k];
            }
        }
        done();
    });

    it('should allow inheritance', function() {
        expect(ostrich.getSpecies()).to.equal('ostrich');
        expect(ostrich.isFlighted()).to.equal(false);
        expect(ostrich.isOstrich()).to.equal(true);
        expect(ostrich.toString()).to.equal('[Bird: ostrich]');
    });

    it('should allow class factory functions to return constructor functions', function() {
        var AlternativeClass = amdRequire('test/syntax/AlternativeClass');
        expect(AlternativeClass.myStatic).to.equal(true);
        
        var myAlternative = new AlternativeClass('AlternativeClass');
        expect(myAlternative.initA).to.equal(true);
        expect(myAlternative.initB).to.equal(true);
        expect(myAlternative.initMessage).to.equal('AlternativeClass');
        
        myAlternative.myMethod('AlternativeClass.myMethod');        
        expect(myAlternative.methodMessage).to.equal('AlternativeClass.myMethod');
        
        myAlternative.myMethod2('AlternativeClass.myMethod2');        
        expect(myAlternative.methodMessage).to.equal('AlternativeClass.myMethod2');
        
        expect(myAlternative.a).to.equal(true);
        expect(myAlternative.b).to.equal(true);
        
    });
    
    it('should allow instanceof to be used', function() {
        var AlternativeClass = amdRequire('test/syntax/AlternativeClass');
        var AlternativeSuperClass = amdRequire('test/syntax/AlternativeSuperClass');
        
        var myAlternative = new AlternativeClass('AlternativeClass');
        expect(myAlternative instanceof AlternativeClass).to.equal(true);
        expect(myAlternative instanceof AlternativeSuperClass).to.equal(true);
        
        var mySuperAlternative = new AlternativeSuperClass('AlternativeSuperClass');
        expect(mySuperAlternative instanceof AlternativeClass).to.not.equal(true);
        
        var Ostrich = amdRequire('test/classes/Ostrich');
        var ostrich = new Ostrich();
        expect(ostrich instanceof Ostrich).to.equal(true);
        
    });
    
    it('should make all superclass name as the modifiers', function() {
        
        var Ostrich2 = amdRequire('test/classes/Ostrich2');
        var ostrich = new Ostrich2();
        expect(ostrich.getSpecies()).to.equal('ostrich');
        expect(ostrich.isFlighted()).to.equal(false);
        expect(ostrich.isOstrich()).to.equal(true);
        expect(ostrich.toString()).to.equal('[Bird: ostrich]');
        
    });
    
    it('should allow classes to be in the modules namespace', function() {
        define.Class('globalTest/myModule/MyClass', function(require) {
            return {
                
            };
        });
        
        expect(amdRequire("globalTest/myModule/MyClass")).to.not.equal(null);

        define('globalTest/myModule', function(require) {
            return {
                
            };
        });
        
        amdRequire('globalTest/myModule');
        
        expect(amdRequire("globalTest/myModule/MyClass")).to.not.equal(null);
    });
    
    it('should allow instanceof against classes accessed using require', function() {
        define.Class('instanceOfTest2.myModule.MyClass', function(require) {
            return {
                
            };
        });
        
        var MyClass = amdRequire('instanceOfTest2.myModule.MyClass');
        var myObject = new MyClass();
        
        expect(myObject instanceof MyClass).to.equal(true);
    });
    
    it('should allow static in classes accessed using require', function() {
        define.Class('globalStaticsTest.myModule.MyClass', function() {
            var MyClass = function() {};
            MyClass.SOME_STATIC = true;
            return MyClass;
        });
        
        var MyClass = amdRequire('globalStaticsTest.myModule.MyClass');
        expect(MyClass.SOME_STATIC).to.equal(true);
    });
    
    it('should allow for mixins', function() {
        var Ostrich = amdRequire('test/mixins/Ostrich');
        var ostrich = new Ostrich();
        expect(ostrich.fly).to.not.equal(null);
    });

});

