
define(["domReady","js/authorization","js/upload","base.self"], function(domReady,Authorization,uploader) {

    domReady(function() {

        new Authorization({uploader:uploader});

    });

});


