/***** Lisp Parser Devel *****/

/* requires tools >= 3.0 */

(function (win, udef){
  ////// Import //////
  
  var arrp = $.arrp;
  var udefp = $.udefp;
  var inp = $.inp;
  var al = $.al;
  var len = $.len;
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
  
  ////// Parser //////
  
  function prs(a){
    var lst = prslis(a);
    if (nilp(cdr(lst)))return car(lst);
    return cons("do", lst);
  }
  
  function prs1(a){
    if (isParen(a))return prslis(rembds(a));
    if (isSParen(a))return prs1("(fn (%) (" + slc(a, 2, len(a)-1) + "))");
    if (isBrac(a))return ["&arr", prsarr(rembds(a))];
    //if (isSBrac(a))return prs1("(assoc " + slc(a, 2, len(a)-1) + ")");
    if (isStr(a))return ["&str", JSON.parse(a)];
    if (isNum(a))return Number(a);
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
  
  function prsarr(a, r, pos){
    if (udefp(r))r = [];
    if (udefp(pos))pos = 0;
    var o = next(a, pos);
    if (o[1] == "")return r;
    push(prs1(o[1]), r);
    return prsarr(a, r, o[0]+len(o[1]));
  }
  
  function obj(a, pos){
    a = slc(a, pos);
    if (beg(a, "{", "(", "[")){
      var ds = {"(": ")", "[": "]", "{": "}"};
      var d = [a[0], ds[a[0]]];
      var lvl = 1;
      for (var i = 1; i < len(a); i++){
        if (a[i] == d[0])lvl++;
        else if (a[i] == d[1])lvl--;
        if (lvl == 0)return slc(a, 0, i+1);
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
    if (beg(a, "#(", "'", "`", "~", "!"))return a[0] + obj(a, 1);
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
  
  function isNum(a){
    return has(/^-?[0-9]+(\.[0-9]+)?$/, a);
  }
  
  function isSpace(a){
    return has(/^[\s,]+$/, a) || has(/^;[^\n\r]*$/, a);
  }
  
  ////// Lisp functions //////
  
  function nilp(a){
    return arrp(a) && len(a) == 0;
  }
  
  function car(a){
    return (a[0] !== udef)?a[0]:[];
  }
  
  function cdr(a){
    return (a[1] !== udef)?a[1]:[];
  }
  
  function cons(a, b){
    return [a, b];
  }
  
  ////// Object exposure //////
  
  win.Lisp = {
    prs: prs,
    
    nilp: nilp,
    car: car,
    cdr: cdr,
    cons: cons
  };
  
  ////// Testing //////
  
  //al(prs("(+ 2 3)"));
  
})(window);
