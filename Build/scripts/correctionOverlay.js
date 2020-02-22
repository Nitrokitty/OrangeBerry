// ------------------ ON LOAD -------------------

// ------------------ ------------- -------------------

// ------------------ FUNCTIONS -------------------
var toggleCorrectionOverlay = function(){
    var overlay = $("div.correction-overlay");
    var open = overlay.hasClass("hide");
    if(open) {
        var $body = $(".body");
        var height = $body.height();
        var width = $body.width();
        var bodyStyle = getComputedStyle($body.parent()[0]);

        overlay.removeClass("hide");
        
        var content = overlay.find(".overlay-content")[0];
        var contentStyle = getComputedStyle(content);
        var verticalMargin = parseInt(contentStyle.marginTop) + parseInt(contentStyle.marginBottom)
        var horizontalMargin =  parseInt(contentStyle.marginLeft) + parseInt(contentStyle.marginRight)

        var container = overlay.find(".overlay-container")[0];        

        container.style.left = bodyStyle.marginLeft;
        container.style.top = bodyStyle.marginRight;

        container.style.minHeight = height + "px";
        container.style.minWidth = width + "px";
        content.style.minHeight = (height - verticalMargin) + "px";
        content.style.minWidth = (width - horizontalMargin) + "px";
        content.style.maxHeight = content.style.minHeight;
        content.style.maxWidth = content.style.minWidth;
    }
    else 
        overlay.addClass("hide");


    $(".menu-container").toArray().forEach(function(menuContainer){
        var $menuContainer = $(menuContainer);
        if(open)
            $menuContainer.addClass("inactive");
        else
            $menuContainer.removeClass("inactive");
    });

    return open;
}
// ------------------ ------------- -------------------