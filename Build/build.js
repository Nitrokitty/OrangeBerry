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
    OrangeBerry.clear = true;

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
            var isOpening = false;
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
        $(".validation .navigation [class*='fa-angle']").on("click", function(event){
            validate(event.currentTarget.getAttribute("data-goto"));
        });        

        // ReValidate
        $(".validation .navigation .arrows .re-validate").on("click", function(event){
            validate(null, true);
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

function validate(selector, force)
{
    console.log("validating")
    var $validation = $(".validation");
    if($validation.hasClass("validating"))
    {
        console.log("already validating");
        return;
    }
    $validation.addClass("validating");
    $validation.find(".arrows .index")[0].style.display = "none";
    $validation.find(".arrows .re-validate")[0].style.opacity = 0;

    post("goto", { selector, force });    
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
        if(request.data.by != "OrangeBerry" && request.msg != "searchComplete")
            return;
        
            var fields = $.parseJSON(request.data.fields);
        $(".overlay").addClass("hide")
    }
);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {   
        if(request.data.by != "OrangeBerry" && request.msg != "validationComplete")
            return;
            
        var results = $.parseJSON(request.data.results);
        var index = request.data.index;

        console.log("validationComplete")
        console.log(results)
        console.log(index)

        recreateTable(results, index);
        setTimeout(function(){
            var $validation = $(".validation");
            $validation.removeClass("validating");            
            $validation.find(".arrows .index")[0].style.display = "";
            $validation.find(".arrows .re-validate")[0].style.opacity = 1;
            var $arrows = $validation.find(".navigation .arrows");
            $arrows[0].style.marginLeft = index || index === 0? (index >= 9? "24%" : "26%") : "28%";
        });
    }
);

window.addEventListener("message", function(event) {     
    if(event.data.source !== window.origin || event.data.by !== "OrangeBerry")
        return;

    var fields = $.parseJSON(event.data.fields);

    $(".overlay").addClass("hide")
  }, false);

function recreateTable(validationResults, activeIndex) {
    var $fieldsTable = $(".validation .validation-results table.fields tbody");
    var $formTable = $(".validation .validation-results table.form tbody");
    
    if(validationResults){                
        clearTable($fieldsTable);
        clearTable($formTable);
        
        $fieldsTable.append(createTableHeader());
        $formTable.append(createTableHeader());

        var currentIndex = 0;
        Object.keys(validationResults).forEach(function(elementId){
            $table = elementId === "Form"? $formTable : $fieldsTable;
            validationResults[elementId].forEach(function(result){
                if(!result.FormattedValue)
                {
                    var $row = $("<tr class='" + (activeIndex === currentIndex? "selected" : "")+ "' data-uuid='" + elementId + "' data-index='" + currentIndex + "'></tr>");
                    $row.append($("<td class='item-number'>" + (++currentIndex) + "</td>"));
                    $row.append($("<td class='property'>" + result.Property + "</td>"));
                    $row.append($("<td class='exception'>" + result.ExceptionMessage + "</td>"));
                    $table.append($row);
                }
            });        
        });

        setTimeout(function(){
            toggleEmptyMessage($fieldsTable);
            toggleEmptyMessage($formTable);

            // Validation Select
            $(".validation table tr:not('.header')").on("click", function(event){                                
                post("goto", { uuid: event.currentTarget.getAttribute("data-uuid"), index: event.currentTarget.getAttribute("data-index") });
            });
        });
    }
    else {
        if(activeIndex < 0)
            return;
        $fieldsTable.find(".selected").removeClass("selected");
        $fieldsTable.find("[data-index='" + activeIndex + "']").addClass("selected");
    }

    activeIndex = typeof activeIndex !== "number"? parseInt(activeIndex) : activeIndex;
    $(".validation .navigation .index").text(activeIndex + 1);
}

function toggleEmptyMessage($table)
{
    var showMessage = !$table.find("tr:not(.header)").length;
    var messageClass = $table.parent().hasClass("form")? "form" : "fields";
    var $message = $(".validation .validation-results .empty."+ messageClass);

    if(showMessage){
        $table[0].style.display = "none";
        $message[0].style.display = "";
    }
    else {
        $table[0].style.display = "";
        $message[0].style.display = "none";
    }
}

function clearTable($table)
{
    $table.children().toArray().forEach(function(child) {        
        child.remove();
    });
}

function createTableHeader()
{
    var $header = $("<tr class='header'></tr>");
    $header.append($("<th class='item-number'>#</th>"));
    $header.append($("<th class='property'>Property</th>"));
    $header.append($("<th class='exception'>Exception</th>"));
    return $header;
}
