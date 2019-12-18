var jq = document.createElement("script");

jq.addEventListener("load", loaded); // pass my hoisted function
jq.src = "jquery.js";
document.querySelector("head").appendChild(jq);

OrangeBerry = { }


setTimeout(function(){
    if($("#search-button").length)
        loaded();
}, 100);

function loaded () {
    console.log("loaded")
    $("#search-button").on("click", function() { 
        search();
    });

    $("#search-bar").on("keyup", function(event) { 
        if (event.keyCode === 13) {            
            event.preventDefault();
            search();
        }
    });
}

function search()
{
    var overlay = $(".overlay");
    overlay.removeClass("hide")
    
    OrangeBerry.search = $("#search-bar").val();

    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
        var activeTab = tabs[0];            
        chrome.tabs.sendMessage(activeTab.id, {
            msg: "search", 
            data: {
                by: "OrangeBerryPopup",
                term: OrangeBerry.search
            }
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