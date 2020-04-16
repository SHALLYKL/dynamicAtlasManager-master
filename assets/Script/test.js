const DynamicAtlasManager = require("DynamicAtlasManager");

cc.Class({
    extends: cc.Component,

    properties: {
        showNode:cc.Node,
        selectedSf:cc.SpriteFrame,
        unSelectSf:cc.SpriteFrame,
        useGridBtnSp:cc.Sprite,
        noGridBtnSp:cc.Sprite
    },

    // use this for initialization
    onLoad: function () {
        let loadList = [];
        for (let i = 0; i < 28; i++) {
            loadList.push(`bg/${i + 1}`);
        }
        let self = this;
        this.sfList = [];
        cc.loader.loadResArray(loadList, cc.SpriteFrame, function (err, sfList) {
            // DynamicAtlasManager.insertFrame("goods", sf);
         
            self.sfList = sfList;
        })
    },
    btnUseGrid(event){
        event.target.getComponent(cc.Sprite).spriteFrame = this.selectedSf;
        // this.showDynamicDebug = !this.showDynamicDebug;
        this.useGridBtnSp.spriteFrame = this.selectedSf;
        DynamicAtlasManager.noGrid(false);
        this.sfList.forEach(sf => {
            DynamicAtlasManager.insertFrame("useGrid", sf);
        })
        DynamicAtlasManager.showDebug(true);
    },
    
    btnNoGrid(event){
        event.target.getComponent(cc.Sprite).spriteFrame = this.selectedSf;
        DynamicAtlasManager.noGrid(true);
        this.sfList.forEach(sf=>{
            DynamicAtlasManager.insertFrame("noGrid", sf);
        });
        DynamicAtlasManager.showDebug(false);
        DynamicAtlasManager.showDebug(true,this.showNode);
    },
    // called every frame
    update: function (dt) {

    },
});
