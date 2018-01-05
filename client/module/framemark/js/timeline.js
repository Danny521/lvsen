define(['jquery','mootools'],function(){
	if(location.href.match(/\/dispatch\//gi)){return}
	if(location.href.match(/\/screen\.html/gi)){return}
	function $ID(obj){ return document.getElementById(obj);}
	function getX(obj){ return obj.offsetLeft+(obj.offsetParent?getX(obj.offsetParent):obj.x?obj.x:0);}    
	function getY(obj){ return (obj.offsetParent?obj.offsetTop+getY(obj.offsetParent):obj.y?obj.y:0);}

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

		this.getNow=function(stype)
		{
			if(stype=="minute")
			{
				var D= new Date();
				D.setMinutes(0);
				D.setSeconds(0);      
				D.setMilliseconds(0);
				var n=D.getTime();
				return n;
			}
			if(stype=="hour")
			{
				var D= new Date();
				D.setHours(0);
				D.setMinutes(0);    
				D.setSeconds(0);      
				D.setMilliseconds(0);
				var n=D.getTime();
				return n;
			}
			if(stype=="date")
			{
				var D= new Date();
				D.setDate(1);
				D.setHours(0);
				D.setMinutes(0);    
				D.setSeconds(0);      
				D.setMilliseconds(0);
				var n=D.getTime();
				return n;
			}
			if(stype=="year")
			{
				var D= new Date(); 
				D.setMonth(0);
				D.setDate(1);
				D.setHours(0);     
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

		var Events={};
		this.fireEvent=function(name,data)
		{
			if(Events[name])
			{
				var L=Events[name].length;
				for(var i=0;i<=L-1;i++)
				{
					Events[name][i](data);
				}			
			}
		}

		this.on=function(name,fn)
		{
			if(!Events[name]){Events[name]=[];}
			Events[name].push(fn);
		};

		this.mousewheel=function()
		{
			var self=this;
			var id=this.id;
			canvas.on("mousewheel",function(evt)
			{
				 if(self.dotype=="select"){return}
				 evt.preventDefault();
				 evt.stopPropagation();
				 var oevt=evt.originalEvent;
				 if(oevt.wheelDelta){delta = oevt.wheelDelta/120; }
				 if(oevt.detail){delta = -oevt.detail/3; }
				 if(delta>0)
				 {
					//console.log("delta="+delta);
					self.viewClass=self.viewClass-1;
				 }
				 else
				 {
					//console.log("delta="+delta);
					self.viewClass=self.viewClass+1;
				 }
				 var L=self["class"].length;
				 if(self.viewClass>L-1){self.viewClass=L-1}
				 if(self.viewClass<0){self.viewClass=0}	
				 self.redraw();
				 setTimeout(function(){
					self.fireEvent("mousewheel",{"viewClass":self.viewClass});
				 },20);
			});
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

		this.getRange=function()
		{
			var self=this;
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
					//console.log("Range,left="+left);
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
					//console.log(dragNode.hasClass("RangeProgress"));
					if(dragNode.hasClass("RangeProgress"))
					{
						var xleft=left+(x-x0);
						//console.log(xleft)
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

		this.drag=function(node,options)
		{
			if(!options){options={};}
			var mousedown=false;
			var x0=0;
			var Left0=0;
			var width=0;
			//var node=null;
			var id=this.id;

			canvas.on("mousedown",function(evt){
				//console.log("mousedown");
				evt.preventDefault();
				evt.stopPropagation();
				//if(!$(evt.target).hasClass("Range")){return}
				node=$(evt.target);
				mousedown=true;
				x0=evt.clientX;
				Left0=node.css("left");
				Left0=parseInt(Left0);
				width=RangeProgress.css("width");
				width=parseInt(width);
				if(options.start)
				{
					options.start(x0);
				}
				//console.log("mousedown");
			});

			canvas.on("mousemove",function(evt){
				evt.preventDefault();
				evt.stopPropagation();
				//if(!$(evt.target).hasClass("Range")){return}
				var x=evt.clientX;
				if(mousedown)
				{
					var startLeft=RangeBegin.css("left");
					var endLeft=RangeEnd.css("left");
					startLeft=parseInt(startLeft);
					endLeft=parseInt(endLeft);
					var w=Math.abs(endLeft-startLeft);
					if(w<20){return}
					var Left=Left0+(x-x0);
					//console.log(node[0]);
					node.css("left",Left+"px");
					RangeProgress.css("left",startLeft+"px");
					RangeProgress.css("width",w+"px");
					//console.log(Left);

					if(options.move)
					{
						options.move(x,x0);
					}
				}	
			});
			canvas.on("mouseup",function(evt){
				evt.preventDefault();
				evt.stopPropagation();
				//if(!evt.target.hasClass(".Range")){return}	
				mousedown=false;
				if(options.end){
					options.end();
				}
			});
		}

		this.dragXY=function()
		{
			var mousedown=false;
			var dragNode=null;
			var x0=0;
			var left=0;
			//return
			var id=this.id;
			//console.log(canvas);
			canvas.on("mousedown",function(evt){
				if(self.dotype!="default"){return}
				evt.preventDefault();
				evt.stopPropagation();
				mousedown=true;
				x0=evt.clientX;
				left=Time_line.css("left");
				left=parseInt(left);
				//console.log("canvas,mousedown");
				return false;
			});

			canvas.on("mousemove",function(evt){
				evt.preventDefault();
				evt.stopPropagation();
				if(self.dotype!="default"){return}
				if(mousedown)
				{
					var x=evt.clientX;
					//$("#Time_line").css("left",left+x-x0);	
					//console.log(Time_line.css("left"))
					return true;
				}
			});

			canvas.on("mouseup",function(evt){
				if(self.dotype!="default"){return}
				if(mousedown)
				{
					evt.preventDefault();
					evt.stopPropagation();
					mousedown=false;
					var x=evt.clientX;
					self.ondragend(x,x0);
				}
				return true;
			});
		}

		this.ondragend=function(x,x0)
		{
			var self=this;
			if(x==x0){return}
			var n=(x>x0)?100:-100;
			var stype=(x>x0)?"MoveLeft":"MoveRight";
			Time_line.animate({left:n},200,function()
			{
				self[stype]();
				Time_line.css("left","0px");
				self.fireEvent("dragend",x);
			});	
			//this.pointer.css("left","0px");
		}

		this.MoveLeft=function(){this.MoveTime("-");}
		this.MoveRight=function(){this.MoveTime("+");}

		this.MoveTime=function(type)
		{
			var x=this["class"][this.viewClass].dis;
			var T=this.zeroTime;
			if(type=="+"){T=T+x;}
			else{T=T-x;}
			this.zeroTime=T;
			this.redraw();
		}

		this["class"]=
		[
			{dis:1000,scale:10,per:"ms",ftype:"getSeconds",format:"yyyy-M-d h:mm:ss",subformat:"S"},
			{dis:10*1000,scale:10,per:"s",ftype:"getSeconds",format:"yyyy-M-d h:mm:ss",subformat:"s"},
			{dis:30*1000,scale:10,per:"s",ftype:"getSeconds",format:"yyyy-M-d h:mm:ss",subformat:"s"},
			{dis:60*1000,scale:12,per:"",ftype:"getSeconds",format:"yyyy-M-d h:mm:ss",subformat:"s"},
			{dis:2*60*1000,scale:12,per:"",ftype:"getSeconds",format:"yyyy-M-d h:mm:ss",subformat:"s"},
			{dis:3*60*1000,scale:12,per:"",ftype:"getSeconds",format:"yyyy-M-d h:mm:ss",subformat:"s"},
			{dis:4*60*1000,scale:12,per:"",ftype:"getSeconds",format:"yyyy-M-d h:mm:ss",subformat:"s"},
			{dis:5*60*1000,scale:5,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm:ss",subformat:"h:mm"},
			{dis:6*60*1000,scale:5,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm:ss",subformat:"h:mm"},
			{dis:8*60*1000,scale:5,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm:ss",subformat:"h:mm"},
			{dis:10*60*1000,scale:5,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm:ss",subformat:"h:mm"},
			{dis:12*60*1000,scale:12,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:15*60*1000,scale:12,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:20*60*1000,scale:12,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:25*60*1000,scale:12,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:30*60*1000,scale:10,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:40*60*1000,scale:10,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:50*60*1000,scale:10,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:60*60*1000,scale:12,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:1.5*60*60*1000,scale:12,per:"",ftype:"getMinutes",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:2*60*60*1000,scale:4,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:3*60*60*1000,scale:4,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:4*60*60*1000,scale:8,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:5*60*60*1000,scale:8,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:6*60*60*1000,scale:6,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:7*60*60*1000,scale:6,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:8*60*60*1000,scale:8,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:9*60*60*1000,scale:8,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:10*60*60*1000,scale:8,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:11*60*60*1000,scale:8,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:12*60*60*1000,scale:12,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:13*60*60*1000,scale:12,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:14*60*60*1000,scale:12,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:15*60*60*1000,scale:12,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:16*60*60*1000,scale:12,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:18*60*60*1000,scale:12,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:20*60*60*1000,scale:12,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:24*60*60*1000,scale:12,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:2*24*60*60*1000,scale:12,per:"",ftype:"getHours",format:"yyyy-M-d h:mm",subformat:"h:mm"},
			{dis:3*24*60*60*1000,scale:3,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:4*24*60*60*1000,scale:3,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:5*24*60*60*1000,scale:3,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:6*24*60*60*1000,scale:3,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:7*24*60*60*1000,scale:3,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:8*24*60*60*1000,scale:7,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:9*24*60*60*1000,scale:7,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:10*24*60*60*1000,scale:7,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:12*24*60*60*1000,scale:7,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:15*24*60*60*1000,scale:15,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:16*24*60*60*1000,scale:15,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:18*24*60*60*1000,scale:15,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:20*24*60*60*1000,scale:15,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:25*24*60*60*1000,scale:15,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:28*24*60*60*1000,scale:15,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:30*24*60*60*1000,scale:10,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"}, //一天
			{dis:2*30*24*60*60*1000,scale:10,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:3*30*24*60*60*1000,scale:10,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:4*30*24*60*60*1000,scale:10,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:5*30*24*60*60*1000,scale:10,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:6*30*24*60*60*1000,scale:6,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:7*30*24*60*60*1000,scale:6,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:8*30*24*60*60*1000,scale:6,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:10*30*24*60*60*1000,scale:6,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"M-d"},
			{dis:12*30*24*60*60*1000,scale:6,per:"",ftype:"getDate",format:"yyyy-M-d",subformat:"yyyy-M-d"}	
		];

		this.redraw=function()
		{
			var html="";
			var vc=this.viewClass;
			var classvc=this["class"][vc];	
			var D=new Date(this.zeroTime);
			var len=classvc.scale;
			var m=D[classvc.ftype]();
			var timefmt="yyyy年M月d日";
			var str=D.format(timefmt);
			showTime.html(str);
			var per=classvc.per;
			var w0=this.getCell(len);
			var unit=classvc.dis/classvc.scale;
			for(var i=0;i<=len;i++)
			{
				//var k=(i+m);
				var D=new Date(this.zeroTime+unit*i);
				var k=D.format(classvc.subformat);
				var span="<span class='subscale'>"+k+per+"</span>";
				html=html+"<div title='"+i+"' class='scale' style='left:"+(i*w0)+"px'>"+span+"</div>";
			}
			Time_line.html(html);
		}

		this.getTimeRange=function()
		{
			var n=this.viewClass;
			var dx=this["class"][n].dis;
			var start=this.zeroTime;
			var end=this.zeroTime+dx;
			var obj={start:start,end:end}
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


		this.AutoPointer=function(flag)
		{
			 var Me=this;
			 if(!flag){clearInterval(this.timer); return}
			 var unitTime=Me.unitTime;
			 var pointer=this.pointer;
			 var w=canvas.width();
			 //console.log("AutoPointer",unitTime);
			 this.timer=setInterval(function()
			 {
				 var x=pointer.css("left").Number();
				 if(x>=w)
				 {
					self.MoveRight();
					pointer.css("left","0px");
					return;
				 }
				 var obj=self.getTimeRange();
				 var start=obj.start;
				 var end=obj.end;
				 //console.log(start,end,end-start);
				 var dx=unitTime*w/(end-start);
				 pointer.css("left",(x+dx)+"px");
				 //console.log("dx="+dx,x+dx);
			 },unitTime);
		}

		this.unitTime=50;

		this.UIHTML=function()
		{
			var html=
			[
				"<div class='showTime'></div>",
				"<div class='Time_line'></div>"
				//"<div class='Time_line_Data'></div>"
				//"<img class='pointer' src='pointer.png'/>",
				// "<div class='Time_line_Range'>",
				// 	"<div class='RangeProgress'></div>",
				// 	"<div class='Range RangeBegin'></div>",
				// 	"<div class='Range RangeEnd'></div>",
				// "</div>"
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

		this.init=function(id)
		{
			this.initUI(id);
			this.dragXY();
			var T=this.getNow("minute");
			this.zeroTime=T-30*24*60*60*1000;
			this.viewClass=54;
			this.redraw();
			this.mousewheel();
			this.getRange();
			this.showRange();
			//this.AutoPointer(true);
		}
	}
	window.Timeline=_Timeline;
});

