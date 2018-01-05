define(['pubsub'], function(pubsub){

	var subscribeInterface = function(){
		pubsub.subscribe("playVideo", function(msg, data){
			//alert("播放视频");
		});
	};

	subscribeInterface.prototype = {
		
	};

	new subscribeInterface();
});