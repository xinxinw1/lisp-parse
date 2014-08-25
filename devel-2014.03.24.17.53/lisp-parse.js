/***** Lisp Parser Devel *****/

/* require tools >= 3.1 */
/* require lisp-tools */

(function (win, udf){
  ////// Import //////
  
  var udfp = $.udfp;
  var is = $.is;
  var has = $.has;
  var rpl = $.rpl;
  var len = $.len;
  var sli = $.sli;
  var but = $.but;
  var mid = $.mid;
  var att = $.att;
  var mat = $.mat;
  var err = $.err;
  
  var s = L.s;
  var nilp = L.nilp;
  var car = L.car;
  var cdr = L.cdr;
  var cons = L.cons;
  
  ////// Processing functions //////
  
  function beg(a){
    var ag = arguments;
    var l = ag.length;
    for (var i = 1; i < l; i++){
      if (beg1(a, ag[i]))return true;
    }
    return false;
  }
  
  function beg1(a, x){
    var lx = x.length;
    var la = a.length;
    if (lx > la)return false;
    for (var i = 0; i < lx; i++){
      if (a[i] !== x[i])return false;
    }
    return true;
  }
  
  function end(a){
    var ag = arguments;
    var l = ag.length;
    for (var i = 1; i < l; i++){
      if (end1(a, ag[i]))return true;
    }
    return false;
  }
  
  function end1(a, x){
    var lx = x.length;
    var la = a.length;
    if (lx > la)return false;
    for (var i = la, j = lx; j >= 0; i--, j--){
      if (a[i] !== x[j])return false;
    }
    return true;
  }
  
  function bnd(a, x, y){
    return beg1(a, x) && end1(a, y);
  }
  
  function mid2(a){
    if (beg(a, "#"))return sli(a, 2, len(a)-1);
    return mid(a);
  }
  
  ////// Parser //////
  
  function prs(a){
    var l = plis(a);
    if (nilp(cdr(l)))return car(l);
    return cons("do", l);
  }
  
  function prs1(a){
    if (parp(a))return plis(mid2(a));
    if (sbrap(a))return prs1("(nfn (" + mid2(a) + "))");
    if (brap(a))return prs1("(arr " + mid2(a) + ")");
    if (sparp(a))return prs1("(# " + mid2(a) + ")");
    if (strp(a))return s(JSON.parse(a));
    if (rgxp(a))return prgx(a);
    if (curp(a))return prs1("(obj " + mid2(a) + ")");
    if (beg(a, "'"))return prs1("(qt " + sli(a, 1) + ")");
    if (beg(a, "`"))return prs1("(qq " + sli(a, 1) + ")");
    if (beg(a, ",@"))return prs1("(uqs " + sli(a, 2) + ")");
    if (beg(a, ","))return prs1("(uq " + sli(a, 1) + ")");
    if (beg(a, "#") && a !== "#"){
      return prs1("(qgs " + sli(a, 1) + ")");
    }
    if (beg(a, "!"))return prs1("(not " + sli(a, 1) + ")");
    if (nump(a))return a;
    if (has(".", a)){
      if (is(a, "."))return a;
      //if (end(a, "."))return prs1("(nwfn " + but(a) + ")");
      if (beg(a, "."))return prs1("(dtfn " + rpl(".", " ", sli(a, 1)) + ")");
      return prs1("(. " + rpl(".", " ", a) + ")");
    }
    return a;
  }
  
  function plis(a, pos){
    if (udfp(pos))pos = 0;
    var o = next(a, pos);
    if (o[1] == "")return [];
    if (o[1] == "." && pos != 0)return dot(a, o[0]+len(o[1]));
    return cons(prs1(o[1]), plis(a, o[0]+len(o[1])));
  }
  
  function dot(a, pos){
    var o = next(a, pos);
    if (o[1] == "")err(dot, "Missing object after \".\" in a = $1", a);
    var n = next(a, o[0]+len(o[1]));
    if (n[1] != "")err(dot, "More than one object after \".\" in a = $1", a);
    return prs(o[1]);
  }
  
  function prgx(a){
    var s = rpl("\\\"", "\"", mid2(a));
    return new RegExp(s, "g");
  }
  
  function next(a, pos){
    var o = obj(a, pos);
    if (spcp(o))return next(a, pos+len(o));
    return [pos, o];
  }
  
  function obj(a, pos){
    var b = sli(a, pos);
    if (beg(b, "{", "(", "[")){
      var ds = {"(": ")", "[": "]", "{": "}"};
      var d = [b[0], ds[b[0]]];
      var p = 1; // paren lvl
      var s = false; // string lvl
      for (var i = 1; i < len(b); i++){
        switch (b[i]){
          case d[0]: if (!s)p++; break;
          case d[1]: if (!s)p--; break;
          case "\"": if (b[i-1] != "\\")s = !s; break;
        }
        if (p == 0)return sli(b, 0, i+1);
      }
      err(obj, "Brackets not matched in a = $1", a);
    }
    if (beg(b, "\"")){
      for (var i = 1; i < len(b); i++){
        if (b[i] == "\"" && b[i-1] != "\\"){
          return sli(b, 0, i+1);
        }
      }
      err(obj, "Double quotes not matched in a = $1", a);
    }
    if (beg(b, "#|")){
      for (var i = 3; i < len(b); i++){
        if (b[i] == "#" && b[i-1] == "|"){
          return sli(b, 0, i+1);
        }
      }
      err(obj, "Block comment not matched in a = $1", a);
    }
    if (beg(b, ",@"))return ",@" + obj(b, 2);
    if (beg(b, "#\"", "#[", "#(", "'", "`", ",", "~", "!")){
      return b[0] + obj(b, 1);
    }
    if (beg(b, ";"))return mat(/^[^\n\r]*/, b);
    if ($.beg(b, /\s/))return mat(/^\s+/, b);
    return mat(/^\S*/, b);
  }
  
  function parp(a){
    return bnd(a, "(", ")");
  }
  
  function sparp(a){
    return bnd(a, "#(", ")");
  }
  
  function brap(a){
    return bnd(a, "[", "]");
  }
  
  function sbrap(a){
    return bnd(a, "#[", "]");
  }
  
  function curp(a){
    return bnd(a, "{", "}");
  }
  
  function strp(a){
    return bnd(a, "\"", "\"");
  }
  
  function rgxp(a){
    return bnd(a, "#\"", "\"");
  }
  
  function nump(a){
    return has(/^-?[0-9]+(\.[0-9]+)?$/, a);
  }
  
  function spcp(a){
    return has(/^\s+$/, a) || has(/^;[^\n\r]*$/, a) || bnd(a, "#|", "|#");
  }
  
  ////// Object exposure //////
  
  att({prs: prs}, L);
  
  ////// Testing //////
  
  //al(prs("(+ 2 3)"));
  
})(window);
