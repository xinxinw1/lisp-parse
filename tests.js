title("Lisp Parser Testing");

load("lib/tools.js");
load("lib/ajax.js");
load("lib/prec-math.js");
load("lib/lisp-tools.js");
load("lib/lisp-parse.js");

//// Parser ////

test('L.typ(L.car(L.prs("(1)")))', "num");
test('L.dat(L.car(L.prs("(1)")))', "1");

test('L.typ(L.prs1("(test . test test)"))', "ps");
test('L.dsj(L.gres(L.prs1("(test test)")))', "(test test)");
test('L.dsj(L.gres(L.prs1("(test . test test)")))', "(test . test test)");
test('L.dsj(L.gres(L.prs1("(. test)")))', "(. test)");

test('L.nilp(L.gres(L.plissec(")")))', true);
test('L.nilp(L.gres(L.plissec("]", "]")))', true);
test('L.iso(L.gres(L.plissec("test . test]", "]")), ' +
           'L.cons(L.sy("test"), L.sy("test")))',
       true);

test('L.iso(L.gres(L.psec("test test . test)")), ' +
           'L.lis(L.sy("test"), L.sy("test"), L.sy("."), L.sy("test")))',
       true);
test('L.nilp(L.gres(L.psec(")")))', true);

test('L.iso(L.gres(L.psecn("test test . test")), ' +
           'L.lis(L.sy("test"), L.sy("test"), L.sy("."), L.sy("test")))',
       true);
test('L.nilp(L.gres(L.psecn("")))', true);

test('L.dsj(L.gres(L.psecn("test test")))', "(test test)");
test('L.iso(L.gres(L.psecn("test test . test")), ' +
           'L.lis(L.sy("test"), L.sy("test"), L.sy("."), L.sy("test")))',
       true);
test('L.nilp(L.gres(L.psecn("")))', true);

test('L.dat(L.gres(L.prs1("#\\"test\\"gi#|test|#")))', /test/gi, $.iso);
// L.dat(L.gres(L.prs1("test#\"\\\"test\"gi")))
test('L.dat(L.gres(L.prs1("test#\\"\\\\\\"test\\"gi")))', "test");

test('L.typ(L.car(L.gres(L.prs1("#[a b c]"))))', "sym");
test('L.dat(L.car(L.gres(L.prs1("#[a b c]"))))', "arr");
test('L.typ(L.car(L.gres(L.prs1("[a b c]"))))', "sym");
test('L.dat(L.car(L.gres(L.prs1("[a b c]"))))', "nfn");
test('L.typ(L.car(L.gres(L.prs1("{a b c}"))))', "sym");
test('L.dat(L.car(L.gres(L.prs1("{a b c}"))))', "obj");
test('L.typ(L.car(L.gres(L.prs1("#(a b c)"))))', "sym");
test('L.dat(L.car(L.gres(L.prs1("#(a b c)"))))', "#");

test('L.iso(L.prs("\'\'"), L.lis(L.sy("qt"), L.sy("\'")))', true);

test('L.iso(L.prs("({})"), L.lis(L.lis(L.sy("obj"))))', true);


