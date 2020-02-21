function addPopupListener(expectedMessage, callback) {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {        
            if(request.data.by != "OrangeBerry" && request.msg != expectedMessage)
                return;
            
            callback(request, sender, sendResponse);
        }
    );
}
