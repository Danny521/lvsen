/**
 * 全局变量模块
 * @author chengyao
 * @date   2014-12-08
 */
define(['js/model/alarmanalysis-model','/module/common/popLayer/js/popImg.js','jquery.pagination'],function(alarmModel,popImg){
	return{
		//当前搜索出的历史报警条数
		hisCount: 0,
		//组织树
		orgTree: null,
		//摄像机树
		cameraTree: null,
		//组织树面包屑信息存储
		steps: [],
		//摄像机树面包屑信息存储
		treeSteps: [],
		//当前组织树数据信息
		curDepartment: {},
		//当前摄像机树数据信息
		curTreeDepartment: {},
		//tab切换是否第一次的标识
		falg :true,
		firstLoad:false,
		//模块地址
		templateURL: "/module/protection-monitor/alarmanalysis/inc/alarmanalysis_template.html",
		setPagination: function(total, selector, itemsPerPage, callback) {
			jQuery(selector).pagination(total, {
				orhide: false,
				prev_show_always: false,
				next_show_always: false,
				items_per_page: itemsPerPage,
				first_loading: false,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);
				}
			});
		},
		sliceFaceImg: function(imgPath) {
			if(imgPath.indexOf("/img/")>-1){
				var strArr = imgPath.substr(imgPath.indexOf("/defence_img"),imgPath.length);
			}else{
				return imgPath;
			}

			return strArr;
		},
		histNewimplent:function(params){
			var self = this;
			if(params && params.deployEvent){
				var imgTime = params.deployEvent.absTime,
					faceImg = self.sliceFaceImg(params.deployEvent.imgInfo[0]),
					imgName = params.deployEvent.cameraName;
			}

			jQuery("a.analysis").on("click",function(e) {
				e.preventDefault();
				var index = jQuery(this).closest('tbody').index(),
				remark = jQuery("#remark").find("span").text();
				renderHis(imgTime,faceImg,index,imgName,remark);
			});
			var renderHis = function(imgTime,faceImg,index,imgName,remark){
				alarmModel.ajaxEvent.getBase64Url({ filePath: faceImg},function(res){
					if (res.code === 200) {
						var base64 = res.data;
						var imgData = {
			                baseInfo: {
			                    filePath: "/img" + faceImg,// 图片路径
			                    storageTime: imgTime, // 创建时间
			                    remark:remark || "无"
			                },
			                operatorOptions: {
			                	downloadUrl: "/service/storage/download?filePath="+faceImg+"&isBucket=false", // 下载地址
			                	saveToCloudbox: { // 保存到云空间
			                		fileName: imgName,
									filePath: base64.replace(/\r|\n/g, ""),
									catchTime: imgTime
			                    }
			                }
			            };
			            popImg.initial(imgData);
					}else if(res.code ===500){
						notify.error("获取图片信息失败！")
						return;

					}
				},function(error){
					notify.error("获取图片信息失败！")
					return;
				});
			}
		},
		//通过报警类型值获取报警类型名称
		getEventTypeName: function(x) {
			var typeData = {
				"0": "无任何事件",
				"1": "无任何事件",
				"2": "绊线检测",
				"4": "区域入侵",
				"8": "目标离开区域",
				"16": "出现目标",
				"32": "徘徊检测",
				"64": "物品遗留",
				"128": "物品丢失",
				"256": "非法停车",
				"512": "场景突变",
				"1024": "奔跑检测",
				"2048": "人群聚集",
				"4096": "人数统计",
				"8192": "车牌识别",
				"16384": "车辆逆行",
				"65536": "离岗检测",
				"131072": "车流统计",
				"262144": "出门检测",
				"524288": "人脸检测",
				"1048576": "打架检测",
				"2097152": "人脸识别",
				"4194304": "拥堵检测",
				"8388608": "非法尾随检测",
				"16777216": "烟火检测",
				"33554432": "手动报警",
				"134217728": "人员布控",
				"7": "人脸入库"
			};
			return typeData[x];
		}
	};
});
