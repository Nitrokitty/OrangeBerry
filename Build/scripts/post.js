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

console.log("script loaded")