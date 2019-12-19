var interval = setInterval(function(){
    if(this.name !== "c-content"){
        clearInterval(interval);
        return;    
    }

    if(!window.OrangeBerry){
        window.OrangeBerry = { 
            "Cognito": new CognitoObject()
        }
    }

    if(window.OrangeBerry.Cognito.isLoaded){
        init();    
        clearInterval(interval);
    }
}, 100);

function init() {        
    this.OrangeBerry.View = new View();
    this.OrangeBerry.Cognito.init();    

    window.addEventListener("message", function(event) {                         
        if(!event.origin.match(/https?:\/\/services.cognitoforms.com/g) || event.data.by != "OrangeBerry"){            
            return;
        }

        if(event.data.change === "internalName" || event.data.change === "name"){
            this.OrangeBerry.Cognito.update();
            this.OrangeBerry.View.update();           
        }

        if(event.data.msg === "validation")
        {
            if(!event.data.success)
                return;

            OrangeBerry.Cognito.updateValidationResults(event.data.results.results);
            focusInvalidElements(event.data.results.results, event.data.goto, event.data.currentElement);
        }
      }, false);

      chrome.runtime.onMessage.addListener(
        function(request) {
            if (request.msg === "search") {
                OrangeBerry.Search = {}
                OrangeBerry.Search.parentNames = [];
                OrangeBerry.Search.elements = [];
                OrangeBerry.Search.fields = [];
                OrangeBerry.Search.color = request.data.color;
                OrangeBerry.Search.exactMatch = request.data.exactMatch;
                OrangeBerry.Search.include = request.data.include;

                var elements = fieldSearch(request.data.term, this.OrangeBerry.Cognito.fields, OrangeBerry.Search.exactMatch);
                highlightElements(elements, OrangeBerry.Search.color, request.data.clear);
                if(elements.length === 1)
                    OrangeBerry.Cognito.focus(elements[0]);
                
                chrome.runtime.sendMessage({
                    msg: "searchComplete", 
                    data: {
                        by: "OrangeBerry",
                        fields: JSON.stringify(this.OrangeBerry.Cognito.fields)
                    }
                }); 
            }
        }
    );

    chrome.runtime.onMessage.addListener(
        function(request) {
            if (request.msg === "goto") {
                var results = OrangeBerry.Cognito.validate(request.data.selector);
                if(results)
                {
                    console.log("has results")                    
                    focusInvalidElements(results, request.data.selector, OrangeBerry.Cognito.currentElement || 0);
                }
                else
                    console.log("doesnt have results")
            }
        }
    );
}

var focusInvalidElements = function(results, _goto, currentElement)
{    
    currentElement = currentElement || 0;
    var resultKeys = Object.keys(results);
    var index = null;

    if(_goto === "first-error")
        index = 0;
    else if(_goto === "last-error")
        index = resultKeys.length - 2;
    else {
        index = resultKeys.indexOf(currentElement);
        if(index < 0){
            var i = 0;
            for(var i; i < resultKeys.length - 1; i ++)
            {
                if(resultKeys[i] > currentElement)
                    break;
            }
            index = i;
        }

        index = _goto === "next-error"? index + 1 : index - 1;
    }
        
    if(index === null || index < 0)
        index = 0;

    if(resultKeys.length <= index || (resultKeys.length === 1 && index >= resultKeys.length - 2))
        return;
    
    OrangeBerry.Cognito.focusUuid(resultKeys[index]);
}

var normalizeStr = function(str)
{
    return str.toLowerCase().replace(/\s+/g, "");
}

var fieldMatches = function(search, label, internalName, exactMatch)
{
    var matches = false;

    if(exactMatch) {
        matches = OrangeBerry.Search.include.labels? label === search: false;
        matches = matches || (OrangeBerry.Search.include.internalNames? internalName === search: false);
    } else {
        var search = normalizeStr(search);
        matches = OrangeBerry.Search.include.labels? normalizeStr(label).indexOf(search) >= 0: false;
        matches = matches || (OrangeBerry.Search.include.internalNames?  normalizeStr(internalName).indexOf(search) >= 0: false);
    }
    
    return matches;
}

var fieldSearch = function (search, fields, exactMatch)
{    
    fields.forEach(function(field)
    {
        var internalName = field.InternalName;
        var label = field.Name;
       
        
        if(fieldMatches(search, label, internalName, exactMatch))
        {                                
            if(!exactMatch || label === search || internalName === search)
            {
                var element = $(document);                          
                
                OrangeBerry.Search.parentNames.forEach(function(parent){                        
                    element = $(element).find("[data-field='" + parent + "']")[0];                
                });
                
                element = $(element).find("[data-field='" + internalName + "']")[0];
                
                if(element){
                    OrangeBerry.Search.elements.push(element);
                    OrangeBerry.Search.fields.push(field);
                }
            }
        }
        
        if(field.ChildType)
        {
            OrangeBerry.Search.parentNames.push(internalName);
            fieldSearch(search, field.ChildType().Fields());
            OrangeBerry.Search.parentNames.pop();
        }
    });
    
    return OrangeBerry.Search.elements;
}

function highlightElements (elements, color, clear){        
    if(clear){
        $(".c-forms-layout-element").toArray().forEach(function(element){
            element.style.backgroundColor = "";
        });
    }

    color = color || "pink";
    
    elements.forEach(function(element){
        element.style.backgroundColor = color;
    });
}


class View {
    __elements = null;
    constructor() {
        
    }

    get elements()
    {
        if(!this.__elements)
            this.__elements = $("#c-forms-layout-elements").children().children().children(".c-forms-layout-element.c-field");

        return this.__elements;
    }

    update()
    {
        this.__elements = null;
        console.log("view updated")
    }

}

class CognitoObject
{
    __form = null;    
    __validation = null;

    _get(variable, serialize)
    {
        var varPaths = variable.split('.');
        var obj = null;
        var txt = "if (";

        for(var i = 1; i < varPaths.length + 1; i++){
            txt += "typeof " + varPaths.slice(0, i).join('.') + " !== 'undefined' && "
        }
        txt = txt.substr(0, txt.length - 4);
        txt += ") { $('body').attr('orange-berry', JSON.stringify(" 
        + (serialize? "Cognito.serialize" :"" )
        + "(" + variable + "))); }";

        var script = document.createElement('script');
        script.id = "OrangeBerry";
        script.appendChild(document.createTextNode(txt));
        document.body.appendChild(script);
        var obj = $("body").attr("orange-berry");    
        $("body").removeAttr("orange-berry");

        return obj? $.parseJSON(obj) : null;    
    }

    _set(func)
    {
        var script = document.createElement('script');
        script.id = "OrangeBerry";
        script.appendChild(document.createTextNode(func));
        document.body.appendChild(script);
    }    

    get currentElement()
    {
        return this._get("Cognito.Forms.model.currentElement.uuid()", false);
    }

    get _form()
    {
        if(!this.__form){
            this.__form = this._get("Cognito.Forms.model.currentForm", true);
        }

        return this.__form;
    }

    get fields()
    {        
        return this._form.Fields;
    }

    get isLoaded()
    {
        return this._form !== null;
    }

    init()
    {
        this._set("Cognito.Field.$InternalName.addChanged(function (obj, args) { window.postMessage({ by: 'OrangeBerry', change: 'internalName', newVal: args.newValue, oldVal: args.oldValue }, '*'); })");
        this._set("Cognito.Field.$Name.addChanged(function (obj, args) { window.postMessage({ by: 'OrangeBerry', change: 'name', newVal: args.newValue, oldVal: args.oldValue }, '*'); })");
    }

    update()
    {
        this.__form = null;
        this.__validation = null;
        console.log("updated form")
    }

    updateValidationResults(results)
    {
        this.__validation = results;
        console.log("validation results updated")
    }

    focus(element)
    {        
        this._set("$(\"[data-field='" + element.getAttribute("data-field") +"']\").focus()");
    }

    focusUuid(uuid)
    {        
        this._set("$(\"[data-uuid='" + uuid +"']\").focus()");
    }

    validate(goto)
    {        
        if(!this.__validation){
            var validateCall = `var newForm = Cognito.Forms.model.currentForm;
            var serializedNewForm = Cognito.serialize(newForm);

            disableChoiceFieldValidation = JSON.stringify(serializedNewForm).length >= 1000000;

            var endpoint = "validateFormExpressions" + (newForm && newForm.get_Id() ? ("?form=" + newForm.get_Id()) : "");

            Cognito.Forms.serviceRequest({
                endpoint: endpoint,
                method: "POST",
                contentType: "application/json+cognito; charset=utf-8",
                data: { NewRootType: serializedNewForm, OldRootType: null, NewFieldPath: null, OldFieldPath: null, Localization: Cognito.serialize(newForm.get_Localization()), RenameExpressions: false },
                success: function (res) {
                    window.postMessage({"by": "OrangeBerry", "msg": "validation", "success": true, "results": res, "goto": "` + goto + `", "currentElement": Cognito.Forms.model.currentElement.uuid() });
                },
                error: function () {
                    window.postMessage({"by": "OrangeBerry", "msg": "validation", "success": false});
                }
            });`;

            this._set(validateCall);
            return null;
        }

        return this.__validation;
    }
}
