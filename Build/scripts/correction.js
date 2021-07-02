// ------------------ LOAD SCRIPTS -------------------
var scripts = ["scripts/chromeRuntime"]
var scriptsLoaded = 0;

function scriptLoaded()
{
    scriptsLoaded++;
    if(scriptsLoaded === scripts.length)
        loaded();
}

scripts.forEach(function(scriptName){
    var script = document.createElement("script");
    script.src = scriptName + ".js";
    script.addEventListener("load", scriptLoaded);
    document.head.appendChild(script);
});
// ------------------ ------------- -------------------

// ------------------ ON LOAD -------------------
OrangeBerry.onLoad.push(onLoad)
function onLoad()
{
    OrangeBerry.Correction = {}
    OrangeBerry.Correction.defaultRootName = "Form";
    // Validation GOTO
    $("button#correction-troubleshoot").on("click", function(event){       
        var isOpen = toggleCorrectionOverlay();          
        post("troubleshootStart");
    });    

    $(".correction-overlay .fa-window-close, .correction-overlay .no-issues-found button.close").on("click", function(){
        var isOpen = toggleCorrectionOverlay();                
    });

    $(".correction-overlay .issues-found button.troubleshoot-fix").on("click", function() {
        if(OrangeBerry.Correction.Duplicates.requiresFixing) {
            var duplicatesCopy = JSON.parse(JSON.stringify(OrangeBerry.Correction.Duplicates));
            delete duplicatesCopy["fieldsBy"];
            post("troubleshootFix", {
                duplicates: duplicatesCopy
            });
        }
    });

    $(".correction-overlay .issues-found button.troubleshoot-copy").on("click", function(event){
        if(OrangeBerry.Correction.Duplicates.requiresFixing){
            var duplicatesCopy = JSON.parse(JSON.stringify(OrangeBerry.Correction.Duplicates));
            delete duplicatesCopy["fieldsBy"];
            
            var info = "";
            Object.keys(duplicatesCopy).forEach(function(key){
                if(Object.keys(duplicatesCopy[key]).length > 0)
                {
                    var displayName = key === "internalNames" ? "Duplicate Field Internal Names" : 
                                      key === "elementNames" ? "Duplicate Element Sources (Names)" : 
                                      key === "ids" ? "Duplicate Field Ids" : 
                                      key === "uuids" ? "Duplicate Element UUIDs" : 
                                      key === "missingFields" ? "Fields with out View Elements" : 
                                      key === "missingElements" ? "Elements with out Fields" : "";
                    
                    info += "# " + displayName + "\n";
                    Object.keys(duplicatesCopy[key]).forEach(function(_key){
                        info += "  - " + _key + " \n";
                    });
                }
            });
            
            if(info.length > 0)
                copy(info.substring(0, info.length - 1), this);
        }
    });
}
// ------------------ ------------- -------------------

// ------------------ FUNCTIONS -------------------
var copy = function(text, button)
{
    var originalText = button.textContent;
    navigator.clipboard.writeText(text).then(function() {        
        button.textContent = "Copied!";
        setTimeout(function(){
            button.textContent = originalText;
        }, 300);
      }, function(err) {
        button.textContent = "Not Copied...";
        setTimeout(function(){
            button.textContent = originalText;
        }, 300);
      });    
}

var startTroubleshooting = function(data)
{    if(!data)
        return;
    
    OrangeBerry.Correction.fields = JSON.parse(data.fields)
    OrangeBerry.Correction.viewElements = $(data.viewDefinition).children().toArray();
    OrangeBerry.Correction.defaultRootName = data.formName;
    
    OrangeBerry.Correction.Duplicates = {};
    OrangeBerry.Correction.Duplicates.fieldsBy = {};

    var $list = $(".correction-overlay .troubleshoot-list");
    
    OrangeBerry.Correction.Duplicates.internalNames = troubleshootItem($list.find(".troubleshoot-list-item[check-for='internal-names']"), findDuplicateFields);
    OrangeBerry.Correction.Duplicates.elementNames = troubleshootItem($list.find(".troubleshoot-list-item[check-for='element-names']"), findDuplicateElements);
    OrangeBerry.Correction.Duplicates.ids = troubleshootItem($list.find(".troubleshoot-list-item[check-for='ids']"), findDuplicateIds);
    OrangeBerry.Correction.Duplicates.uuids = troubleshootItem($list.find(".troubleshoot-list-item[check-for='uuids']"), findDuplicateUuids)
    OrangeBerry.Correction.Duplicates.missingFields = troubleshootItem($list.find(".troubleshoot-list-item[check-for='missing-fields']"), findMissingFields)
    OrangeBerry.Correction.Duplicates.missingElements = troubleshootItem($list.find(".troubleshoot-list-item[check-for='missing-elements']"), findMissingElements)
    
    var $options = $(".troubleshoot-issues-options");    
    (OrangeBerry.Correction.Duplicates.requiresFixing? $options.find(".issues-found") : $options.find(".no-issues-found")).removeClass("hide");
    (!OrangeBerry.Correction.Duplicates.requiresFixing? $options.find(".issues-found") : $options.find(".no-issues-found")).addClass("hide");
}

var troubleshootItem = function($itemElement, troubleshootFunction)
{
    $itemElement.removeClass("hide");
    $checking = $itemElement.find(".troubleshoot-state.checking");
    $checking.removeClass("hide");
    
    var result = troubleshootFunction();    
    var invalidItemLength = Object.keys(result).length;

    OrangeBerry.Correction.Duplicates.requiresFixing = OrangeBerry.Correction.Duplicates.requiresFixing || Object.keys(result).length > 0;
    var isValid = invalidItemLength === 0;
    $checking.addClass("hide");
    $itemElement.find(".troubleshoot-state." + (isValid? "valid" : "invalid")).removeClass("hide");
    $itemElement.find(".troubleshoot-state." + (isValid? "invalid" : "valid")).addClass("hide");

    return result;
}

var _getDuplicates = function(obj)
{
    var duplicates = {};
    Object.keys(obj).forEach(function(key){
        if(obj[key].length > 1)
            duplicates[key] = obj[key];
    });

    console.log(JSON.stringify(duplicates));

    return duplicates;
}

var findDuplicateFields = function() {    
    console.log("find duplicate names");

    if(!OrangeBerry.Correction.Duplicates.fieldsBy.scope)
        OrangeBerry.Correction.Duplicates.fieldsBy.scope = _aggregateFieldsByScope(OrangeBerry.Correction.fields, OrangeBerry.Correction.defaultRootName, {});
    
    var duplicates = _getDuplicates(OrangeBerry.Correction.Duplicates.fieldsBy.scope);

    console.log(JSON.stringify(duplicates));

    return duplicates;
}

var findDuplicateUuids = function(){
    console.log("find duplicate uuids")
    if(!OrangeBerry.Correction.Duplicates.fieldsBy.uuid)
        OrangeBerry.Correction.Duplicates.fieldsBy.uuid = _aggregateFieldsByUuid(OrangeBerry.Correction.viewElements, OrangeBerry.Correction.defaultRootName, {});

    var duplicates = _getDuplicates(OrangeBerry.Correction.Duplicates.fieldsBy.uuid);

    console.log(JSON.stringify(duplicates));

    return duplicates;
}

var findDuplicateIds = function() {
    console.log("find duplicate ids")

    if(!OrangeBerry.Correction.Duplicates.fieldsBy.id)
        OrangeBerry.Correction.Duplicates.fieldsBy.id = _aggregateFieldsById(OrangeBerry.Correction.fields, {});

    var duplicates = _getDuplicates(OrangeBerry.Correction.Duplicates.fieldsBy.id);

    console.log(JSON.stringify(duplicates));

    return duplicates;
}

var findDuplicateElements = function(){
    console.log("find duplicate elements")
    if(!OrangeBerry.Correction.Duplicates.fieldsBy.elementScope)
        OrangeBerry.Correction.Duplicates.fieldsBy.elementScope = _aggregateElementsByScope(OrangeBerry.Correction.viewElements, OrangeBerry.Correction.defaultRootName, {});

    var duplicates = _getDuplicates(OrangeBerry.Correction.Duplicates.fieldsBy.elementScope);

    console.log(JSON.stringify(duplicates));

    return duplicates;
}

var findMissingFields = function() {
    if(!OrangeBerry.Correction.Duplicates.fieldsBy.scope)
        OrangeBerry.Correction.Duplicates.fieldsBy.scope = _aggregateFieldsByScope(OrangeBerry.Correction.fields, OrangeBerry.Correction.defaultRootName, {});
    
    if(!OrangeBerry.Correction.Duplicates.fieldsBy.elementScope)
        OrangeBerry.Correction.Duplicates.fieldsBy.elementScope = _aggregateElementsByScope(OrangeBerry.Correction.viewElements, OrangeBerry.Correction.defaultRootName, {});
    
    return _findMissingFields(OrangeBerry.Correction.Duplicates.fieldsBy.scope, OrangeBerry.Correction.Duplicates.fieldsBy.elementScope, {});
}

var findMissingElements = function() {
    if(!OrangeBerry.Correction.Duplicates.fieldsBy.scope)
        OrangeBerry.Correction.Duplicates.fieldsBy.scope = _aggregateFieldsByScope(OrangeBerry.Correction.fields, OrangeBerry.Correction.defaultRootName, {});
    
    if(!OrangeBerry.Correction.Duplicates.fieldsBy.elementScope)
        OrangeBerry.Correction.Duplicates.fieldsBy.elementScope = _aggregateElementsByScope(OrangeBerry.Correction.viewElements, OrangeBerry.Correction.defaultRootName, {});
    
    return _findMissingElements(OrangeBerry.Correction.Duplicates.fieldsBy.scope, OrangeBerry.Correction.Duplicates.fieldsBy.elementScope, {});
}

var _findMissingFields = function(fieldsByScope, elementsByScope, missingElements){    
    elementsByScope = Object.keys(elementsByScope);
    Object.keys(fieldsByScope).forEach(function(fieldScope) {                        
        if(elementsByScope.indexOf(fieldScope) < 0)
            missingElements[fieldScope] = fieldsByScope[fieldScope];        
    });
    
    return missingElements;
}

var _findMissingElements = function(fieldsByScope, elementsByScope, missingElements){    
    fieldsByScope = Object.keys(fieldsByScope);
    Object.keys(elementsByScope).forEach(function(elementScope) {                        
        if(fieldsByScope.indexOf(elementScope) < 0)
            missingElements[elementScope] = elementsByScope[elementScope];        
    });
    
    return missingElements;
}

var _aggregateFieldsById = function(fields, _fields){    
    fields.forEach(function(field) {                
        var id = field.Index;
        if(Object.keys(_fields).indexOf(id) >= 0)        
            _fields[id].push(field);   
        else
            _fields[id] = [field];

        if(field.ChildType)                    
            _fields = _aggregateFieldsById(field.ChildType.Fields, _fields);      
    });    

    return _fields;
}

var _aggregateFieldsByUuid = function(elements, scope, _fields) {
    elements.forEach(function(element) {
        var tagName = element.tagName.toLowerCase();
        if(tagName === "progressbar" || tagName === "pagebreak")
            return;

        var $element = $(element);
        var uuid = $element? $element.attr("uuid") : null;
        if($element && uuid){            
            if(Object.keys(_fields).indexOf(uuid) < 0)
                _fields[uuid] = [element];
            else
                _fields[uuid].push(element);                
            
            var childElements = element.children;
            if(childElements && childElements.length > 0)
                _fields = _aggregateFieldsByUuid(Array.from(childElements), scope + "." + $element.attr("source"), _fields);
        }
    });

    return _fields;
}

var _aggregateElementsByScope = function(elements, scope, _fields) {
    elements.forEach(function(element) {
        var tagName = element.tagName.toLowerCase();
        if(tagName === "progressbar" || tagName === "pagebreak")
            return;

        var $element = $(element);
        var name = $element? $element.attr("source") : null;        
        if($element && name){            
            var nameScope = scope + "." + name;
            if(Object.keys(_fields).indexOf(nameScope) < 0)
                _fields[nameScope] = [element];
            else
                _fields[nameScope].push(element);                
            
            var childElements = element.children;
            if(childElements && childElements.length > 0)
                _fields = _aggregateElementsByScope(Array.from(childElements), nameScope, _fields);
        }
    });

    return _fields;
}

var _aggregateFieldsByScope = function(fields, scope, _fields) {
    fields.forEach(function(f) { 
        var name = f.InternalName;
        var scopeName = scope + "." + name;
        
        if(Object.keys(_fields).indexOf(scopeName) >= 0)        
            _fields[scopeName].push(f);   
        else
            _fields[scopeName] = [f];
        
        if(f.ChildType)                    
            _fields = _aggregateFieldsByScope(f.ChildType.Fields, scope + "." + f.InternalName, _fields);        
    });

    return _fields;
}

var _getChildElements = function ($element, exludePlaceHolders) {
    var container = $element.children('.c-forms-layout-section-container');
    var children;

    if ($element.is("#c-forms-layout-elements"))
        container = $element;
    else if ($element.is(".c-columns"))
        children = $element.children(".c-forms-layout-element");
    else if ($element.is(".c-forms-row"))
        children = $element.children(".c-columns").children(".c-forms-layout-element");
    else if ($element.hasClass("c-forms-layout-table"))
        children = $element.find(".c-forms-layout-element");
    else {
        var repeatingContainer = container.children('.c-forms-layout-repeatingsection-container');
        if (repeatingContainer.length > 0)
            container = repeatingContainer;
    }

    if (!children)
        children = container.children(".c-forms-row").children(".c-columns").children(".c-forms-layout-element");

    if (exludePlaceHolders)
        return children.filter(function(element) { return !$(element).hasClass("c-forms-layout-placeholder"); });

    return children;
}

// ------------------ ------------- -------------------

// ------------------ EVENTS -------------------
chrome.runtime.onMessage.addListener((message, sender, request) => {
    if(message.msg !== 'troubleshootData')
        return;

    startTroubleshooting(message.data);
});

// addPopupListener("troubleshootingComplete", function(request){
   
// });
// ------------------ ------------- -------------------