/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */

/* global fetch, Promise */

let uniqueId = 0;
let dropsByItem = [];

function getData(){
    let itemArr = [];
    let stageArr = [];
    let dropArr = [];
    
    /*
     * API - https://developer.penguin-stats.io/public-api/ 
     *       https://penguin-stats.io/
     */
    
    Promise.all([
        fetch('tables/item_table.json'),
        fetch('tables/stage_table.json'),
        fetch('https://penguin-stats.io/PenguinStats/api/v2/result/matrix')
    ])
        .then(res => Promise.all(res.map(res => res.json())))
        .then(res => {
            res.forEach(r =>{
                if(r.matrix){
                    //Contains rate of 
                    dropArr = r.matrix;
                }
                else if(r.items){
                    itemArr = r.items;
                }
                else if(r.stages){
                    stageArr = r.stages;
                }
            });
            organiseData(itemArr, stageArr, dropArr);
        });
}

function organiseData(itemArr, stageArr, dropArr){
    /*
     * Item Object Structure:
     *      item {
     *          item.id
     *          item.name
     *          item.tier
     *          item.uniqueId
     *          item.stages: [stage Objects]
     *      }
     *          
     *  Stage Object Structure:
     *      stage
     */
    
    itemArr.forEach(itemElem =>{
        let item = new Object();
        item.id = itemElem.itemId;
        item.name = itemElem.name;
        item.tier = itemElem.rarity;
        item.uniqueId = uniqueId;
        item.stages = itemElem.stageDropList.filter(stage => {
            return stage.stageId.search('main') !== -1 ||
                stage.stageId.search('sub') !== -1;  
        });
        item.stages.forEach(stage => {
            let stageInfo = stageArr.find(stageElem => {
                return stageElem.stageId === stage.stageId;
            });
            let dropInfo = dropArr.find(dropElem =>{
                return dropElem.itemId === item.id &&
                        dropElem.stageId === stageInfo.stageId;
            });
            stage.code = stageInfo.code;
            stage.dropRate = dropInfo.quantity / dropInfo.times;
            stage.sanityPerDrop = stageInfo.apCost / stage.dropRate;
        });
        dropsByItem.push(item);
        uniqueId++;
    });
    console.log(dropsByItem);
    
    
    displayData(dropsByItem);
}

function displayData(dropsByItem){
    let displayCards = ``;
    
    dropsByItem.forEach(item => {
        if(item.stages.length !== 0){
            displayCards += `<div class="card">
                                <div class="item-name">
                                    ${item.name}
                                </div>
                                <div class="item-img-container">
                                    <img src="img/items/tier/${item.tier}.png"
                                        class="item-img-tier"
                                        height="130" width="130"/>
                                    <img src="img/items/${item.id}.png" 
                                        class="item-img"
                                        height="100" 
                                        width="100" 
                                        alt="${item.name}"/>
                                </div>
                                <div class="stage-table">
                                    <div class="stage-table-heading">
                                        <span>Stage</span>
                                        <span>Rate</span>
                                        <span>Sanity <br> per Item</span>
                                    </div>
                                    <div class="stage-table-info">
                                        ${displayCardStage(item.stages)}
                                    </div>
                                </div>
                            </div>`;
        }
    });
    
    document.getElementById('display-cards').innerHTML = displayCards;
    
    let itemOption = ``;
    
    dropsByItem.forEach(item =>{
        itemOption +=   `<option value="${item.uniqueId}">
                            ${item.name}
                        </option>`;
    });
    
    document.getElementById('sel-item').innerHTML = itemOption;
    document.getElementById('del-id').innerHTML = itemOption;
    
    displayStageOption(document.getElementById('del-id').value, dropsByItem);
}

function displayCardStage(stages){
    let displayStage = ``;
    
    stages.forEach(stage => {
        displayStage += `<div class="stage-row">
                            <span class="stage-code">
                                ${stage.code}
                            </span>
                            <span class="stage-drop-rate">
                                ${stage.dropRate.toFixed(3)}
                            </span>
                            <span class="stage-sanity-per-drop">
                                ${stage.sanityPerDrop.toFixed(3)}
                            </span>
                        </div>`;
    });
    return displayStage;
}

function displayStageOption(itemId, items){
    let stageOption = ``;
    
    let selectedItem = items.find(item => {
        return item.uniqueId === parseInt(itemId);
    });
    
    selectedItem.stages.forEach(stage =>{
        stageOption +=   `<option value="${stage.code}">
                            ${stage.code}
                        </option>`;
    });
    
    document.getElementById('del-stage').innerHTML = stageOption;
}

function searchByItem(name, items){
    let selectedItems = items.filter(item => {
        return item.name.toUpperCase() === name.toUpperCase();
    });
    
    document.getElementById('by-item').value = '';
    
    displayData(selectedItems);
}

function searchByStage(stageName, items){
    let selectedItems = items.filter(item => {
        return item.stages.find(stage => {
            return stage.code === stageName;
        });
    });
    
    document.getElementById('by-stage').value = '';
    
    displayData(selectedItems);
}

function filterRarity(rarity, items){
    let selectedItems = items.filter(item => {
        return item.tier === parseInt(rarity);
    });
    displayData(selectedItems);
}

function addItem(name, items){
    let item = new Object;
    item.name = name;
    item.uniqueId = uniqueId;
    item.stages = [];
    
    items.push(item);
    
    document.getElementById('add-name').value = '';
    
    displayData(items);
}

function addStage(itemId, stageName, dropRate, sanity, items){
    let stage = new Object();
    stage.code = stageName;
    stage.dropRate = parseFloat(dropRate);
    stage.sanityPerDrop = parseFloat(sanity);
    
    let item = items.find(itemElem => {
        return itemElem.uniqueId === parseInt(itemId);
    });
    
    item.stages.push(stage);
    
    document.getElementById('sel-item').value = '';
    document.getElementById('add-stage-name').value = '';
    document.getElementById('add-drop').value = '';
    document.getElementById('add-sanity').value = '';
    
    displayData(items);
}

function deleteItem(itemId, items){
    let delItem;
    
    items.forEach((item, i) => {
        if(parseInt(itemId) === item.uniqueId){
            delItem = i;
        }
    });
    
    items.splice(delItem, 1);
    
    document.getElementById('del-stage').value = '';
    document.getElementById('del-id').value = '';
    
    displayData(items);
}

function deleteStage(itemId, stageCode, items){
    let delItem = items.find(item => {
        return item.uniqueId === parseInt(itemId);
    });
    
    let delStage;
    delItem.stages.forEach((stage, i) => {
        if(stage.code === stageCode){
            delStage = i;
        }
    });
    
    delItem.stages.splice(delStage, 1);
    
    document.getElementById('del-stage').value = '';
    document.getElementById('del-id').value = '';
    
    displayData(items);
}

function showForm(formId){
    let showH = '300px';
    let showW = '150px';
    let hide = '0px';
    let form = document.getElementById(formId);
    console.log(form);
    
    if(window.getComputedStyle(form).maxHeight === hide){
        form.style.maxHeight = showH;
        form.style.maxWidth = showW;
    }
    else{
        form.style.maxHeight = hide;
        form.style.maxWidth = hide;
    }
    
}