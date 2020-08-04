const tabTable = document.getElementById("currentTabs")
const savedTabTable = document.getElementById("tabHistory")
const saveCurrentButton = document.getElementById("saveCurrent")
const removeHistoryButton = document.getElementById("removeAll")
const restoreAllTabsButton = document.getElementById("restoreAll")
const printableCheckbox = document.getElementById("printable")
const undoButton = document.getElementById("undo")
const restoreAndRemoveButton = document.getElementById("restoreAndRemove")
const tabStorage = window.localStorage
const tabList = []

saveCurrentButton.addEventListener("click", saveAndClose)
removeHistoryButton.addEventListener("click", removeHistory)
restoreAndRemoveButton.addEventListener("click", restoreAndRemove)
restoreAllTabsButton.addEventListener("click", restoreAll)
printableCheckbox.addEventListener("click", convertUrls)
undoButton.addEventListener("click", undo)

function reloadPage(lenIn){
    let x = lenIn*300
    setTimeout(function(){location.reload()}, x)
}

let savedTabs = {};
try{
    savedTabs = JSON.parse(tabStorage.getItem("OMRTabs"))
 } 
catch{
    tabStorage.removeItem("OMRTabs")
 }//load up tabs from previous sessions

getOpenTabs()//load up open tabs
getTabsFromStorage()
async function getOpenTabs(){
    await chrome.tabs.query({currentWindow: true}, function(tabs){
        for (let i = 0; i<tabs.length; i++){
            const extTitle = "Open Tabs Extension"
            if (tabs[i].title!==extTitle){
                createRow(tabs[i])
                tabList.push(tabs[i])
            }
        }
    })
}
//getTabsFromStorage()
function getTabsFromStorage(){
    if(savedTabs){
        for (key in savedTabs){
            createRow(savedTabs[key], 1)
        }
    }
}
function saveAndClose(){
    saveTabs()
    closeTabs()
    tabStorage.removeItem("OMRBackup")//seems like a reasonable trigger for backups being cleared
    reloadPage(tabList.length)
}
function saveTabs(){
    const newDate = new Date()
    const options = { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric"}
    const urlList = []
    for (let i = 0; i<tabList.length; i++){
        tabList[i].date = newDate.toLocaleString(undefined, options)
        urlList.push(tabList[i].url)
    }
    const newList = [...tabList]
    for (key in savedTabs){
        if(!(urlList.includes(savedTabs[key].url))){
            newList.push(savedTabs[key])
        }
    }
    tabStorage.setItem("OMRTabs", JSON.stringify(newList))
}
function closeTabs(){
    for (let i = 0; i<tabList.length; i++){
        chrome.tabs.remove(tabList[i].id)
    }
}

function createRow(tab, savedOrNot = 0){
    const row = document.createElement("tr")
    const colOne = document.createElement("td")
    const colTwo = document.createElement("td")
    colOne.innerText = tab.title
    const link = generateLink(tab.url)
    colTwo.appendChild(link)
    row.appendChild(colOne)
    row.appendChild(colTwo)
    if(savedOrNot){
        const colThree = document.createElement("td")
        const colFour = document.createElement("td")
        const removeButton = generateRemoveButton(tab.id)
        removeButton.innerText = "Remove"
        colFour.appendChild(removeButton)
        colThree.innerText = tab.date
        row.appendChild(colThree)
        row.appendChild(colFour)
        savedTabTable.appendChild(row)
    }
    else{
        tabTable.appendChild(row)
    }
}



function undo(){
    let backUp;
    try{
        backUp = JSON.parse(tabStorage.getItem("OMRBackup"))
        tabStorage.setItem("OMRTabs", JSON.stringify(backUp))
    }
    catch {
        tabStorage.removeItem("OMRBackup")
        alert("Error retrieving backup")
    }
    
    reloadPage(backUp.length)
}
function restoreAndRemove(){
    restoreAll(300)
    removeHistory(savedTabs.length*1.5)
}
function removeHistory(delay = 0){
    tabStorage.removeItem("OMRTabs")
    tabStorage.setItem("OMRBackup", JSON.stringify(savedTabs))
    reloadPage(delay)
}
function restoreAll(delay = savedTabs.length){
    for (key in savedTabs){
        chrome.tabs.create({url: savedTabs[key].url})
    }
    reloadPage(delay)
}

function generateRemoveButton(itemId){
    const removeButton = document.createElement("button")
    removeButton.addEventListener("click", function(event){
        for (let i = 0; i<savedTabs.length; i++){
            if(savedTabs[i].id===itemId){
                savedTabs.splice(i, 1)
            }
        }
        tabStorage.setItem("OMRTabs", JSON.stringify(savedTabs))
        reloadPage(0)
    })
    return removeButton
}
let printableChecked = 0
function convertUrls(){
    printableChecked = !printableChecked
    let toFind = "p"
    if(printableChecked) toFind = "a"
    urls = [...document.getElementsByTagName(toFind)]
    console.log(urls)
    for (let i = 0; i<urls.length; i++){
        LinkOrPrint(urls[i], printableChecked)
    }
}

function LinkOrPrint(urlIn, print = 0){
    if(print){
        urlIn.parentNode.innerHTML = "<p>"+urlIn.href+"</p>"
    }
    else{
        const link = generateLink(urlIn.innerText)
        urlIn.parentNode.appendChild(link)
        urlIn.innerHTML = ""
    }
}

function generateLink(urlIn){
    const link = document.createElement("a")
    link.innerText = "Click!"
    link.href = urlIn
    link.target = "_blank"
    return link
}