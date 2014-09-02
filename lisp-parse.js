/***** Lisp Parser Devel *****/

/* require tools >= 3.1 */
/* require lisp-tools */

(function (win, udf){
  ////// Import //////
  
  var udfp = $.udfp;
  //var is = $.is;
  var has = $.has;
  var pos = $.pos;
  var rpl = $.rpl;
  var len = $.len;
  var sli = $.sli;
  var beg = $.beg;
  var end = $.end;
  var mid = $.mid;
  var att = $.att;
  var mat = $.mat;
  var err = $.err;
  var app = $.app;
  var emp = $.emp;
  var inp = $.inp;
  
  var typ = L.typ;
  var tag = L.tag;
  var rep = L.rep;
  var dat = L.dat;
  
  var cons = L.cons;
  var car = L.car;
  var cdr = L.cdr;
  var nil = L.nil;
  var nrev = L.nrev;
  
  var lis = L.lis;
  
  var nilp = L.nilp;
  var symp = L.symp;
  
  var is = L.is;
  
  var sy = L.sy;
  var nu = L.nu;
  var st = L.st;
  var rx = L.rx;
  
  var isa = L.isa;
  
  ////// Types //////
  
  // r = result; a lisp obj
  // l = length; a js int
  function ps(r, l, o){
    var b = {type: "ps", res: r, len: l};
    if (udfp(o))return b;
    return app(o, b);
  }
  
  function wh(l){
    return {type: "wh", len: l};
  }
  
  function gres(a){
    return a.res;
  }
  
  function glen(a){
    return a.len;
  }
  
  function sres(a, x){
    return a.res = x;
  }
  
  function slen(a, x){
    return a.len = x;
  }
  
  function psp(a){
    return isa("ps", a);
  }
  
  function whp(a){
    return isa("wh", a);
  }
  
  ////// Parser //////
  
  // input: a js str of lisp code
  // output: a lisp obj representing that code
  function prs(a){
    var l = gres(psecn(a));
    if (nilp(cdr(l)))return car(l);
    return cons("do", l);
  }
  
  // input: a js str of lisp code
  // output: a ps obj with res = a lisp obj, and len = length of data parsed
  //           or a wh obj with len = length of whitespace
  function prs1(a){
    if (emp(a))return ps(nil(), 0);
    if (beg(a, "("))return plis(a);
    if (beg(a, "{"))return pobj(a);
    if (beg(a, "["))return pnfn(a);
    if (beg(a, "/"))return prgx(a);
    if (beg(a, "\""))return pstr(a);
    if (beg(a, "|"))return pbsym(a);
    if (beg(a, "#|"))return pbcom(a);
    if (beg(a, "#["))return parr(a);
    if (beg(a, "#("))return pref(a);
    if (beg(a, "'"))return pqt(a);
    if (beg(a, "`"))return pqq(a);
    if (beg(a, ",@"))return puqs(a);
    if (beg(a, ","))return puq(a);
    if (beg(a, "@"))return pspi(a); // splice
    if (beg(a, "~"))return pcmpl(a);
    if (beg(a, ";"))return pcom(a);
    if (beg(a, /^\s/))return pwhi(a);
    if (beg(a, ")", "]", "}"))err(prs1, "Extra end bracket in a = $1", a);
    return psymnum(a);
  }
  
  function plis(a){
    var r = plissec(sli(a, 1));
    slen(r, glen(r)+1);
    return r;
  }
  
  function pwhi(a){
    return wh(mat(/^\s+/, a).length);
  }
  
  function gsymnum(a){
    for (var i = 0; i < len(a); i++){
      if (has(/[\s(){}\[\]|"\/]/, a[i])){
        // for cases like "test(a b c)"
        return sli(a, 0, i);
      }
      if (a[i] === "#" && i+1 !== a.length && inp(a[i+1], "|", "[", "(", "{")){
        // for cases like "test#|hey|#"
        return sli(a, 0, i);
      }
    }
    // for cases like a = "test"
    return a;
  }
  
  function psymnum(a){
    var r = gsymnum(a);
    if (r === "")err(psymnum, "Unknown item a = $1", a);
    if (has(/^-?[0-9]+(\.[0-9]+)?$/, a))return ps(nu(r), r.length);
    return ps(sy(r), r.length);
  }
  
  function pcom(a){
    return wh(mat(/^;[^\n\r]*/, a).length);
  }
  
  function pobj(a){
    var r = psec(sli(a, 1), "}");
    return ps(cons(sy("obj"), gres(r)), glen(r)+2);
  }
  
  function pnfn(a){
    var r = plissec(sli(a, 1), "]");
    return ps(lis(sy("nfn"), gres(r)), glen(r)+1);
  }
  
  function parr(a){
    var r = psec(sli(a, 2), "]");
    return ps(cons(sy("arr"), gres(r)), glen(r)+2);
  }
  
  function pref(a){
    var r = psec(sli(a, 2), ")");
    return ps(cons(sy("#"), gres(r)), glen(r)+2);
  }
  
  function pbcom(a){
    for (var i = 2; i < a.length; i++){
      if (a[i] == "#" && a[i-1] == "|"){
        return wh(i+1);
      }
    }
    err(pbcom, "Block comment not matched in a = $1", a);
  }
  
  function prgx(a){
    var r = gbnd(a, "/");
    var aft = prs1(sli(a, r.length));
    if (psp(aft) && symp(gres(aft)) && !nilp(gres(aft))){
      var f = dat(gres(aft));
      if (!has("g", f))f += "g";
      return ps(rx(new RegExp(mid(r), f)), len(r)+glen(aft));
    }
    return ps(rx(new RegExp(mid(r), "g")), len(r));
  }
  
  function pbsym(a){
    var r = gbnd(a, "|");
    return ps(sy(mid(r)), len(r), {bsym: true});
  }
  
  function pstr(a){
    var r = gbnd(a, "\"");
    return ps(st(JSON.parse(rpl(["\n", "\r", "\t"],
                                ["\\n", "\\r", "\\t"],
                                r))),
              len(r));
  }
  
  function gbnd(a, x){
    var s = false; // slashes
    for (var i = 1; i < len(a); i++){
      if (a[i] == "\\")s = !s;
      else {
        if (a[i] == x && !s){
          return sli(a, 0, i+1);
        }
        s = false;
      }
    }
    err(gbnd, "Bounds x = $1 not matched in a = $2", x, a);
  }
  
  // input: a js str of a list without the first bracket
  //          like "test test . c)"
  // output: a ps obj with res = list of contents and len = length
  function plissec(a, end){
    if (udfp(end))end = ")";
    var r = nil();
    var i = 0;
    var c; // curr
    var dot = false;
    var dotitem = false;
    while (true){
      if (i >= a.length){
        err(plissec, "Brackets $1 not matched in a = $2", end, a);
      }
      if (a[i] === end)break;
      c = prs1(sli(a, i));
      if (!whp(c)){
        if (dot !== false){
          if (dotitem === false){
            // dot before this item and no item between dot and curr
            dotitem = gres(c);
          } else {
            // two items after dot == not lisd
            r = cons(dot, r); // add dot
            r = cons(dotitem, r); // add item btw dot and curr
            r = cons(gres(c), r); // add curr item
            dot = false;
            dotitem === false;
          }
        } else if (!nilp(r) && is(gres(c), sy(".")) && !c.bsym){
          // !nilp(r) == dot is not first in the list (. a)
          dot = gres(c);
        } else {
          // not currently after a dot and c is not a dot
          r = cons(gres(c), r);
        }
      }
      i += glen(c);
    }
    if (dot !== false){
      if (dotitem !== false){
        // one item after dot
        return ps(nrev(r, dotitem), i+1); // i+1 to include the ending )
      }
      // no items after dot
      r = cons(dot, r);
      return ps(nrev(r), i+1);
    }
    // no dots or more than one item after dot
    return ps(nrev(r), i+1);
  }
  
  // no dot version of plissec
  function psec(a, end){
    if (udfp(end))end = ")";
    var r = nil();
    var i = 0;
    var c; // curr
    while (true){
      if (i >= a.length){
        err(psec, "Brackets $1 not matched in a = $2", end, a);
      }
      if (a[i] === end)break;
      c = prs1(sli(a, i));
      if (!whp(c))r = cons(gres(c), r);
      i += glen(c);
    }
    // i+1 to include the ending )
    return ps(nrev(r), i+1);
  }
  
  // parse to end of file
  function psecn(a){
    var r = nil();
    var i = 0;
    var c; // curr
    while (i < a.length){
      c = prs1(sli(a, i));
      if (!whp(c))r = cons(gres(c), r);
      i += glen(c);
    }
    return ps(nrev(r), i);
  }
  
  /*function pqt(a){
    var r = prs1(sli(a, 1));
    if (whp(r))return ps(sy("qt"), 
      return ps(lis(sy("qt"), gres(r)), glen(r)+1);*/
    
    
  
  /*function prs(a, pos){
    var l = pgrp(a, [], 0)[0];
    if (nilp(cdr(l)))return car(l);
    return cons("do", l);
  }
  
  function prs1(a, pos){
    var b = sli(a, pos);
    if (beg(b, "{"))return conn("obj", pafg(b, "}", 1));
    if (beg(b, "("))return plis(b);
    if (beg(b, "["))return lisn("nfn", pafg(b, "]", 1));
    if (beg(b, "\""))return pstr(b);
    if (beg(b, "|"))return psym(b);
    if (beg(b, "#|"))return paft(b, len(gcom(b)));
    if (beg(b, "#\""))return prgx(b);
    if (beg(b, "#["))return conn("arr", pafg(b, "]", 2));
    if (beg(b, "#("))return conn("#", pafg(b, ")", 2));
    if (beg(b, "'"))return lisn("qt", paft(b, 1));
    if (beg(b, "`"))return lisn("qq", paft(b, 1));
    if (beg(b, ",@"))return lisn("uqs", paft(b, 2));
    if (beg(b, "@"))return lisn("splice", paft(b, 1));
    if (beg(b, ","))return lisn("uq", paft(b, 1));
    if (beg(b, "~"))return lisn("cmpl", paft(b, 1));
    //if (beg(b, "!"))return lisn("not", paft(b, 1));*/
    ////if (beg(b, ";"))return paft(b, len(mat(/^;[^\n\r]*/, b)));
    ////if ($.beg(b, /\s/))return paft(b, mat(/^\s+/, b).length);
    ////if (beg(b, ")", "]", "}"))return [b[0], 1];
    ////var s = mat(/^[^(){}"\[\]\s]*/, b);
    /*if (beg(s, "#") && s !== "#"){
      return lisn("qgs", [sli(s, 1), len(s)]);
    }
    if (is(s, "."))return [lis("dot"), 1];
    //if (is(s, "."))return [".", 1];
    if (has(".", s) && !nump(s)){
      if (end(s, "."))return obj(s);
      if (beg(s, "."))return [cons("dtfn", spl(sli(s, 1), ".")), len(s)];
      return [cons(".", spl(s, ".")), len(s)];
    }
    return obj(s);
  }
  
  // (var [o l] (prs1 a pos))
  function paft(a, n){
    return alen(n, prs1(a, n));
  }
  
  function pafg(a, end, n){
    return alen(n, pgrp(a, end, n));
  }
  
  function lisn(x, a){
    return [lis(x, a[0]), a[1]];
  }
  
  function conn(x, a){
    return [cons(x, a[0]), a[1]];
  }
  
  function obj(a){
    return [a, a.length];
  }
  
  function alen(n, a){
    return [a[0], a[1]+n];
  }
  
  function pgrp(a, end, pos){
    var r = prs1(a, pos);
    if (nilp(end)){
      if (r[0] === "")return [[], r[1]];
    } else {
      if (r[0] === "")err(pgrp, "Missing $1", end);
      if (synp(r[0])){
        var p = $.pos(end, r[0]);
        if (p != -1){
          if (p == 0)return [[], r[1]-len(r[0])+p+len(end)];
          return [lis(sli(r[0], 0, p)), r[1]-len(r[0])+p+len(end)];
        }
      }
    }
    var o = pgrp(a, end, pos+r[1]);
    return [cons(r[0], o[0]), r[1]+o[1]];
  }
  
  function plis(a){
    return alen(1, plgrp(a, 1));
  }
  
  function plgrp(a, pos){
    var end = ")";
    var r = prs1(a, pos);
    if (r[0] === "")err(plgrp, "Missing $1", end);
    if (synp(r[0])){
      var p = $.pos(end, r[0]);
      if (p != -1){
        if (p == 0)return [[], r[1]-r[0].length+p+end.length];
        return [lis(sli(r[0], 0, p)), r[1]-r[0].length+p+end.length];
      }
    }
    var o = plgrp(a, pos+r[1]);
    if (iso(r[0], lis("dot")) && a[pos-1] != "("){
    //if (r[0] == "." && a[pos-1] != "("){
      if (nilp(o[0]))err(plgrp, "Missing object after \".\" in a = $1", a);
      if (!nilp(cdr(o[0])))err(plgrp, "More than one object after \".\" in a = $1", a);
      return [car(o[0]), r[1]+o[1]];
    }
    return [cons(r[0], o[0]), r[1]+o[1]];
  }
  
  function pstr(a){
    var r = gstr(a);
    return [s(JSON.parse(r)), len(r)];
  }
  
  function gstr(a){
    return gbnd(a, "\"");
  }
  
  function psym(a){
    var r = gbnd(a, "|");
    return [mid(r), len(r)];
  }
  
  function gbnd(a, x){
    var s = false; // slashes
    for (var i = 1; i < len(a); i++){
      if (a[i] == "\\")s = !s;
      else {
        if (a[i] == x && !s){
          return sli(a, 0, i+1);
        }
        s = false;
      }
    }
    err(gbnd, "Bounds x = $1 not matched in a = $2", x, a);
  }
  
  function gcom(a){
    for (var i = 2; i < a.length; i++){
      if (a[i] == "#" && a[i-1] == "|"){
        return sli(a, 0, i+1);
      }
    }
    err(gcom, "Block comment not matched in a = $1", a);
  }
  
  function prgx(a){
    var r = gstr(sli(a, 1));
    var s = rpl("\\\"", "\"", mid(r));
    return [new RegExp(s, "g"), len(r)+1];
  }*/
  
  ////// Object exposure //////
  
  att({
    ps: ps,
    wh: wh,
    gres: gres,
    glen: glen,
    sres: sres,
    slen: slen,
    psp: psp,
    whp: whp,
    
    prs: prs,
    prs1: prs1,
    plis: plis,
    pwhi: pwhi,
    gsymnum: gsymnum,
    psymnum: psymnum,
    plissec: plissec,
    psec: psec,
    psecn: psecn
  }, L);
  
  ////// Testing //////
  
  //al(prs("(+ 2 3)"));
  
})(window);
