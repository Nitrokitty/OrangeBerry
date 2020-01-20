
var duplicateSPFields = function(fields) {
    var spFields = flatMapFields(fields);
    var dict = {};
    spFields.filter(function(field){
        return spFields.filter(function(_field) { return formatSPName(_field.get_Name()) === formatSPName(field.get_Name()) }).length > 1;
    }).map(function(field){
        var key = formatSPName(field.get_Name());
        dict[key] = dict[key] || [];
        dict[key].push(field);
    });

    return dict;
}

var flatMapFields = function(fields)
{    
    var arr = [];

    fields.forEach(function(f){
        arr.push(f);
        if(f.get_ChildType())
            arr.concat(flatMapFields(f.get_ChildType().get_Fields()));
    });
    return arr;
}

var formatSPName = function(name)
{
    var _name = name.substring(0, 32).replace("\u200B", "").replace("\u00A0 ", " ").replace(" \u00A0", " ").replace("\u00A0", " ");
    Object.keys(encodings).forEach(function(key){
        _name = _name.replace(key, encodings[key]);
    });
    return _name;
}

var encodings = {
    "~": "_x007e_",
    "!": "_x0021_",
    "@": "_x0040_",
    "#": "_x0023_",
    "$": "_x0024_",
    "%": "_x0025_",
    "^": "_x005e_",
    "&": "_x0026_",
    "*": "_x002a_",
    "(": "_x0028_",
    ")": "_x0029_",
    "+": "_x002b_",
    "-": "_x002d_",
    "–": "_x2013_",
    "—": "_x2014_",
    "=": "_x003d_",
    "{": "_x007b_",
    "}": "_x007d_",
    ":": "_x003a_",
    "\"": "_x0022_",
    "|": "_x007c_",
    ";": "_x003b_",
    "'": "_x0027_",
    "\\": "_x005c_",
    "<": "_x003c_",
    ">": "_x003e_",
    "?": "_x003f_",
    ",": "_x002c_",
    ".": "_x002e_",
    "/": "_x002f_",
    "`": "_x0060_",
    " ": "_x0020_",
    "[": "_x005b_",
    "]": "_x005d_"
};