/** 从试图分析中全局数据传过来*/
var imgtolibRender = new Class({
	Implements: [Options, Events],
	player: null,
	intervalFlag: null, //计时器
	playStatus: false,
	totalWidth: 800,
	options: {
		filepath: null,
		picJson: null
	},
	initialize: function(options) {
		/**显示渲染图片内容*/
		//定义画布 并渲染数据
		var self = this;
		this.setOptions(options);
	},
	initShowPic: function() {
		var self = this;
		window.paperH = Raphael('image_struct', 800, 525);
		if (self.options.picJson != null && self.options.picJson != "") {
			window.paperH.fromJSON(self.options.picJson);
			jQuery('#image_struct svg rect').attr("cursor", "move");
			jQuery('#image_struct svg ellipse').attr("cursor", "move");
			jQuery('#image_struct svg path').attr("cursor", "move");
			//jQuery('#image_struct svg text').attr("cursor","move");
			function drawselect() {
				window.paperH.forEach(function(el) {
					//添加拖动方法
					if (el.type != 'image' && el.type != 'text') {
						if (el.attrs.opacity == '0.1') {
							el.drag(Move, StartMove, EndMove).data("textIn", el.next);

							function StartMove(dx, dy) {
								this.tempx = this.attr("x");
								this.tempy = this.attr("y");
							}

							function Move(dx, dy, x, y) {
								var attr = {
									'x': this.tempx + dx,
									'y': this.tempy + dy,
									'cursor': 'move'
								};
								this.attr(attr);
								var lb = this.data("textIn");
								var tx1 = this.tempx + dx;
								var ty1 = this.tempy + dy + this.attr("height") / 2;
								lb.transform(['T', tx1, ty1]);
							}

							function EndMove() {
								this.animate({
									"opacity": 0.1
								}, 300);
							}
						} else {
							el.draggable();
						}
					}
					//给文字添加可编辑方法
					if (el.type == 'text') {
						window.paperH.inlineTextEditing(el);
						el.dblclick(function(evt) {
							var input = el.inlineTextEditing.startEditing();
							$(input).on('blur', function(e) {
								el.inlineTextEditing.stopEditing();
							});
						});
					}
					//添加删除方法
					el.click(function(evt) {
						jQuery(document).on('keydown', '', function(e) {
							if (e.keyCode == 46 && el.type != 'image') {
								if (el.type == 'text') {
									if (el.prev.attrs.opacity == '0.1') {
										el.prev.remove();
									}
								}
								if (el.attrs&& el.attrs.opacity && el.attrs.opacity == '0.1') {
									if (el.next.type == 'text') {
										el.next.remove();
									}
								}
								el.remove();
							}
						});
					});
				});
			}
			drawselect();
		} else {
			// console.log("1212"+self.options.filepath)
			var img_url = self.options.filepath;
			var img = new Image();
			self.setImage(img_url, img);
		}
		var videoImpl = new videoAnalyst({
			toolContain: ".video_tool",
			paperId: "image_struct"
		});
		videoImpl.markTargettemplate();
	},
	initPlayer: function(playParm) {
		var playerImpl = new Mplayer({});
		playerImpl.initPlayer(playParm); //调用播放器
	},
	//设置图片大小
	setImage: function(img_url, img) {
		// 改变图片的src
		img.src = img_url;
		var check = function() {
			if (img.width > 0 || img.height > 0) {
				if (img.width > 700 || img.height > 424) {
					if (img.width / img.height > 700 / 424) {
						img.height = 700 * img.height / img.width;
						img.width = 700;
					} else {
						img.width = img.width / img.height * 424;
						img.height = 424;
					}
				}
				paperH.image(img_url, 0, 0, img.width, img.height);
				clearInterval(set);
			}
		};
		var set = setInterval(check, 40);
	}
});