define(['mootools', '/module/ptz-controller/win-dialog.js', 'jquery', 'jquery-ui'], function(MooTools,setDrag) {
	var _Effect = function() {

		var self = this;
		this.bindEvent = function(gVideoPlayer) {

		};

		this.convertValue = function(value) {
			return Math.round((value + 127) / 2.54);
		};

		//弹出色彩调节对话框
		this.showDialog = function(obj, pobj) {
			var self = this;
			var index=pobj.index;
			var data=pobj.data;
			self.player=pobj.player;
			self.showWebDialog(obj, pobj);
		};

		this.winclose=function(player){
			var L=player.playerObj.GetLayout();
			for(var i=0;i<=L-1;i++){
				var cd=player.cameraData[i];
				if(typeof(cd)=="object"){
					var hd=player.cameraData[i].Effect;
					if(hd>0){
						player.playerObj.CloseWebDialog(hd);
					}
				}
			}	
		};

		this.showWebDialog=function(obj, pobj){
			var self=this;
			var index=pobj.index;
			var data=pobj.data;
			var player=self.player=pobj.player;
			self.winclose(pobj.player);
			var brStyle={
				"url":"http://"+location.host+"/module/ptz-controller/effect/index.html", 
				"center":true,
				"left":0,
				"top":200,
				"width":285,
				"height":264,
				"alpha":0.1,
				"resize":true,
				"minbtn": {
					"show": false
				},
				"border":
				{ 
					"width":2,
					"color":13421772
				}, 
				"title":
				{
					"text":"色彩调节", 
					"color":15987699,
					"height":45, 
					"fontsize":14
				}, 
				"closebtn":
				{
					"normal":10066329, 
					"hover":14828338
				}, 
				"modal":false
			};
			brStyle=JSON.stringify(brStyle);
			try{
				var N=player.playerObj.ShowWebDialog(brStyle);
				player.cameraData[index].Effect=N;
			}catch(e){
				notify.warn("请安装最新版本的ocx");
			}
			player.DialogIndex=index;
			/**
			 * 取消绑定的事件，add by zhangyu on 2015/5/26
			 */
			player.removeEvents("WebDialogEvent", {
				internal: false
			});
			player.addEvent("WebDialogEvent",function(id,eid,data){
				if(N==id){
					if(data=="window.close"){
						if(typeof(player.cameraData[index])=="object"){
							delete player.cameraData[index].Effect;
						}
						return;
					}
					var data=JSON.parse(data);
					if(data.type=="complate"){

					}else{
						var index = player.playerObj.GetFocusWindowIndex();
						player.setColor(data, index);
						player.cameraData[index].effect = Object.clone(data); //将改变后的色彩参数保存至每个通道							
					}
				}
			});
		};
	};
	//window.Effect = new _Effect();
	var Effect = new _Effect();
	return Effect;
});