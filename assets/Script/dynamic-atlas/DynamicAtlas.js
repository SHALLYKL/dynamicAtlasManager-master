/******************************************
 * @author shallykl<657669149@qq.com>
 * @copyright  2019.6.17
 * @doc 图集.
 * @end
 ******************************************/
const RenderTexture = cc.RenderTexture;
const AtlasGrid =require("AtlasGrid");

const space = 2;

/**
 * @description:构造图集
 * @param {type} 图集的宽度
 * @param {width} 图集的高度
 * @param {width} 是否不要启用格子（默认为false,false表示使用优化格子，true为保持引擎原方案）
 */
function Atlas (width, height, noGrid) {
    let texture = new RenderTexture();
    texture.initWithSize(width, height);
    texture.update();

    this._texture = texture;

    this._x = space;
    this._y = space;
    this._nexty = space;

    this._width = width;
    this._height = height;

    this._innerTextureInfos = {};
    this._innerSpriteFrames = [];

    this._useGrid = !!!noGrid;//是否使用格子
    if(this._useGrid){
        this._gridW = 16;
        this._gridH = 16;
        this._atlasGrid = new AtlasGrid(width/this._gridW,height/this._gridH);
    }
}

Atlas.DEFAULT_HASH = (new RenderTexture())._getHash();

cc.js.mixin(Atlas.prototype, {
    insertSpriteFrame (spriteFrame) {
        let rect = spriteFrame._rect,
            texture = spriteFrame._texture,
            info = this._innerTextureInfos[texture._id];

        let sx = rect.x, sy = rect.y;

        if (info) {
            sx += info.x;
            sy += info.y;
        }
        else {
            let width = texture.width, height = texture.height;
            if(this._useGrid){
                if(!this._atlasGrid){
                    this._atlasGrid = new AtlasGrid(this._width/this._gridW,this._height/this._gridH);
                }
                let pos = new cc.v2(0,0);
                let find = this.getEmpty(width+space,height+space,pos);
                if(!find){
                    cc.warn("no space for Texture",texture.url)
                    return null;//已经没有空间能放下这张图片了
                } 
                // texture bleeding
                this._texture.drawTextureAt(texture, pos.x-1, pos.y);
                this._texture.drawTextureAt(texture, pos.x+1, pos.y);
                this._texture.drawTextureAt(texture, pos.x, pos.y-1);
                this._texture.drawTextureAt(texture, pos.x, pos.y+1);
                this._texture.drawTextureAt(texture, pos.x, pos.y);
                this._innerTextureInfos[texture._id] = {
                    x: pos.x,
                    y: pos.y,
                    texture: texture
                };
                sx += pos.x;
                sy += pos.y;
            }else{
                if ((this._x + width + space) > this._width) {
                    this._x = space;
                    this._y = this._nexty;
                }

                if ((this._y + height+space) > this._nexty) {
                    this._nexty = this._y + height + space;
                }

                if (this._nexty > this._height) {
                    return null;
                }

                // texture bleeding
                this._texture.drawTextureAt(texture, this._x-1, this._y);
                this._texture.drawTextureAt(texture, this._x+1, this._y);
                this._texture.drawTextureAt(texture, this._x, this._y-1);
                this._texture.drawTextureAt(texture, this._x, this._y+1);
                this._texture.drawTextureAt(texture, this._x, this._y);

                this._innerTextureInfos[texture._id] = {
                    x: this._x,
                    y: this._y,
                    texture: texture
                };

                sx += this._x;
                sy += this._y;

                this._x += width + space;
            }

            this._dirty = true;
        }
        let frame = {
            x: sx,
            y: sy,
            texture: this._texture
        }
        return frame;
    },

    /**
    @description:查询最近并满足需求的合图区域，设置grid信息，返回的是
	*如果返回null，则表示无法加入了
	*优先选择最接近自己高度的节点
	*@param w 宽度
	*@param h 高度
	*@return Boolean true代表找到位置，插入成功，false则表示这张合图已经放不下了，插入失败。
	*/
    getEmpty(w,h,pos){
        var find = this._atlasGrid.addRect(1,Math.ceil(w/this._gridW),Math.ceil(h/this._gridH),pos);
        if(find){
            //grid插入数据成功
            pos.x = pos.x*this._gridW+space;
            pos.y = pos.y*this._gridH+space;
        }
        return find;

    },
    update () {
        if (!this._dirty) return;
        this._texture.update();
        this._dirty = false;
    },

    reset (isDestroy) {
        this._x = space;
        this._y = space;
        this._nexty = space;
        this._innerTextureInfos = {};
        //格子也要重置
        if(this._atlasGrid){
            if(isDestroy){
                this._atlasGrid._release();
                this._atlasGrid = null;
            }else{
                this._atlasGrid.init(this._width/this._gridW,this._height/this._gridH);
            }
        }
    },
    getUsedRate(){
        if(this._useGrid) return this._atlasGrid._used;
    },
    destroy () {
        this.reset(true);
        this._texture.destroy();
    }

});

module.exports = Atlas;
