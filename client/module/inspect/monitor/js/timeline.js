define(function(){
	(function(){
    function $ID(obj){ return document.getElementById(obj);}
    function getX(obj){ return obj.offsetLeft+(obj.offsetParent?getX(obj.offsetParent):obj.x?obj.x:0);}    
    function getY(obj){ return (obj.offsetParent?obj.offsetTop+getY(obj.offsetParent):obj.y?obj.y:0);}

    var _console={};
    _console.log=function(x)
    {
    	if(console)
    	{
    		//console.log(x);
    	}
    }

    var notify=parent.notify;

	Date.prototype.format = function(format)
	{
		var o = 
		{ 
			"M+" : this.getMonth()+1, //month 
			"d+" : this.getDate(), //day 
			"h+" : this.getHours(), //hour 
			"m+" : this.getMinutes(), //minute 
			"s+" : this.getSeconds(), //second 
			"q+" : Math.floor((this.getMonth()+3)/3), //quarter 
			"S" : this.getMilliseconds() //millisecond 
		} 

		if(/(y+)/.test(format))
		{ 
		   format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
		} 

		for(var k in o) 
		{ 
			if(new RegExp("("+ k +")").test(format)) 
			{ 
			  format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length)); 
			} 
		}
	    return format; 
	} 

	function setDate(n)
	{
		  var D= new Date();
		  D.setHours(n);        //设置 Date 对象中的小时 (0 ~ 23)。 
		  D.setMinutes(0)       //设置 Date 对象中的分钟 (0 ~ 59)。 
		  D.setSeconds(0)       //设置 Date 对象中的秒钟 (0 ~ 59)。 
		  D.setMilliseconds(0)  //设置 Date 对象中的毫秒 (0 ~ 999)。
		  return D;
	}

    var _Timeline=function()
    {
	    this.setTime=function(y,m,d,h,m,s,ms)
	    {
			var D= new Date();
			D.setFullYear(y);  
			D.setMonth(m);
			D.setDate(d);
			D.setHours(h);     
			D.setMinutes(m);    
			D.setSeconds(s);      
			D.setMilliseconds(ms);
			var n=D.getTime();
			return n;
	    }

	    var self=this;
	    this.stype="minute";
    	this.uniwidth=50;
    	this.width=0;
    	this.start=0;
    	this.end=0;
    	this.zoom=1;
    	this.startTime=this.setTime(1970,0,1,0,0,0);
    	this.endTime=this.setTime(2014,0,1,0,0,0);
    	this.dotype="default";

    	this.getCell=function(k)
    	{
    		var id=this.id;
    		var w=$("#"+id).width();
    		return w/k;
    	}

    	this.getNow=function(stype,n)
    	{
			if(n){var D= new Date(n);}
			else{var D= new Date();}
    		if(stype=="minute")
    		{
				D.setMinutes(0);
				D.setSeconds(0);      
				D.setMilliseconds(0);
			    var n=D.getTime();
			    return n;
    		}
    		else if(stype=="hour")
    		{
				D.setHours(0);
				D.setMinutes(0);    
				D.setSeconds(0);      
				D.setMilliseconds(0);
				var n=D.getTime();
			    return n;
    		}
    		else if(stype=="date")
    		{
				D.setDate(1);
				D.setHours(0);
				D.setMinutes(0);    
				D.setSeconds(0);      
				D.setMilliseconds(0);
				var n=D.getTime();
			    return n;
    		}
    		else if(stype=="year")
    		{
				D.setMonth(0);
				D.setDate(1);
				D.setHours(0);     
				D.setMinutes(0);    
				D.setSeconds(0);      
				D.setMilliseconds(0);
				var n=D.getTime();
			    return n;
    		}
    		else
    		{
				D.setMinutes(0);
				D.setSeconds(0);      
				D.setMilliseconds(0);
			    var n=D.getTime();
			    return n;
    		}
    	}

	    this.getDate=function(datestr)
	    {
			var D= new Date(datestr);
			var _FullYear=D.getFullYear();
			var _Month=D.getMonth();
		    var _Day=D.getDay();   //从 Date 对象返回一周中的某一天 (0 ~ 6)。
		 	var _Date=D.getDate(); //从 Date 对象返回一个月中的某一天 (1 ~ 31)。
			var _Hours=D.getHours();
			var _Minutes=D.getMinutes();
			var _Seconds=D.getSeconds();
			var _Milliseconds=D.getMilliseconds();

		    var FullYear=(_Month)+(_Date-1)+(_Hours)+_Minutes+_Seconds+_Milliseconds; //=0为整年开头;
		    var Month=(_Date-1)+(_Hours)+_Minutes+_Seconds+_Milliseconds; //=0为整月开头;
		    var Day=_Day+(_Hours)+_Minutes+_Seconds+_Milliseconds; //=0为星期开头;
		    var Hours=(_Hours)+_Minutes+_Seconds+_Milliseconds; //=0为整小时开头;
		    var Minutes=_Minutes+_Seconds+_Milliseconds; //=0为整分钟时开头;
		    var Seconds=_Seconds+_Milliseconds; //=0为整秒时开头;

		    if(FullYear==0){return {FullYear:true};}
		    if(Month==0)   {return {Month:true};}
		    if(Day==0)     {return {Day:true};}
		    if(Hours==0)   {return {Hours:true};}
		    if(Minutes==0) {return {Minutes:true};}
		    if(Seconds==0) {return {Seconds:true};}    	
	    }

        this.setDrag=function(obj)
	    {
		  	 var x0=0;
		  	 var y0=0;
		  	 var left=0; 
		  	 var top=0;
		  	 var mousedown=false;

		  	 jQuery(obj.container).on("mousedown",obj.dragTarget,function(evt)
		  	 {
			  	 	x0=evt.clientX;
			  	 	y0=evt.clientY;
			  	 	left=jQuery(obj.moveTarget).css("left");
			  	 	top=jQuery(obj.moveTarget).css("top");
			  	 	left=parseInt(left);
			  	 	top=parseInt(top);
			  	 	mousedown=true;
			  	 	if(obj.ondragstart)
			  	 	{
			  	 		obj.ondragstart(x0,y0,x,y);
			  	 	}
		  	 });

		  	 jQuery(obj.container).on("mousemove",function(evt)
		  	 {
		  	 	if(mousedown)
		  	 	{
		      	 	var x=evt.clientX;
		      	 	var y=evt.clientY;      	 		
		  	 		if(obj&&obj.x)
		  	 		{
		  	 			var xx=left+x-x0;
		  	 			if(obj.minx&&xx<obj.minx){xx=obj.minx;}	
		  	 			if(obj.maxx&&xx>obj.maxx){xx=obj.maxx;}
		  	 			jQuery(obj.moveTarget).css("left",xx);
		  	 		}
		  	 		if(obj&&obj.y)
		  	 		{
		  	 			var yy=top+y-y0;
		  	 			if(obj.miny&&yy<obj.miny){yy=obj.miny;}	
		  	 			if(obj.maxy&&yy>obj.maxy){yy=obj.maxy;}
		  	 			jQuery(obj.moveTarget).css("top",yy);
		  	 		}
		  	 		if(obj.ondraging)
		  	 		{
		  	 			obj.ondraging(x0,y0,x,y);
		  	 		}
		  	 	}
		  	 });
		  	 var mouseout="";
		  	 if(obj.mouseout){mouseout="mouseout"}
		  	 jQuery(obj.container).on("mouseup "+mouseout,obj.dragTarget,function(evt)
		  	 {
			  	 	var x=evt.clientX;
			  	 	var y=evt.clientY;  
			  	 	mousedown=false;
			  	 	if(obj.ondragend)
			  	 	{
			  	 		obj.ondragend(x0,y0,x,y);
			  	 	}
		  	 });
	    }
	    
	    this.mousewheel=function()
	    {
	    	var id=this.id;
	    	_console.log("id="+id);
	    	_console.log(canvas);
			canvas.on("mousewheel",function(evt)
			{
				 if(self.dotype=="select"){return}
			     evt.preventDefault();
			     evt.stopPropagation();
			     var oevt=evt.originalEvent;
			     _console.log(oevt);
			     var preClass=self.viewClass;
			     var delta=0;
			     if(oevt.deltaY){delta=-oevt.deltaY}
			     if(oevt.wheelDelta){delta = oevt.wheelDelta/120;}
			     if(oevt.detail){delta = -oevt.detail/3;}

			     if(delta>0){self.viewClass--;}
			     else{self.viewClass++;}
			     var L=self["class"].length;
			     if(self.viewClass>L-1){self.viewClass=L-1}
			     else if(self.viewClass<0){self.viewClass=0}	
			     var obj=self.getTimeRange();
			     var start=obj.start;
			     var end=obj.end;
			     var dis=end-start;
			     //_console.log("self.viewClass="+self.viewClass)
			     var time=self.videoPlayer.getPlayTime(self.index)-2000;
			     //获取的时间是相对于0开始的，就是播放开始的时间
			     //self.onwheel(preClass,self.viewClass);
			     if(time-dis>0)
			     {
			     	var n=parseInt(time/dis);
			     	//self.MoveTime("+",1);
			     	//self.zeroTime=start+n*dis;
			        //_console.log("end<now,越界");
			     }
			     self.redraw(true);
			});
	    }

	    this.onwheel=function(preClass,n)
	    {
	    	var pointer=this.pointer;
	    	var pos=pointer.css("left").Number();
		    var obj=self.getTimeRange();
		    var start=obj.start;
		    var end=obj.end;
		    var dis=end-start;
		    var n=this.viewClass;
	    	var dx=this["class"][preClass].dis;

	        var t=this.pos2time(pos,start,start+dx);
	        pos=this.time2pos(t,start,end);
	        pointer.css("left",pos+"px");
	    }

	    this.time2pos=function(t,start,end)
	    {
	    	var dis=end-start;
	        return this.width*(t-start)/dis;
	    }

	    this.pos2time=function(x,start,end)
	    {
	    	var dis=end-start;
	    	return start+dis*x/this.width;
	    }

	    this.RangeResize=false;
	    String.prototype.Number=function()
	    {
	    	var n=parseFloat(this);
	    	return n;
	    }

	    this.showRange=function()
	    {
	    	RangeProgress.on("click",function(evt){
	    		var x0=$(this).css("left").Number();
	    		var w0=$(this).css("width").Number();
				RangeBegin.css("left",x0+"px");
				RangeEnd.css("left",(x0+w0)+"px");
				RangeBegin.css("display","block");
				RangeEnd.css("display","block");
	    	});
	    }

	    this.getSelectRange=function()
	    {
	    	var node=RangeProgress;
			var x1=node.css("left").Number();
			var x2=x1+node.css("width").Number();
			var obj=this.getTimeRange();
			var start=obj.start;
			var end=obj.end;
			var dis=end-start;
			var w=this.width;
			var _start=parseInt(start+dis*x1/w);
			var _end=parseInt(end+dis*x2/w);
			return [_start,_end];
	    }

	    this.getRange=function()
	    {
			var mousedown=false;
			var dragNode=null;
			var x0=0;
			var left=0;
			var id=this.id;
			var offset=getX($ID(id));
			//return
			canvas.on("mousedown",function(evt){
				if(self.dotype!="select"){return}
				RangeBegin.hide();
				RangeEnd.hide();
				dragNode=$(evt.target);
			    evt.preventDefault();
			    evt.stopPropagation();
				mousedown=true;
				x0=evt.clientX;
				var w=RangeProgress.css("width");
				w=parseInt(w);
				//if(w>0){return}				
				if(dragNode.hasClass("RangeProgress"))
				{
					left=dragNode.css("left").Number();
					return;
				}
				if(dragNode.hasClass("Range"))
				{
					RangeBegin.show();
					RangeEnd.show();
					left=dragNode.css("left").Number();
					return;
				}
				RangeProgress.css("left",(x0-offset)+"px");
				RangeProgress.css("width","0px");
				RangeProgress.show();
				return false;
			});

			canvas.on("mousemove",function(evt){
			    evt.preventDefault();
			    evt.stopPropagation();
			    if(self.dotype!="select"){return}
				//if($(evt.target).hasClass("RangeProgress")){return}
				if(mousedown)
				{
					var x=evt.clientX;
					var w=Math.abs(x-x0);
					var minx=Math.min(x,x0);
					//_console.log(dragNode.hasClass("RangeProgress"));
					if(dragNode.hasClass("RangeProgress"))
					{
						var xleft=left+(x-x0);
						//_console.log(xleft)
						dragNode.css("left",xleft+"px");
						return;
					}
					if(dragNode.hasClass("Range"))
					{
						var xleft=left+(x-x0);
						var sleft=RangeBegin.css("left");
						var eleft=RangeEnd.css("left");
						w=Math.abs(sleft.Number()-eleft.Number());
						//if(w<30){w=30}
						dragNode.css("left",xleft+"px");		
						RangeProgress.css("left",sleft);
						RangeProgress.css("width",(w)+"px");
						return;
					}
					RangeProgress.css("width",(w)+"px");
					RangeProgress.css("left",(minx-offset)+"px");
					return true;
				}
			});

			canvas.on("mouseup",function(evt){
				if(self.dotype!="select"){return}
				//if($(evt.target).hasClass("RangeProgress")){return}
				if(mousedown)
				{
				    evt.preventDefault();
				    evt.stopPropagation();
					mousedown=false;
					var x=evt.clientX;
					if(x==x0)
					{
						self.RangeResize=false;
						return;
					}
					this.RangeResize=true;
					self.onselectend(x,x0);	
				}
				return true;
			});
	    }

	    this.onselectend=function(x,x0)
	    {

	    }

	    this.dragXY=function()
	    {
			var mousedown=false;
			var dragNode=null;
			var x0=0;
			var left=0;
			var id=this.id;
			canvas.on("mousedown",function(evt){
				if(self.dotype!="default"){return}
			    //evt.preventDefault();
			    //evt.stopPropagation();
			    dragNode=$(evt.target);
				mousedown=true;
				x0=evt.clientX;
				left=Time_line.css("left");
				left=parseInt(left);
				//_console.log("canvas,mousedown");
				if(dragNode.hasClass("Time_line_pointer"))
				{
					self.AutoPointer(false);
					//_console.log("self.AutoPointer(false)")
					left=dragNode.css("left").Number();
				}
				return false;
			});

			canvas.on("mousemove",function(evt){
			    //evt.preventDefault();
			    //evt.stopPropagation();
			    if(self.dotype!="default"){return}
				if(mousedown)
				{
					var x=evt.clientX;
				    if(dragNode.hasClass("Time_line_pointer"))
				    {
						var xleft=left+(x-x0);
						dragNode.css("left",xleft+"px");
				    }
				}
			});

			canvas.on("mouseup",function(evt){
				if(self.dotype!="default"){return}
				if(mousedown)
				{
				    //evt.preventDefault();
				    //evt.stopPropagation();
					mousedown=false;
					var x=evt.clientX;
				    if(dragNode.hasClass("Time_line_pointer"))
				    {
				    	self.AutoPointer(false);
						var nowleft=dragNode.css("left").Number();
						self.onDragPointerEnd(x-x0,nowleft);
						return;
				    }
				    var dx=Math.abs(x-x0);
			    	if(dx<=10){return}
			    	if(x<x0)
			    	{
				    	//var dis=self["class"][self.viewClass].dis;
				    	var T=self.zeroTime;
				    	var now=(new Date()).getTime();
				    	if(T>now)
				    	{
				    		notify.warn("不能移动轴到未来");
				    		return;
				        }
			    	}
			    	else
			    	{
			    		//notify.warn("正在加载视频时间数据...");
			    	}
			    	self.AutoPointer(false);
			    	var n=(x>x0)?100:-100;

			    	var stype=(x>x0)?"MoveLeft":"MoveRight";
			    	self[stype](1); //滑动轴，平移一个单位

					Time_line.animate({left:n},200,function()
					{
						Time_line.css("left","0px");
					});					    
					self.ondragXYend(x,x0);	
				}
				return true;
			});
	    }

	    this.ondragXYend=function(x,x0)
	    {
			//this.pointer.css("left","0px");
	    }

	    this.MoveLeft=function(n){this.MoveTime("-",n);}
	    this.MoveRight=function(n){this.MoveTime("+",n);}

	    this.MoveTime=function(type,n)
	    {
	    	var x=this["class"][this.viewClass].dis;
	    	var T=this.zeroTime;
	    	if(!n){n=1;}
	    	if(type=="+"){T=T+n*x;}
	    	else{T=T-n*x;}
	    	this.zeroTime=T;
	    	this.redraw(true);
	    }

	    this["class"]=
	    [
			//{dis:1000,scale:10,per:"ms",ftype:"getSeconds",format:"yyyy-M-d h:mm:ss",subformat:"S"},
			//{dis:10*1000,scale:10,per:"s",ftype:"getSeconds",format:"yyyy-M-d h:mm:ss",subformat:"s"},
			//{dis:30*1000,scale:10,per:"s",ftype:"getSeconds",format:"yyyy-M-d h:mm:ss",subformat:"s"},
			{dis:60*1000,scale:12,per:"",ftype:"getSeconds",format:"yyyy-M-d h:mm:ss",subformat:"s"},
			{dis:5*60*1000,scale:5,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm:ss",subformat:"h:mm"},
			{dis:12*60*1000,scale:12,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:30*60*1000,scale:10,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:60*60*1000,scale:12,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm",subformat:"h:mm"},

			{dis:2*60*60*1000,scale:4,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:4*60*60*1000,scale:8,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:6*60*60*1000,scale:6,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:8*60*60*1000,scale:8,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:12*60*60*1000,scale:12,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:24*60*60*1000,scale:12,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},

			{dis:3*24*60*60*1000,scale:3,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:7*24*60*60*1000,scale:7,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:15*24*60*60*1000,scale:15,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:30*24*60*60*1000,scale:10,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:3*30*24*60*60*1000,scale:10,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:6*30*24*60*60*1000,scale:6,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:12*30*24*60*60*1000,scale:6,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"yyyy-M-d"}	
	    ];

	    this.showStart=function(zt,classvc)
	    {
			var D=new Date(zt);
			var len=classvc.scale;
			var m=D[classvc.ftype]();
			var str=D.format(classvc.format);
			showTime.html(str);
	    }

	    this.redraw=function(flag)
	    {
			var html="";
			var vc=this.viewClass;
			var classvc=this["class"][vc];
			var len=classvc.scale;

			var zt=this.zeroTime;
			this.showStart(zt,classvc);

			var per=classvc.per;
			var w0=this.getCell(len);
			var unit=classvc.dis/classvc.scale;
			var fmt=classvc.subformat;
			for(var i=0;i<=len;i++)
			{
			    //var k=(i+m);
			    var D=new Date(zt+unit*i);
			    var k=D.format(fmt);
			    var span="<span class='subscale'>"+k+per+"</span>";
		        html=html+"<div title='"+i+"' class='timescale' style='left:"+(i*w0)+"px'>"+span+"</div>";
			}
			Time_line.html(html);
			_console.log("redraw");
			if(flag&&this.timedata)
			{
				this.drawData(this.timedata.videos);
			}
	    }

	    this.getTimeRange=function()
	    {
	    	var n=this.viewClass;
	    	var dx=this["class"][n].dis;
	    	var start=this.zeroTime;
	    	var end=this.zeroTime+dx;
	    	var obj={start:start,end:end,dis:dx}
	    	return obj;
	    }

	    this.format=function(T)
	    {
			var D= new Date(T);
			var y=D.getFullYear();
			var M=D.getMonth();
			var d=D.getDate();
			var h=D.getHours();
			var m=D.getMinutes();
			var s=D.getSeconds();
			var ms=D.getMilliseconds();
			return [y,M,d,h,m,s,ms];
	    }

	    this.getScale=function(L,i)
	    {
			var Range_startTime=setDate(0).getTime();
			var Range_endTime=setDate(5).getTime();

			var startTime=2*Range_startTime-Range_endTime;
			var endTime=2*Range_endTime-Range_startTime;
			var dt=3*(Range_endTime-Range_startTime);
			var r=endTime+dt*(i-2*L)/(3*L);
			return r;    	
	    }

	    this.unitTime=200;
	    //8.7 +8000 比视频快
	    //8.7 +2000 比视频快
	    //8.7 -3000  似乎刚刚好
	    this.offsetTime=0;
	    this.AutoPointer=function(flag)
	    {
	         if(!flag){clearInterval(self.timer); return}
      	 	 var unitTime=self.unitTime;
      	 	 var pointer=this.pointer;
      	 	 var w=canvas.width();
      	 	 //_console.log("AutoPointer",unitTime);
      	 	 if(typeof(self.videoPlayer)!="object"){return}
		     this.timer=setInterval(function()
		     {
		     	 var obj=self.getTimeRange();
		     	 var start=obj.start;
		     	 var end=obj.end;
		     	 var T=self.offsetTime+self.videoPlayer.getPlayTime(self.index)-3000;
		     	 var dis=end-start;
		     	 //_console.log("T="+T+","+(end-start)+",initTime="+self.initTime+",zeroTime="+self.zeroTime);
		     	 var pos=w*(T+self.initTime-start)/dis;
		     	 //_console.log("self.initTime-start="+(self.initTime-start)+",w="+w+",pos="+pos);
		     	 if(pos<0){pos=0}
		     	 pointer.css("left",(pos)+"px");
		     	 var k=w*unitTime/dis;
		     	 if(w-pos<=k)
		     	 {
		     	 	//_console.log("跳轴");
		     	 	//_console.log([w,pos,k,w-pos,dis]);
		     	 	self.MoveTime("+",1);
		     	 	pointer.css("left","0px");
		     	 	return;
		     	 }
		     },unitTime);
	    }
	    
	    this.zero=0;
	    this.AutoPointer2=function(flag)
	    {
	         if(!flag){clearInterval(self.timer); return}
      	 	 var unitTime=self.unitTime;
      	 	 var pointer=this.pointer;
      	 	 var w=canvas.width();
      	 	 //_console.log("AutoPointer",unitTime);
      	 	 //if(typeof(self.videoPlayer)!="object"){return}
      	 	 this.zero=0;
		     this.timer=setInterval(function()
		     {
		     	 self.zero=self.zero+unitTime;
		     	 //var obj=self.getTimeRange();
		     	 //var start=obj.start;
		     	 //var end=obj.end;
		     	 //var dis=end-start;
		     	 var len=self["class"][self.viewClass].dis;
		     	 var k=w*unitTime/len;
		     	 var pos=pointer.css("left").Number();
		     	 pos=pos+w*unitTime/len;
		     	 pointer.css("left",pos+"px");
		     	 if(w-pos<=k)
		     	 {
		     	 	//_console.log("跳轴");
		     	 	//_console.log([w,pos,k,w-pos,dis]);
		     	 	self.MoveTime("+",1);
		     	 	pointer.css("left","0px");
		     	 	return;
		     	 }
		     },unitTime);
	    }

	    this.startData=0;
	    this.endData=0;
	    this.videodata=[];

		this.queryData=function(a,b,rngbegin,rngend)
		{
			function inset(x,L,R)
			{
				if(x>=L&&x<R){return true}
				else{return false}
			}

		    var a_in_range=inset(a,rngbegin,rngend);
		    var b_in_range=inset(b,rngbegin,rngend);

			if(b<=rngbegin)
			{
				return {type:0,msg:"无数据",begin:0,end:0};
			}
			else if(a<rngbegin&&b_in_range)
			{
				return {type:1,msg:"有数据",begin:rngbegin,end:b};
			}
			else if(a<rngbegin&&b>rngend)
			{
				return {type:2,msg:"有数据",begin:rngbegin,end:rngend};
			}
			else if(a_in_range&&b_in_range)
			{
				return {type:3,msg:"有数据",begin:a,end:b};
			}
			else if(a_in_range&&b>rngend)
			{
				return {type:4,msg:"有数据",begin:a,end:rngend};
			}
			else if(a>=rngend)
			{
				return {type:5,msg:"无数据",begin:0,end:0};
			}
		}

	    this.drawData=function(A)
	    { 
	    	var rng=this.getTimeRange();
	    	var start=rng.start;
	    	var end=rng.end;
	    	var basewidth=this.width;
	    	var dis=rng.dis;
	    	//console.log("Range="+getRangefmt([start,end]))
  	        //console.log("A="+getfmt(A))
	    	var L=A.length;
	    	var html="";
	    	for(var i=0;i<=L-1;i++)
	    	{
	    		var obj=this.queryData(A[i][0],A[i][1],start,end);
	    		if(obj.type==0||obj.type==5)
	    		{
	    			_console.log("越界跳过obj.type="+obj.type);
	    			continue;   
	    	    }
				var x=obj.begin;
				var w=obj.end-x;
				var left=basewidth*(x-start)/dis;
				var width=basewidth*w/dis;
	 			html=html+"<span class='videodata' style='left:"+left+"px;width:"+width+"px;'></span>";
	    	}
	    	_console.log(html)
	    	Time_line_Data.html(html);
	     }

		function getRangefmt(rng)
		{
		   var fmt="yyyy-MM-dd hh:mm:ss.000";
		   var str=rng[0]+","+rng[1]+";";
		   str=str+(new Date(rng[0])).format(fmt)+","+(new Date(rng[1])).format(fmt);
		   return str;
		}

		function getfmt(A)
		{
			  var fmt="yyyy-MM-dd hh:mm:ss.000";
			  var L=A.length;
			  var str=JSON.stringify(A)+";";

			  for(var i=0;i<=L-1;i++)
			  {
			      str=str+(new Date(A[i][0])).format(fmt)+","+(new Date(A[i][1])).format(fmt)+";"
			  }
			  return str;
		}
	    this.moveData=function(begintime,endtime)
	    {
	    	var rng=this.getTimeRange();
	    	var start=rng.start;
	    	var end=rng.end;
	    	var dis=end-start;
	    	var dx=begintime-start;
	    	//var w=endtime-begintime;
	    	if(dx<0)
	    	{
	    		var n=parseInt(-dx/dis);
	    		self.MoveLeft(n);
	    	}
	    	else
	    	{
	    		var n=parseInt(dx/dis);
	    		self.MoveRight(n);
	    	}
	    }

	    this.ChangeStatus=function()
	    {
	    	canvas.on("dblclick",function(evt){
	    		var Flag=(self.dotype=="default");
	    		self.dotype=Flag?"select":"default";
	    	});
	    }

        //拖动指针松开的事件；
	    this.onDragPointerEnd=function(x,left)
	    {
	    	
	    }

	    this.UIHTML=function()
	    {
	    	var html=
	    	[
				"<div class='showTime'></div>",
				"<div class='Time_line'></div>",
				"<div class='Time_line_Data'></div>",
				"<img class='Time_line_pointer' src='/assets/images/bg/pointer1.png'/>",
				"<div class='Time_line_Range'>",
					"<div class='RangeProgress'></div>",
					"<div class='Range RangeBegin'></div>",
					"<div class='Range RangeEnd'></div>",
				"</div>"
	    	].join("");
	    	return html;
	    }
	    var canvas=null;
	    var showTime=null;
	    var Time_line=null;
	    var Time_line_Data=null;
	    var Time_line_Range=null;

	    var RangeProgress=null;
	    var RangeBegin=null;
	    var RangeEnd=null;

	    this.initUI	=function(id)
	    {
	    	this.id=id;
	    	var html=this.UIHTML();
	    	var Node=$("#"+id);
	    	this.width=Node.width();
	    	Node.html(html);
	    	var Nodes=Node.children();
	    	canvas=Node;
	    	showTime=Nodes.eq(0);
	    	Time_line=Nodes.eq(1);
	    	Time_line_Data=Nodes.eq(2);
	    	this.pointer=Nodes.eq(3);
	    	Time_line_Range=Nodes.eq(4);
	    	var temp=Nodes.eq(4).children();
	    	RangeProgress=temp.eq(0);
	    	RangeBegin=temp.eq(1);
	    	RangeEnd=temp.eq(2);
	    }

	    this.initData="hour";
	    this.initTime=0;
	    this.use=false;
	    this.channelid=0;

	    this.repaint=function()
	    {
	    	this.initUI(this.id);
	    	//var d=this.initData;
	    	var t=this.initTime;
	    	var T=this.getNow("",t);
	    	T=this.initTime;
	    	this.zeroTime=T;
	    	this.redraw(true);
	    }

	    this.init=function(id)
	    {
	    	this.initUI(id);
	    	this.dragXY();
	    	var d=this.initData;
	    	var t=this.initTime;
	    	var T=this.getNow(d,t);
	    	this.zeroTime=T;
	    	this.initTime=T;
	    	this.viewClass=10
	    	this.redraw(false);
	    	this.mousewheel();
	    	//this.getRange();
	    	//this.showRange();
	    	//this.ChangeStatus();
	    	//this.dragPointer();
	    	//this.AutoPointer(true);
	    }
    }
    window.Timeline=_Timeline;
})();
});

