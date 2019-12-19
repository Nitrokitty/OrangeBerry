var jq = document.createElement("script");

jq.addEventListener("load", loaded); // pass my hoisted function
jq.src = "../Javascript/jquery.js";
document.querySelector("head").appendChild(jq);

OrangeBerry = { }


setTimeout(function(){
    loaded();
}, 100);


OrangeBerry.isLoaded = false;
function loaded () {
    if(OrangeBerry.isLoaded)
        return;

    OrangeBerry.isLoaded = true;
    OrangeBerry.activeColor = "pink";
    OrangeBerry.exactMatch = false;
    OrangeBerry.include = {}
    OrangeBerry.include.internalNames = true;
    OrangeBerry.include.labels = true;

    $(".color-select .color").toArray().forEach(function(colorElement){
        var color = colorElement.getAttribute("data-color");
        colorElement.style.backgroundColor = color;
        if(color === OrangeBerry.activeColor)
            $(colorElement).addClass("selected");
    });

    (function(){
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
    
        // Menu Toggle
        $(".caret-menu .button").on("click", function(event) {             
            var target = $(event.currentTarget).parent();        
            target.find(".button i")[0].remove();
            var icon = null;
    
            if(target.hasClass("closed")){
                target.removeClass("closed");            
                icon = $("<i class='fas fa-angle-down'></i>")[0];            
            }
            else {
                target.addClass("closed");            
                icon = $("<i class='fas fa-angle-right'></i>")[0];            
            }
    
            target.find(".button")[0].appendChild(icon);
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

        // Validation GOTO
        $(".validation [class*='fa-angle']").on("click", function(event){
            post("goto", { selector: event.currentTarget.getAttribute("data-goto")});
        });

    })();
}

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

function post(message, data)
{
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
        var activeTab = tabs[0];            
        chrome.tabs.sendMessage(activeTab.id, {
            msg: message, 
            data: data
        });        
    });        
}


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log("popup.js")
        console.log("message received")
        var fields = $.parseJSON(request.data.fields);        

        $(".overlay").addClass("hide")
    }
);

window.addEventListener("message", function(event) { 
    console.log("popup.js")
    console.log(event)
    if(event.data.source !== window.origin || event.data.by !== "OrangeBerry")
        return;

    var fields = $.parseJSON(event.data.fields);

    $(".overlay").addClass("hide")
  }, false);