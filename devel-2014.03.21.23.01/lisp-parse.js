/***** Lisp Parser Devel *****/

/* require tools >= 3.1 */
/* require lisp-tools */

(function (win, udf){
  ////// Import //////
  
  var udfp = $.udfp;
  var has = $.has;
  var rpl = $.rpl;
  var len = $.len;
  var sli = $.sli;
  var mid = $.mid;
  var beg = $.beg;
  var bnd = $.bnd;
  var att = $.att;
  var mat = $.mat;
  var err = $.err;
  
  var s = L.s;
  var nilp = L.nilp;
  var car = L.car;
  var cdr = L.cdr;
  var cons = L.cons;
  
  ////// Processing functions //////
  
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
    if (sbrap(a))return prs1("(fn (_) (" + mid2(a) + "))");
    if (brap(a))return prs1("(arr " + mid2(a) + ")");
    if (sparp(a))return prs1("(# " + mid2(a) + ")");
    if (strp(a))return s(JSON.parse(a));
    if (rgxp(a))return prgx(a);
    if (curp(a))return prs1("(obj " + mid2(a) + ")");
    if (beg(a, "'"))return prs1("(qt " + obj(a, 1) + ")");
    if (beg(a, "`"))return prs1("(qq " + obj(a, 1) + ")");
    if (beg(a, ",@"))return prs1("(uqs " + obj(a, 2) + ")");
    if (beg(a, ","))return prs1("(uq " + obj(a, 1) + ")");
    if (beg(a, "!"))return prs1("(not " + obj(a, 1) + ")");
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
    a = sli(a, pos);
    if (beg(a, "{", "(", "[")){
      var ds = {"(": ")", "[": "]", "{": "}"};
      var d = [a[0], ds[a[0]]];
      var p = 1; // paren lvl
      var s = false; // string lvl
      for (var i = 1; i < len(a); i++){
        switch (a[i]){
          case d[0]: if (!s)p++; break;
          case d[1]: if (!s)p--; break;
          case "\"": if (a[i-1] != "\\")s = !s; break;
        }
        if (p == 0)return sli(a, 0, i+1);
      }
      err(obj, "Brackets not matched in a = $1", a);
    }
    if (beg(a, "\"")){
      for (var i = 1; i < len(a); i++){
        if (a[i] == "\"" && a[i-1] != "\\"){
          return sli(a, 0, i+1);
        }
      }
      err(obj, "Double quotes not matched in a = $1", a);
    }
    if (beg(a, ",@"))return ",@" + obj(a, 2);
    if (beg(a, "#\"", "#[", "#(", "'", "`", "~", "!"))return a[0] + obj(a, 1);
    if (beg(a, ";"))return mat(/^[^\n\r]*/, a);
    if (beg(a, /\s/))return mat(/^\s+/, a);
    return mat(/^\S*/, a);
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
    return has(/^\s+$/, a) || has(/^;[^\n\r]*$/, a);
  }
  
  ////// Object exposure //////
  
  att({prs: prs}, L);
  
  ////// Testing //////
  
  //al(prs("(+ 2 3)"));
  
})(window);
