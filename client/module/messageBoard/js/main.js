/**
 * Created by Leon.z on 2016/5.5
 */
define(["require","domReady","jquery-ui-1.10.1.custom.min","base.self"],function(require,domReady){
    domReady(function(){
        require(["js/messgaMain","js/messageView"],function(main,msgView){
        	main.init();
        	msgView.init(main);
        });
    });
});