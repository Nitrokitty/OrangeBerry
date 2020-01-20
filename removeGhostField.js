var findDuplicateFields = function(fields, scope) {
    if(!fields)
        fields = Cognito.Forms.model.currentForm.get_Fields(); 
    if(!scope)
        scope = Cognito.Forms.model.currentForm.get_InternalName();

    var _fields = [];
    var duplicates = []
    fields.filter(function(f) { 
        var name = f.get_InternalName();
        if(_fields.indexOf(name) >= 0)
        { 
            if(Object.keys(duplicates).indexOf(scope + "." + name) < 0)
                duplicates[scope + "." + name] = [];
            duplicates[scope + "." + name].push(f);
        }
        else
            _fields.push(name);
        
        if(f.get_ChildType())
        {
            
           var childDuplicates = findDuplicateFields(f.get_ChildType().get_Fields(), scope + "." + f.get_InternalName());
           Object.keys(childDuplicates).forEach(function(key){
                if(Object.keys(duplicates).indexOf(key) < 0)
                    duplicates[key] = [];
                duplicates[key].forEach(function(_f){
                    if(duplicates[key].filter(function(d){ d.get_InternalName() === _f.get_InternalName()}).length === 0)
                    duplicates[key].push(_f);
                });
           });
        }
    });

    return duplicates;    
}

var removeDuplicateFields = function(duplicates, fields, scope)
{    
    if(!fields)
        fields = Cognito.Forms.model.currentForm.get_Fields();   
    if(!scope)
        scope = Cognito.Forms.model.currentForm.get_InternalName();

    var _fields = [];
    fields.forEach(function(f){
        var arr = duplicates[scope + "." + f.get_InternalName()];
        if(arr)        
            _fields = _fields.concat(arr);        
    });

    _fields = fields.filter(function(f) { return _fields.indexOf(f) < 0; });
    
    if(fields.length !== _fields.length)
    {
        fields.beginUpdate();
        fields.clear();
        fields.addRange(_fields);
        fields.endUpdate();
    }

    fields.forEach(function(field){
        if(field.get_ChildType()){
            removeDuplicateFields(duplicates, field.get_ChildType().get_Fields(), scope + "." + field.get_InternalName());
        }        
    });

    if(scope === Cognito.Forms.model.currentForm.get_InternalName())
    {
        console.log("The following duplicate fields were removed: ");
        Object.keys(duplicates).forEach(function(_scope){
            console.log("  -" + _scope);
        });
    }
}

var removeGhostField = function(internalName)
{
    var fields = Cognito.Forms.model.currentForm.get_Fields();    
    _fields = fields.filter(function(f) { return f.get_InternalName() !== internalName});
    if(fields.length === _fields.length)
        return false;

    fields.beginUpdate();
    fields.clear();
    fields.addRange(_fields);
    fields.endUpdate();

    Cognito.Forms.model.currentForm.get_Fields().length === _fields.length;
}

var findDuplicateUuids = function(elements, elementsByUuid, scope){
    if(!elements)
        elements = $("#c-forms-layout-elements").childElements().filter(function () { return !$(this).isPlaceholder() });
    if(!elementsByUuid)
        elementsByUuid = {};
    if(!scope)
        scope = Cognito.Forms.model.currentForm.get_InternalName();

    elements.toArray().forEach(function(element) {
        var $element = $(element);
        if($element){            
            var uuid = parseInt($element.uuid() || "-1");
            if(!elementsByUuid[uuid])
                elementsByUuid[uuid] = [];

            var field = $element.get_field();
            elementsByUuid[uuid].push({scope, name: field? $element.get_name(): "", element: $element});
            
            var childElements = $element.childElements().filter(function () { return !$(this).isPlaceholder() });
            if(field && childElements && childElements.length > 0)
                elementsByUuid = findDuplicateUuids(childElements, elementsByUuid, scope + "." + field.get_InternalName());
        }
    });

    if(scope !== Cognito.Forms.model.currentForm.get_InternalName())
        return elementsByUuid;

    var duplicates = {};
    Object.keys(elementsByUuid).forEach(function(key){
        var val = elementsByUuid[key];
        if(val.length > 1)
            duplicates[key] = val;
    });

    return duplicates;
}

var findDuplicateIds = function(fields, fieldsById, scope){
    if(!fields)
        fields = Cognito.Forms.model.currentForm.get_Fields();
    if(!fieldsById)
        fieldsById = {};
    if(!scope)
        scope = Cognito.Forms.model.currentForm.get_InternalName();

    fields.forEach(function(field) {                
        var id = field.get_Index();
        if(!fieldsById[id])
            fieldsById[id] = [];
        
        fieldsById[id].push({scope, name: field.get_InternalName(), field});        
        
        if(field && field.get_ChildType())
            fieldsById = findDuplicateIds(field.get_ChildType().get_Fields(), fieldsById, scope + "." + field.get_InternalName());        
    });

    if(scope !== Cognito.Forms.model.currentForm.get_InternalName())
        return fieldsById;

    var duplicates = {};
    Object.keys(fieldsById).forEach(function(key){
        var val = fieldsById[key];
        if(val.length > 1)
            duplicates[key] = val;
    });

    return duplicates;
}

var findGhostFields = function(fields, elements, ghosts, scope){
    if(!fields)
        fields = Cognito.Forms.model.currentForm.get_Fields();
    if(!elements)
        elements = $("#c-forms-layout-elements").childElements().filter(function () { return !$(this).isPlaceholder() });
    if(!ghosts)
        ghosts = {};
    if(!scope)
        scope = Cognito.Forms.model.currentForm.get_InternalName();

    elements.toArray().forEach(function(element) {                
        var $element = $(element);
        var name = $element.attr("data-field");
        var field = fields.first(function(f){ return f.get_InternalName() === name; });
        if(!field){
            var elementType = $element.elementType();
            if(elementType !== "Layout")
                ghosts[scope + "." + name] = $element;            
        }
        else
        {
            var childElements = $element.childElements().filter(function () { return !$(this).isPlaceholder() });
            if(field && field.get_ChildType() && childElements.length)
                ghosts = findGhostFields(field.get_ChildType().get_Fields(), childElements, ghosts, scope + "." + name); 
        }
    });
    
    return ghosts;
}