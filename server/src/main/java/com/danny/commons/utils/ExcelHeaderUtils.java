package com.danny.commons.utils;


/**
 * 文件头常量表
 * @author mabo@netposa.com
 *
 */
public class ExcelHeaderUtils {
	/**
	 * 巡检年统计
	 */
	public static String[][] CITYHEADERS = new String[][]{
		{"年/月","联网指标","#cspan","#cspan","#cspan","#cspan","#cspan","在线率","#cspan","#cspan","完好率","#cspan","#cspan","图像质量得分","坐标采集得分","#cspan","#cspan","坐标采集得分","月得分"},
	 	{"#rspan","实有地市数量","符合要求地市数量","应上联监控数","实际上联监控数","联网系数","联网指标","在线数","检测总数","实测在线率","检测合格数","检测总数","完好率","#rspan","GIS采集数","实际上联监控数","GIS采集率","#rspan","#rspan"}
	};
	/**
	 * 每次巡检报表导出表头 
	 */
	public static String[][] DETAILHEADERS = new String[][]{
		{"地市","联网率","#cspan","在线率","#cspan","完好率","#cspan","GIS采集率","#cspan","图像平台质量","#cspan","#cspan","#cspan","#cspan","#cspan","坐标采集","单次巡检得分"},
		{"#rspan","应上联监控数","实际上联监控数","实测在线数","实测巡检总数","检测合格数","检测总数","GIS采集数","实际上联监控数","实有地市数","符合要求地市数量","联网系数","联网指标","在线率","完好率","GIS采集率","#rspan"}
	};
	
	/**
	 * 实时巡检导出表头
	 */
	public static String [] REALREPORTHEADERS = new String[]{"一级目录","二级目录","三级目录","四级目录","五级目录","摄像机国标ID","摄像机名称","状态","开始时间","结束时间"};

	/**
	 * 配置巡检计划导出巡检结果表头
	 */
	public static String[] TASKPLANREPORTHEADERS = new String[]{"摄像机名称", "所属组织", "巡检人", "巡检时间", "在线/离线", "巡检结果", "备注信息"};
	
	/**
	 * 地图配置模板导出
	 */
	public static String[] MAP_CONFIG_HEADER = new String[]{"摄像机名称", "AV通道号", "经度", "纬度", "可视角度"};

	
	/**
	 * 巡检记录详情
	 */
	public static String[]  INSPECTRECORDHEADERS1 = new String[]{"开始时间","结束时间","在线数","离线数","完好数","故障数","摄像机总数"};
//	public static String[]  INSPECTRECORDHEADERS2 = new String[]{"组织结构","摄像机通道号","摄像机名称","摄像机状态","图像质量"};
	public static String[]  INSPECTRECORDHEADERS2 = new String[]{"组织结构","摄像机通道号","摄像机名称","图像质量"};


	
	/**
	 * 应建摄像机模板导出
	 */
	public static String[] CITY_COVER_CONFIG_HEADER = new String[]{"市级行区划名称", "下辖地区名称", "应建摄像机数"};
	/**
	 * 摄像机建设数据导出
	 */
	public static String[] CITY_COVER_BUILD_CONFIG_HEADER = new String[]{"行政区", "已建摄像机", "应建摄像机","占比"};

}
