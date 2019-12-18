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
        console.log("model.js")
        console.log("event listener")
        if(!event.origin.match(/https?:\/\/services.cognitoforms.com/g) || event.data.by != "OrangeBerry"){            
            return;
        }

        if(event.data.change === "internalName" || event.data.change === "name"){
            this.OrangeBerry.Cognito.update();
            this.OrangeBerry.View.update();           
        }
      }, false);

      chrome.runtime.onMessage.addListener(
        function(request) {          
            console.log("model.js")
            console.log("message received")  
            if (request.msg === "search") {
                OrangeBerry.Search = {}
                OrangeBerry.Search.parentNames = [];
                OrangeBerry.Search.elements = [];
                OrangeBerry.Search.fields = [];

                var elements = fieldSearch(request.data.term.toLowerCase().replace(/\s+/g, ""), this.OrangeBerry.Cognito.fields);
                highlightElements(elements);
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
}


var fieldSearch = function (search, fields, exactMatch)
{
    fields.forEach(function(field)
    {
        var internalName = field.InternalName;
        var label = field.Name.toLowerCase().replace(/\s+/g, "");
        if(label.indexOf(search) >= 0 || internalName.toLowerCase().indexOf(search) >= 0)
        {                    
            if(!exactMatch || label === search || internalName.toLowerCase() === search)
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

function highlightElements (elements, color){        
    $(".c-forms-layout-element").toArray().forEach(function(element){
        element.style.backgroundColor = "";
    });
    
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
        console.log("updated form")
    }

    focus(element)
    {
        element
        this._set("$(\"[data-uuid='" + element.getAttribute("data-field") +"']\").focus()");
    }
}
