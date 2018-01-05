MapPlatForm = {};
MapPlatForm.Base = {};
//创建Marker图标居中
MapPlatForm.ModdleMarker = 0;
//创建Marker图标底部为中心点
MapPlatForm.BottomMarker = 1;
(function() {
	// body...
	var jsFiles = null;
	 jsFiles = [
        "MapConfig.js",
	 	"MapTools.js",
	 	"MapTag.js",
	 	"MapService.js",
        "MapGeometry.js"
	 ];
	var scriptName = "MapBase.js";
	var r = new RegExp("(^|(.*?\\/))(" + scriptName + ")(\\?|$)"),
        s = document.getElementsByTagName('script'),
        src, m, host = "";
    for (var i = 0, len = s.length; i < len; i++) {
        src = s[i].getAttribute('src');
        if (src) {
            m = src.match(r);
            if (m) {
                host = m[1];
                break;
            }
        }
    }
    host = host+"Base";
	if (!jsFiles || jsFiles.length <= 0)
            return;
        var scriptTags = new Array(jsFiles.length);
        for (var i = 0, len = jsFiles.length; i < len; i++) {
            scriptTags[i] = "<script type='text/javascript' src='" + host + "/" + jsFiles[i] + "'></script>";
        }
        if (scriptTags.length > 0) {
            document.write(scriptTags.join(""));
        }    
})();