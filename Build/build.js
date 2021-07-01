OrangeBerry = { }
OrangeBerry.onLoad = []
// ------------------ LOAD SCRIPTS -------------------
var scripts = ["../Javascript/jquery", "scripts/post", "scripts/chromeRuntime", "scripts/validation", "scripts/search", "scripts/correction", "scripts/correctionOverlay"]
var scriptsLoaded = 0;
var _loadThrottle;

function scriptLoaded()
{
    scriptsLoaded++;
    if(scriptsLoaded === scripts.length)
        _loadThrottle = loaded;
}

scripts.forEach(function(scriptName){
    var script = document.createElement("script");
    script.src = scriptName + ".js";
    script.addEventListener("load", scriptLoaded);
    document.head.appendChild(script);
});

var intervalId = setInterval(function(){
    if(_loadThrottle)
    {        
        _loadThrottle();
        clearInterval(intervalId);
    }
})
// ------------------ ------------- -------------------

// ------------------ FUNCTIONS -------------------
function loaded () {    
    console.log("loaded")
    debugger;
    // Menu Toggle
    $(".caret-menu .button").on("click", function(event) {             
        var target = $(event.currentTarget).parent();        
        target.find(".button i")[0].remove();
        var icon = null;
        var isOpening = false;

        if(target.parents(".menu-container").hasClass("inactive"))
            return;

        if(target.hasClass("closed")){
            target.removeClass("closed");            
            icon = $("<i class='fas fa-angle-down'></i>")[0];            
            isOpening = true;
        }
        else {
            target.addClass("closed");            
            icon = $("<i class='fas fa-angle-right'></i>")[0];            
        }

        target.find(".button")[0].appendChild(icon);

        var tableRows = $(".validation table tbody tr");
        if(isOpening && target[0].id === "menu-validation" && tableRows.length === 0)
            validate();
    });
        
    OrangeBerry.onLoad.forEach(function(loadFunc){ loadFunc(); });    
}
// ------------------ ------------- -------------------

// ------------------ EVENTS -------------------
window.addEventListener("message", function(event) {     
    if(event.data.source !== window.origin || event.data.by !== "OrangeBerry")
        return;

    var fields = $.parseJSON(event.data.fields);

    $(".overlay").addClass("hide");
  }, false);
// ------------------ ------------- -------------------