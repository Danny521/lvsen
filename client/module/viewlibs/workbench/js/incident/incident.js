require(['/require-conf.js'], function(){
    require(['domReady', 'js/incident/IncidentMgrController'], function(domReady, IncidentMgr){


        domReady(function(){
            jQuery(function() {

                if (window.location.href.indexOf("create") !== -1 && window.location.href.indexOf("_bak") === -1) {
                    IncidentMgr.init({
                        "mode": "create"
                    })
                } else if (window.location.href.indexOf("update") !== -1) {
                    IncidentMgr.init({
                        "mode": "edit"
                    })
                }

            });
        })
    })
})
