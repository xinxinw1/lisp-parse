/***** Lisp Parser Devel *****/

/* require tools >= 3.0 */

(function (win, udef){
  ////// Import //////
  
  var arrp = $.arrp;
  var udefp = $.udefp;
  var inp = $.inp;
  var al = $.al;
  var len = $.len;
  var lpos = $.lpos;
  var slc = $.slc;
  var has = $.has;
  var beg = $.beg;
  var end = $.end;
  var push = $.push;
  var mtch = $.mtch;
  var err = $.err;
  
  ////// Processing functions //////
  
  function rembds(a){
    return slc(a, 1, len(a)-1);
  }
  
  ////// Lisp functions //////
  
  function nilp(a){
    return arrp(a) && len(a) == 0;
  }
  
  function car(a){
    return !udefp(a[0])?a[0]:[];
  }
  
  function cdr(a){
    return !udefp(a[1])?a[1]:[];
  }
  
  function cons(a, b){
    return [a, b];
  }
  
  ////// Parser //////
  
  function prs(a){
    var lis = prslis(a);
    if (nilp(cdr(lis)))return car(lis);
    return cons("do", lis);
  }
  
  function prs1(a){
    if (isParen(a))return prslis(rembds(a));
    if (isBrac(a))return prs1("(fn (_) (" + rembds(a) + "))");
    if (isSBrac(a))return prs1("(arr " + slc(a, 2, len(a)-1) + ")");
    if (isSParen(a))return prs1("(# " + slc(a, 2, len(a)-1) + ")");
    if (isStr(a))return ["&str", JSON.parse(a)];
    if (isRgx(a))return prsrgx(a);
    if (isCurl(a))return prs1("(obj " + rembds(a) + ")");
    if (beg(a, "'"))return prs1("(qt " + obj(a, 1) + ")");
    if (beg(a, "`"))return prs1("(qq " + obj(a, 1) + ")");
    if (beg(a, "~@"))return prs1("(uqs " + obj(a, 2) + ")");
    if (beg(a, "~"))return prs1("(uq " + obj(a, 1) + ")");
    if (beg(a, "!"))return prs1("(not " + obj(a, 1) + ")");
    return a;
  }
  
  function prslis(a, pos){
    if (udefp(pos))pos = 0;
    var o = next(a, pos);
    if (o[1] == "")return [];
    if (o[1] == "." && pos != 0)return dot(a, o[0]+len(o[1]));
    return cons(prs1(o[1]), prslis(a, o[0]+len(o[1])));
  }
  
  function dot(a, pos){
    var o = next(a, pos);
    if (o[1] == "")err(dot, "Missing object after \".\" in a = $1", a);
    var n = next(a, o[0]+len(o[1]));
    if (n[1] != "")err(dot, "More than one object after \".\" in a = $1", a);
    return prs(o[1]);
  }
  
  function next(a, pos){
    var o = obj(a, pos);
    if (isSpace(o))return next(a, pos+len(o));
    return [pos, o];
  }
  
  function prsrgx(a){
    var bnd = lpos("\"", a);
    return new RegExp(slc(a, 2, bnd), slc(a, bnd+1));
  }
  
  function obj(a, pos){
    a = slc(a, pos);
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
        if (p == 0)return slc(a, 0, i+1);
      }
      err(obj, "Brackets not matched in a = $1", a);
    }
    if (beg(a, "\"")){
      for (var i = 1; i < len(a); i++){
        if (a[i] == "\"" && a[i-1] != "\\"){
          return slc(a, 0, i+1);
        }
      }
      err(obj, "Double quotes not matched in a = $1", a);
    }
    if (beg(a, "~@"))return "~@" + obj(a, 2);
    if (beg(a, "#\"")){
      var o = obj(a, 1);
      var o2 = obj(a, 1+len(o));
      if (has(/^[a-z]+$/, o2))return a[0] + o + o2;
      return a[0] + o;
    }
    if (beg(a, "#[", "#(", "'", "`", "~", "!"))return a[0] + obj(a, 1);
    if (beg(a, ";"))return mtch(/^[^\n\r]*/, a);
    if (beg(a, /[\s,]/))return mtch(/^[\s,]+/, a);
    return mtch(/^[^\s,]*/, a);
  }
  
  function isParen(a){
    return beg(a, "(") && end(a, ")");
  }
  
  function isSParen(a){
    return beg(a, "#(") && end(a, ")");
  }
  
  function isBrac(a){
    return beg(a, "[") && end(a, "]");
  }
  
  function isSBrac(a){
    return beg(a, "#[") && end(a, "]");
  }
  
  function isCurl(a){
    return beg(a, "{") && end(a, "}");
  }
  
  function isStr(a){
    return beg(a, "\"") && end(a, "\"");
  }
  
  function isRgx(a){
    return beg(a, "#\"") && has(/^[a-z]*$/, slc(a, lpos("\"", a)+1));
  }
  
  function isNum(a){
    return has(/^-?[0-9]+(\.[0-9]+)?$/, a);
  }
  
  function isSpace(a){
    return has(/^[\s,]+$/, a) || has(/^;[^\n\r]*$/, a);
  }
  
  ////// Object exposure //////
  
  win.Lisp = {
    prs: prs
  };
  
  ////// Testing //////
  
  //al(prs("(+ 2 3)"));
  
})(window);
