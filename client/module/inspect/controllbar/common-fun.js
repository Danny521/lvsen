define(function () {
	
	return {
		/**
		 * [getPlayTime 播放历史的时候取播放时间]
		 * sence:
		 * 1.添加正标记
		 * @author huzc
		 * @date   2015-03-09
		 * @param  {[数字]}   time   [时间]
		 * @param  {[对象]}   player [播放器对象]
		 * @param  {[数字]}   index  [分屏序号]
		 * @return {[数字]}          [时间]
		 */
		"getPlayTime": function (time, player, index) {
			var _player = player;
			var attrstr = _player.playerObj.GetVideoAttribute(index);
			if (attrstr != "ERROR") {
				var videoType = JSON.parse(attrstr).videoType;
				if (videoType == 2) {
					var T = player.getPlayTime(index) - 0;
					//var delta=window.SelectCamera.ListData[index].timePoint;
					var beginTime = window.SelectCamera && window.SelectCamera.ListData[index].beginTime;
					time = window.Toolkit.formatDate(new Date(beginTime + T));
				}
			}
			return time;
		}
	};

});