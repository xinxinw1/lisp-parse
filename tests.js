QUnit.test('Parser', function (assert){
  assert.same(L.typ(L.car(L.prs("(1)"))), "num");
  assert.teststr(L.dat(L.car(L.prs("(1)"))), "1");
  
  assert.same(L.typ(L.prs1("(test . test test)")), "ps");
  assert.same(L.dsj(L.gres(L.prs1("(test test)"))), "(test test)");
  assert.same(L.dsj(L.gres(L.prs1("(test . test test)"))), "(test . test test)");
  assert.same(L.dsj(L.gres(L.prs1("(. test)"))), "(. test)");
  
  assert.same(L.nilp(L.gres(L.plissec(")"))), true);
  assert.same(L.nilp(L.gres(L.plissec("]", "]"))), true);
  assert.same(L.iso(L.gres(L.plissec("test . test]", "]")), L.cons(L.sy("test"), L.sy("test"))),
         true);
  
  assert.same(L.iso(L.gres(L.psec("test test . test)")), L.lis(L.sy("test"), L.sy("test"), L.sy("."), L.sy("test"))),
         true);
  assert.same(L.nilp(L.gres(L.psec(")"))), true);
  
  assert.same(L.iso(L.gres(L.psecn("test test . test")), L.lis(L.sy("test"), L.sy("test"), L.sy("."), L.sy("test"))),
         true);
  assert.same(L.nilp(L.gres(L.psecn(""))), true);
  
  assert.same(L.dsj(L.gres(L.psecn("test test"))), "(test test)");
  assert.same(L.iso(L.gres(L.psecn("test test . test")), L.lis(L.sy("test"), L.sy("test"), L.sy("."), L.sy("test"))),
         true);
  assert.same(L.nilp(L.gres(L.psecn(""))), true);
  
  assert.same(L.dat(L.gres(L.prs1("#\"test\"gi#|test|#"))), /test/gi, $.iso);
  // L.dat(L.gres(L.prs1("test#\"\\\"test\"gi")))
  assert.same(L.dat(L.gres(L.prs1("test#\"\\\\\"test\"gi"))), "test");
  
  assert.same(L.typ(L.car(L.gres(L.prs1("#[a b c]")))), "sym");
  assert.same(L.dat(L.car(L.gres(L.prs1("#[a b c]")))), "arr");
  assert.same(L.typ(L.car(L.gres(L.prs1("[a b c]")))), "sym");
  assert.same(L.dat(L.car(L.gres(L.prs1("[a b c]")))), "fn1");
  assert.same(L.typ(L.car(L.gres(L.prs1("{a b c}")))), "sym");
  assert.same(L.dat(L.car(L.gres(L.prs1("{a b c}")))), "obj");
  assert.same(L.typ(L.car(L.gres(L.prs1("#(a b c)")))), "sym");
  assert.same(L.dat(L.car(L.gres(L.prs1("#(a b c)")))), "#");
  
  assert.same(L.iso(L.prs("''"), L.lis(L.sy("qt"), L.sy("\'"))), true);
  
  assert.same(L.iso(L.prs("({})"), L.lis(L.lis(L.sy("obj")))), true);
});
