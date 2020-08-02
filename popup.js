const getTabButton = document.getElementById("getTabs")
getTabButton.addEventListener("click", buttonHandler)
function buttonHandler(){
    chrome.tabs.create({url: "tabList.html"})
}
