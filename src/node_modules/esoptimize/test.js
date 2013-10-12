var assert = require('assert');
var esprima = require('esprima');
var escodegen = require('escodegen');
var esoptimize = require('./esoptimize');

function bodyOfFunction(f) {
  return f.toString().replace(/^[^\{]*\{((?:.|\n)*)\}[^\}]*$/, '$1');
}

function test(input, expected) {
  input = esprima.parse(bodyOfFunction(input));
  expected = esprima.parse(bodyOfFunction(expected));
  var output = esoptimize.optimize(input);
  var options = { format: { indent: { style: '  ' } } };
  assert.strictEqual(escodegen.generate(output, options), escodegen.generate(expected, options));
  assert.strictEqual(JSON.stringify(output, null, 2), JSON.stringify(expected, null, 2));
}

it('numeric constants', function() {
  test(function() {
    var a = 0 / 0 * 2;
    var b = 100 / 0;
    var c = 100 / 0 * -2;
    var d = -0;
  }, function() {
    var a, b, c, d;
    a = 0 / 0;
    b = 1 / 0;
    c = -1 / 0;
    d = 0;
  });
});

it('unary operators', function() {
  test(function() {
    a(
      !1,
      ~1,
      +1,
      -1,
      void 1,
      typeof 1,
      delete b
    );
    b++;
    b--;
    ++b;
    --b;
  }, function() {
    a(
      false,
      -2,
      1,
      -1,
      void 0,
      'number',
      delete b
    );
    b++;
    b--;
    ++b;
    --b;
  });
});

it('binary operators', function() {
  test(function() {
    a(
      1 + 2,
      1 - 2,
      1 * 2,
      1 / 2,
      1 % 2,
      1 & 2,
      1 | 2,
      1 ^ 2,
      1 << 2,
      1 >> 2,
      1 >>> 2,
      1 < 2,
      1 > 2,
      1 <= 2,
      1 >= 2,
      1 == 2,
      1 != 2,
      1 === 2,
      1 !== 2,
      0 && 1,
      0 || 1,
      1 instanceof b,
      1 in b
    );
    b = 2;
    b += 2;
    b -= 2;
    b *= 2;
    b /= 2;
    b %= 2;
    b &= 2;
    b |= 2;
    b ^= 2;
    b <<= 2;
    b >>= 2;
    b >>>= 2;
  }, function() {
    a(
      3,
      -1,
      2,
      0.5,
      1,
      0,
      3,
      3,
      4,
      0,
      0,
      true,
      false,
      true,
      false,
      false,
      true,
      false,
      true,
      0,
      1,
      1 instanceof b,
      1 in b
    );
    b = 2;
    b += 2;
    b -= 2;
    b *= 2;
    b /= 2;
    b %= 2;
    b &= 2;
    b |= 2;
    b ^= 2;
    b <<= 2;
    b >>= 2;
    b >>>= 2;
  });
});

it('sequence folding', function() {
  test(function() {
    var a = (1, 2, 3);
    var b = (1, x(), 2, y(), 3);
    var c = (1, (x(), 2), 3);
  }, function() {
    var a, b, c;
    a = 3;
    b = (x(), y(), 3);
    c = (x(), 3);
  });
});

it('logical negation', function() {
  test(function() {
    a(!(b < c));
    a(!(b > c));
    a(!(b <= c));
    a(!(b >= c));
    a(!(b == c));
    a(!(b != c));
    a(!(b === c));
    a(!(b !== c));
    a(!(b && c));
    a(!(b || c));
    a(!(b < c && d || e > f));
    a(!(b < c || d && e > f));
  }, function() {
    a(b >= c);
    a(b <= c);
    a(b > c);
    a(b < c);
    a(b != c);
    a(b == c);
    a(b !== c);
    a(b === c);
    a(!b || !c);
    a(!b && !c);
    a((b >= c || !d) && e <= f);
    a(b >= c && (!d || e <= f));
  });
});

it('array folding', function() {
  test(function() {
    var a = [1, 2][0];
    var b = [1, c()][0];
    var c = [1, 2][-1];
    var d = [1, 2][0.5];
    var e = [1, 2, 3]['len' + 'gth'];
  }, function() {
    var a, b, c, d, e;
    a = 1;
    b = [1, c()][0];
    c = [][-1];
    d = [][0.5];
    e = 3;
  });
});

it('string folding', function() {
  test(function() {
    var a = '12'[0];
    var b = '12'[-1];
    var c = '12'[0.5];
    var d = '123'['len' + 'gth'];
  }, function() {
    var a, b, c, d;
    a = '1';
    b = ''[-1];
    c = ''[0.5];
    d = 3;
  });
});

it('object literal folding', function() {
  test(function() {
    var a = { 'x': 0, 'y': 1 }['x'];
    var b = { 'x': 0, 'y': 1 }.x;
    var c = { 1: 2, 3: 4 }[1];
  }, function() {
    var a, b, c;
    a = 0;
    b = 0;
    c = 2;
  });
});

it('property normalization', function() {
  test(function() {
    a(b['c']);
    a(b['c d']);
    a({ 1: 2, 'b': 'c' });
  }, function() {
    a(b.c);
    a(b['c d']);
    a({ '1': 2, b: 'c' });
  });
});

it('side-effect-free code removal', function() {
  test(function() {
    'use strict';
    if (false) var x;
    'not use strict';
    1;
    x;
    x.y;
    (function() {});
    var foo = function() {};
    function foo() {}
  }, function() {
    'use strict';
    var x, foo;
    foo = function() {};
    function foo() {}
  });
});

it('block flattening', function() {
  test(function() {
    a();
    ;
    { ; b(); { c(); } d(), e(); }
    f();
  }, function() {
    a();
    b();
    c();
    d();
    e();
    f();
  });
});

it('function block flattening', function() {
  test(function() {
    function foo(a, b) {
      a();
      ;
      { ; b(); { c(); } d(), e(); }
      f();
    }
  }, function() {
    function foo(a, b) {
      a();
      b();
      c();
      d();
      e();
      f();
    }
  });
});

it('unused variable removal', function() {
  test(function() {
    var a, b;
    function foo(a) {
      var a, b, c;
      a();
      b();
    }
    (function(a) {
      function foo() {
        var b, c;
        a();
        b();
      }
      function bar() {}
      foo();
    }());
    b = 0;
  }, function() {
    var a, b;
    function foo(a) {
      a();
      (void 0)();
    }
    (function(a) {
      function foo() {
        a();
        (void 0)();
      }
      foo();
    }());
    b = 0;
  });
});

it('ternary expression folding', function() {
  test(function() {
    a(true ? b() : c());
  }, function() {
    a(b());
  });
});

it('if statement dead code removal', function() {
  test(function() {
    if (0) a();
    if (0) a(); else b();
    if (1) a(); else b();
    if (a()) { b(); } else {}
    if (a()) { 1; }
    if (a()) { 1; } else { 2; }
  }, function() {
    b();
    a();
    if (a()) b();
    a();
    a();
  });
});

it('while statement dead code removal', function() {
  test(function() {
    while (false) foo();
    while (true) foo();
  }, function() {
    while (true) foo();
  });
});

it('do-while statement dead code removal', function() {
  test(function() {
    do foo(); while (false);
    do foo(); while (true);
  }, function() {
    foo();
    do foo(); while (true);
  });
});

it('for statement dead code removal', function() {
  test(function() {
    for (;0;) foo();
    for (foo();0;) foo();
    for (var bar;0;) foo();
    for (var bar = 0;0;) foo();
    for (;1;) foo();
    for (;;) foo();
  }, function() {
    var bar;
    foo();
    bar = 0;
    for (;1;) foo();
    for (;;) foo();
  });
});

it('with statement dead code removal', function() {
  test(function() {
    with (foo) {}
    with (foo) foo();
  }, function() {
    with (foo) foo();
  });
});

it('try statement dead code removal', function() {
  test(function() {
    try { foo(); } catch (e) { foo(); } finally { foo(); }
    try { foo(); } catch (e) { foo(); } finally {}
    try { foo(); } catch (e) { foo(); }
    try { foo(); } catch (e) {} finally { foo(); }
    try { foo(); } catch (e) {} finally {}
    try { foo(); } catch (e) {}
    try { foo(); } finally { foo(); }
    try { foo(); } finally {}
    try {} catch (e) { foo(); } finally { foo(); }
    try {} catch (e) { foo(); } finally {}
    try {} catch (e) { foo(); }
    try {} catch (e) {} finally { foo(); }
    try {} catch (e) {} finally {}
    try {} catch (e) {}
    try {} finally { foo(); }
    try {} finally {}
  }, function() {
    try { foo(); } catch (e) { foo(); } finally { foo(); }
    try { foo(); } catch (e) { foo(); }
    try { foo(); } catch (e) { foo(); }
    try { foo(); } finally { foo(); }
    foo();
    foo();
    try { foo(); } finally { foo(); }
    foo();
  });
});

it('return statement folding', function() {
  test(function() {
    function foo() { if (bar()) return void 0; bar(); }
    function foo() { var x; if (bar()) return x; bar(); }
  }, function() {
    function foo() { if (bar()) return; bar(); }
    function foo() { if (bar()) return; bar(); }
  });
});

it('switch statement dead code removal', function() {
  test(function() {
    switch (0) {}
    switch (foo()) {}
  }, function() {
    foo();
  });
});
