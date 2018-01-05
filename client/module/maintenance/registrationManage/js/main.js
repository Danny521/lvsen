/**
 * Created by Leon.z on 2016/3/23.
 */
define(["require","domReady","jquery-ui-1.10.1.custom.min","base.self","permission"],function(require,domReady){
    domReady(function(){
        require(["js/view/main-port"],function(main){
        	main.init();
        });
    });
});