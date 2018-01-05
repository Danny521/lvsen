/**
 * Created by Leon.z on 2015/6/1.
 */
define(["require","domReady","mootools","jquery-ui-1.10.1.custom.min","base.self"],function(require,domReady,mootools){
    domReady(function(){
        require(["js/main-port"],function(main){
        	main.init();
        });
    }); 
});