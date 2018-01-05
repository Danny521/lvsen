
define(["mootools"],function() {

	var VideoPlayer = new Class({
		Implements: [Options, Events],
		focusChannel: 0,//聚焦的窗口
		manualFocusChannel: -1,//手动单击聚焦的通道号，用户单击后有效，并只有效一次
		options: {
			ip: null,
			port: null,
			user: null,
			passwd: null,
			path: null,// 路径(实时流、文件、录像、pfs)
			type: null,//播放类型
			vodType: null,//录像深度
			begintime: null,
			endtime: null,
			//具体对应于某个摄像头
			autoplay: true,
			loop: false,
			width: 0,
			height: 0,
			layout: 4, //播放器布局
			eventEnable:true,
			uiocx: 'UIOCX'
		},

		initialize: function(options) {
			var self = this;
			this.setOptions(options);
			this.cameraData  = this.options.cameraData || new Array(16).repeat(-1); //当前通道对象数组，存放相关的信息.默认每组都为-1.代表没有视频在通道中
			this.prePlayData = this.options.prePlayData || new Array(16).repeat(-1); //当前正在通道对象数组，存放相关的信息.默认每组都为-1.代表没有视频在通道中
			this.playerObj   = document.getElementById(this.options.uiocx);//jQuery(this.options.uiocx)[0];
			this.setLayout(self.options.layout);
			if (this.options.eventEnable) {
				this.bindEvents();
			}
			self.playerObj.EnableDES(true);
			/**
			 * 根据配置设置视频播放窗口的拉伸或者原始形态，by zhangyu on 2015/7/24
			 */
			this.playerObj.SetRatio(window.ocxDefaultRatio, -1);
		},
		getErrorCode:function(x)
		{
			var ErrorData=
			{
				"-1":"未分类错误",
				"-2":"avport错误",
				"-3":"服务器配置信息被破坏",
				"-4":"服务器必须重新启动",
				"-5":"字符串的长度超出预设长度",
				"-6":"指令已经过时",
				"-7":"指令没有实现",
				"-8":"运行时异常",
				"-9":"驱动程序内部故障",
				"-10":"内部程序逻辑错误",
				"-11":"对象不支持的POSA接口",
				"-12":"创建线程失败",
				"-13":"空函数，不应该调用到此处",
				"-14":"缺少或没有配置驱动(POSA对象构造器)",
				"-15":"该功能限制使用",
				"-16":"指令用法错误，程序逻辑错误",
				"-17":"输出参数缓冲区太小",
				"-18":"路由连接失败，找不到匹配网关主机模式集",
				"-19":"试图注销尚未注册的POSA对象构造器",
				"-20":"重复注册已经注册的POSA对象构造器",
				"-21":"设置系统时间失败",
				"-22":"设置服务器ip失败",
				"-23":"取得服务器ip失败",
				"-24":"更新系统文件失败",
				"-25":"接收夹带数据失败",
				"-26":"没有足够的内存",
				"-27":"错误的组播地址数量",
				"-28":"服务端检测到无法解析的请求",
				"-29":"IO操作超时",
				"-30":"IO操作被取消",
				"-31":"连接正在进行中",
				"-32":"未被挂装的Host",
				"-33":"被固定挂装的Host",
				"-34":"系统退出中，请求无法完成",
				"-35":"外部程序逻辑错误",
				"-41":"读取avsetting配置信息错误",
				"-42":"写avsetting配置信息错误",
				"-43":"没有找到要保存的类型",
				"-45":"av名字错误",
				"-46":"坐标不正确",
				"-47":"宽度或是高度不正确",
				"-48":"设置叠加位图不正确",
				"-49":"获得动态感知错误",
				"-50":"功能限制",
				"-51":"设置编码参数失败",
				"-52":"矩阵端口参数越界",
				"-53":"视频尺寸参数错误",
				"-54":"视频制式参数错误",
				"-55":"视频编码器av口参数越界",
				"-56":"视频编码器未知错误",
				"-57":"视频解码器未知错误",
				"-81":"列出用户信息失败",
				"-82":"加入用户失败",
				"-83":"删除用户失败",
				"-84":"没有此用户",
				"-85":"保存用户失败",
				"-86":"用户数超出限制",
				"-87":"没有请求的功能",
				"-88":"没有权限访问",
				"-89":"用户名或密码不正确",
				"-90":"用户级别太低",
				"-91":"已经有用户登录",
				"-92":"本用户已经登录",
				"-93":"不正确的对象名字",
				"-94":"DDB存取出错",
				"-95":"Ticket无效",
				"-96":"登录失败",
				"-97":"TCP Session连接数限制",
				"-101":"设置的长度不能小于0",
				"-102":"打开目录失败",
				"-103":"删除文件失败",
				"-104":"设置文件生存期错误",
				"-105":"错误的时间格式",
				"-106":"smf文件已经开始存储数据，请在存储数据前添加所有的流信息",
				"-107":"被保护的文件无法删除，请取消保护后再删除",
				"-110":"参数重复设置",
				"-111":"参数不存在",
				"-141":"串口的端口号错误",
				"-142":"打开串口失败",
				"-143":"保存串口配置失败",
				"-144":"读串口配置失败",
				"-145":"setpioHelper错误",
				"-146":"摄像头已经被锁定",
				"-147":"摄像头不能被控制",
				"-148":"访问受限",
				"-149":"设备PTZControl失败",
				"-150":"不支持的设备型号",
				"-151":"向串口发送数据失败",
				"-152":"获取PTZ操作信息失败",
				"-153":"获取PTZ控制信息失败",
				"-161":"磁盘号错误",
				"-162":"磁盘格式化错误",
				"-163":"错误的分区号",
				"-164":"格式化磁盘分区错误",
				"-166":"正在录像的文件不能删除",
				"-167":"错误的文件名",
				"-168":"没有找到满足条件的文件",
				"-169":"错误的文件类型",
				"-170":"缺少标题，不能录像",
				"-171":"没有找到自动录像指令",
				"-172":"设置自动录像失败",
				"-173":"清除自动录像失败",
				"-174":"分配地址失败",
				"-175":"设置视频输出制式错误",
				"-176":"设置视频输入制式错误",
				"-177":"初始化MP4编码器错误",
				"-178":"初始化MP4解码器错误",
				"-179":"设定视频输入颜色",
				"-180":"视频采集驱动初始化错误",
				"-181":"视频显示驱动初始化错误",
				"-182":"管理的objs超过系统范围",
				"-183":"本sobj所拥有的targets超过限制",
				"-184":"增加一个sobj错误",
				"-185":"增加一个tboj错误",
				"-186":"打开文件失败",
				"-187":"没有找到指定的目标",
				"-188":"处于disable状态",
				"-189":"avsobj没有初始化",
				"-190":"avtobj没有初始化",
				"-191":"不能启动大图模式",
				"-192":"在大图模式无法完成此操作",
				"-193":"音频输入驱动初始化错误",
				"-194":"音频输出驱动初始化错误",
				"-195":"源重复打开",
				"-196":"目标重复打开",
				"-197":"MP3编码器初始化失败",
				"-198":"MP3解码器初始化失败",
				"-199":"错误的目标通道名",
				"-200":"文件数目太多",
				"-201":"错误的target数量(只支持一个target)",
				"-202":"传输不存在或用户没有发起该target",
				"-203":"错误的指令",
				"-204":"错误的事件类型",
				"-205":"错误的音频编码码率",
				"-206":"串口处于disable状态",
				"-207":"设置自动录像的条件重复",
				"-208":"目标流不存在",
				"-209":"节点处于断线状态",
				"-210":"CarryId重复",
				"-211":"CarryId不存在",
				"-212":"设备处于断线状态",
				"-213":"关闭文件错误",
				"-214":"要读的长度错误",
				"-215":"文件句柄错误",
				"-216":"读文件错误",
				"-217":"seekfile错误",
				"-218":"得到文件长度错误",
				"-219":"得到文件当前位置错误",
				"-220":"没有音频数据",
				"-221":"没有视频数据",
				"-222":"写文件错误",
				"-223":"系统资源(非内存)不足",
				"-224":"PosaClass对象不存在",
				"-225":"不是一个PosaSourceStream",
				"-226":"不是一个PosaTargetStream",
				"-227":"PosaHost对象已经存在",
				"-228":"PosaHost对象不存在",
				"-229":"PosaPort对象已经存在",
				"-230":"PosaPort对象不存在",
				"-231":"没有找到合适的PosaHost驱动",
				"-232":"没有找到合适的PosaSourceStream驱动",
				"-233":"没有找到合适的PosaTargetStream驱动",
				"-234":"没有找到合适的PosaDecoder驱动",
				"-235":"没有找到合适的PosaSilenceGenerator驱动",
				"-236":"Posa对象已经存在",
				"-237":"PosaSourceChannel已经被关闭",
				"-238":"分配本地地址或端口失败",
				"-239":"请求传输失败",
				"-240":"请求接收数据失败",
				"-241":"对象不存在",
				"-242":"对象已经存在",
				"-243":"对象属性设置错误",
				"-244":"属性值为空或非法",
				"-245":"不能分配到路径",
				"-279":"抢占数字干线优先级不够",
				"-246":"目标必须是本地的，不能是远程的",
				"-247":"路径连接失败",
				"-248":"属性不存在",
				"-249":"资源被抢占",
				"-250":"资源编号错误",
				"-251":"资源编号不存在",
				"-252":"超过该网段最大数字码流数",
				"-253":"POSA流I/O超时",
				"-254":"POSA流格式不匹配",
				"-255":"没有为软解码器设置Renderer",
				"-256":"没有为POSA目标流设置源",
				"-257":"POSA流的url格式不正确",
				"-258":"UDP或TCP端口已经被占用",
				"-259":"源流不存在",
				"-260":"解码器初始化失败",
				"-261":"解码失败",
				"-262":"没有初始化POSA运行支持库",
				"-263":"已经初始化过了POSA运行支持库",
				"-264":"没有提供定时器API",
				"-265":"加入到组播失败",
				"-266":"连接设备失败",
				"-267":"本地矩阵切换线路被抢占",
				"-268":"选定的节点路由(PassNODE)中不包括本节点或者找不到对应的网关",
				"-269":"传输的源和目标NPS地址不能都要求自动分配",
				"-270":"服务器连接其它设备或服务器时发生网络断线错误",
				"-271":"选定的节点路由(PassNODE)已经包括本节点",
				"-272":"断线重连动作现在不能进行, 必须推迟",
				"-273":"看门狗线程检查到源流在设定时间内没收到任何码流数据",
				"-274":"非法的目标通道名称",
				"-275":"检查到TCP socket已经无效(无法获取对方IP)",
				"-276":"视频丢失",
				"-277":"非法XML字符串",
				"-278":"XML格式不匹配",
				"-300":"正在重连中",
				"-301":"模块引用计数不为0",
				"-302":"缓冲区长度不够",
				"-320":"打开Sqlite数据库失败",
				"-321":"查询Sqlite数据库失败",
				"-322":"不支持的数据类型",
				"-323":"创建数据表失败",
				"-324":"删除数据表失败",
				"-325":"删除数据失败",
				"-326":"插入数据失败",
				"-327":"更新数据失败",
				"-501":"函数或参数格式不正确",
				"-502":"连接服务器失败",
				"-503":"客户端功能未实现",
				"-504":"客户端内存溢出",
				"-505":"客户端不认识的属性类型",
				"-506":"尚未连接服务器",
				"-507":"发送失败",
				"-508":"接收失败",
				"-509":"客户端不能打开文件",
				"-510":"客户端文件格式不正确",
				"-511":"客户端不能读文件",
				"-512":"客户端检测到无法解析的应答",
				"-513":"已经连接了服务器",
				"-514":"不正确的IP地址或主机名称",
				"-515":"无法创建新的RawObject",
				"-517":"服务器没有响应",
				"-518":"收到无法处理的应答",
				"-519":"传输已经发起",
				"-520":"摄像机没有设置传输协议",
				"-521":"摄像机的传输协议目前不支持",
				"-522":"用户没有登录",
				"-523":"网络接收超时",
				"-524":"网络地址PING不通",
				"-525":"服务器TCP端口错误",
				"-526":"对方已经关闭连接",
				"-527":"用户登录次数太多",
				"-528":"设备不支持的参数配置",
				"-600":"非法的服务器本地数据库文件",
				"-601":"程序没有初始化",
				"-702":"非法db对象ID",
				"-703":"db缓冲区太小",
				"-704":"db对象或者属性不存在",
				"-705":"db对象或者属性已经存在",
				"-706":"db内存不足",
				"-707":"db没有初始化",
				"-708":"db打开文件失败",
				"-709":"db数据check失败",
				"-710":"db类型不匹配",
				"-711":"db非法对象名",
				"-712":"db错误的文档",
				"-713":"db密码不可读",
				"-800":"设备尺寸太小",
				"-801":"不能识别分区格式",
				"-802":"存储设备上的ROFS版本高于当前程序支持版本",
				"-803":"分区尺寸改变",
				"-804":"分区头信息损坏",
				"-805":"缺少关键Slice",
				"-806":"Slice时间差过大",
				"-807":"Package时间长度大于时间段最大允许值",
				"-808":"磁盘空间不足",
				"-809":"磁盘设备参数异常",
				"-810":"Package数量为0",
				"-811":"无效的Package序列号",
				"-812":"没有与读mask匹配的Slice",
				"-813":"打开ROFS原始设备失败",
				"-814":"ROFS原始设备重复打开",
				"-815":"非法ROFS存储设备名",
				"-816":"只有未格式化或者停止态的磁盘才进行格式化/反格式化操作",
				"-817":"不存在的StgName",
				"-818":"缺少同步Slice",
				"-819":"ROFS设备未格式化",
				"-820":"ROFS设备录像中",
				"-821":"ROFS设备数据修复中",
				"-822":"ROFS设备未打开",
				"-823":"无法获取ROFS设备信息",
				"-824":"ROFS管理器已经初始化",
				"-825":"ROFS管理器未初始化",
				"-826":"ROFS固定区标识信息不匹配",
				"-827":"ROFS固定区标识信息太大",
				"-828":"ROFS Package内slice数太多",
				"-829":"数据包信息损坏",
				"-830":"数据信息不一致",
				"-831":"用户取消ROFS设备数据修复",
				"-832":"未处于修复状态",
				"-833":"不是ROFS主设备",
				"-834":"ROFS辅设备忙",
				"-835":"ROFS索引数据损坏",
				"-836":"ROFS时间段数据损坏",
				"-837":"ROFS设备未开始同步拷贝",
				"-838":"ROFS设备已经开始同步拷贝",
				"-839":"不是ROFS辅设备",
				"-840":"循环同步",
				"-841":"ROFS设备写失败",
				"-842":"ROFS设备读失败",
				"-843":"没有与查询时间匹配的Package",
				"-844":"没有与读条件时间匹配的Package索引",
				"-845":"创建元数据文件失败",
				"-846":"打开元数据文件失败",
				"-847":"元数据文件尺寸错误",
				"-848":"元数据文件内容错误",
				"-855":"重复配置ROFS原始设备",
				"-856":"ROFS2设备(StoreGroup)太小，无法格式化",
				"-857":"存在通道时，ROFS2不能格式化",
				"-858":"ROFS2基本头信息损坏",
				"-859":"ROFS2非法块数量",
				"-860":"ROFS2非法通道数量",
				"-861":"ROFS2块头信息损坏",
				"-862":"ROFS2通道头信息损坏",
				"-863":"ROFS2剩余空间不足",
				"-864":"ROFS2命名重复",
				"-865":"ROFS2没有可用块",
				"-866":"ROFS2未找到可删除的最旧数据块",
				"-867":"ROFS2非法块大小",
				"-868":"ROFS2构造组的磁盘路径不匹配",
				"-869":"ROFS2数据已经加锁",
				"-870":"ROFS2没有剩余可用空间，已经录像数据总时间没有满足设定值",
				"-871":"通道名称不存在！",
				"-872":"ROFS2块空间不足",
				"-873":"ROFS2 由于录像周期已到达或是空间不足，未发生写设备动作",
				"-874":"Player,ID 错误",
				"-875":"Player,缓冲区需要数据",
				"-876":"Player,缓冲区已满",
				"-877":"Player, input slice缓冲区回调函数没有设置",

				//系统错误
				"-10002":"系统调用失败",
				"-10003":"系统资源不足/被占用",
				"-10004":"内存不足",
				"-10005":"未分类异常",
				"-10006":"内部程序逻辑错误",
				"-10007":"外部程序逻辑错误",
				"-10008":"不支持的功能",
				"-10009":"功能未实现",
				"-10010":"系统/任务退出中，请求无法完成",
				"-10011":"服务端对象状态不支持，请求被拒绝",
				"-10012":"参数值或格式不正确",
				"-10013":"任务未完成",
				"-10014":"服务已经存在",
				"-10015":"服务不存在",
				"-10016":"会话已经存在",
				"-10017":"会话不存在",
				"-10018":"TCP服务端口已经被使用",
				"-10019":"网络对端关闭/或断线",
				"-10020":"会话被放弃",
				"-10021":"服务退出中",
				"-10022":"连接服务器/设备失败",
				"-10023":"未连接服务/设备",
				"-10024":"接收数据失败",
				"-10025":"发送数据失败",
				"-10026":"无法解析的请求",
				"-10027":"无法解析的应答",
				"-10028":"功能已经启动",
				"-10029":"功能未启动",
				"-10030":"系统忙，请求/调用被忽略",
				"-10031":"非法网络请求协议头",
				"-10032":"巨大网络请求数据，拒绝",
				"-10033":"动作已被请求",
				"-10034":"动作未被请求",
				"-10035":"服务连接中，稍后再试",
				"-10036":"当前上下文中，无效IP地址",
				"-10037":"请求端对象状态不支持，请求被拒绝",
				"-10038":"网络连接超时",
				"-10039":"资源使用中，不能卸载或删除",
				"-10040":"ISCM授权失败",
				"-10041":"对象已存在",
				"-10042":"对象不存在",
				"-10043":"会话处于并行调用模式，只支持并行posting型方法",
				"-10044":"会话处于并行回调模式，只支持并行posting型回调",
				"-10048":"消息队列满，投递消息失败",
				"-10049":"消息队列满，发送消息失败",
				"-10050":"接口未定义",
				"-10051":"对端方法不存在或不匹配，请检查网络两端接口版本是否一致",
				"-10052":"对端回调不存在或不匹配，请检查网络两端接口版本是否一致",
				"-10053":"回调未就绪，调用被忽略",
				"-10054":"绑定回调连接失败",
				"-10055":"方法匹配失败，请尝试调用其它方法集",
				"-10056":"ISCM回调未实现，请在派生类中重载实现",
				"-10057":"已经登录",
				"-10058":"未登录",
				"-10059":"ISCM客户端接口对象服务IPP无效",
				"-10060":"ISCM接口对象异步调用队列满",
				"-10061":"没有此用户",
				"-10062":"用户名或密码不正确",
				"-10063":"没有权限访问",
				"-10064":"异步调用缓存内存大小限制",
				"-10065":"会话未连接或正在关闭中",
				"-10100":"已在服务群组中",
				"-10101":"不在服务群组中",
				"-10102":"应用服务IPP冲突",
				"-10103":"启动服务进程失败",
				"-10104":"文件已存在",
				"-10105":"文件不存在",
				"-10106":"文件打开失败",
				"-10107":"文件读失败",
				"-10108":"文件写失败",
				"-10109":"禁止操作此文件/路径名（服务使用中，或未授权路径）",
				"-10110":"创建目录失败",
				"-10111":"订阅回调已发起",
				"-10112":"订阅回调未发起",
				"-10113":"无效ISCM远程任务库",
				"-10114":"无效ISCM远程任务函数",
				"-10115":"ISCM远程任务已存在",
				"-10116":"ISCM远程任务不存在",

				//播放SDK错误
				"-20000":"基本错误边界值",
				"-20001":"不支持",
				"-20002":"功能暂未实现",
				"-20003":"未初始化",
				"-20005":"内存不足",
				"-20004":"打开太多句柄，系统资源不足",
				"-20006":"无效句柄，可能已经关闭",
				"-20007":"无效对象名，没有这个对象",
				"-20008":"参数错误",
				"-20009":"没有文件",
				"-20010":"正在查找文件",
				"-20011":"查找文件时没有更多的文件",
				"-20012":"查找文件时异常",
				"-20013":"文件Url全路径错误",
				"-20014":"元素已存在ESIST",
				"-20015":"对象不存在",
				"-20016":"OSD叠加文本错误",
				"-20017":"OSD类型错误",
				"-20018":"OSD显示错误",
				"-20019":"获取默认端口错误",
				"-20020":"登录失败",
				"-20021":"没有更多查讯数据",
				"-20022":"设置密码错误",
				"-20023":"设置键值不存在",
				"-20024":"对应的键没有值",
				"-20025":"功能未实现",
				"-20026":"获得句柄错误",
				"-20027":"事件重复订阅",
				"-20028":"读到文件末尾",
				"-20029":"句柄不存在",
				"-20030":"对象指针为空",
				"-20031":"第一侦不是I侦",
				"-20032":"不支持的平台",
				"-20033":"缓冲区太小",
				"-20034":"不支持的服务器类型",

				"-21001":"ID 错误",
				"-21002":"播放缓冲区需要数据",
				"-21003":"播放缓冲区已满",
				"-21004":"输入多个slice方式下回调函数没有设置",
				"-21005":"错误的播放命令",
				"-21006":"错误的播放速度",
				"-21007":"实时播放时不能采用回调方式输入Slice数据",
				"-21008":"资源已经释放",
				"-21009":"播放线程已经停止",

				///DLL自定义错误码
				"-21100":"未播放",
				"-21101":"已播放",
				"-21102":"无录像",

				///22000以上为日志服务器错误代码
				"-22001":"未定义的错误类型",
				"-22002":"数据查询结果不正确",

				///OCX 自定定义错误码
				"-30001":"传入参数无效",
				"-30002":"要操作的窗口被占用",
				"-30003":"无可操作的视频",
				"-30004":"用户放弃操作",
				"-30005":"视屏不支持的操作",
				"-30006":"CPU使用率过高",
				"-30007":"内存使用率过高",
				"-30008":"当前播放模式不支持该功能"
			};
			return ErrorData[x];
		},
		//提示报错信息
		ShowError:function(x){
			if(x<0&&typeof(notify)=="object")
			{
				notify.warn("播放失败:"+this.getErrorCode(x+""));
			}
			return x;
		},

		//登录pvg    obj:{"user":"xx1","passwd":"xx2","ip":"192.168.60.21","port":2100}
		login: function(obj) {
			if (this.playerObj.GetVersion()==='PVA_OCX_V0.2.7') {
				var jsonstr = JSON.stringify(obj);
				var result = this.playerObj.Login(jsonstr);
				return result;
			}
		},
		//预登录，一次性将多个摄像头登录pvg
		preLogin: function(arr) {
			var self = this;
			if (typeOf(arr) === 'array' && arr.length) {
				arr.reverse();
				var i = arr.length;
				while (i--) {
					self.login(arr[i]);
				}
			}
		},
		//预打开  但是不显示图像，即隐藏打开  返回该视频句柄，该句柄在prePlayStream函数是使用
		//param格式：{"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1"}
		preOpenStream: function(param,index) {
			param.type = 1;
			var jsonstr = JSON.stringify(param);
			var handle = this.playerObj.OpenStream(jsonstr,288);
			this.savePrePlayCameraData(param, index);//存储摄像头信息
			return handle;
		},
		//关闭preOpenStream打开的隐藏视频
		perCloseStream:function(handle) {
			if (handle >= 0){
				var N = this.playerObj.CloseStream(handle);
				return N;
			}
		},
		//预播放  将preOpenStream隐藏打开的画面显示  handle是preOpenStream函数的返回值  index是窗口号
		prePlayStream:function(handle,index){
			var N = this.playerObj.PlayStream(handle,index);

			this.cameraData[index] = JSON.parse(JSON.stringify(this.prePlayData[index]));  // 把预播放的数据放到正在播放的通道中

			return N;
		},

		// 关闭所有预播放的视频
		perAllCloseStream : function(){
			this.perCloseStream(0);
		},

		// 实时流播放的基本参数（6个）  type代表实时流
		// {"type":1,"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1"}
		play: function(options, index, isIgnorePlay) { /*index为通道号*/
			var result = null,
				jsonstr = JSON.stringify(options);
			if(isIgnorePlay){
				result = 0;
			}else{
				result = this.playerObj.Play(jsonstr, index);
			}
			this.setFocusWindow(index);
			this.saveCameraData(options, index);//存储摄像头信息
			this.manualFocusChannel = -1;
			//提示报错信息
			this.ShowError(result);
			return result;
		},

		pause: function(bool, index) {/*bool:true 暂停播放  false:停止播放*/
			var N = this.playerObj.Stop(true, index);
			//提示报错信息
			this.ShowError(N);
		},

		stop: function(bool, index) {/*bool:true 暂停播放  false:停止播放*/
			var N = this.playerObj.Stop(false, index);
			//提示报错信息
			this.ShowError(N);
			this.cameraData[index] = -1;//将序号为i的窗口置闲
		},
		stopWithoutClearData: function(bool, index) {/*bool:true 暂停播放  false:停止播放*/
			var N = this.playerObj.Stop(false, index);
			//提示报错信息
			//this.ShowError(N);
			//this.cameraData[index] = -1;//将序号为i的窗口置闲
		},

		togglePlay: function(index) {
			var N = this.playerObj.TogglePlay(index);
			//提示报错信息
			this.ShowError(N);
		},

		//抓图 (抓拍的命名格式为路径：对象名_当前系统时间.jpg)  返回值0为正确； 非0为错误码
		printScreen: function(index) {
			var N = this.playerObj.CapturePicture(index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},

		//全屏
		displayFullScreen: function() {
			if(!this.isFullScreen()){
				this.playerObj.SetControlFullScreen();
			}
		},

		//取消全屏
		cancelFullScreen: function() {
			if(this.isFullScreen()){
				this.playerObj.RestoreControlScreenShow();
			}
		},

		//检测当前状态是否全屏 返回true是有  false是没有
		isFullScreen: function(){
			return this.playerObj.IsControlFullScreen();
		},

		//检测是否有最大化窗口  返回true是有最大化   false是没有最大化
		isHaveMaxWindow: function(){
			var result = this.playerObj.IsHaveMaximizeWindow();
			return result===1?true:false;
		},

		toggleScreen: function(index) {
			//TODO
		},

		//设置分屏布局(参数layout,目前只能是1,4,9,16,41  41:4行1列)
		setLayout: function(layout) {
			this.playerObj.SetLayout(layout);
		},

		//获取目前分屏布局的编号(即是几分屏)，对应setLayout函数
		getLayout: function() {
			try {
				return this.playerObj.GetLayout();
			} catch(err){return 4}
		},

		toggleRecordVideo: function(cameraId) {
			// TODO
		},

		getVersion: function() {
			return this.playerObj.GetVersion();
		},

		//设置通道窗口最大化或者退出最大化(参数index为通道序号，起始值为0，从左到右，从上到下。左上角第一个为起始点)
		toggleWindowMaximize: function(index) {
			return this.playerObj.SetWindowMaximize(index);
		},

		//设置占满控件大小的通道恢复正常大小(参数index为通道序号，起始值为0，从左到右，从上到下。左上角第一个为起始点)
		setWindowRestore: function(index) {
			return this.playerObj.SetWindowRestore(index);
		},

		//获取焦点窗口
		getFocusWindow: function() {
			var N = this.playerObj.GetFocusWindowIndex();
			//提示报错信息
			this.ShowError(N);
			return N;
		},

		//设置焦点窗口
		setFocusWindow: function(index) {
			this.focusChannel = index;
			this.playerObj.SetFocusWindow(index);
		},

		//返回窗口数量  暂时未用到此接口
		getWindowCount: function() {
			return this.playerObj.GetWindowCount();
		},

		isFocusWindow: function(index){
			return this.playerObj.IsFocusWindow(index);
		},

		//获取当前通道的左上角xy坐标和宽高  返回值格式如：{"Left":1,"Top":1,"Width":570,"Height":185}
		getVideoRectByIndex: function(index) {
			var jsonString = this.playerObj.GetVideoRectByIndex(index); //格式如：{"Left":1,"Top":1,"Width":570,"Height":185}
			return jsonString !== 'ERROR' ? JSON.parse(jsonString) : {}//{Left:1,Top:1,Width:200,Height:185};
		},

		//设置画面比例
		//type 1:原始	2:拉伸	3 4:3 4 16:9	5 16:10
		setRatio: function(type, index) {
			this.playerObj.SetRatio(type, index);
		},

		//获取画面比例
		//type值1、2、3、4、5分别代表设置原始、拉伸、4:3、16:9、16:10
		getRatio: function(index){
			return this.playerObj.GetRatioCode(index);
		},

		//设置窗口背景提示	0 正常，  1 视频丢失  2 离线
		setStyle: function(type, index){
			try {
				this.playerObj.SetStreamLostByIndex(type, index);
			} catch (error) {
				
			}
		},

		refreshWindow: function(index){
			try {
				return this.playerObj.RefreshVideoWindow(index);
			} catch (err) {
				return 0;
			}

		},

		//刷新的时间间隔，单位毫秒（ms）,设置定时刷新窗口背景，地图单窗口模式专用接口，设置布局后调用一次即可
		refreshForGis : function(ms){
			return this.playerObj.RefreshForGis(ms);
		},

		//数字放大
		digitalZoom: function(type, index) {//type: 当前窗口放大0，其他窗口放大1
			this.playerObj.StartZoomByIndex(type, index);
		},

		//停止放大
		stopZoom: function(index){
			return this.playerObj.StopZoomByIndex(index);
		},

		//关闭放大流 index:放大流所在的窗口
		stopZoomStream: function(index){
			return this.playerObj.StopZoomStream(index);
		},

		//设置字符叠加信息
		setInfo: function(json, index){
			/*var N = this.playerObj.SetOSD(0, str);
			//提示报错信息
			this.ShowError(N);*/
			var jsonstr = JSON.stringify(json);
			return this.playerObj.SetOSD(jsonstr, index);
		},

		//检查闲忙状态	返回值：true-忙 false-闲
		isBusy: function(index){
			try {
				return this.playerObj.GetWindowBusyByIndex(index);
			} catch (err) {
				return 0;
			}
		},

		//设置画面参数调节（亮度、对比度、饱和度、色调）
		//jsonObj参数，JSON格式的字符串，（亮度、对比度、饱和度、色调）参数范围统一为【-127，127】Json格式：{"bright":100,"contrast":100,"saturation":100,"hue":100}
		//返回值0为正确；非0为错误码
		setColor: function(jsonObj, index) {
			var str = JSON.stringify(jsonObj);
			var N = this.playerObj.SetColorAttribute(str, index);
			//提示报错信息
			this.ShowError(N);
		},

		//获取画面参数 正确返回JSON格式的画面参数，错误返回"ERROR" Json格式：{"bright":100,"contrast":100,"saturation":100,"hue":100}
		getColor: function(index) {
			return JSON.parse(this.playerObj.GetColorAttribute(index));
		},

		toggleSound: function(index){
			var soundStatus = this.playerObj.IsSoundEnable(index);//错误返回负数 开启状态：1    静音状态：0
			if(soundStatus >= 0){
				var toggle = !parseInt(soundStatus,10);
				this.playerObj.SoundEnable(toggle, index);
			}
			//提示报错信息
			this.ShowError(soundStatus);
		},

		//声音状态	开启返回1，未开启返回0，错误返回负数
		isSoundEnable: function(index){
			var N = this.playerObj.IsSoundEnable(index);
			//提示报错信息
			this.ShowError(N);
		},

		//云台控制   enable :true表示打开，false表示关闭
		switchPTZ: function(enable, index) {
			try {
				this.playerObj.SetWindowPTZByIndex(enable, index);
			} catch (err) {
				return 0;
			}

		},

		/**设置窗口云台的速度(默认是最大速度15)*/
		//ptzspeed:窗口云台速度 [0~15]   index:窗口索引   返回值true为成功 false为失败
		setPtzSpeed: function(ptzspeed, index) {
			return this.playerObj.SetWndPtzSpeed(ptzspeed, index);
		},

		/**设置云台控制箭头范围
		*	unit: 0:像素为单位  1:百分比为单位
		*	top_bottom: 到窗口顶部和底部的距离
		*	left_right: 到窗口左边和右边的距离
		*/

		//返回值布尔  true为成功   false为失败
		setPtzRange: function(unit, top_bottom, left_right){
			return this.playerObj.SetPTZRange(unit, top_bottom, left_right);
		},

		//获取视频属性值
		//{"videoType":0,"width":704,"height":480,"frameRate":0,"duration":0,"totalframes":0,"videoCodec":0,"audioCodec":0}  错误返回"ERROR"
		getVideoInfo: function(index){
			var str = this.playerObj.GetVideoAttribute(index);
			return JSON.parse(str);
		},

		//获取图片信息	(预置位截图)  返回值：字符串，正确返回base64编码的图片信息，错误返回"ERROR"
		getPicInfo: function(index){
			return this.playerObj.GetPicInfo(index);
		},

		//流速统计  返回值：字符串，正确返回当前实时流传输速度 “xxx KB/S”，错误返回"ERROR"
		getStreamMonitor: function(index){
			return this.playerObj.GetTransferSpeed(index);
		},

		// 窗口通道间拖动切换是否可用
		enableExchangeWindow : function(enable){
			var N = this.playerObj.EnableExchangeWindow(enable);
			//提示报错信息
			this.ShowError(N);
			return N;
		},

		/**事件绑定*/
		/*bindEvents: function(){
			var self = this;

			var listenOCX = function(){

				//监听通道单击事件
				function self.playerObj::OnWndClick(index, xPoint, yPoint){
					self.manualFocusChannel = index;//手动聚焦
					self.fireEvent('OCXCLICK',index);
				};

				//窗口被双击
				function self.playerObj::OnWndDClik(index, xPoint, yPoint){
					self.fireEvent('OCXWNDOWDBLCLICK',xPoint,yPoint);
					//TODO
				};

				//焦点改变时通知
				function self.playerObj::OnFocusChange(oldIndex, newIndex){
					//TODO
				};

				//发生了窗口交换
				function self.playerObj::OnSwitchWindow(srcIndex, desIndex){
					self.fireEvent('OCXWNDOWSWITCH',srcIndex,desIndex);
					//TODO
				};

				//鼠标移动到窗口矩形中
				function self.playerObj::OnMouseMoveWindow(index, xPoint, yPoint){
					//TODO
				};

				//鼠标离开控件
				function self.playerObj::OnMouseLeaveControl(index){
					//TODO
				};

				//布局发生改变
				function self.playerObj::OnLayoutChange(oldCount, newCount){
					//TODO
				};

				//进入控件全屏
				function self.playerObj::OnFullScreen(){
					//TODO
				};

				//退出控件全屏
				function self.playerObj::OnExitFullScreen(){
					//TODO
				};

				jQuery(document).keydown(function(e){
					if(e.which===27){
						self.cancelFullScreen();
					}
				});
			};

			listenOCX();
		},*/

		bindEvents: function(){
			//焦点改变时通知
			var self = this;

			var EventList = {
				"WndClick":"click",
				"WndDClik":"dblclick",
				"SizeChanged":"resize",
				"DownLoadPercent":"download",
				"MouseWheelEvent":"mousewheel",
				"FocusChange":"focuschange",
				"SwitchWindow":"switchwindow",
				"MouseMoveWindow":"mousemovewindow",
				"MouseLeaveControl":"mouseleavecontrol",
				"LayoutChange":"layoutchange",
				"FullScreen":"fullscreen"
			};
			for(var prop in EventList) {
				(function(prop){

					var func=function(data){
						self.fireEvent(EventList[prop],arguments);
					}
					if(self.playerObj.attachEvent){
                        self.playerObj.attachEvent("on" + prop, func);
					} else {
                        self.playerObj.addEventListener(prop, func, false);
					}
				})(prop);
			}
		},

	/*****************以下是复合接口，供某些页面的特殊调用**************************************************/

		//获取闲置窗口集合
		getIdleWindows: function(){
			var result = [];
			for(var i = 0; i < this.getLayout(); i++){
				if(!this.isBusy(i)){
					result.push(i);
				}
			}
			return result;
		},

		setFocusByCameraID: function(cameraID,callback) {
			var id;
			for (var i = 0; i < 16; i++) {
				if (this.cameraData[i] !== -1) {
					id= this.cameraData[i].cameraId || this.cameraData[i].cId;
					if (id === cameraID) {
						this.setFocusWindow(i);
						if(callback){
							callback(this.cameraData[i]);
						}
						return;
					}
				}
			}
			//this.setFocusWindow(index);
		},

		//存储摄像头信息到对应cameraData数组中
		saveCameraData: function(options, index){
			this.cameraData[index] = options;
		},

		savePrePlayCameraData:function(options, index){
			this.prePlayData[index] = options;
		},

		//关闭所有窗口
		stopAll: function(){
			var layout = this.getLayout();
			for (var i = 0; i < layout; i++) {
				if(this.isBusy(i)){
					this.stop(false, i);
				}else{
                    this.cameraData[i] = -1;
                }
			}
		},
		stopAllWithoutClearData : function(){
			var layout = this.getLayout();
			for (var i = 0; i < layout; i++) {
				if(this.isBusy(i)){
					this.stopWithoutClearData(false, i);
				}
			}
		},
		refreshAllWindow: function(){
			var layout = this.getLayout();
			for (var i = 0; i < layout; i++) {
				this.refreshWindow(i);
			}
		},

        setStyleToAll : function(){
            var layout = this.getLayout();
            for (var i = 0; i < layout; i++) {
                this.setStyle(0,i);
            }
        },


        transformData : function(channel,extendData){

            var params = {
                "cId"         : extendData.cId,
                "cType"       : extendData.cType,    //？
                "type"        : 1,  //实时流
                "user"        : channel.username,
                "passwd"      : channel.password,
                "ip"          : channel.ip,
                "port"        : channel.port,
                "path"        : channel.av_obj,
                "status"      : extendData.status,
                "orgId"       : extendData.orgId,
                cameraChannel : {
                    id: channel.id
                }
            };

            return params;
        },

        playData : function(channel,index,extendData){
            var params = this.transformData(channel,extendData),
                result = this.play(params, index);

            return result;
        },

        playhd : function(camerData,index,extendData){
            var channel = camerData.hd_channel[0];

            this.playData(channel, index, extendData);
        },

        playiPC : function(camerData,index,extendData){

            var channel = camerData.sd_channel[0];

            this.playData(channel, index, extendData);

        },
        /**
         @method method
         @decription 播放标清视频的一个函数，此函数为中间函数，给playRoute调用
         @param {object} camerData 摄像机通道信息，格式和playRoute一致
         @param {object}  index 数字，窗口序号
         @param {object} extendData 传入的摄像机信息
         */
        Playsd:function(camerData,index,extendData){
            var self       = this,
                sd_channel = camerData.sd_channel,
                sd_length  = sd_channel.length,
                group_id,
                DVR_index  = -1,
                NVR_index  = -1,
                code_index = -1,
                result;

            //1表示编码器，没有录像；2表示DVR  3表示 nvr，高清摄像机的标清码流ipc
            for (var i=0; i <=sd_length-1; i++){
                group_id = sd_channel[i].pvg_group_id;
                if (group_id === 2){
                    DVR_index = i;
                }else if(group_id === 1){
                    code_index = i;
                }else{
                    NVR_index = i;
                }
            }

            if (DVR_index === -1 && NVR_index === -1 && code_index === -1) {
                var param = {
                    "cId": extendData.cId,
                    "cType": extendData.cType,    //？
                    "type": 1,  //实时流
                    "user": "",
                    "passwd": "",
                    "ip": "",
                    "port": "",
                    "path": "",
                    "status": extendData.status,
                    "orgId": extendData.orgId,
                    cameraChannel: {
                        id: ""
                    }
                };
                //self.play(param, index);
                notify.info("摄像机未包含有效的通道信息！", {timeout: 1500});
                self.saveCameraData(param, index);
            }

            if(DVR_index !== -1){

                result = self.playData(sd_channel[DVR_index], index, extendData);

                if(result < 0 && code_index !== -1){
                    notify.warn("正在尝试编码器通道！");
                    result = self.playData(sd_channel[code_index], index, extendData);

                    if(result < 0 && NVR_index !== -1){
                        notify.warn("正在尝试高清通道！");
                        result = self.playData(sd_channel[NVR_index], index, extendData);
                        if(result < 0){
                            //notify.warn("播放失败！");
                        }
                    }
                }
                return false;
            }

            if(code_index !== -1){
                result = self.playData(sd_channel[code_index], index, extendData);

                if(result < 0 && NVR_index !== -1){
                    notify.warn("正在尝试高清通道！");
                    result = self.playData(sd_channel[NVR_index], index, extendData);
                    if(result < 0){
                        //notify.warn("播放失败！");
                    }
                }
                return false;
            }

            if(NVR_index !== -1){
                result = self.playData(sd_channel[NVR_index], index, extendData);
                if(result < 0){
                    //notify.warn("播放失败！");
                }
                return false;
            }

        },

        /**
         *@method PlayRoute
         *@description 实时视频播放路由
         *@param {object} camerData 从摄像机id 获取摄像机数据，里面至少含有 sdchannel hdchannel 数组
         *@param {Number} index 窗口序号
         *@param {object} extendData 传入的摄像机信息
         */

        PlayRoute:function(camerData,index,extendData){

            var self      = this,
                hd_length = camerData.hd_channel.length,
                result;

            if(hd_length>0){

                result = self.playhd(camerData,index,extendData);

                if(result < 0){
                    result = self.playiPC(camerData,index,extendData);
                    if(result < 0){
                        //notify.warn("播放失败！");
                    }
                }
                return;
            }else{
                self.Playsd(camerData,index,extendData);
            }
        },

        /**
         *@method
         *@description 从摄像机id播放实时视频
         @param {object} cameraData 传入的摄像机播放信息
         @param {number} index 数字 窗口序号
         */
        PlayByCameraId:function(cameraData,index){
            var self     = this,
                cameraId = cameraData.cId;

            jQuery.ajax({
                url: "/service/video_access_copy/accessChannels",
                type: 'get',
                data: {id: cameraId},
                dataType: 'json',
                success: function(res){
                    if (res.code === 200){
                        self.PlayRoute(res.data.cameraInfo,index,cameraData);
                    }else if (res.code === 500){
                        notify.error(res.data.message);
                    }else {
                        notify.error("获取数据异常！");
                    }
                }
            });
        }
	});

	return VideoPlayer
});