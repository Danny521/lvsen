define([
	'/module/ptz-controller/effect/effect.js'
], function(Effect) {

	return (function(scope) {

		//播放器对象
		var _player = null;

		scope.init = function(ocxPlayer) {
			//存储播放器对象
			_player = ocxPlayer;

			var index = _player.curChannel,
			data = _player.cameraData[index],
			pobj = {
				index: index,
				data: data,
				player: _player
			};
			_player.playerObj.SetFocusWindow(index);
			Effect.showDialog({
				center: true
			}, pobj);
		};

		return scope;

	}({}));
});