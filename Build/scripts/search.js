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
    // Set the background of each color on load
    $(".color-select .color").toArray().forEach(function(colorElement){
        var color = colorElement.getAttribute("data-color");
        colorElement.style.backgroundColor = color;
        if(color === OrangeBerry.activeColor)
            $(colorElement).addClass("selected");
    });

    // Search
    $("#search-button").on("click", function() { 
        search();
    });

    // Enter Search
    $("#search-bar").on("keyup", function(event) { 
        if (event.keyCode === 13) {            
            event.preventDefault();
            search();
        }
    });

    // Color Select
    $(".color-select .color").on("click", function(event){
        OrangeBerry.activeColor = event.currentTarget.getAttribute("data-color");
        $(".color-select .color.selected").removeClass("selected");
        $(event.currentTarget).addClass("selected");
    });

    // Toggle Exact Match
    $(".exact-match input").on("change", function(event){
        OrangeBerry.exactMatch = event.currentTarget.checked;
    });

    // Toggle Include Internal Names
    $(".include-internal-names input").on("change", function(event){
        OrangeBerry.include.internalNames = event.currentTarget.checked;
    });

    // Toggle Include Labels
    $(".include-labels input").on("change", function(event){
        OrangeBerry.include.labels = event.currentTarget.checked;
    });

     // Toggle Clear
     $(".clear input").on("change", function(event){
        OrangeBerry.clear = event.currentTarget.checked;
    });
}
// ------------------ ------------- -------------------

// ------------------ FUNCTIONS -------------------
function search()
{
    var overlay = $(".overlay");
    overlay.removeClass("hide")
    
    OrangeBerry.search = $("#search-bar").val();

    post("search", {
        by: "OrangeBerryPopup",
        term: OrangeBerry.search,
        color: OrangeBerry.activeColor,
        exactMatch: OrangeBerry.exactMatch,
        include: OrangeBerry.include,
        clear: OrangeBerry.clear
    });       
}
// ------------------ ------------- -------------------

// ------------------ EVENTS -------------------
addPopupListener("searchComplete", function(request){
    var fields = $.parseJSON(request.data.fields);
    $(".overlay").addClass("hide")
});
// ------------------ ------------- -------------------