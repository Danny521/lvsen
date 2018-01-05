define(['jquery'],function(jQuery){
	var VideoPlayer = new Class({
		Implements: [Options, Events],
		curChannel: -1,//当前窗口序号
		focusChannel: -1,//聚焦的窗口
		manualFocusChannel: -1,//手动单击聚焦的通道号，用户单击后有效，并只有效一次
		coverIndex: 0,//进行视频覆盖的指针
		curMaxWinChannel:-1,//当前最大化的窗口
		videoLoop: 0, //全局视频替换变量，从0--15，重复循环   setFreePath函数有调用
		ratioData:[],//每个窗口的比例状态 默认都是拉伸
		grabIndex:-1,//记录getPicInfo()是的窗口位置，方便窗口resize时重新计算遮挡层位置。
		isRunningInspect:false,//轮巡监巡是否启动中，默认false
		cameraDataCache:{},//摄像机信息缓存，主要是通过id获取通道信息时使用
		options: {
			ip: '192.168.60.170',
			port: 2100,
			user: 'admin',
			passwd: 'admin',
			path: null,
			type: null,//播放类型
			vodType: null,//录像深度
			begintime: null,
			endtime: null,
			cId: null,//具体对应于某个摄像头
			cameraType: null,//具体对应某个摄像头编码（对摄像头的唯一标识）
			starttime: null,
			// index: null,
			autoplay: true,
			loop: false,
			width: 0,
			height: 0,
			layout: 4, //播放器布局
			resize:false,
			eventEnable:true,
			uiocx: 'UIOCX',
			displayMode: 0 //设置摄像机的播放模式（0为普通模式，1为布防模式）,at 2014-6-17
		},
		DownLoadlist:{},
		FPindex:-1, //记录左侧列表那里，刚刚双击菜单播放实时视频的那个窗口index
		initialize: function(options) {
			var self = this;
			this.setOptions(options);
			this.cameraData = this.options.cameraData || new Array(16).repeat(-1); //当前通道对象数组，存放相关的信息.默认每组都为-1.代表没有视频在通道中
			this.ratioData = new Array(16).repeat(2);
			this.playerObj = document.getElementById(this.options.uiocx);
			// this.playerObj = document.getElementById(this.options.uiocx);

			if(this.options.resize){
				this.resizeWin();
			}
			
			this.setVideoMarginColor();
			// self.setLayout(self.options.layout);

			if (this.options.eventEnable) {
				this.bindEvents();
			}
			/**
			 * 根据配置设置视频播放窗口的拉伸或者原始形态，by zhangyu on 2015/7/24
			 */
			this.playerObj.SetRatio(window.ocxDefaultRatio, -1);
		},

		/**
		* 获取错误信息
		* @x: 错误码
		**/
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
		/**
		* 提示报错信息
		* @x: 错误码
		**/
		//提示报错信息
		ShowError:function(x)
		{
			if(x<0&&typeof(notify)=="object")
			{
				//notify.warn("播放失败:"+this.getErrorCode(x+""));
			}
			return x;
		},
		/**
		* 播放器自适应，根据父类元素自适应
		**/
		resizeWin:function(){
			var ocx = jQuery(this.options.uiocx);
			jQuery(window).resize(function(){
				var h = ocx.parent().height(),
					w = ocx.parent().width();
				ocx.height(h);
				ocx.width(w);
			});
			jQuery(window).trigger('resize');
		},
		/**
		* 预处理，参数检查
		* @options: {
		* 			type: //类型
		*			user: //用户名
		*			passwd:  //密码
		*			ip:  //IP地址
		*			port:  //端口号
		*			path:  //路径
		*         }
		**/
		pretreat:function(options){
			var nativeKeys = ["type","user","passwd","ip","port","path"];
			if(typeOf(options)==="object"){
				var keys = Object.keys(options),
					isSame = true;
				for(var i = 0;i<nativeKeys.length;i++){
					if(keys.indexOf(nativeKeys[i])===-1){
						isSame = false;
						break;
					}
				}
				if(!isSame){
					notify.error("播放器打开输入参数错误,缺少参数");
					//console.log("type:",options.type,",user:",options.user,",passwd:",options.passwd,",ip:",options.ip,",port:",options.port,",path:",options.path)
				}
				return isSame;

			}else{
				notify.error("播放器打开输入参数错误，不是对象 ");
				return false;
			}

		},
		/**
		* 视频播放
		* @options：视频播放参数
		*			实时流播放的基本参数（6个）：  type代表实时流
		*			{"type":1,"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1"}
		*			业务需要的参数（4个）（后续修改添加，请大家自行更新）：
		*			1."cType":摄像机类型（1:球击 0:枪击）
		*			2."cStatus":摄像机状态（0:在线 1:离线）
		*			3."cId":摄像机ID、"cName":摄像机名称
		*			4."cplayStatus":播放状态  0：正常播放  1：播放异常   2：没有进行播放（离线）
		* @index: 分屏索引
		**/
	play: function(options, index, disableFocus) { /*该函数添加了type属性、cplayStatus属性、*/
			options.type = 1;
			var result = null,
			jsonstr = JSON.stringify(options);
			//添加扩展字段cplayStatus
		if (this.hasPermission(options.cameraId, index)) {
			if (parseInt(options.cStatus) === 0) {
				result = this.playerObj && this.playerObj.Play(jsonstr, index);
				//打开成功的时
				if (result === 0) {
					options.cplayStatus = 0;
				} else {
					options.cplayStatus = 1;
				}
			} else {
				options.cplayStatus = 2;
			}
		}else{
			options.cplayStatus = 5;
		}
			this.setDisplayStyle(options, index);
			if (!this.isRunningInspect&&!disableFocus) {//具体参看上海权限版本，移植过来disablefocus参数，马越修改2015.03.05
				this.manualFocusChannel = -1;
				this.setFocusWindow(index);
			}
			this.saveCameraData(options, index); //存储摄像头信息
			//提示报错信息
			this.ShowError(result);
			return result;
		},
		/**
		* 播放实时流
		* @options: {"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1"}
		* @index: 分屏索引
		**/
		playStream:function(options, index){
			var self = this;
			this.fireEvent("playStreamLog",index);
			options.type = 1;
			var jsonstr = JSON.stringify(options);
			var N=this.playerObj.Play(jsonstr, index);//console.log("etime:",(new Date()).getTime());
			//提示报错信息
			this.ShowError(N);
			//加水印
			if(typeof(WaterMark)=="object"){
				WaterMark.setWatermark(this,index);
			}
			return N;
		},
		/**
		* 播放视频（pfs文件），供视图库调用
		* @param: 视频播放参数
		*		  {"type":3,"filename":"NPFS:192.168.12.33:9000/username=admin&password=admin#/avi/人脸&车辆.mbf"," displayMode ":0}
		*		  {"type":3,"filename":http://localhost:8080/npweb/video_file/pfs_2_192.168.60.245:9000:admin:admin_video_fe428a14-194c-4b06-853a-1d419f31549c.mbf"," displayMode ":0}
		* @index: 分屏索引
		**/
		playNPFS:function(parm,index){
			var param = "";
			if(parm){
				parm.type = 3;
				param = JSON.stringify(parm);
			}
			var N=this.playerObj.Play(param, index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},
		//获取在线的数据  返回值如下
					/*	[{
						"ip": "192.168.12.93",
						"port": 2100,
						"username": "admin"，
						"password": "admin",
						"av_obj": "av/4",
						"channel_status": 0
					}, {
						"ip": "192.168.12.93",
						"port": 2100,
						"username": "admin"，
						"password": "admin",
						"av_obj": "av/4",
						"channel_status": 0
					}]*/
		/**
		* 获取在线通道列表
		* @channels：通道数组
		**/
		getOnlineChannels:function(channels){
			var result = [];
			if(typeOf(channels)==='array'){
				channels.each(function(item,index){
					if(item.channel_status===0){
						result.push(Object.clone(item));
					}
				});
			}
			return Array.clone(result);
		},
		/**
		* 获取高清或者标清通道
		* @channels: 通道
		* @streamType：0:标清 1：高清
		**/
		getSDHDchannels:function(channels,streamType){
			if(streamType===0){
				channels.definitionType = 0;//标示当前通道播放的视频类型（高清:1  or  标清:0），方便UI上高清标清显示时知道当前是什么状态
				return channels.sdChannel;
			}else{
				channels.definitionType = 1;
				return channels.hdChannel;
			}
		},
		/**
		* 获取DVR通道视频(暂时不使用)
		* @channels: 通道数组
		**/
		getDVRChannel:function(channels){
			var result = {};
			if(typeOf(channels)==='array'){
				channels.each(function(item,index){
					if(item.pvg_group_id===2){
						return Object.clone(item);
					}
				});
			}
		},
		/**
		* 获取指定通道数据(从后往前取)
		* @channels：通道数组
		* @channelType:1(PVG5.11)、2(DVR)、3(NVR)、4(非DVR)
		**/
		getChannel:function(channels,channelType){
			if(typeOf(channels)==='array'){
				var result = [];
				var i = channels.length;
				while(i--){
					if(channelType!==4){
						if(channels[i].pvg_group_id === channelType){
							result.push(Object.clone(channels[i]));
						}
					}else{
						if(channels[i].pvg_group_id !== 2){
							result.push(Object.clone(channels[i]));
						}
					}
				}
				return result;
			}
		},
		//获取准备播放历史录像的通道的所有数据,在播放历史的时候使用 by hu
		getPlayChannel:function(A,index)
		{
			var camera =A[index];
			if (camera.hdChannel&&camera.hdChannel.length > 0) 
			{
				return camera.hdChannel[0];	//目前只有1个
			}
			else if (camera.sdChannel&&camera.sdChannel.length > 0) 
			{
				for (var i=0; i < camera.sdChannel.length; i++) 
				{
					var group_id=camera.sdChannel[i].pvg_group_id;
					//1表示编码器，没有录像；2表示DVR
					if (group_id == 2 || group_id == 3) 
					{ 
						return camera.sdChannel[i];
					}
					else if(group_id ==1)
					{
						return false;
					}
				}
			}
			return false;
		},

		/**
		* 格式化数据格式
		* @date: 通道参数
		**/
		formatStreamDate:function(date){
			var tem = {};
			tem.ip = date.ip;
			tem.port = date.port;
			tem.user = date.username;
			tem.passwd = date.password;
			tem.path = date.av_obj;
			tem.id = date.id;
			return tem;
		},
		/**
		* 扩展屏调用 已废弃
		* @cameraInfo:{"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1","cplayStatus":"0","cType":1}
		* 目前非gVideoPlayer中的摄像机调用该函数时，cplayStatus默认为0
		**/
		playExpandStreamOld:function(cameraInfo,index){
			var self = this,
				playStatus = -1;
			self.saveCameraData(cameraInfo,index);//保存数据到cameraData数组中
			if (cameraInfo.cplayStatus===0) {
				playStatus = self.playStream(cameraInfo,index);
				//此处的判断为非gVideoPlayer时做的处理。 如果后续扩展屏需要添加页面，此处还需优化
				if (playStatus!==0) {
					self.setStyle(1,index);
				}
			}
			WaterMark.setWatermark(this,index);//加水印
			self.setPlayerStyle(index);
		},
		/**
		* 扩展屏调用
		* @cameraInfo:{"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1","cplayStatus":"0","cType":1}
		* 目前非gVideoPlayer中的摄像机调用该函数时，cplayStatus默认为0
		**/
		playExpandStream:function(cameraInfo,index){
			var self = this,
				playStatus = -1;
			cameraInfo.cplayStatus = undefined;
			self.saveCameraData(cameraInfo,index);//保存数据到cameraData数组中
			if (cameraInfo.cStatus===0) {//在线
				playStatus = self.playStream(cameraInfo,index);
				//此处的判断为非gVideoPlayer时做的处理。 如果后续扩展屏需要添加页面，此处还需优化
				if (playStatus!==0) {
					self.cameraData[index].cplayStatus = 1;
					self.setStyle(1,index);
				}else{
					self.cameraData[index].cplayStatus = 0;
				}
			}else if (cameraInfo.cStatus===1) {
				self.cameraData[index].cplayStatus = 2;
			}
			WaterMark.setWatermark(this,index);//加水印
			self.setPlayerStyle(index);
		},
		/**
		* 更新播放状态
		* @index: 分屏索引号
		**/
		updatePlayStatus:function(index){
			var self = this;
			var camera = self.cameraData[index];
			if(camera.hdStatus===undefined&&camera.sdStatus===undefined){
				if(!(camera.hdChannel&&camera.hdChannel.length)){//强化判断条件
					camera.hdStatus = false;
				}else{
					camera.hdStatus = true;
				}
				if(!(camera.sdChannel&&camera.sdChannel.length)){
					camera.sdStatus = false;
				}else{
					camera.sdStatus = true;
				}
			}
		},
		/**
		* 获取可以播放的通道(暂未使用)
		* @channels: 摄像机通道数组
		**/
		getPlayableChannels:function(channels){
			var result = [];
			if(typeOf(channels)==='array'){
				var i = channels.length;
				while(i--){
					if(channels[i].enablePlay){
						result.push(channels[i]);
					}
				}
			}
			return result;
		},
		/**
		* 设置每个通道是否可以正常播放  扩充enablePlay属性(暂未使用)
		* @channels: 摄像机通道数组
		* @index：分屏索引号
		**/
		setChannelEnable:function(channels,index){
			var self = this;
			if(typeOf(channels)==='array'){
				var i = channels.length;
				while(i--){
					var tem = self.formatStreamDate(channels[i]);
					var result = self.playStream(tem,index);
					if(result===0){
						channels[i].enablePlay = true;
					}else{
						channels[i].enablePlay = false;
					}
					self.stopStream(index);
				}
			}
		},
	hasPermission:function(id,index){
		var flag = permission.stopFaultRightById([id])[0];
		//this.cameraData[index].hasPermission = flag;//无权限
		return flag;
	},
		/**
		* 高清/标清播放  
		* @type: 0标清  1高清
		* @index: 分屏索引号
		* @cameraInfo 格式{"hdChannel":[{"id":19,"ip":"192.168.60.181","port":2100,"username":"admin","password":"admin","av_obj":"av/181_173/15013002","channel_status":0,"pvg_group_id":3}],"sdChannel":[{"id":19,"ip":"192.168.60.181","port":2100,"username":"admin","password":"admin","av_obj":"av/181_173/15013002","channel_status":0,"pvg_group_id":2}],"cId":19,"cName":"浦东分局模拟摄像机测试19","cCode":15164646,"cType":1,"cStatus":0}
		* @disable  是否设置遮挡层  true:不设置   非真：设置（可以为空）
		* @disableStyle  是否设置遮挡层  true:不设置   非真：设置（可以为空）
		**/
		playSHstream:function(cameraInfo,index,type,disable,disableStyle){

			var playOK = -1,//播放状态
				self = this;

			function enplay(ary){
				var aryCopy = Array.clone(ary);
				var i = aryCopy.length;
				//console.log('i',i)
				while(i--){
					var t = self.formatStreamDate(ary[i]);
					playOK = self.playStream(t,index);
					//console.log('t',t)
					self.cameraData[index].playingChannel = t;//存放当前正在播放的通道信息
					if (playOK===0) {
						return;
					}
				}
			}
			self.stop(false,index,disable);//关闭当前通道
			delete cameraInfo.zoomType;//清除放大标志位。马越
			self.saveCameraData(cameraInfo,index);//保存数据到cameraData数组中
		if (self.hasPermission(cameraInfo.cameraId||cameraInfo.cId, index)) {

			self.updatePlayStatus(index);
			//获取高清/标清通道信息
			var channels = self.getSDHDchannels(self.cameraData[index],type);
			//获取在线的数据信息
			var onlineChannels = self.getOnlineChannels(channels);

			//没有找到在线的通道
			if(onlineChannels.length<1){
				self.cameraData[index].cplayStatus = 2; //离线
				if(type===0){
					self.cameraData[index].sdStatus = false;//高清标清切换switchDefinition()时使用，以防止高清标清都切换失败时，死循环切换
				}else{
					self.cameraData[index].hdStatus = false;
				}
				//假数据
				var tem3 = {
					'ip':0, 
					'port':0,
					'user':0,
					'passwd':0,
					'path':0,
					'cplayStatus':2,
					'cType':self.cameraData[index].cType,
					'id':0
				};
				self.cameraData[index].playingChannel = tem3;  //存放当前正在播放的通道信息
			//找到在线的通道
			}else{
				if(type===0){ //标清
					//先播放DVR的
					var DVRChannels = self.getChannel(onlineChannels,2);
					if(DVRChannels.length){
						enplay(DVRChannels);
					}
					//DVR播放失败后或者没有找到DVR时播放PVG
					if(playOK!==0){
						var PVGChannels = self.getChannel(onlineChannels,4);
						if(PVGChannels.length){
							enplay(PVGChannels);
						}
					}
				}else{//高清
					enplay(onlineChannels);
				}

				if(playOK!==0){
					if(type===0){
						self.cameraData[index].sdStatus = false;
					}else{
						self.cameraData[index].hdStatus = false;
					}

					self.cameraData[index].cplayStatus = 1;
				}else{
					if(type===0){
						self.cameraData[index].sdStatus = true;
					}else{
						self.cameraData[index].hdStatus = true;
					}
					self.cameraData[index].cplayStatus = 0;
				}
			}
		} else {
			self.cameraData[index].playingChannel={};
			self.cameraData[index].cplayStatus = 5;//无权限
		}
			self.cameraData[index].playingChannel.cplayStatus = self.cameraData[index].cplayStatus;
			self.cameraData[index].playingChannel.cName = self.cameraData[index].cName;
			self.cameraData[index].playingChannel.cType = self.cameraData[index].cType;
				self.cameraData[index].playingChannel.cCode = self.cameraData[index].cCode;
			self.cameraData[index].playingChannel.ratioType = 2;//设置过画面比例取值默认为2拉伸,用于扩展屏
			self.fireEvent('CHECKRESTREE', {cameraId: self.cameraData[index].cId});
			!disableStyle&&self.setPlayerStyle(index);//设置播放器样式
			self.manualFocusChannel = -1;//清除手动聚焦标识
			self.setFocusWindow(index);//设置聚焦
			return playOK===0?true:false;
		},
		/**
		* 切换高清标清
		* @type: 0:标清  1：高清
		* @index: 分屏索引号
		* @disable :是否设置视频遮挡层  true:不设置， 非真：设置(可以不传该参数) 
		**/
		switchDefinition:function(index,type,disable){
			var cameraCopy = Object.clone(this.cameraData[index]),
				camera = this.cameraData[index];
			//高标清通道有一个为空时将不切换
			if (camera.hdChannel&&(!camera.hdChannel.length||!camera.sdChannel.length)) {return;}
			//只有当前摄像机的所有通道中至少有一个可正常播放时，才切换
			if(camera.sdStatus||camera.hdStatus){
				if(type === 0){
					this.fireEvent('SDvideo');
				}else{
					this.fireEvent('HDvideo');
				}


				var result = this.playSHstream(cameraCopy,index,type,disable,true);
				if(!result){//打开失败
					if(type===1){//高清打开失败，自动切换回标清
						//notify.error('高清模式切换失败,系统自动切换回标清模式');
						return this.switchDefinition(index,0,disable);
					}else{//标清打开失败，自动切换回高清
						//notify.error('标清模式切换失败,系统自动切换回高清模式');
						return this.switchDefinition(index,1,disable);
					}
				}else{//打开成功
					return result;
				}
			}else{
				//notify.error('标清高清均无可用通道，切换失败');
			}
		},
		/**
		* 停止播放视频（pfs）
		**/
		pauseNPFS: function(index) {
			var N = this.playerObj.Stop(true, index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},
		/**
		* 暂停播放视频
		* @index：分屏索引号
		**/
		pause: function(index){
			var N = this.playerObj.Stop(true, index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},
		/**
		* 停止播放视频流
		* @index：分屏索引号
		**/
		stopStream:function(index){
			var result = this.playerObj.Stop(false, index);
			this.playerObj.RefreshVideoWindow(index);
			//提示报错信息
			this.ShowError(result);
			return result;
		},
		/**
		* 停止视频播放，关闭相应的云台，同时控制该位置的鼠标悬浮事件
		* @bool 暂未使用到，使用时直接默认为false即可
		* @index 分屏索引号
		* @disable  是否设置遮挡层  true:不设置   非真：设置（可以为空）
		**/
		stop: function(bool, index, disable) {
			var camera = this.cameraData[index];
			if (camera && camera !== -1) {
				var closeCameraId = camera.cId;
				//在线
				if(camera.cplayStatus===0){
					//清除和这个通道相关的放大窗口
					var zoomType = camera.zoomType;
					if (zoomType!==undefined && zoomType!==null && zoomType !== -1) {
						this.stopZoom(index);
						//jQuery('#selectBlockContent div p').removeClass('checked');
					}
					var N = this.playerObj.Stop(false, index);
					this.switchPTZ(false,index);//关闭云台红色箭头
					//提示报错信息
					this.ShowError(N);
				}
				if (!this.isRunningInspect) {
					this.fireEvent('CLOSEPTZ',this.cameraData[index].cId);//解决轮巡监巡是切换时面板会自动收缩  mayue
				}
				this.fireEvent('CANCELCHECK',this.cameraData[index].cId);
				//如果当前鼠标在这个channel通道上，就隐藏遮挡层
				// console.log(this.focusChannel,this.manualFocusChannel)
				if(index===this.curChannel||index===this.manualFocusChannel){
				//仅仅在抓图未开启时才对遮挡层做定位
					if (!jQuery(".screenshot-preview").is(":visible")) {
						if (!disable) {
							jQuery('.video-control').css('left', 10000);
						}
					}else{
						jQuery('.screenshot-preview .exit').trigger('click');//加上这行代码，主要为了解决，当前窗口有抓图，但是用户又手动聚焦后，双击左侧树播放时，抓图没有关闭的问题
					}
				}
				this.cameraData[index] = -1;//将序号为i的窗口置闲
			}
			this.setStyle(0,index);//播放器样式设置为正常
		},
		/**
		* 播放暂停开关，如果是播放状态则暂停，如果是暂停状态则播放,(实时流无效)   返回值0为正确； 非0为错误码
		* @index: 分屏索引号
		**/
		togglePlay: function(index) {
			var N=this.playerObj.TogglePlay(index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},
		/**
		* 抓图 (抓拍的命名格式为路径：对象名_当前系统时间.jpg)  返回值0为正确； 非0为错误码
		* @index: 分屏索引号
		**/
		printScreen: function(index) {
			var N = this.playerObj.CapturePicture(index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},

		/**
		* 全屏
		**/
		displayFullScreen: function() {
			var self = this;
			if(!self.isFullScreen()){
				self.playerObj.SetControlFullScreen();
			}
		},

		/**
		* 取消全屏
		**/
		cancelFullScreen: function() {
			if(this.isFullScreen()){
				this.playerObj.RestoreControlScreenShow();
			}
		},

		/**
		* 检测当前状态是否全屏 返回true是有  false是没有
		**/
		isFullScreen: function(){
			return this.playerObj.IsControlFullScreen();
		},

		/**
		* 检测是否有最大化窗口  返回true是有最大化   false是没有最大化
		**/
		isHaveMaxWindow: function(){
			var result = this.playerObj.IsHaveMaximizeWindow();
			return result===1?true:false;
		},

		toggleScreen: function(index) {
			//TODO
		},
		/**
		* 设置分屏布局
		* @layout: 目前只能是1,4,9,16,41  
		*          41表示4行1列
		**/
		setLayout: function(layout) {
			//this.playerObj.SetLayout(layout);
			var oldLayout = this.getLayout();
			//如果将要切换的布局数小于当前布局数，则要关闭多出来的通道
			if(oldLayout>layout){
				for(var i=layout;i<oldLayout;i++){
					this.stop(false,i);
				}
			}

			if (!this.isHaveMaxWindow()) {
				this.playerObj.SetLayout(layout);

			} else {//如果当前通道是最大化，则取消最大化后进行布局切换
				if (this.isRunningInspect) {
					this.toggleWindowMaximize(this.curMaxWinChannel);
				}
				this.playerObj.SetLayout(layout);
			}

			if (layout<this.manualFocusChannel+1) {
				this.manualFocusChannel = -1;
			}

			this.videoLoop = 0;
		},
		/**
		* 高清标清播放时的布局切换
		* @layout: 目前只能是1,4,9,16,41  
		*          41表示4行1列
		**/	
		setLayoutBySH:function(layout){
			var oldLayout = this.getLayout();
			this.setLayout(layout);
			if(layout===1){
				this.curMaxWinChannel = -1;//切到一分屏时取消设置最大窗口
				//如果切换到一分屏，且第一分屏有视频数据，则将第一屏高清显示
				if(this.cameraData[0]!==-1){
					//有高清通道才切换成高清
					if(this.cameraData[0].hdChannel&&this.cameraData[0].hdChannel.length>0){ 
						var str=this.playerObj.GetVideoAttribute(0)+"";
						if(str!="ERROR"&&JSON.parse(str).videoType==1)
						{
							this.switchDefinition(0,1);
						}
					}
				}
			}else{
				//如果切换到非一分屏，且第一分屏有视频数据，则将第一屏标清显示
				var str=this.playerObj.GetVideoAttribute(0)+"";
				if(oldLayout===1&&this.cameraData[0]!==-1)
				{
					if(str!="ERROR"&&JSON.parse(str).videoType==1)
					{
						this.switchDefinition(0,0);
					}
				}
			}
		},
		/**
		* 获取目前分屏布局的编号(即是几分屏)，对应setLayout函数 
		**/	
		getLayout: function() {
			return this.playerObj.GetLayout();
		},

		toggleRecordVideo: function(cameraId) {
			// TODO
		},
		/**
		* 获取版本号
		**/	
		getVersion: function() {
			return this.playerObj.GetVersion();
		},
		/**
		* 设置通道窗口最大化或者退出最大化
		* @index: 分屏序号  
		**/	
		toggleWindowMaximize: function(index) {
			var self = this;
			var definitionType = self.cameraData[index].definitionType;
			if(this.isHaveMaxWindow()){
				//退出最大化
				if((definitionType!==undefined)&&(definitionType === 1)){
					this.switchDefinition(index,0);
				}
				this.curMaxWinChannel = -1;
			}else{
				//进入最大化
				if((definitionType!==undefined)&&(definitionType === 0)){
					this.switchDefinition(index,1);
				}
				this.curMaxWinChannel = index-0;
				this.setFocusWindow(index);
			}
			return this.playerObj.SetWindowMaximize(index);
		},
		/**
		* 获取上一个ocx接口的执行结果  正确返回错误码的解析字符串，错误返回"ERROR"
		**/	
		getError:function(){
			var result = this.playerObj.GetLastError();
			if(result!=="ERROR"){
				//console.log("ERROR信息：",result);
				return result==="操作成功完成"?true:false;
			}
		},
		/**
		* 设置占满控件大小的通道恢复正常大小(参数index为通道序号，起始值为0，从左到右，从上到下。左上角第一个为起始点)  返回值true为成功   false为失败
		*@index 分屏序号
		**/	
		setWindowRestore: function(index) {
			return this.playerObj.SetWindowRestore(index);
		},
		/**
		 *获取焦点窗口  返回值为当前聚焦窗口号
		*/
		getFocusWindow: function() {
			var N = this.playerObj.GetFocusWindowIndex();
			//提示报错信息
			this.ShowError(N);
			return N;
		},
		/**
		*设置焦点窗口
		*@index 分屏序号
		*/
		setFocusWindow: function(index) {
			this.focusChannel = index;
			this.playerObj.SetFocusWindow(index);
		},

		//返回窗口数量  暂时未用到此接口
		getWindowCount: function() {
			return this.playerObj.GetWindowCount();
		},
		
		//检查指定的窗口是否有焦点   返回值：有焦点返回true，无焦点返回false
		isFocusWindow: function(index){
			return this.playerObj.IsFocusWindow(index);
		},

		//获取当前通道的左上角xy坐标和宽高  返回值格式如：{"Left":1,"Top":1,"Width":570,"Height":185}
		getVideoRectByIndex: function(index) {
			var jsonString = this.playerObj.GetVideoRectByIndex(index); 
			try
			{
				return JSON.parse(jsonString);
			}catch(e){}
		},
		
		//设置画面比例
		//type 1:原始	2:拉伸	3 4:3 4 16:9	5 16:10
		setRatio: function(type, index) {
			this.ratioData[index] = type;
			this.playerObj.SetRatio(type, index);
		},

		//获取画面比例
		//返回值1、2、3、4、5分别代表设置原始、拉伸、4:3、16:9、16:10
		getRatio: function(index){
			return this.playerObj.GetRatioCode(index);
		},

		/**
		 * [设置播放器样式]
		 * @author Mayue
		 * @date   2015-03-09
		 * @param  {[type]}   type  [0 正常，  1 视频丢失  2 离线   3 cpu过高  5暂无权限访问]
		 * @param  {[type]}   index [对应播放器窗口索引]
		 * @param  {[type]}   force [强制执行，跳过中的if判断]
		 */
		setStyle: function(type, index,force){
			//轮巡、监巡进行中且 type==0时不允许设置背景   关于监巡2组监巡分组中间的空白段  刷新用的是refreshWindow实现
			if(type===0&&this.isRunningInspect&&!force){
				return false;
			}
			this.playerObj.SetStreamLostByIndex(type, index);
		},
		/**
		 * [播放器窗口上按照需要显示红色箭头]
		 * @author Mayue
		 * @date   2015-03-09
		 * @param  {[type]}   player [播放器对象]
		 * @param  {[type]}   index [当前鼠标进入的窗口索引]
		 * @return {[type]}         [description]
		 */
		ptzRedArrow:function(index){
			var self = this,
				status = self.playerObj.GetVideoAttribute(0),
				userID = jQuery('#userEntry').attr('data-userid'),
				param;
			if (status!=='ERROR'&&JSON.parse(status).videoType===1) {//有视频播放，并且是实时视频
				if (self.cameraData[index].cType===1) {//球击
					if (typeof(window.controlBar)==='object') {
						if (controlBar.runningStatus === 3) { //轮巡
							if (_.indexOf(LoopInspect.unlockedChannels, index) !== -1) {
								self.switchPTZ(false, index);
								return;
							}
						} else if (controlBar.runningStatus === 2) { //监巡
							if (!LoopInspect.isPausing) {
								return self.switchPTZ(false, index);
							}
						} else if (controlBar.runningStatus === 1) {//经典模式

						}
					}
					param = {
						cameraId: this.cameraData[index].cId||this.cameraData[index].id//cId是视频指挥页面，id是兼容扩展屏
					};
					jQuery.when(gPTZService.checkMonopoly(param),gPTZService.checkLock(param)).done(function(monopolyRes,lockRes){
						if (lockRes[0].code === 200 && monopolyRes[0].code === 200) {
							var lockData = lockRes[0].data,
								monopolyData = monopolyRes[0].data,
								lockStatus = lockData.lock, //"1"锁定  "0"未锁定
								monopolyStatus = monopolyData.status, // "1"未独占  "0"独占
								flag = false,
								lockStatusTem = lockStatus === '1' ? true : false,
								monopolyStatusTem = monopolyStatus === '0' ? true : false;
							//未锁定  未独占时
							if (lockStatus === '0' && monopolyStatus === '1') {
								flag = true;
							} else { //独占或者锁定至少有一个发生时（操作）
								//只有当上面操作是当前用户自己执行的，且自己没有锁定时，才执行下面代码(即可以控制云台)
								if (lockData.userId === undefined && monopolyData.userId === parseInt(userID)) {
									if (lockStatus === '0') {
										flag = true;
									}
								}
							}
							self.switchPTZ(flag, index);
						}
					});
				}else{
					self.switchPTZ(false, index);					
				}
			}
		},
		//根据status显示播放器样式（显示离线、正常、打开异常、云台红色鼠标）
		setDisplayStyle:function(option,index){
			var status = option.cplayStatus,
				type = option.cType;
			switch(status)
			{
				case 0://正常
					this.setStyle(0,index);
					//球击
					if(type===1 && this.isRunningInspect){
						this.switchPTZ(true,index);
					}
					break;
				case 1://播放异常
					this.setStyle(1,index);
					//notify.error("视频打开失败，请检查设备后重试");
					break;
				case 2://没有打开（离线）
					this.setStyle(2,index);
				break;
			case 5://没有权限
				this.setStyle(5,index);
					break;
				default:
					//console.log("setDisplayStyle函数的status参数错误",status);
					break;
			}
		},
		//设置播放器样式 基于setDisplayStyle的优化
		setPlayerStyle:function(index){
			var self = this,
			camera = self.cameraData[index],
			cameraId = camera.cId,
			status = camera.cplayStatus,
				type = camera.cType;
			switch(status)
			{
				case 0://正常
					this.setStyle(0,index);
					//球击
					if(type===1){
						if (!this.isRunningInspect) {
						if (window.controlBar) {
							controlBar.fireEvent('judgePermissionPtz',cameraId,index);
						}else{
							self.switchPTZ(true, index);
						}
						}
					}
					break;
				case 1://播放异常
					this.setStyle(1,index);
					//notify.error("视频打开失败，请检查设备后重试");
					break;
				case 2://没有打开（离线）
					this.setStyle(2,index);
				break;
			case 5://没有权限
				this.setStyle(5,index);
					break;
				default:
					//console.log("setDisplayStyle函数的status参数错误",status);
					break;
			}
		},
		//刷新图像窗口
		refreshWindow: function(index){
			return this.playerObj.RefreshVideoWindow(index);
		},
		//刷新全部图像窗口  仅仅供监巡时使用(2个监巡分组中间空白时)
		refreshAllWins: function(){
			var layout = this.getLayout();
			while(layout--){
				this.playerObj.SetStreamLostByIndex(0, layout);  //0 正常，  1 无法打开，  2 离线， 3 CPU过高
			}
		},
		//数字放大
		digitalZoom: function(type, index) {//type: 当前窗口放大0，其他窗口放大1
			return this.playerObj.StartZoomByIndex(type, index);
		},

		//停止放大
		stopZoom: function(index){
			if (this.cameraData[index].hasOwnProperty('zoomType')) {
				delete this.cameraData[index].zoomType;
			}
			return this.playerObj.StopZoomByIndex(index);
		},

		//关闭放大流 index:放大流所在的窗口
		stopZoomStream: function(index){
			return this.playerObj.StopZoomStream(index);
		},

		//设置字符叠加信息
		setInfo: function(json, index){
			/*var json = {
				type: 0, // 0:文本
				x: 0.1,
				y: 0.1,
				text: str,
				font: "宋体",
				autocolor: 0,
				textcolor: 255,
				backcolor: 200,
				fontsize: 9.8,
				algin: 1
			};*/
			// var teststr = '{"type":0,"x":0.5,"y":0.5,"text":"头疼","font":"宋体","autocolor":0,"textcolor":80,"backcolor":200,"fontsize":9.8,"algin":1}';
			var jsonstr = JSON.stringify(json);
			// return this.playerObj.SetOSD(teststr, index);
			return this.playerObj.SetOSD(jsonstr, index);
		},

		//检查闲忙状态	返回值：true-忙 false-闲
		isBusy: function(index){
			return this.playerObj.GetWindowBusyByIndex(index);
		},
		
		//设置画面参数调节（亮度、对比度、饱和度、色调）
		//jsonObj参数，JSON格式的字符串，（亮度、对比度、饱和度、色调）参数范围统一为【-127，127】Json格式：{"bright":100,"contrast":100,"saturation":100,"hue":100}
		//返回值0为正确；非0为错误码
		setColor: function(jsonObj, index) {
			var str = JSON.stringify(jsonObj);
			var N = this.playerObj.SetColorAttribute(str, index);
			//提示错误信息
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
				var N = this.playerObj.SoundEnable(toggle, index);
			}
			//提示报错信息
			this.ShowError(soundStatus);
			this.ShowError(N);
		},

		//声音状态	开启返回1，未开启返回0，错误返回负数
		isSoundEnable: function(index){
			var N = this.playerObj.IsSoundEnable(index);
			//提示报错信息
			this.ShowError(N);
		},

		//云台控制   enable :true表示打开，false表示关闭
		switchPTZ: function(enable, index) {
			if (permission.klass["ptz-control"] === "ptz-control") {
				this.playerObj.SetWindowPTZByIndex(enable, index);
			}
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
			return (str === "ERROR")? "" : JSON.parse(str);
		},

		//获取图片信息	(预置位截图)  返回值：字符串，正确返回base64编码的图片信息，错误返回"ERROR"
		getPicInfo: function(index){
			this.grabIndex = index-0;
			return this.playerObj.GetPicInfo(index);
		},

		//流速统计  0.2.6版本ocx原始值格式为 0.92Mbps,返回值：字符串，正确返回当前实时流传输速度 “xxx KB/S”，错误返回"ERROR"
		//
		getStreamMonitor: function(index){
			var s="0Kbps";
			var str = this.playerObj.GetTransferSpeed(index);
			if(str.indexOf("KB/S")>0){
				s = parseInt(str.replace("KB/S","").trim())*8 +"Kbps";
			}else if(str.indexOf("MB/S")>0){
				s = parseInt(str.replace("MB/S","").trim())*8 +"Mbps";
			}
			else if(str.indexOf("Mbps")>0||str.indexOf("Kbps")>0)
			{
				s=str;
			}
			return s;
		},

		//云台方向控制 {cmd:云台方向代表指令, param:云台转动(非0)或停止(0), index:当前通道号}  返回值：0为正确；非0为错误码
		ptzControl: function (cmd, param, index) {
			var N = this.playerObj.PtzControl(cmd, param, index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},

		//云台锁定 {lockTime:0解锁,0以上数字表示锁定时间, index:当前通道号}  返回值：0为正确；非0为错误码
		ptzLock: function(lockTime,index){
			var N = this.playerObj.PtzLock(lockTime, index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},

		//设置速度 （对实时流无效）
		setPlaySpeed:function(speed,index){  //speed:-2（单帧） -1（X2慢）、0（正常）、1（X2快）
			if(speed===-2||speed===-1||speed===-0||speed===1){
				var result = this.playerObj.SetPlayMode(0,speed,index);
				if(result===0){
					var tmp = this.getPlaySpeed(index);
					this.cameraData[index].playSpeed = tmp;
				}else{//提示报错信息
					this.ShowError(result);
				}
			}
			return result;
		},
		//正反播放（对实时流无效）
		reversePlay:function(type,index){   // type:0（倒放）、1（正放）
			if(type===0||type===1){
				var result = this.playerObj.SetPlayMode(1,type,index);
				if(result!==0){
					//提示报错信息
					this.ShowError(result);
				}
			}else{
				notify.error('正反播放参数错误');
			}
		},
		//从指定时间开始播放（对实时流无效）
		playByTime:function(time,index){   // time:  单位ms
			var result = this.playerObj.SetPlayMode(2,time,index);
			if(result!==0){
				//提示报错信息
				this.ShowError(result);
				//console.log('从指定时间开始播放设置失败');
			}
			return result;
		},
		//从指定帧开始播放（对实时流无效）
		playByFrame:function(frame,index){   // frame: 帧
			var result = this.playerObj.SetPlayMode(3,frame,index);
			if(result!==0){
				//提示报错信息
				this.ShowError(result);
			}
		},
		//从指定百分比开始播放（对实时流无效）
		playByPercentage:function(percent,index){   // percent: 百分比
			var result = this.playerObj.SetPlayMode(4,frame,index);
			if(result!==0){
				//提示报错信息
				this.ShowError(result);
			}
		},
		//获取当前播放速度（实时流无效）  正确返回当前播放速度；	错误返回"ERROR"
		getPlaySpeed:function(index){
			return this.playerObj.GetPlayMode(index) === 'ERROR' ? '1' : this.playerObj.GetPlayMode(index);
		},
		//获取当前播放时间（在Play成功后调用，对文件和pfs有效）成功：返回播放时间(单位：毫秒，非负数)  失败：返回错误码，负数
		getPlayTime:function(index){
			var N = this.playerObj.GetPlayTime(index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},

		//视图库抓图，播放开始后调用 成功返回：base64编码的图片信息  失败返回：”ERROR”
		playerSnap:function(index){
			return this.playerObj.PlayerSnap(index);
		},

		//播放指定时间范围内的视频（播放开始后调用，只对文件、PFS有效）用于视图库 返回值：0为正确，非0为错误码
		//startTime endTime单位是ms   type:true：循环播放，false：一次播放
		playFormStartToEnd:function(startTime,endTime,type,index){
			var N = this.playerObj.PlayFormStartToEnd(startTime,endTime,type,index);
			//提示报错信息
			this.ShowError(N);
			return N;
		},

		//设置云台速度(默认是最大速度15)    ptzspeed: 窗口云台速度 [0~15]  返回值：true为成功  false为失败
		setPtzSpeed:function(ptzspeed,index){
			return this.playerObj.SetWndPtzSpeed(ptzspeed,index);
		},
		/**编辑多边形、箭头线、框等*/
		//返回值true为成功 false为失败
		/**参数说明
			type = 1，创建一个多边形
			type = -2，删除所有的多边形
			type = 2，创建一个箭头线
			type = -4 删除所有的箭头线
			type = 3，创建一个框
			type = -6，删除所有的框
			创建时，调用一次接口，只能创建一个对象
			index 窗口索引*/
		polygonEdit: function(type, index){
			return this.playerObj.PolygonEdit(type, index);
		},
		//创建一个多边形
		polygonSet: function(index){
			return this.polygonEdit(1,index);
		},
		//删除所有多边形
		polygonDelAll: function(index){
			return this.polygonEdit(-2,index);
		},
		//创建一个箭头线
		arrowsPathSet: function(index){
			return this.polygonEdit(2,index);
		},
		//删除所有箭头线
		arrowsPathDelAll: function(index){
			return this.polygonEdit(-4,index);
		},
		//创建一个框
		rectSet: function(index){
			return this.polygonEdit(3,index);
		},
		//删除所有的框
		rectDelAll: function(index){
			return this.polygonEdit(-6,index);
		},
		/**关闭数字放大模式*/
		/**参数说明 strText字符串 箭头线的标号，eg“区域0” index窗口索引 */
		//返回值 0为成功 负数为错误码  （转为true为成功，false为失败）
		deleteOArray: function(strText, index){
			return this.playerObj.DeleteOArray(strText, index)===0?true:false;
		},
		/**录像下载，仅下载不播放 0为成功 负数为错误码*/
		/**参数说明：strRecdPath:JSON格式的字符串 录像信息 类型(数字)、用户名、密码、PVG服务器的IP或者DNS、端口号、Av对象名、
		录像类型(数字)（0为服务器录像, 非0为录像所在的层数,最大值为256, 建议0-15）、开始时间（"2012-01-01 13:20:00.000"或 "20120101132000000"）、
		结束时间（"2012-01-01 13:20:00.000"或 "20120101132000000"），
		eg：{"type":2,"user":"admin","passwd":"admin","ip": "192.168.60.181","port":2000,"path": "av/181_183/1","vodType":1,"beginTime":"20120101132000000","endTime":"20120101152000000"}
		字符串 strFileName：下载文件绝对路径名（预留参数，可为""）目前是弹框，由用户选择路径名称*/
		downLoadRecd: function(RecdPath, strFileName,fn){  
			this.fireEvent('onDownLoadRecd',RecdPath);
			var str=RecdPath;
			var self=this;
			if(typeof(RecdPath)=="object")
			{
				var str=JSON.stringify(RecdPath);
			}
			var result=this.playerObj.DownLoadRecd(str, strFileName);
			this.DownLoadlist[result+""]=
			{
				callback:function(x)
				{
					if(typeof(fn)=="function"){fn(x);}
					if(x==100)
					{
					   self.stopDownLoadRecd(result);
					}
				}
			};
			//提示报错信息
			this.ShowError(result);
			return result;
		},
		/**取消录像下载**/
		stopDownLoadRecd: function(handle){
			var result = this.playerObj.StopDownLoadRecd(handle);
			this.ShowError(result);
			return(result === 0) ? true : false;
		},
		/**布防布控图像创建*/
		/**参数说明：图像信息
		 {名称，坐标，颜色}
		 颜色BGR各8位组成的整数
		 1、单线单箭头（点3为箭头，应在12的中垂线上）
		 "{'singlearrowline',{(0.7,0.1),(0.3,0.1),(0.5,0.2)}, '255' }"
		 2、双线单箭头（点3为箭头，应在12的中垂线上）
		 "{'doublelineonearrow',{(0.2,0.6),(0.6,0.6),(0.4,0.5),(0.3,0.1),(0.5,0.2)},'255'}"
		 3、矩形
		 "{'rectangle',{(0.3,0.35),(0.4,0.35),(0.35,0.35),(0.55,0.63)},\'255\' }"
		 4、多边形
		 "{'polygon',{(0.43,0.1),(0.5,0.15),(0.25,0.9),(0.7,0.3),(0.64,0.57)},\'255\'}"
		 5、单线双箭头（点3、4为箭头，应在12的中垂线上）
		 "{'onelinedoublearrow',{(0.2,0.2),(0.8,0.8),(0.4,0.6),(0.6,0.4)},'255'}"
		 返回值：0为成功 负数为错误码*/
		createImage: function(imageInfo, index){
			var result = this.playerObj.CreateImage(imageInfo, index);
			//提示报错信息
			this.ShowError(result);
			return result===0?true:false;
		},
		/**关闭CreateImage创建的所有图像*/
		/**0为成功 负数为错误码 index窗口索引*/
		releaseAllImage: function(index){
			var result = this.playerObj.ReleaseAllImage(index);
			//提示报错信息
			this.ShowError(result);
			return result===0?true:false;
		},

		// 获取当前播放实时流的帧率
		getFramRate:function(index){
			var result = this.playerObj.GetFrameRate(index);
			return result;
		},
		on:function(name,fn){
			var self=this;
			var Names=
			{
				"click":"WndClick",
				"dblclick":"WndDClik",
				"resize":"SizeChanged",
				"download":"DownLoadPercent",
				"switch":"SwitchWindow",
				"enter":"MouseMoveWindow",
				"leave":"MouseLeaveControl"
			};
			for(var x in Names)
			{
				if(name==x){
					name=Names[x];
				}
			}
			var A=name.split(" ");
			var L=A.length;
			for(var i=0;i<=L-1;i++)
			{
				self.addEvent(name,fn);
			}
		},
		/**
		* 事件绑定
		**/
		bindEvents: function(){
			var self = this;
			var EventList=[
				"WndClick",//on的方式已注册
				"WndDClik",//on的方式已注册
				"SizeChanged",//on的方式已注册
				"DownLoadPercent",//on的方式已注册
				"MouseWheelEvent",
				"FocusChange",
				"SwitchWindow",//on的方式已注册
				"MouseMoveWindow",//on的方式已注册
				"LayoutChange",
				"FullScreen",
				"PlayBackStartOrEnd",
				"MouseLeaveControl", //on的方式已注册
				"MouseMove"
			];

			var L=EventList.length;

			for(var i=0;i<=L-1;i++){
				(function(k){
					var name=EventList[k]+"";
					var func=function()
					{
						self.fireEvent(name,arguments);
					}
					if(self.playerObj.attachEvent){
						self.playerObj.attachEvent("on" + name, func);
					} else {
						self.playerObj.addEventListener(name, func, false);
					}
			   })(i);			
			}
		},
		//获取空闲窗口数组
		getFreeWindows: function(){
			var result = [];
			for(var i = 0; i < this.getLayout(); i++){
				var str=this.playerObj.GetVideoAttribute(i)+"";
				if(str=="ERROR"){
					result.push(i);
				}
			}
			return result;
		},
	/*****************以下是复合接口，供某些页面的特殊调用**************************************************/

		//获取闲置窗口集合  返回值是[2,3,4..] 该方法可能有问题弃之
		getIdleWindows: function(){
			var result = [];
			for(var i = 0; i < this.getLayout(); i++){
				if(this.cameraData[i]===-1){
					result.push(i);
				}
			}
			return result;
		},

		//双击资源树播放时调用    pvg_group_id: 1(pvg5.11)、2(DVR)、3(NVR)   标清优先播放DVR
		/*options参数格式：
		 {
		 "cId": 2,
		 "cName": "摄像头名",
		 "cStatus": 1,//是否有通道可用 0-有 1-全部通道不可用
		 "cType": 1,//是否云台可控
		 "hdChannel": //高清摄像头通道
		 [{
		 "id":132
		 "ip": "192.168.12.93",
		 "port": 2100,
		 "user": "admin"， //pvg 用户名
		 "passwd": "admin",
		 "path": "av/4",//通道 av对象名
		 "channel_status": 1,//是否可用 0-可用 1-不可用
		 "pvg_group_id":3
		 }, {
		 "id":132
		 "ip": "192.168.12.93",
		 "port": 2100,
		 "user": "admin"， //pvg 用户名
		 "passwd": "admin",
		 "path": "av/4",//通道 av对象名
		 "channel_status": 1,//是否可用 0-可用 1-不可用
		 "pvg_group_id":3

		 }],
		 "sdChannel": //标清摄像头通道
		 [{
		 "id":132
		 "ip": "192.168.12.93",
		 "port": 2100,
		 "user": "admin"， //pvg 用户名
		 "passwd": "admin",
		 "path": "av/4",
		 "channel_status": 1,
		 "pvg_group_id":2
		 }, {
		 "id":132
		 "ip": "192.168.12.93",
		 "port": 2100,
		 "user": "admin"， //pvg 用户名
		 "passwd": "admin",
		 "path": "av/4",
		 "channel_status": 1,
		 "pvg_group_id":1
		 }],
		 }
		*/
		setFreePath: function(options) {
			var self = this;
			var isfullscreen = options.isfullscreen;
			
			var curLayout = self.getLayout(); //目前的视频布局值
			var isHaveMaxWindow = self.isHaveMaxWindow();
			//判断是否有高清，且有最大屏
			var pType = (curLayout===1 && options.hdChannel.length>0 || isHaveMaxWindow && options.hdChannel.length>0)?1:0;
			var playOK = false;
			if(self.curMaxWinChannel != -1){//存在最大化的窗口
				var maxChannel = self.curMaxWinChannel;
				self.stop(false, maxChannel);
				playOK = self.playSHstream(options, maxChannel,pType);
				if (!playOK) playOK = self.switchDefinition(maxChannel,pType===1?0:1);
				self.FPindex=maxChannel;
			}else if (self.manualFocusChannel !== -1) {//优先在用户手动聚焦的通道中播放
				var temChannel = self.manualFocusChannel;
				
				//jQuery(".screenshot-preview .exit").trigger('click');//关闭抓图面板(如果抓图面板存在的话)  马越注释掉，双击打开新的视频时，原来有抓图遮挡层窗口不能退出

				self.stop(false, self.manualFocusChannel);
				playOK = self.playSHstream(options, temChannel,pType);
				if (!playOK) playOK = self.switchDefinition(temChannel,pType===1?0:1);
				self.FPindex=temChannel;
			//自动寻找窗口播放
			} else {
				var ary = self.getIdleWindows();

				//找到可用的空闲窗口
				if(ary.length > 0){
					playOK = self.playSHstream(options, ary[0],pType);
					if (!playOK) playOK = self.switchDefinition(ary[0],pType===1?0:1);
					self.FPindex=ary[0];
				//当前窗口全为忙碌状态
				}else{
					self.stop(false,self.videoLoop);
					playOK = self.playSHstream(options, self.videoLoop,pType);
					if (!playOK) playOK = self.switchDefinition(self.videoLoop,pType===1?0:1);
					self.FPindex=self.videoLoop;

					self.videoLoop++; //检查标志位自增
					//检查标志位是否越界
					if (self.videoLoop === curLayout) {
						self.videoLoop = 0;
					}
				}
			}
			return playOK;
		},
		getFreeWindow:function()
		{
			var self = this;
			var L = self.getLayout(); //目前的视频布局值
			var A=[];
			for(var i=0;i<=L-1;i++)
			{
				var Flag=self.playerObj.GetWindowBusyByIndex(i)+"";
				if(Flag=="false")
				{
					A.push(i);
				}
			}
			return A;
		},
		setFreePath_history:function(options,fn)
		{
			var self = this;
			var curLayout = self.getLayout(); //目前的视频布局值
			var pType = curLayout===1?1:0;
			var playOK = false;
			//优先在用户手动聚焦的通道中播放
			if (self.manualFocusChannel !== -1) 
			{
				var temChannel = self.manualFocusChannel;
				self.stop(false, self.manualFocusChannel);
				playOK = self.playInHistory(options,temChannel);
			//自动寻找窗口播放
			} 
			else
			{
				var ary = self.getIdleWindows();
				//找到可用的空闲窗口
				if(ary.length > 0)
				{
					playOK = self.playInHistory(options, ary[0]);

				}//当前窗口全为忙碌状态
				else
				{
					self.stop(false,self.videoLoop);
					playOK = self.playInHistory(options, self.videoLoop);
					self.FPindex=self.videoLoop;
					self.videoLoop++; //检查标志位自增
					//检查标志位是否越界
					if (self.videoLoop === curLayout) {
						self.videoLoop = 0;
					}
				}
			}
			return playOK;
		},

		setFocusByCameraID: function(cameraID) {
			var index = -1;
			for (var i = 0; i < 16; i++) {
				if (this.cameraData[i] !== -1) {
					if (this.cameraData[i].cId === cameraID) {
						index = i;
					}
				}
			}
			this.setFocusWindow(index);
		},

		//存储摄像头信息到对应cameraData数组中
		saveCameraData: function(options, index){
			this.cameraData[index] = Object.clone(options);
			if(typeof(TimeList)=="object"&&typeof(TimeList[index])=="object")
			{
				TimeList[index].data=false;
			}
		},

		//检查cameraId当前是不是唯一的
		isOnlyCameraId: function(cameraId) {
			for (var i = j = 0; i < 16; i++) {
				if (this.cameraData[i].cId === cameraId) {
					j++;
				}
				if (j >= 2) {
					return false;
				}
			}
			return true;
		},

		//关闭所有窗口
		stopAll: function(){
			var layout = this.getLayout();
			for (var i = 0; i < layout; i++) {
				this.stop(false, i);
				this.playerObj.Stop(false, i);
				this.refreshWindow(i);
				this.setRatio(window.ocxDefaultRatio,i);
			}
			this.videoLoop = 0;
		},

		stopAllSimple: function(){
			var layout = this.getLayout();
			for (var i = 0; i < layout; i++) {
				this.playerObj.Stop(false, i);
			}
		},
		open: function(type, options) { //type:文件为0，实时流为1，录像为2
			options.type = type;
			var result = null;
			switch (type) {
				case 0:
					//TODO
					break;
				case 1:
					result = this.playLive(options);
					break;
				case 2:
					result = this.playRecord(options);
					break;
			}
			return result;
		},

		//播放录像
		playRecord: function(options) {
			options.beginTime = options.begintime;
			// options.endTime = '';
			var result = this.playInHistory2(options, options.index);
			return result;
		},

		//历史页面播放实时流
		playLive: function(options){
			var idleWindows = this.getIdleWindows();
			var layout = this.getLayout();
			if(idleWindows.length > 0){//有空闲窗口，直接播放
				this.playInHistory(options, idleWindows[0]);
			}else{//无空闲窗口则修改布局为4布局 历史调阅页面最多开4个窗口
				if(layout < 4){
					var newLayout = Math.pow((Math.sqrt(layout) + 1), 2); //布局增加一级
					this.setLayout(newLayout);
					this.playInHistory(options, layout);
				}else{
					this.playInHistory(options, this.coverIndex++);
					if(this.coverIndex === 4){
						this.coverIndex = 0;
					}
				}
			}
		},

		playInHistory: function(options, index) { /*index为通道号*/
			this.fireEvent("playInHistoryLog",index);
			var result = null,
			jsonstr = JSON.stringify(options);
			if(this.playerObj)
			{
				result = this.playerObj.Play(jsonstr, index);
			}
			else{notify.warn("播放器this.playobj不存在");return}
			this.manualFocusChannel = -1;
			this.setFocusWindow(index);
			if(typeof(this.cameraData[index])=="object")
			{
				this.cameraData[index].history=Object.clone(options);
			}
			//提示报错信息
			this.ShowError(result);
			WaterMark.setWatermark(this,index);
			return result;
		},

		// playInHistory2不提供实时和历史切换
		playInHistory2: function(options, index) { /*index为通道号*/
			this.fireEvent("playInHistoryLog",index);
			var result = null,
			jsonstr = JSON.stringify(options);
			result = this.playerObj && this.playerObj.Play(jsonstr, index);
			this.manualFocusChannel = -1;
			this.setFocusWindow(index);
			this.saveCameraData(options, index); //存储摄像头信息
			// this.cameraData[index].history=Object.clone(options);
			//提示报错信息
			this.ShowError(result);
			return result;
		},
		mapWindow:function(fn)
		{		
			var N=this.playerObj.GetLayout();
			for(var i=0;i<=N-1;i++)
			{
				var str=this.playerObj.GetVideoAttribute(i)+"";
				if(fn){fn(str,i);}
			}
		},
		getCurWindow:function(evt)
		{
			var index=0;
			var offset=$("#videoControl").offset();
			var offsetOCX=$("#UIOCX").offset();
			var N=$("#UIOCX")[0].GetLayout()-0;
			var K=Math.sqrt(N);
			var pw=$("#UIOCX").width();
			var ph=$("#UIOCX").height();
			var w0=pw/K;
			var h0=ph/K;

			var x0=offsetOCX.left;
			var y0=offsetOCX.top;

			var x=offset.left;
			var y=offset.top;
			var m=(x-x0)/pw;
			var n=(y-y0)/ph;
			return [m,n];
		},
		//计算当前窗口里播放历史视频的最后一个窗口的索引,历史调阅模块使用
		getLast_hisIndex:function(fn)
		{
			if(!this.playerObj){return -1;}		
			var N=this.playerObj.GetLayout();
			var index=-1;
			for(var i=0;i<=N-1;i++)
			{
				var str=this.playerObj.GetVideoAttribute(i);
				if(str=="ERROR"){continue;}
				var jsonobj=JSON.parse(str);
				if(fn){fn(jsonobj,i);}
				if(jsonobj.videoType==2)
				{
					index=i;
				}
			}
			return index;
		},
		//遍历所有窗口，封装回调
		get_hiscount:function(fn)
		{
			if(!this.playerObj){return 0;}		
			var N=this.playerObj.GetLayout();
			for(var i=0;i<=N-1;i++)
			{
				var str=this.playerObj.GetVideoAttribute(i)+"";
				if(fn){fn(str,i);}
			}
		},
		/**
		*获取第一个播放历史录像的分屏序号 -1为不存在播放历史录像的分屏
		@index 分屏序号
		*/
		getFirstHisIndex:function(index)
		{
			var hisK=0;
			var FirstHisIndex=-1;
			this.get_hiscount(function(str,i)
			{
				if(str!=="ERROR"&&JSON.parse(str).videoType==2) //&&i!==index
				{
					hisK++;
					if(hisK==1)
					{
						FirstHisIndex=i;
					}
				}
			});
			return {count:hisK,index:FirstHisIndex};
		},
		/**
		*获取摄像机通道id
		@camera 摄像机通道数组
		*/
		findcamid:function(camera)
		{
			var camid = 0;
			camera.temphdsd=0;
			if(camera.hdchannel){camera.hdChannel=camera.hdchannel}
			if(camera.sdchannel){camera.sdChannel=camera.sdchannel}
			if(camera.hd_channel){camera.hdChannel=camera.hd_channel}
			if(camera.sd_channel){camera.sdChannel=camera.sd_channel}
			if (camera.hdChannel&&camera.hdChannel.length > 0) 
			{
				camid = camera.hdChannel[0].id;	//目前只有1个
				camera.temphdsd=1;
			}
			else if (camera.sdChannel&&camera.sdChannel.length > 0) 
			{
				var NoEnCoder=0;
				for (var i=0; i < camera.sdChannel.length; i++) 
				{
					var group_id=camera.sdChannel[i].pvg_group_id;
					//1表示编码器，没有录像；2表示DVR
					if (group_id == 2 || group_id == 3) 
					{ 
						NoEnCoder++;
						camid = camera.sdChannel[i].id;
						break;
					}
					else if(group_id == 1)
					{
						camid = -1;
					}
				}
				if(NoEnCoder==0)
				{
					camid = -1;
				}
			}
			return camid;
		},
		/**
		*获取摄像机通道id
		@A 摄像机通道数组
		@index 分屏索引序号
		*/
		getcamid:function(A,index)
		{
			return this.findcamid(A[index]);
		},
		/**
		*播放历史录像，传入格式化的参数
		@n分屏序号
		@begintime 开始时间
		@endtime结束事件
		@vodType 录像深度
		@data json播放录像数据
		@fn 回调函数
		*/
		playHis:function(n,begintime,endtime,vodType,data,fn)
		{
			logDict.insertLog('m1','f1','o4','b6',data.name,data.name);
			var str="yyyy-MM-dd hh:mm:ss.000";
			begintime=(new Date(begintime)).format(str);
			endtime=(new Date(endtime)).format(str);
			if(typeof(data)!="object")
			{
				notify.warn("该摄像机没有历史录像或发生异常");
				return;
			}
			var obj=
			{
				"type":2,
				"user":data.username||data.user,
				"passwd":data.password||data.passwd,
				"ip": data.ip,
				"port":data.port,
				"path": data.path,
				"vodType":vodType,
				"beginTime":begintime+"",
				"endTime":endtime+"",
				"displayMode":0
			};
			if(typeof(this.cameraData[n])=="object")
			{
				this.cameraData[n].cName=data.name;
			}
			var str=JSON.stringify(obj);
			var x=this.playInHistory(obj,n);
			if(x<0)
			{
				notify.warn("播放失败:"+this.getErrorCode(x+""));
			}
			if(fn)
			{
				fn(x);
			}
		},
		/**
		*播放历史录像,带回调，传入格式化的参数
		@n分屏序号
		@begintime 开始时间
		@endtime结束事件
		@vodType 录像深度
		@data json播放录像数据
		@fn 回调函数
		*/
		playExHis:function(index,begintime,endtime,vodType,data,fn,Endfn)
		{
			var self=this;
			logDict.insertLog('m1','f1','o4','b6',data.name,data.name);
			var str="yyyy-MM-dd hh:mm:ss.000";
			begintime=(new Date(begintime)).format(str);
			endtime=(new Date(endtime)).format(str);
			if(typeof(data)!="object")
			{
				notify.warn("该摄像机没有历史录像或发生异常");
				return;
			}
			var obj=
			{
				"type":2,
				"user":data.username||data.user,
				"passwd":data.password||data.passwd,
				"ip": data.ip,
				"port":data.port,
				"path": data.path,
				"vodType":vodType,
				"beginTime":begintime+"",
				"endTime":endtime+"",
				"displayMode":0
			};
			if(typeof(this.cameraData[index])=="object")
			{
				this.cameraData[index].cName=data.name;
			}
			var str=JSON.stringify(obj);

			this.playerObj.Stop(true,index);
			var N=this.playerObj.Play2(str,index,function(index, result, userParam)
			{
				self.manualFocusChannel = -1;
				self.setFocusWindow(index);
				if(typeof(self.cameraData[index])=="object")
				{
					self.cameraData[index].history=Object.clone(obj);
				}
				//提示报错信息
				self.ShowError(result);
				WaterMark.setWatermark(self,index);
				fn(index, result, userParam);
			// console.log("播放此段开始，回调"+begintime+","+endtime+",JSON"+JSON.stringify(data));
			},0,function(index, result, userParam)
			{
			// console.log("播放此段结束，回调"+begintime+","+endtime+",JSON"+JSON.stringify(data));
				Endfn(index, result, userParam);
			},0);
			if(N<0)
			{
			// console.log(N);
				notify.warn("播放失败:"+this.getErrorCode(N+""));
			}

		},
		/**
		*判断数据格式
		@data json数据格式 通道信息
		@stype 字符串 类型 取值为real 或 his
		*/
		JudgeFormat:function(data,stype)
		{
			var Flag=false;
			if(stype=="real")
			{
				if(!data.type){return false}
				if(!data.user){return false}	
				if(!data.passwd){return false}
				if(!data.ip){return false}
				if(!data.port){return false}
				if(!data.path){return false}
				if(!data.displayMode){return false}			
			}
			if(stype=="his")
			{
				if(!data.type){return false}
				if(!data.user){return false}	
				if(!data.passwd){return false}
				if(!data.ip){return false}
				if(!data.port){return false}
				if(!data.path){return false}
				if(!data.displayMode){return false}	
				if(!data.vodType){return false}
				if(!data.beginTime){return false}	
				if(!data.endTime){return false}	
			}
			return true;
		},
		/**
		*获取实时视频播放的数据格式
		@data 通道数据 json
		@stype 字符串 类型 取值为real 或 his
		*/
		getPlayData:function(data,stype,definitionType)
		{
			if(data==-1){return false}
			var getDataIndex=function(data,k,definitionType)
			{
				var pdata=data[k];
				var obj=
				{
			        "user": pdata.username,
			        "passwd": pdata.password,
			        "ip": pdata.ip,
			        "port": pdata.port,
			        "path": pdata.av_obj,
			        "displayMode":0,
			        "definitionType":definitionType
				};
				return obj;
			}

			var getParam=function(data,definitionType)
			{
				var L=data.length;
				if(L==1)
				{
					return getDataIndex(data,0,definitionType);
				}
				else if(L>=2)
				{
					for(var i=0;i<=L-1;i++)
					{
						if(data[i].pvg_group_id===2||data[i].pvg_group_id===3)
						{
							//alert("走dvr");
							return getDataIndex(data,i,definitionType);
						}
					}
					return getDataIndex(data,0,definitionType);
				}
			}
			if(stype=="real")
			{
				if(data.sd_channel&&data.sd_channel.length>=1)
				{
					//return getParam(data.sd_channel,0);
				}

				if(data.sdchannel&&!data.sdChannel)
				{
					data.sdChannel=data.sdchannel;
					//delete data.sdchannel;
				}
				if(data.hdchannel&&!data.hdChannel)
				{
					data.hdChannel=data.hdchannel;
					//delete data.hdchannel;
				}
				//console.log("data.hdChannel.length="+data.sdChannel.length);
				/*if(data.sdChannel&&data.sdChannel.length>=1)
				{
					return getParam(data.sdChannel,0);
				}
				else if(data.hdChannel&&data.hdChannel.length>=1)
				{
					return getParam(data.hdChannel,1);
				}
				else
				{
					return null;
				}*/
				var sd,hd; 
				if(data.sdChannel&&data.sdChannel.length>=1)
				{
					sd = getParam(data.sdChannel,0);
				}
				if(data.hdChannel&&data.hdChannel.length>=1)
				{
					hd = getParam(data.hdChannel,1);
				}
				if(!sd && !hd){
					return null;
				}
				if(definitionType === 1){
					if(hd) {return hd;}
					else {  return sd;}
				}else if(definitionType === 0){
					if(sd) {return sd;}
					else {return sd;}
				}
			}
	},
	/**
	*登录pvg    
	@obj:{"user":"xx1","passwd":"xx2","ip":"192.168.60.21","port":2100}
	*/
	login: function(obj) {
		var jsonstr = JSON.stringify(obj);
		var result = this.playerObj.Login(jsonstr);
		return result;
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
	preOpenStream: function(param) {
		param.type = 1;
		var jsonstr = JSON.stringify(param);
		var handle = this.playerObj.OpenStream(jsonstr,288);
		return handle;
	},
	//关闭preOpenStream打开的隐藏视频
	preCloseStream:function(handle){
		if (handle>0) {
			var N = this.playerObj.CloseStream(handle);
			return N;
		}
	},
	//预播放  将preOpenStream隐藏打开的画面显示  handle是preOpenStream函数的返回值  index是窗口号
	prePlayStream:function(handle,index){
		if (handle>0) {
			var N = this.playerObj.PlayStream(handle,index);
			return N;
		}
	},
	//判断当前通道是否离线
	isOffChannel:function(arr){
		var i = arr.length;
		if(i){
			while(i--){
				if(arr[i].channel_status === 0){//在线
					return false;
				}
			}
			return true;
		}else{
			return true;
		}
	},
	//判断摄像头是否是离线
	isOffLine:function(param){
		if(!param.hdChannel.length&&!param.sdChannel.length){
			return true;
		}else{
			var hdStatus = this.isOffChannel(param.hdChannel);
			var sdStatus = this.isOffChannel(param.sdChannel);
			return (hdStatus&&sdStatus);
		}
	},
	//布防播放   备注：针对一瓶播放
	defencePlay:function(param){
		var layout = this.getLayout();
		var self = this;
		if(layout===1){
			self.playerObj.Stop(false, 0);//关闭之前画面
			self.refreshWindow(0);//刷新当前画面
			self.saveCameraData(param,0);//保存数据到cameraData数组中
			var isOff = self.isOffLine(param);
			if(isOff){
				self.cameraData[0].cplayStatus = 2;
				this.setStyle(2,0);
				return false;
			}else{
				var allChannels = param.hdChannel.concat(param.sdChannel);
				var onlineChannels = self.getOnlineChannels(allChannels);
				var i = onlineChannels.length;
				while(i--){
					var tem = self.formatStreamDate(onlineChannels[i]);
					if(self.options.displayMode === 1){
						tem.displayMode = 1;
					}
					var result = self.playStream(tem,0);
					if(result===0){
						self.cameraData[0].playing = tem;
						self.cameraData[0].cplayStatus = 0;
						return true;
					}else{
						if(i===0){
							self.cameraData[0].cplayStatus = 1;
							this.setStyle(1,0);
							return false;
						}
					}
				}

				}
			}
		},
		/**
		 * 抓图(原图  base64串)  备注：该方法必须在grabCompress之后调用，获取上一次grabCompress时内部保持的原图图片信息
		 * 获取index窗口最后一次CatchScaleDownPicture抓图的原始图片信息(如果不调用CatchScaleDownPicture, 多次调用本接口获取的为同一张原始图片)
		 * 返回值 字符串，正确返回base64编码的png图片信息，错误返回"ERROR"
		 */  
		grabOriginal:function(index){
			var base64 = this.playerObj.GetRawPicture(index);
			if (index!=='ERROR') {
				base64.replace(/[\n\r]/ig, '');
			}
			return base64;
		},
		/**
		 * 抓图(压缩过的  base64串),同时抓取它的原图，但是此处仅仅只是保持到ocx内部，供grabOriginal调用
		 * 抓图，并返回压缩的png图片信息
		 *1.1080p和720p视频，图片压缩为512*288
		 *2.w>720且 h>480视频，图片压缩为(w/2)*(h/2)
		 *3.其他视频，图片不压缩
		 *返回值字符串，正确返回base64编码的png图片信息，错误返回"ERROR"
		 */
		grabCompress:function(index){
			var base64 = this.playerObj.CatchScaleDownPicture(index);
			if (index!=='ERROR') {
				this.grabIndex = index-0;
				base64.replace(/[\n\r]/ig, '');
			}
			return base64;
		},
		/**
		 * grabOriginal的扩展形式  抓图(原图  base64串)  备注：该方法必须在grabCompress之后调用，获取上一次grabCompress时内部保持的原图图片信息
		 * 获取index窗口最后一次CatchScaleDownPictureEx抓图的指定格式原始图片信息(GetRawPicture扩展接口)
		 * 字符串，正确返回base64编码的指定格式图片信息，错误返回"ERROR"
		 */
		grabOriginalEx:function(index){
			var base64 = this.playerObj.GetRawPictureEx(index,3);//1:BMP  2:GIF  3:JPG 4:PNG  由于JPG速度最快  实战默认选用3 注：不要求与CatchScaleDownPictureEx的nPicType一致
			if (index!=='ERROR') {
				base64.replace(/[\n\r]/ig, '');
			}
			return base64;
		},
		/**
		 *grabCompress的扩展形式  抓图(压缩过的  base64串),同时抓取它的原图，但是此处仅仅只是保持到ocx内部，供grabOriginal调用
		 *抓图，并返回压缩的指定格式图片信息(CatchScaleDownPicture扩展接口)
		 *1.1080p和720p视频，图片压缩为512*288
		 *2.w>720且 h>480视频，图片压缩为(w/2)*(h/2)
		 *3.其他视频，图片不压缩
		 * @return 字符串，正确返回base64编码的指定格式图片信息，错误返回"ERROR"
		 */
		grabCompressEx:function(index){
			var base64 = this.playerObj.CatchScaleDownPictureEx(index,3);//1:BMP  2:GIF  3:JPG 4:PNG  由于JPG速度最快  实战默认选用3
			if (index!=='ERROR') {
				this.grabIndex = index-0;
				base64.replace(/[\n\r]/ig, '');
			}
			return base64;
		},
		/**
		 * 抓图，并返回压缩的指定格式、指定大小图片信息(CatchScaleDownPicture2扩展接口)
		 * @number index  播放窗口索引
		 * @number width  截图的宽  图片宽度, 最小有效值为4,最大有效值为3840
		 * @number height 截图的长  图片高度，最小有效值为4,最大有效值2160
		 * @return {[type]}        [description]
		 *
		 * 注 关于图片大小的说明：
		 *1.图片宽高参数自动处于有效范围内
		 *2.width>0且height<=0时，根据width按视频原始比例自适应高度
		 *3.width<=0且height>0时，根据height按视频原始比例自适应宽度
		 *4.width>0且height>0时，按此宽高
		 *5.Width<0且height<0时，自动压缩，同CatchScaleDownPictureEx
		 */
		grabCompressEx2:function(index,width,height){
			var base64 = this.playerObj.CatchScaleDownPictureEx2(index,3,width,height);//1:BMP  2:GIF  3:JPG 4:PNG  由于JPG速度最快  实战默认选用3
			if (index!=='ERROR') {
				this.grabIndex = index-0;
				base64.replace(/[\n\r]/ig, '');
			}
			return base64;
		},

		/**
		 * 抓原图并获取指定格式图片信息()(GetPicInfo扩展接口)
		 * @number index  播放窗口索引
		 * @return {[type]}        [description]
		 */
		catchOriginal:function(index){
			var base64 = this.playerObj.CatchPictrue(index,3);//1:BMP  2:GIF  3:JPG 4:PNG  由于JPG速度最快  实战默认选用3
			if (index!=='ERROR') {
				this.grabIndex = index-0;
				base64.replace(/[\n\r]/ig, '');
			}
			return base64;
		},

		/**
		此函数为播放视频的函数，封装PlayEx执行，此函数一般给playRoute调用
		@str:  字符串，播放需要的通道信息字符串
		@stype:  字符串，标清/高清等描述信息,不写可为空字符串
		@index:   数字 窗口序号
		@A:   数组，默认为空,记录播放路由的信息数组
		@fn:  播放回调函数 格式和 playRoute的回调函数格式保持一致
		*/
		PlayerEx:function(str,stype,index,A,fn,timeout)
		{
			var self=this;
			var isTimeout=true;
			if(!timeout){timeout=8000}
			var N=this.playerObj.PlayEx(str,index,function(index, result, userParam)
			{
				 isTimeout=false;
				 if(result==0)
				 {
					isTimeout=true;
					A.push("待播放"+stype+"通道连接pvg成功，已经获取到码流！通道信息:"+str);
					//这里不执行fn,走到下一个回调执行fn
				 }
				 else
				 {
					A.push("尝试连接pvg失败！错误码:"+result+",通道信息:"+str);
					fn&&fn(false,str,A);
				 }
			},0,function(index, result, userParam)
			{
				isTimeout=false;
				 if(result==0)
				 {
					A.push("播放"+stype+"通道成功，通道信息:"+str);
					fn&&fn(true,str,A);
				 }
				 else
				 {
					A.push("尝试播放"+stype+"通道失败！错误码:"+result+",通道信息:"+str);
					fn&&fn(false,str,A);
				 }
			},0);

			if(N<0)
			{
				A.push("playEx函数执行失败,返回错误码"+N+",通道信息:"+str);
				self.StopEx(false, index);
				fn&&fn(false,str,A);
				return;
			}
			setTimeout(function()
			{
				if(isTimeout)
				{
					A.push("连接"+timeout+"毫秒之后无法连接上，超时,通道信息:"+str);
					//self.playerObj.Stop(false,index);
					self.StopEx(false, index);
					fn&&fn(false,str,A);
				}
			},timeout);
		},
		/**
		 播放标清视频的一个函数，此函数为中间函数，给playRoute调用
		 @camerData:  摄像机通道信息，格式和playRoute一致
		 @index:  数字，窗口序号
		 @A:  数组，默认为空
		 @fn:  播放回调函数 回调函数格式和 playRoute回调一致
		*/
		Playsd:function(camerData,index,A,fn,timeout)
		{
			if(!timeout){timeout=8000;}
			var self=this;
			var sd_channel=camerData.sd_channel;
			var sd_length=sd_channel.length;
			A.push("for循环查找标清通道");
			var EnCoder=null;
			for (var i=0; i <=sd_length-1; i++) 
			{
				var group_id=sd_channel[i].pvg_group_id;
				//1表示编码器，没有录像；2表示DVR  3表示 nvr，高清摄像机的标清码流ipc
				if (group_id == 2 || group_id == 3) 
				{ 
					var stype=(group_id == 2 )?"dvr":"nvr";
					A.push("找到一个"+stype+"通道,尝试播放,通道信息:"+JSON.stringify(camerData.sd_channel[i]));
					var params=
					{
							"type":1,
							"user": sd_channel[i].username,
							"passwd": sd_channel[i].password,
							"ip": sd_channel[i].ip,
							"port": sd_channel[i].port,
							"path": sd_channel[i].av_obj,
							"displayMode":0
					};
					var str=JSON.stringify(params);
					A.push("Playsd函数调player.PlayerEx,编号0,参数:"+str);
					self.PlayerEx(str,"标清"+stype,index,A,fn,timeout);
					EnCoder=null;
					return;
				}
				else if(group_id == 1) //即使先运行到这个分支，后面碰到group_id == 2 || group_id == 3 ,则EnCoder=null;
				{
					A.push("找到一个编码器通道,尝试播放,通道信息:"+JSON.stringify(camerData.sd_channel[i]));;
					EnCoder=sd_channel[i];
				}
			}
			EnCoder.type=1;
			var str=JSON.stringify(EnCoder);
			A.push("Playsd函数player.PlayerEx,编号1,参数:"+str);
			self.PlayerEx(str,"标清编码器",index,A,fn,timeout);
		},
		/**
		*实时视频播放路由
		@camerData:  从摄像机id 获取摄像机数据，里面至少含有 sdchannel hdchannel 数组
		@index:  窗口序号
		@fn:  播放成功与否的回调 function(flag,str,A){} flag 布尔型，str 通道数据,A播放路由信息数组
		示例

		playRoute(camerData,0,function(flag,str,A)
		{
			  if(flag==false){console.log("播放失败，通道信息:"+str+",路由信息"+A);}
			  else
			  {
				console.log("播放成功，通道信息:"+str+",路由信息"+A);
			  }
		});
		*/
		PlayRoute:function(camerData,index,fn,timeout)
		{
			if(!timeout){timeout=8000;}
			var self=this;
			var A=[];
			var N=self.getLayout();
			var hd_length=camerData.hd_channel.length;
			var sd_length=camerData.sd_channel.length;
			self.cameraData[index]=camerData;//保存数据到cameraData数组中
			A.push("此摄像机存在"+hd_length+"个高清通道,"+sd_length+"个标清通道");

			if(hd_length===0&&sd_length===0){
				A.push("高标清通道都不存在");
				fn&&fn(false,"",A);
				return;
			}
			if(N!==1)
			{
				A.push("尝试播放标清通道");
				if(sd_length>=1){
					self.Playsd(camerData,index,A,fn,timeout);
					return;					
				}
			}
			A.push("单屏,尝试查找高清通道");
			if(hd_length>0)
			{
				var options=camerData.hd_channel[0];
				var params=
				{
					"type":1,
					"user": options.username,
					"passwd": options.password,
					"ip": options.ip,
					"port": options.port,
					"path": options.av_obj,
					"displayMode":0
				};
				var str=JSON.stringify(params);
				A.push("找到一个高清通道，尝试播放，理论上只有一个高清通道，此处只查找一次");
				A.push("PlayRoute函数调player.PlayerEx,参数:"+str);
				self.PlayerEx(str,"高清",index,A,function(flag,str,A)
				{
					if(flag==false)
					{
						A.push("播放高清通道失败,通道信息:"+str);
						//fn(false,str,A);
						if(sd_length<=0)
						{
							A.push("不存在标清通道:"+str);
							fn&&fn(false,str,A);
							return;
						}
						else
						{
							A.push("尝试播放标清通道！通道信息:"+str);
							self.Playsd(camerData,index,A,fn,timeout);					
						}					
						return;
					}

					else
					{
						//A.push("播放高清通道成功,通道信息:"+str);
						fn&&fn(true,str,A);
					}
				},timeout);
				return;
			}
			else
			{
				A.push("没找到高清通道，尝试查找标清通道信息");
				if(sd_length<=0)
				{
					A.push("不存在标清通道"+JSON.stringify(camerData));
					fn&&fn(false,"",A);
					return;
				}
				A.push("尝试播放标清通道");
				self.Playsd(camerData,index,A,fn,timeout);
			}
		},

		/**
		*从摄像机id播放实时视频
		@cameraid: 字符串，摄像机id
		@index:  数字 窗口序号
		@fn: 回调函数，和PlayRoute保持一致
		*/
		PlayByCameraId:function(cameraid,index,fn,timeout)
		{
			var self = this;
			if (self.cameraDataCache[cameraid] !== undefined) {
				self.PlayRoute(self.cameraDataCache[cameraid], index, fn, timeout);
			} else {
				self.getCameraDataById(cameraid, index, function(data) {
					self.cameraDataCache[cameraid] = data.cameraInfo;
					self.PlayRoute(data.cameraInfo, index, fn, timeout);
				});
			}
		},
		/**
		 * [StopEx 异步关闭播放的分屏]
		 * @author huzc
		 * @date   2015-03-10
		 * @param  {[布尔]}   pause     [是否暂停,false关闭，true暂停]
		 * @param  {[序号]}   index     [分屏序号]
		 * @param  {Function} fn        [关闭成功后的回调函数，关闭失败的回调暂时不支持]
		 * @param  {[任意]}   userParam [用户参数,暂时固定为0，可以不去关心]
		 */
		StopEx:function(pause, index, fn){
			var N = this.playerObj.StopEx(pause, index, function(index, result, userParam) {
				if (result === 0) { //不等于0的情况不用关心，因为不等于0时，即关闭失败时无法执行回调
					fn && fn(index);
				}
			}, 0);
		},
		/**
		 * [getAjax get类型ajax]
		 * @author Mayue
		 * @date   2015-03-12
		 * @param  {[type]}   url      [description]
		 * @param  {[type]}   params   [description]
		 * @param  {Function} callback [description]
		 * @return {[type]}            [description]
		 */
		getAjax:function(url,params,callback){
			var self=this;
			jQuery.ajax({
				url: url,
				type: 'get',
				data: params,
				dataType: 'json',
				success: function(res) {
					if (res.code === 200) 
					{
						if(typeof(callback)=="function")
						{
							callback(res.data);
						}
					} 
					else if (res.code === 500)
					{
						notify.error(res.data.message);
					} 
					else
					{
						notify.error("获取数据异常！");
					}
				}
			});
		},
		/**
		*从摄像机id获取数据
		@cameraid: 字符串，摄像机id
		@index:  数字 窗口序号
		@fn: 回调函数，和PlayRoute保持一致
		*/
		getCameraDataById:function(cameraid,index,fn){
			var self=this,
				url = "/service/video_access_copy/accessChannels";
			self.getAjax(url,{id:cameraid},fn);
		},
		getCameraDataByIds:function(cameraids,fn){
			var self=this,
				url = "/service/video_access_copy/accessChannelsArr";
			self.getAjax(url,{ids:cameraids.join(',')},fn);
		},
		/*getCameraDataById:function(cameraid,index,fn){
			var self=this;
			jQuery.ajax({
				url: "/service/video_access_copy/accessChannels",
				type: 'get',
				data: {id: cameraid},
				dataType: 'json',
				success: function(res) {
					if (res.code === 200) 
					{
						if(typeof(fn)=="function")
						{
							fn(res.data);
						}
					} 
					else if (res.code === 500) 
					{
						notify.error(res.data.message);
					} 
					else 
					{
						notify.error("获取数据异常！");
					}
				}
			});
		},*/
		/**
			*获取历史录像片段信息
			@cId 摄像机通道id
			@begintime 开始时间
			@endtime 结束时间
			@fn 查询的回调函数 参数 function(camera,flag){} camera json格式 flag布尔型
				{
					"code": 200,
					"data": {
						"port": 2100,
						"username": "admin",
						"time": 1396839419996,
						"videos": [
							[1396831555359, 1396831742573, 0],
							[1396839112185, 1396839419987, 0]
						],
						"name": "60.172_1_R",
						"path": "av/181_172/1",
						"password": "admin",
						"ip": "192.168.60.181"
					}
				}
		*/
		/**
		*选中一段历史录像播放,播放的数据为window.SelectCamera.ListData[index].searchData里存储的数据
		@index 分屏索引序号
		@order 搜索的历史录像片段中的播放某片段的序号
		@fn回调
		*/
		PlayListTime:function(index,order,fn)
		{
			var self=this;
			var ListData= window.SelectCamera.ListData[index]; 
			var data=ListData.searchData;
			if(!data)
			{
			// console.log("!data,data=window.SelectCamera.searchData");
				data=window.SelectCamera.searchData;
			}
			//if(!data.videos[order]){return}
			//console.log("data="+JSON.stringify(data))
			try
			{
				var beginTime=data.videos[order][0]; //可能报错需处理
			}
			catch(e)
			{
			// console.log("data.videos="+JSON.stringify(data.videos));
			// console.log("data="+JSON.stringify(data));
			// console.log("order="+order);
				return "ERROR";
			}

			var endTime=data.videos[order][1];
			var vodType=data.videos[order][2];
			window.SelectCamera.ListData[index].subindex=order;
			//window.SelectCamera.ListData[index].timePoint=beginTime;
			window.SelectCamera.ListData[index].beginTime=beginTime;
			window.SelectCamera.ListData[index].endTime=endTime;
			window.SelectCamera.ListData[index].vodType=vodType;
			var searchHTML=window.SelectCamera.searchHTML;
			//window.SelectCamera.searchHTML="";
			//window.SelectCamera.ListData[index].searchHTML=searchHTML;
			//window.SelectCamera.searchHTML="";
			var resultList =jQuery("#ptzCamera .content .view.hisplay.ui.tab .resultList");
			var definitionType=window.SelectCamera.ListData[index].definitionType;
			var input_beginTime=jQuery(".his_beginTime.input-time").val();;
			var input_endTime=jQuery(".his_endTime.input-time").val();
			var definitionType=window.SelectCamera.ListData[index].definitionType;

			window.SelectCamera.ListData[index].searchHTML=resultList.html();;
			window.SelectCamera.ListData[index].input_beginTime=input_beginTime;
			window.SelectCamera.ListData[index].input_endTime=input_endTime;
			// console.log("data="+JSON.stringify(data));
			self.playExHis(index,beginTime,endTime,vodType,data,function(index, result, userParam)
			{ 
				if(result!==0){return}
    		//只有在非轮巡状态下才去控制masklayer  马越
			if (!(jQuery('#startInspector').is(':visible')&&jQuery('#startInspector').hasClass('red'))) {
				jQuery(".masklayer").hide();
			}
				//var text=window.SelectCamera.selectName;
				//改动，解决了历史录像的标题问题
				var text=data.name;
				//console.log("window.SelectCamera.selectName="+window.SelectCamera.selectName);
				//console.log("window.SelectCamera.MenuData="+window.SelectCamera.MenuData);
				var alldata=window.SelectCamera.MenuData[text];
				// console.log("alldata="+JSON.stringify(alldata));
				if(alldata)
				{
					if(alldata.id){alldata.cId=alldata.id;}
					if(alldata.cameracode){alldata.cCode=alldata.cameracode;}
					if(data.path){alldata.path=data.path;}
					if(data.name){alldata.cName=data.name;}
					if(typeof(definitionType)=="number")
					{
						//alert("definitionType="+definitionType);
						alldata.definitionType=definitionType;
					}
					if(typeof(alldata.cameratype)=="number")
					{
						alldata.cType=alldata.cameratype;
					}
					else if(typeof(data.cameratype)=="number")
					{
						alldata.cType=data.cameratype;
					}
					else if(typeof(data.cType)=="number")
					{
						alldata.cType=data.cType;
					}
					//alldata.cType=alldata.cameratype||data.cameratype||data.cType;
					alldata.cStatus=data.cstatus;
					//alldata.cName=alldata.name;
					//console.log("self.cameraData[index]=alldata;");
					self.cameraData[index]=alldata;
					self.updatePlayStatus(index);
					//alert("cType="+player.cameraData[index].cType+",data.cameratype="+data.cameratype);
				}
				window.SelectCamera.ListData[index].searchData=data;
			},function(index,result,data)
			{
				// console.log("fn,end");
				if(typeof(fn)=="function")
				{
					fn(index,result,data);
				}
			});
		},


		/**
		*统计播放历史录像的总的分屏数
		*/
		getHisCount:function()
		{
			var K=0;
			this.get_hiscount(function(str,i)
			{
				if(str!="ERROR"&&JSON.parse(str).videoType===2) //播放历史
				{
					K++;
				}
			});
			return K;
		},
		trigger:function(name,obj)
		{
			var self=this;
			switch(name)
			{
				case "resize":{ self.fireEvent('OCXRESIZE',obj); break;}
				case "mousewheel":{ self.fireEvent('OCXWHEEL',obj); break;}
				case "click":{ self.setFocusWindow(obj); self.fireEvent('OCXCLICK',obj); break;}
				case "dblclick":{ self.setFocusWindow(obj.index); self.fireEvent('OCXDCLICK',obj); break;}
				 //case "focuschange"{ self.fireEvent('OnFocusChange',obj); break;}
				case "switch":{ self.fireEvent('OCXSWITCH',obj); break;}
				case "mousedown":{ self.fireEvent('mousedown',obj);break;}
				case "mousemove":{ self.fireEvent('mousemove', obj);break;}
				case "enter":{ self.fireEvent('MouseMoveWindow', obj);break;}
				case "mouseup":{ self.fireEvent('mouseup', obj);break;}
				case "leave":{ self.fireEvent('LEAVEOCX', obj);break;}
				case "layoutchange":{ self.fireEvent('OnLayoutChange', obj);break;}
				case "fullscreen":{ self.fireEvent('OCXFULLSCR', obj);break;}
				case "exitfullscreen":{ self.fireEvent('OCXCANCELFULL', obj);break;}
				default:{}
			}
		},
		getHistoryList:function(cId,begintime,endtime,fn){
			jQuery.ajax({
				url: '/service/history/list_history_videos_other',
				data: {
					channel_id: cId,
					begin_time: begintime,
					end_time: endtime
				},
				cache: false,
				type: 'GET',
				async: true,
				success: function(res) 
				{
					if (res.code === 200) 
					{
						var camera = res.data;
						fn(camera,true);
					}
					else if(res.code === 500)
					{
						fn(camera,false);
					}
				}
			});
		},
		/**
		 * [setBgColor 设置播放器背景margin颜色]
		 * @author Mayue
		 * @date   2015-04-27
		 */
		setVideoMarginColor:function(){
			this.playerObj.SetVideoMarginColor(0,0,0,-1);//第一个参数红色（范围0~255）第一个参数绿色（范围0~255）第一个参数蓝色（范围0~255） 第四个参数窗口索引  Index = -1表示设置所有窗口
		}
	});
	window.VideoPlayer=VideoPlayer;
	return VideoPlayer;
});

