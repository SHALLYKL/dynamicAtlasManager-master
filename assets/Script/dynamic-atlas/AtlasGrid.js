/******************************************
 * @author shallykl<657669149@qq.com>
 * @copyright 2019.6.17
 * @doc 图集格子信息.
 * @Description: AtlasGrid 将图集划分为格子，
    每个格子记录格子的使用信息、当前行剩余的格子数、当前列剩余的格子数。
    通过这些信息来计算新的图片插入到图集中的位置
    注意：AtlasGrid本身不包含图片信息，只包含格子信息。格子个数不超过256*256
 * @example
 * var atlasGrid = new AtlasGrid(1028,1028)//请使用new来创建一个AtlasGrid实例
 * @end
 ******************************************/

function AtlasGrid(width,height){
	this._width=0;
	this._height=0;
	this._texCount=0;
	this._rowInfo=null;
	// 当前行的最大长度
	this._cells=null;
	// 每个格子的信息。{type,w,h}相当于一个距离场. type=0 表示空闲的。不为0的情况下w,h填充的是该区块图片的宽高
	this._used=0;

	(width===void 0)&& (width=0);
	(height===void 0)&& (height=0);
	this._cells=null;
	this._rowInfo=null;
	this.init(width,height);
}

cc.js.mixin(AtlasGrid.prototype,{
	init(width,height){
		this._width=width;
		this._height=height;
		this._release();
		if (this._width==0) {cc.warn("AtlasGrid的宽高不能为0！");return false;}
		this._cells = new Uint8Array(this._width *this._height*3);
		this._rowInfo = new Uint8Array(this._height);
		this._used=0;
		this._clear();
		return true;
    },
    
	/**
	 * @description:填充数据 
	 * @param {type} 需要的格子类型，1为有数据的，0为没有数据的
	 * @param {width} 需要的实际宽度
	 * @param {width} 需要的实际高度
	 * @param {pos} 返回的位置
	 * @return:Boolean true代表找到位置，插入成功，false则表示这张合图已经放不下了，插入失败。
	 */
	addRect(type,width,height,pos){
        if(!this._get(width,height,pos)) return false;
        pos = pos === void 0 ? new cc.v2(0, 0):pos;
		this._fill(pos.x,pos.y,width,height,type);
		this._texCount++;
		return true;
	},
	_release(){
		this._cells = null;
		this._rowInfo = null;
	},

	_get(width,height,pos){
		if (width > this._width || height >this._height){
			return false;
		};
		var rx=-1;
		var ry=-1;
		var nWidth=this._width;
		var nHeight=this._height;
		var pCellBox=this._cells;
		for (var y=0;y < nHeight;y++){
			//如果该行的空白数 小于 要放入的宽度则返回
			if (this._rowInfo[y] < width)continue ;
			for (var x=0;x < nWidth;){
				var tm=(y *nWidth+x)*3;//起始点
				// 1.格子没被使用（1表示使用过 0表示没使用）
                // 2.当前格子剩下的宽度大于图片的宽度
                // 3.当前格子剩下的高度大于图片的高度
				if (pCellBox[tm] !=0 || pCellBox[tm+1] < width || pCellBox[tm+2] < height){
					x+=pCellBox[tm+1];//调到下一个空白区域
					continue ;
				}
				rx=x;
				ry=y;

				//判断起始点之后的各个点是否满足
				for (var xx=0;xx < width;xx++){
					//遍历之后width的节点 检查高度是不是都符合
                    //tm是起始位置  3xx是之后的每一个像素位置  +2 取高度字段
					if (pCellBox[3*xx+tm+2] < height){
						rx=-1;
						break ;
					}
				}
				//不满足，则取下一个点
				if (rx < 0){
					x+=pCellBox[tm+1];
					continue ;
				}
				// pos.x = rx/3;
				// pos.y = ry/3;
				pos.x=rx;
				pos.y=ry;
				return true;
			}
		}
		return false;
	},
	_fill(x,y,w,h,type){
		var nWidth=this._width;
		var nHeghit=this._height;
		//放不下
		if((x+w)>nWidth || (y+h)>nHeghit){
			return false;
		}
		for (var yy=y;yy < (h+y);++yy){
			if(this._rowInfo[yy]<w){cc.error("宽度不够！")}
			//更新每行空白数
			this._rowInfo[yy]-=w;
			for (var xx=0;xx < w;xx++){
				var tm=(x+yy *nWidth+xx)*3;
				if(this._cells[tm]!=0) {cc.error("有区域已被占用！");}
				//将区域内的格子都设置为当前的图像信息
				this._cells[tm]=type;
				this._cells[tm+1]=w;//填充的图片的宽高，用作检测，当检测到有图片时，直接跳过该区块
				this._cells[tm+2]=h;
			}
		}
		if (x > 0){
			for (yy=0;yy < h;++yy){
				var s=0;
				//找到左侧第一个type!=0的点  即找到第一个有数据的点
                //s记录格子数
				for (xx=x-1;xx >=0;--xx,++s){
					if (this._cells[((y+yy)*nWidth+xx)*3] !=0)break ;
				}

				//更新水平方向两个图像之间空白区域的剩余宽度信息
				for (xx=s;xx > 0;--xx){
					this._cells[((y+yy)*nWidth+x-xx)*3+1]=xx;

				}
			}
		}

		//调整上方相邻空白格子的高度连续信息描述
		if (y > 0){
			for (xx=x;xx < (x+w);++xx){
				s=0;
				//找到上方第一个type!=0的点  即找到第一个有数据的点
                //s记录格子数
				for (yy=y-1;yy >=0;--yy,s++){
					if (this._cells[(xx+yy *nWidth)*3] !=0)break ;
				}
				//更新垂直方向方向两个图像之间空白区域的剩余高度信息
				for (yy=s;yy > 0;--yy){
					this._cells[(xx+(y-yy)*nWidth)*3+2]=yy;
				}
			}
		}
		this._used+=(w*h)/(this._width*this._height);
    },
    //清理
	_clear(){
		this._texCount=0;
		for (var y=0;y < this._height;y++){
			this._rowInfo[y]=this._width;
		}
		for (var i=0;i < this._height;i++){
			for (var j=0;j < this._width;j++){
				var tm=(i *this._width+j)*3;
				this._cells[tm]=0;
				this._cells[tm+1]=this._width-j;
				this._cells[tm+2]=this._width-i;
			}
		}
	}
})
module.exports = AtlasGrid;
