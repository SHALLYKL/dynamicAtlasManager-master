/******************************************
 * @author shallykl<657669149@qq.com>
 * @copyright 2019.6.17
 * @doc 动态图集管理器，次方法覆盖了官方的方法
 * @end
 ******************************************/

const Atlas = require('DynamicAtlas');
let _atlases = cc.js.createMap(true);
let _noGrid = false;
let _textureSize = 2048;
// Smaller frame is more likely to be affected by linear filter
let _minFrameSize = 8;
let _maxFrameSize = 1024;

let _debugNode = null;
let _GL_RGBA = 6408;
/**
 * !#en Manager the dynamic atlas.
 * !#zh 管理动态图集。
 * @class DynamicAtlasManager
 */
let DynamicAtlasManager = {
    noGrid(flag){
        _noGrid = flag
    },
    getAtlas (){
        return _atlases;
    },
    getTexture (where){
        return _atlases[where]._texture;
    },
  
    _getJSBHash(texture){
        if (!texture._hashDirty && texture._hash===texture._hash) {
            return texture._hash;
        }
        let genMipmaps = texture._genMipmaps ? 1 : 0;
        let premultiplyAlpha = texture._premultiplyAlpha ? 1 : 0;
        let flipY = texture._flipY ? 1 : 0;
        let minFilter = texture._minFilter === cc.Texture2D.Filter.LINEAR ? 1 : 2;
        let magFilter = texture._magFilter === cc.Texture2D.Filter.LINEAR ? 1 : 2;
        let wrapS = texture._wrapS === cc.Texture2D.WrapMode.REPEAT ? 1 : (texture._wrapS === cc.Texture2D.WrapMode.CLAMP_TO_EDGE ? 2 : 3);
        let wrapT = texture._wrapT === cc.Texture2D.WrapMode.REPEAT ? 1 : (texture._wrapT === cc.Texture2D.WrapMode.CLAMP_TO_EDGE ? 2 : 3);
        let pixelFormat = texture._format;
        let image = texture._image;
        if (CC_JSB && image) {
            if (image._glFormat !== _GL_RGBA)
                pixelFormat = 0;
            //修复jsb调用_getHash返回NaN的bug
            premultiplyAlpha = image._premultiplyAlpha ? 1 : 0;
        }
        texture._hash = Number(`${minFilter}${magFilter}${pixelFormat}${wrapS}${wrapT}${genMipmaps}${premultiplyAlpha}${flipY}`);
        if (isNaN(texture._hash)) {
            kllog(texture._native,minFilter, magFilter, pixelFormat, wrapS, wrapT, genMipmaps, premultiplyAlpha, flipY)
        }
        texture._hashDirty = false;
        return texture._hash;
    },
    _getHash(texture){
        if(CC_JSB){
            return this._getJSBHash(texture);
        }else{
            return texture._getHash();
        }
    },
    /**
     * !#en Append a sprite frame into the dynamic atlas.
     * !#zh 添加碎图进入动态图集。
     * @method insertSpriteFrame
     * @param {SpriteFrame} spriteFrame
     * 
     * 使用方法：
     * @example
     * 假如加载的是主界面的图片
     * cc.loader.load(url,type,function(err,sf){
     *      DynamicAtlasManager.insertFrame("mainUI",sf)
     * })
     ** 假如加载的是某个场景的图片
     * cc.loader.load(url,type,function(err,sf){
     *      DynamicAtlasManager.insertFrame("scene",sf)
     * })
     * DynamicAtlasManager.insertFrame(合图的模块名称,图片)
     */
    insertFrame (where, spriteFrame) {

        if (CC_EDITOR) return null;
        if (!spriteFrame || spriteFrame._original) return null;

        let texture = spriteFrame._texture;
        if (texture instanceof cc.RenderTexture) return null;
        if(!texture) return null;

        let w = texture.width, h = texture.height;
        if (w > _maxFrameSize || h > _maxFrameSize || w <= _minFrameSize || h <= _minFrameSize
         || this._getHash(texture) !== Atlas.DEFAULT_HASH) {
             cc.log("hash not equal----------------------",texture,this._getHash(texture),Atlas.DEFAULT_HASH)
            return null;
        }

        let atlas = _atlases[where];
        if (!atlas) {
            _atlases[where] = atlas = new Atlas(_textureSize, _textureSize, _noGrid);
        }

        let frame = atlas.insertSpriteFrame(spriteFrame);
        spriteFrame._setDynamicAtlasFrame(frame);
        return spriteFrame;
    },

    //添加合图进图集
    insertAtlas (where, dict){
        let atlas = cc.js.createMap(true);
        for(let key in dict){
            let frame = dict[key];
            atlas[key] = this.insertFrame(where, frame);
            if(!atlas[key]) return null;
        }
        return atlas;
    },

    insertTexture2D (where, texture){
        if (texture instanceof cc.RenderTexture) return null;
        let w = texture.width, h = texture.height;
        if (w > _maxFrameSize || h > _maxFrameSize || w <= _minFrameSize || h <= _minFrameSize
         || this._getHash(texture) !== Atlas.DEFAULT_HASH) {
            return null;
        }
        let atlas = _atlases[where];
        if (!atlas) {
            _atlases[where] = atlas = new Atlas(_textureSize, _textureSize,_noGrid);
        }
        let frame = atlas.insertSpriteFrame({
            _rect : {x:0,y:0}
            ,_texture : texture
        });
        return frame;
    },

    reset (where){
        let atlas = _atlases[where];
        if(!atlas) return;
        atlas.reset();
    },

    /**
     * !#en Displays all the dynamic atlas in the current scene, which you can use to view the current atlas state.
     * !#zh 在当前场景中显示所有动态图集，可以用来查看当前的合图状态。
     * @method showDebug
     * @param {Boolean} show
     */
    // showDebug: CC_DEV && function (show) {
    showDebug: function (show) {
        if (show) {
            if (!_debugNode || !_debugNode.isValid) {
                let width = cc.visibleRect.width;
                let height = cc.visibleRect.height;

                _debugNode = new cc.Node('DYNAMIC_ATLAS_DEBUG_NODE');
                _debugNode.width = width;
                _debugNode.height = height;
                _debugNode.x = width/2;
                _debugNode.y = height/2;
                _debugNode.zIndex = cc.macro.MAX_ZINDEX;
                _debugNode.parent = cc.director.getScene();

                _debugNode.groupIndex = cc.Node.BuiltinGroupIndex.DEBUG;
                cc.Camera._setupDebugCamera();

                let scroll = _debugNode.addComponent(cc.ScrollView);

                let content = new cc.Node('CONTENT');
                let layout = content.addComponent(cc.Layout);
                layout.type = cc.Layout.Type.VERTICAL;
                layout.resizeMode = cc.Layout.ResizeMode.CONTAINER;
                content.parent = _debugNode;
                content.width = _textureSize;
                content.anchorY = 1;
                content.x = _textureSize;

                scroll.content = content;

                for(let where in _atlases){
                    let node = new cc.Node('ATLAS');

                    let texture = _atlases[where]._texture;
                    let spriteFrame = new cc.SpriteFrame();
                    spriteFrame.setTexture(texture);

                    let sprite = node.addComponent(cc.Sprite)
                    sprite.spriteFrame = spriteFrame;

                    node.parent = content;
                }
            }
        }
        else {
            if (_debugNode) {
                _debugNode.parent = null;
                _debugNode = null;
            }
        }
    },
    update () {
        for(let where in _atlases){
            _atlases[where].update();
        }
    },
};

// 引擎自带的动态图集屏蔽
cc.dynamicAtlasManager.insertSpriteFrame = function(spriteFrame){
    return null;
}
cc.dynamicAtlasManager.update = function(){
    DynamicAtlasManager.update();
}

module.exports = DynamicAtlasManager;