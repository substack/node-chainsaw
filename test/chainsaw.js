var Chainsaw = require('chainsaw');

exports.getset = function (assert) {
    var to = setTimeout(function () {
        assert.fail('builder never fired');
    }, 50);
    
    var ch = Chainsaw(function (saw) {
        clearInterval(to);
        var num = 0;
        
        this.get = function (cb) {
            cb(num);
            saw.next();
        };
        
        this.set = function (n) {
            num = n;
            saw.next();
        };
        
        var ti = setTimeout(function () {
            assert.fail('end event not emitted');
        }, 50);
        
        saw.on('end', function () {
            clearTimeout(ti);
            assert.equal(times, 3);
        });
    });
    
    var times = 0;
    ch
        .get(function (x) {
            assert.equal(x, 0);
            times ++;
        })
        .set(10)
        .get(function (x) {
            assert.equal(x, 10);
            times ++;
        })
        .set(20)
        .get(function (x) {
            assert.equal(x, 20);
            times ++;
        })
    ;
};

exports.nest = function (assert) {
    var ch = (function () {
        var vars = {};
        return Chainsaw(function (saw) {
            this.do = function (cb) {
                saw.nest(cb, vars);
            };
        });
    })();
    
    var order = [];
    var to = setTimeout(function () {
        assert.fail('didn\'t get to the end');
    }, 50);
    
    ch
        .do(function (vars) {
            vars.x = 'y';
            order.push(1);
            
            this
                .do(function (vs) {
                    order.push(2);
                    vs.x = 'x';
                })
                .do(function (vs) {
                    order.push(3);
                    vs.z = 'z';
                })
            ;
        })
        .do(function (vars) {
            vars.y = 'y';
            order.push(4);
        })
        .do(function (vars) {
            assert.eql(order, [1,2,3,4]);
            assert.eql(vars, { x : 'x', y : 'y', z : 'z' });
            clearTimeout(to);
        })
    ;
};

exports.builder = function (assert) {
    var cx = Chainsaw(function (saw) {
        this.x = function () {};
    });
    assert.ok(cx.x);
    
    var cy = Chainsaw(function (saw) {
        return { y : function () {} };
    });
    assert.ok(cy.y);
    
    var cz = Chainsaw(function (saw) {
        return { z : function (cb) { saw.nest(cb) } };
    });
    assert.ok(cz.z);
    
    var to = setTimeout(function () {
        assert.fail('nested z didn\'t run');
    }, 50);
    
    cz.z(function () {
        clearTimeout(to);
        assert.ok(this.z);
    });
};
