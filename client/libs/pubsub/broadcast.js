/* 
* @Author: huzc
* @Date:   2015-01-27 09:45:16
* @Last Modified by:   Administrator
* @Last Modified time: 2015-07-16 09:55:25
*/
(function(root, factory){
	'use strict';
	// CommonJS
	if (typeof exports === 'object' && module){
		module.exports = factory();
	// AMD
	} else if (typeof define === 'function' && define.amd){
		define(factory);
	// Browser
	} else {
		root.BroadCast = factory();
	}
}( ( typeof window === 'object' && window ) || this, function(){

	var BroadCast = { handlers:{},windowList:[]};
	BroadCast.storage={};
	BroadCast.timeStep=5000;
	window.BroadCast=BroadCast;
	var  ie678 = !+"\v1";
	/**
	 * [on 收听广播]
	 * @author huzc
	 * @date   2015-06-06
	 * @param  {[字符串]}   eventType [广播频道]
	 * @param  {[json]}   handler   [收到的广播数据]
	 * @return {[type]}             [无]
	 */
	BroadCast.on = function(eventType, handler) {
		if(!this.handlers[eventType]) {
			this.handlers[eventType] = [];
		}
		this.handlers[eventType].push(handler);
		return this;
	}
	/**
	 * [emit 发送广播]
	 * @author huzc
	 * @date   2015-06-06
	 * @param  {[字符串]}   eventType [发送广播频道]
	 * @param  {[json]}   data      [发送广播数据]
	 */
	BroadCast.emit = function(eventType,data) {
		if(!data){
			data={};
		}
		BroadCast.handlers[eventType]=[];
		data["_random"]=Math.random();
		BroadCast.emitToWindow(window,eventType,data);
		//BroadCast.emitToFrames(window.top,eventType,data);
	}
	/**
	 * [emitToWindow 发送广播到其他窗口，内部函数]
	 * @author huzc
	 * @date   2015-06-06
	 * @param  {[对象]}   win       [description]
	 * @param  {[字符串]}   eventType [description]
	 * @param  {[json]}   data      [description]
	 */
	BroadCast.emitToWindow=function(win,eventType,data){
		if(typeof(win)!="object"){return}
		var oldData=win.localStorage.getItem(eventType);
		if(!oldData){var oldobj={}}
		else{
			try{var oldobj=JSON.parse(oldData);}
			catch(e){var oldobj={};}
		}
		if(typeof(data)=="string"||typeof(data)=="number"){
			data=data+"";
			var obj={
				EMIT_NAME:eventType,
				value:data,
				url:location.href
			};  
		}
		else if(typeof(data)=="object"){
			data.EMIT_NAME=eventType;
			data.url=location.href;
			var obj=data;
		}
		var str=JSON.stringify(obj);
		win.localStorage.setItem(eventType,str);
		win.postMessage(str,"*");
		if(ie678){
			BroadCast.SetCookie(eventType,str);
		}
	}

	BroadCast.on("ask-online",function(data){
		BroadCast.emit("anwser-online",{"data":"online"});
	});
	/**
	 * [count 统计有哪些听众]
	 * @author huzc
	 * @date   2015-06-06
	 * @param  {Function} fn [回调，参数为听众信息的数组]
	 */
	BroadCast.count=function(fn,flag){
		var  A=[];
		BroadCast.on("anwser-online",function(data){
			A.push(data);
		});
		BroadCast.emit("ask-online",{"data":"hello"});
		if(flag){
			fn&&fn(A);
		}else{
			setTimeout(function(){
				fn&&fn(A);
			},100);
		}
	}
	/**
	 * [checkPage 检查页面是否存在]
	 * @author huzc
	 * @date   2015-06-08
	 * @param  {[字符串]}   url [description]
	 * @param  {Function} fn  [description]
	 */
	BroadCast.checkPage=function(url,fn){
		var List=[];
		BroadCast.count(function(A){
			if(A[i].url.indexOf(url)){
				List.push(A[i]);
			}
		},false);
		fn&&fn(List);
	}

	BroadCast.emitToWindowList=function(windows,eventType,data){
		var L=windows.length;
		for(var i=0;i<=L-1;i++){
			BroadCast.emitToWindow(windows[i],eventType,data);
		}
	}
	/**
	 * [getFrames 统计iframe信息]
	 * @author huzc
	 * @date   2015-06-06
	 * @param  {[对象]}   win [window对象，需要需要的页面window对象]
	 */
	BroadCast.getFrames=function(win){
		var self=this;
		var A=[];
		var L=win.frames.length;
		for(var i=0;i<=L-1;i++){
			(function(k){
				A.push(win.frames[k]);
				A.concat(self.getFrames(win.frames[k]));               
			})(i);
		}
		return A;
	}
	/**
	 * [emitToFrames 向指定窗口发送广播]
	 * @author huzc
	 * @date   2015-06-06
	 * @param  {[对象]}   win       [窗口window对象]
	 * @param  {[字符串]}   eventType [广播频道]
	 * @param  {[json]}   data      [广播数据]
	 */
	BroadCast.emitToFrames=function(win,eventType,data){
		var A=this.getFrames(win);
		var L=A.length;
		for(var i=0;i<=L-1;i++)
		{
			BroadCast.emitToWindow(A[i],eventType,data);
		}
	}

	BroadCast.listenOpened=function(fn){
		BroadCast.BindEvent("message",function(evt){
			var data=evt.data;
			var obj=JSON.parse(data);
			if(obj.type=="windowList"){
				var A=BroadCast.windowList.length;
				for(var i=0;i<=L-1;i++){
					if(BroadCast.windowList[i].id==obj.id) {
						fn(BroadCast.windowList[i].window);
						break;
					}
				}
			}
		});
	}

	BroadCast.BindEvent=function(obj,name,fn){
		if(obj.addEventListener){
			obj.addEventListener(name,fn,false);
		} else if(obj.attachEvent){
			obj.attachEvent("on"+name,fn);
		}
	}

	BroadCast.UnBindEvent=function(obj,name,fn){
		if(obj.removeEventListener){
			obj.removeEventListener(name,fn,false);
		}
		else if(obj.attachEvent){
			obj.detachEvent("on"+name,fn);
		}
	}

	BroadCast.getOpenWindow=function(id,fn){
		var A=BroadCast.windowList;
		var L=A.length;
		for(var i=0;i<=L-1;i++){
			if(A[i].id===id){
				fn(A[i].window);
				break;
			}
		}
	}
	/**
	 * [getDefaultStorage description]
	 * @author huzc
	 * @date   2015-07-15
	 * @return {[type]}   [description]
	 */
	BroadCast.getDefaultStorage=function(){
		var storage={};
		for(var x in window.localStorage){
			storage[x]=window.localStorage.getItem(x);
		}
		BroadCast.storage=storage;
		return storage;
	}

	BroadCast.delCookie=function(name)//删除cookie
	{
	   document.cookie = name+"=;expires="+(new Date(0)).toGMTString();
	}

	BroadCast.getCookie=function(objName){//获取指定名称的cookie的值
		var arrStr = document.cookie.split("; ");
		for(var i = 0;i < arrStr.length;i ++){
			var temp = arrStr[i].split("=");
			if(temp[0] == objName){
				return unescape(temp[1]);
			} 
	   }
	}

	BroadCast.addCookie=function(objName,objValue,objHours){ 
		var str = objName + "=" + escape(objValue);
		if(!objHours){
			objHours=24;
		}
		if(objHours > 0){
			var date = new Date();
			var ms = objHours*3600*1000;
			date.setTime(date.getTime() + ms);
			str += "; expires=" + date.toGMTString();
	   }
	   document.cookie = str;
	}

	BroadCast.SetCookie=function(name,value)//两个参数，一个是cookie的名子，一个是值
	{
		var Days = 30; //此 cookie 将被保存 30 天
		var exp = new Date();    //new Date("December 31, 9998");
		exp.setTime(exp.getTime() + Days*24*60*60*1000);
		document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString();
	}

	BroadCast.cookietoJSON=function(data)
	{
		var obj={};
		var A = data.split("; ");
		for(var i = 0;i < A.length;i ++){
			var temp = A[i].split("=");
			obj[temp[0]]=temp[1];
	   }
	   return obj;
	}
	BroadCast.cookies=document.cookie;
	BroadCast.timeStep=1000;
	var ieVersion = eval("''+/*@cc_on"+" @_jscript_version@*/-0")*1;
	var ie67=(ieVersion === 5.6)||(ieVersion === 5.7);

	BroadCast.cookieEvent=function(fn){
		if(document.referrer){return}
		if(ieVersion === 5.9){return}
		if(!!window.addEventListener){return}
		setInterval(function(){
			var Flag=(document.cookie!= BroadCast.cookies);
			Flag=Flag&&(!BroadCast.BasePage||BroadCast.getCookie==false)||ie67;
			if(Flag){
				 var localCookie=BroadCast.cookietoJSON(BroadCast.cookies);
				 var realCookie=BroadCast.cookietoJSON(document.cookie);
				 for(var x in realCookie){
					if(localCookie[x]!==realCookie[x]){
						var realCookieobj=JSON.parse(unescape(realCookie[x]));
						realCookieobj.EMIT_NAME=realCookieobj.name;
						var evt=realCookieobj;
						fn(evt);
						break;
					}
				 }
				 BroadCast.cookies=document.cookie;
			}
		},BroadCast.timeStep);
	}

	BroadCast.BindEvent(window,"message",function(evt){
		setTimeout(function(){
			evt=evt||window.event;
			var obj=JSON.parse(evt.data);
			var A=BroadCast.handlers[obj.EMIT_NAME];
			if(A){
				var L=A.length;
				for(var i=0;i<=L-1;i++)
				{
					A[i](obj);
				}
			}
		},200);

	});

	BroadCast.BindEvent(window,"storage",function(evt){
		evt=evt||window.event;
		var key=evt.key;
		if(!evt.newValue){return}
		try{
			var Eventobj=JSON.parse(evt.newValue);
		}catch(e){
			return;
		}
		
		Eventobj.EMIT_NAME=key;
		var A=BroadCast.handlers[key];
		if(A) {
			var L=A.length;

			for(var i=0;i<=L-1;i++)
			{
				A[i](Eventobj);
			}            
		}
	});
	// var handle=ie678?document:window;
	//IE8下发现，evt.key无效，evt下的数据只有url有价值
	BroadCast.BindEvent(document,"storagecommit",function(evt){
		return;
		evt=evt||window.event;
		var str="";
		for(var x in evt)
		{
		   str=str+";\n"+(x+","+evt[x]); 
		}
		if(!evt.key){return}
		var A=BroadCast.handlers[evt.key];
		if(A)
		{
			var L=A.length;
			for(var i=0;i<=L-1;i++)
			{
				A[i](evt);
			}            
		}
	});

	BroadCast.getDefaultStorage();
	//IE8加的
	BroadCast.BindEvent(document,"storage",function(evt){
		setTimeout(function(){
			for(var x in window.localStorage){
				var Item=window.localStorage.getItem(x);
			   if(BroadCast.storage[x]!==Item){
					var obj=JSON.parse(Item);
					obj.EMIT_NAME=x;
					var A=BroadCast.handlers[x];
					if(A){
						var L=A.length;
						for(var i=0;i<=L-1;i++){
							A[i](obj);
						}            
					}
					BroadCast.storage[x]=Item;
					break;
				}                
			}
		},0);
	});

	BroadCast.cookieEvent(function(evt){
		var A=BroadCast.handlers[evt.key];
		if(A){
			var L=A.length;
			for(var i=0;i<=L-1;i++){
				A[i](evt);
			}            
		}
	});
	return BroadCast;
}));

