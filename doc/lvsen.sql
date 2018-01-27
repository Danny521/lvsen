/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50628
Source Host           : localhost:3306
Source Database       : lvsen_fast

Target Server Type    : MYSQL
Target Server Version : 50628
File Encoding         : 65001

Date: 2018-01-26 17:51:39
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for bills
-- ----------------------------
DROP TABLE IF EXISTS `bills`;
CREATE TABLE `bills` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) DEFAULT NULL COMMENT '客户ID',
  `order_id` bigint(20) DEFAULT NULL COMMENT '单据ID',
  `payable_amount` float(20,0) DEFAULT NULL COMMENT '账单应付金额',
  `paid_amount` float(20,0) DEFAULT NULL COMMENT '已结算金额',
  `status` tinyint(1) DEFAULT '0' COMMENT '结算状态，0-未完成，1-已完成',
  `create_time` datetime DEFAULT NULL COMMENT '账单生成时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of bills
-- ----------------------------

-- ----------------------------
-- Table structure for client
-- ----------------------------
DROP TABLE IF EXISTS `client`;
CREATE TABLE `client` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_number` varchar(32) DEFAULT '' COMMENT '客户编号',
  `category_id` int(8) DEFAULT NULL COMMENT '客户种类ID(如:超市,网吧等)',
  `name` varchar(32) DEFAULT '',
  `pinyin` varchar(64) DEFAULT NULL,
  `acronym` varchar(16) DEFAULT NULL,
  `address` varchar(64) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `phone2` varchar(20) DEFAULT NULL,
  `type` varchar(8) DEFAULT '' COMMENT '客户范畴(1-供货商，2-营销商)',
  `remark` varchar(200) DEFAULT NULL COMMENT '备注信息',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='客户信息';

-- ----------------------------
-- Records of client
-- ----------------------------

-- ----------------------------
-- Table structure for client_category
-- ----------------------------
DROP TABLE IF EXISTS `client_category`;
CREATE TABLE `client_category` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(16) DEFAULT NULL COMMENT '客户种类名称(如:超市,网吧等)',
  `status` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of client_category
-- ----------------------------

-- ----------------------------
-- Table structure for goods
-- ----------------------------
DROP TABLE IF EXISTS `goods`;
CREATE TABLE `goods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lvsen_code` varchar(32) NOT NULL DEFAULT '' COMMENT '商品绿森编号',
  `name` varchar(64) NOT NULL DEFAULT '',
  `alias` varchar(30) DEFAULT NULL COMMENT '商品别名',
  `pinyin` varchar(100) DEFAULT NULL,
  `acronym` varchar(20) DEFAULT NULL,
  `alias_pinyin` varchar(60) DEFAULT NULL,
  `alias_acronym` varchar(10) DEFAULT NULL,
  `category_id` int(8) DEFAULT NULL COMMENT '商品类别',
  `specification` varchar(32) DEFAULT '' COMMENT '商品规格（例如:1x4x25）',
  `store_position_number` varchar(20) DEFAULT '' COMMENT '库位编号',
  `status` int(4) DEFAULT '1' COMMENT '状态 1:启用，0:禁用',
  `ext` varchar(200) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='商品信息';

-- ----------------------------
-- Records of goods
-- ----------------------------

-- ----------------------------
-- Table structure for goods_bar_code
-- ----------------------------
DROP TABLE IF EXISTS `goods_bar_code`;
CREATE TABLE `goods_bar_code` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `goods_id` int(11) DEFAULT NULL COMMENT '商品ID',
  `bar_code` varchar(30) DEFAULT '' COMMENT '条形码编号',
  `goods_unit_id` int(8) DEFAULT NULL COMMENT '单商品位ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of goods_bar_code
-- ----------------------------

-- ----------------------------
-- Table structure for goods_category
-- ----------------------------
DROP TABLE IF EXISTS `goods_category`;
CREATE TABLE `goods_category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT NULL,
  `pinyin` varchar(50) DEFAULT NULL,
  `acronym` varchar(10) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `sort` int(8) DEFAULT NULL COMMENT '排序',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态: 1-启用，0-禁用',
  `remark` varchar(200) DEFAULT '' COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of goods_category
-- ----------------------------

-- ----------------------------
-- Table structure for goods_unit
-- ----------------------------
DROP TABLE IF EXISTS `goods_unit`;
CREATE TABLE `goods_unit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `goods_id` int(11) DEFAULT NULL COMMENT '商品ID',
  `is_scan` tinyint(1) DEFAULT NULL COMMENT '是否需要扫描(0-不需要，1-需要)',
  `client_category_id` int(11) DEFAULT NULL COMMENT '客户种类ID',
  `unit_level` int(4) DEFAULT NULL COMMENT '单位级别(1为最小单位，数字越大单位内的最小单位数量越多）',
  `unit_name` int(8) DEFAULT NULL COMMENT '单位名称',
  `capacity` int(8) DEFAULT NULL COMMENT '单位关系',
  `is_min_unit` tinyint(1) DEFAULT NULL COMMENT '是否是最小单位',
  `min_price` float(10,0) DEFAULT NULL COMMENT '商品价格',
  `sale_price` float(10,0) DEFAULT NULL COMMENT '销售价格',
  `weight` float(10,0) DEFAULT NULL COMMENT '单位商品重量(计量单位为kg）',
  `volume` float(10,0) DEFAULT NULL COMMENT '单位商品体积(计量单位为立方米）',
  `status` tinyint(1) DEFAULT NULL COMMENT '状态(0-禁用,1-启用)',
  `remark` varchar(200) DEFAULT NULL COMMENT '备注信息',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of goods_unit
-- ----------------------------

-- ----------------------------
-- Table structure for latest_purchasing_price
-- ----------------------------
DROP TABLE IF EXISTS `latest_purchasing_price`;
CREATE TABLE `latest_purchasing_price` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `client_id` int(20) DEFAULT NULL,
  `client_type` varchar(10) DEFAULT NULL,
  `goods_id` int(20) DEFAULT NULL,
  `price` float(10,0) DEFAULT NULL COMMENT '商品单价',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='客户的商品价格信息';

-- ----------------------------
-- Records of latest_purchasing_price
-- ----------------------------

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `lvsen_code` varchar(32) DEFAULT '' COMMENT '单据绿森编号',
  `client_id` int(11) DEFAULT NULL COMMENT '客户ID',
  `create_user_id` int(11) DEFAULT NULL COMMENT '制单人ID',
  `way_id` int(8) DEFAULT NULL COMMENT '订单来源途径',
  `create_date` datetime DEFAULT NULL COMMENT '创建日期',
  `delivery_date` datetime DEFAULT NULL COMMENT '交货日期',
  `handle_date` datetime DEFAULT NULL COMMENT '处理日期',
  `check_user_id` int(11) DEFAULT NULL COMMENT '过账人',
  `category_id` int(8) DEFAULT NULL COMMENT '单据类型(1-销售订单,2-销售退货,3-进货订单,4-进货退货,5-出库单,6-入库单)',
  `handle_user_id` int(11) DEFAULT NULL COMMENT '处理人ID',
  `discount` float(8,0) DEFAULT NULL COMMENT '折扣',
  `digest` varchar(50) DEFAULT NULL COMMENT '摘要信息',
  `storage_id` int(11) DEFAULT NULL COMMENT '仓库ID',
  `total_money` float(20,0) DEFAULT NULL COMMENT '单据总额',
  `paid_money` float(20,0) DEFAULT NULL COMMENT '已付金额',
  `is_changed` tinyint(1) DEFAULT NULL COMMENT '是否进行过修改0-未修改,1-被修改过',
  `print_count` int(8) DEFAULT '1' COMMENT '打印次数',
  `bar_code` varchar(30) DEFAULT '' COMMENT '条形码编号',
  `pay_status` tinyint(1) DEFAULT NULL COMMENT '结算状态，0-未完成，1-已完成',
  `remark` varchar(100) DEFAULT '' COMMENT '备注信息',
  `ext` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='历史单据记录表';

-- ----------------------------
-- Records of orders
-- ----------------------------

-- ----------------------------
-- Table structure for order_category
-- ----------------------------
DROP TABLE IF EXISTS `order_category`;
CREATE TABLE `order_category` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `name` varchar(10) DEFAULT '',
  `pinyin` varchar(40) DEFAULT NULL,
  `acronym` varchar(10) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of order_category
-- ----------------------------

-- ----------------------------
-- Table structure for order_goods
-- ----------------------------
DROP TABLE IF EXISTS `order_goods`;
CREATE TABLE `order_goods` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) DEFAULT NULL,
  `goods_id` int(11) DEFAULT NULL,
  `sort` int(8) DEFAULT NULL COMMENT '排序',
  `goods_unit_id` int(11) DEFAULT NULL COMMENT '商品单位ID',
  `spec` varchar(20) DEFAULT '' COMMENT '规格',
  `total_number` int(11) DEFAULT '0' COMMENT '单据预期数量',
  `real_number` int(11) DEFAULT NULL COMMENT '实际数量',
  `unit_tranfer` varchar(32) DEFAULT '' COMMENT '单位换算',
  `discount` float(10,0) DEFAULT NULL COMMENT '折扣',
  `sum` float(20,0) DEFAULT '0' COMMENT '金额',
  `discount_price` float(20,0) DEFAULT '0' COMMENT '折后价格',
  `discount_sum` float(20,0) DEFAULT '0' COMMENT '折后金额',
  `is_largess` varchar(20) DEFAULT '' COMMENT '是否为赠品：1-是,0-不是',
  `storage_id` varchar(255) DEFAULT NULL,
  `remark` varchar(50) DEFAULT '' COMMENT '备注信息',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of order_goods
-- ----------------------------

-- ----------------------------
-- Table structure for order_way
-- ----------------------------
DROP TABLE IF EXISTS `order_way`;
CREATE TABLE `order_way` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `name` varchar(16) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of order_way
-- ----------------------------

-- ----------------------------
-- Table structure for repertory
-- ----------------------------
DROP TABLE IF EXISTS `repertory`;
CREATE TABLE `repertory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `goods_id` int(11) NOT NULL,
  `category` int(11) NOT NULL COMMENT '种类',
  `total_num` int(11) NOT NULL COMMENT '库存量',
  `cost_price` float(10,0) NOT NULL COMMENT '成本价--(库存金额除以库存量)',
  `money` float(20,0) NOT NULL COMMENT '库存金额',
  `sort` int(11) DEFAULT NULL COMMENT '排序',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='库存状况';

-- ----------------------------
-- Records of repertory
-- ----------------------------

-- ----------------------------
-- Table structure for store_position
-- ----------------------------
DROP TABLE IF EXISTS `store_position`;
CREATE TABLE `store_position` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `position_number` varchar(32) DEFAULT '' COMMENT '库位编号',
  `warehouse_id` int(11) DEFAULT NULL COMMENT '仓库ID',
  `area` varchar(4) DEFAULT '' COMMENT '区域编号',
  `row` int(4) DEFAULT NULL COMMENT '区域的行号',
  `layer` int(4) DEFAULT NULL COMMENT '层号',
  `place` int(8) DEFAULT '0' COMMENT '一层的位置',
  `status` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='仓库划分';

-- ----------------------------
-- Records of store_position
-- ----------------------------

-- ----------------------------
-- Table structure for sys_config
-- ----------------------------
DROP TABLE IF EXISTS `sys_config`;
CREATE TABLE `sys_config` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `key` varchar(50) DEFAULT NULL COMMENT 'key',
  `value` varchar(2000) DEFAULT NULL COMMENT 'value',
  `status` tinyint(4) DEFAULT '1' COMMENT '状态   0：隐藏   1：显示',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COMMENT='系统配置信息表';

-- ----------------------------
-- Records of sys_config
-- ----------------------------
INSERT INTO `sys_config` VALUES ('1', 'CLOUD_STORAGE_CONFIG_KEY', '{\"aliyunAccessKeyId\":\"\",\"aliyunAccessKeySecret\":\"\",\"aliyunBucketName\":\"\",\"aliyunDomain\":\"\",\"aliyunEndPoint\":\"\",\"aliyunPrefix\":\"\",\"qcloudBucketName\":\"\",\"qcloudDomain\":\"\",\"qcloudPrefix\":\"\",\"qcloudSecretId\":\"\",\"qcloudSecretKey\":\"\",\"qiniuAccessKey\":\"NrgMfABZxWLo5B-YYSjoE8-AZ1EISdi1Z3ubLOeZ\",\"qiniuBucketName\":\"ios-app\",\"qiniuDomain\":\"http://7xqbwh.dl1.z0.glb.clouddn.com\",\"qiniuPrefix\":\"upload\",\"qiniuSecretKey\":\"uIwJHevMRWU0VLxFvgy0tAcOdGqasdtVlJkdy6vV\",\"type\":1}', '0', '云存储配置信息');

-- ----------------------------
-- Table structure for sys_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_log`;
CREATE TABLE `sys_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL COMMENT '用户名',
  `operation` varchar(50) DEFAULT NULL COMMENT '用户操作',
  `method` varchar(200) DEFAULT NULL COMMENT '请求方法',
  `params` varchar(5000) DEFAULT NULL COMMENT '请求参数',
  `time` bigint(20) NOT NULL COMMENT '执行时长(毫秒)',
  `ip` varchar(64) DEFAULT NULL COMMENT 'IP地址',
  `create_date` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='系统日志';

-- ----------------------------
-- Records of sys_log
-- ----------------------------

-- ----------------------------
-- Table structure for sys_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu` (
  `menu_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `parent_id` bigint(20) DEFAULT NULL COMMENT '父菜单ID，一级菜单为0',
  `name` varchar(50) DEFAULT NULL COMMENT '菜单名称',
  `menu_name` varchar(20) DEFAULT NULL,
  `url` varchar(200) DEFAULT NULL COMMENT '菜单URL',
  `perms` varchar(500) DEFAULT NULL COMMENT '授权(多个用逗号分隔，如：user:list,user:create)',
  `type` int(11) DEFAULT NULL COMMENT '类型   0：目录   1：菜单   2：按钮',
  `icon` varchar(50) DEFAULT NULL COMMENT '菜单图标',
  `order_num` int(11) DEFAULT NULL COMMENT '排序',
  `status` tinyint(1) DEFAULT NULL COMMENT '状态(0-禁用,1-启用)',
  PRIMARY KEY (`menu_id`)
) ENGINE=InnoDB AUTO_INCREMENT=666 DEFAULT CHARSET=utf8 COMMENT='菜单管理';

-- ----------------------------
-- Records of sys_menu
-- ----------------------------
INSERT INTO `sys_menu` VALUES ('1', '0', '系统管理', 'sys', null, null, '0', 'fa fa-cog', '0', '1');
INSERT INTO `sys_menu` VALUES ('2', '1', '进货', 'purchase', 'modules/purchase/order', null, '1', 'fa fa-user', '1', '1');
INSERT INTO `sys_menu` VALUES ('3', '1', '销售', 'sale', 'modules/sale/order', null, '1', 'fa fa-user-secret', '2', '1');
INSERT INTO `sys_menu` VALUES ('4', '1', '库存', 'inventory', 'modules/inventory/goodslist', null, '1', 'fa fa-th-list', '3', '1');
INSERT INTO `sys_menu` VALUES ('5', '1', '统计', 'statistics', 'modules/statistics/bill_history', null, '1', 'fa fa-bug', '4', '1');
INSERT INTO `sys_menu` VALUES ('6', '1', '配置', 'config', 'modules/sys/user', null, '1', 'fa fa-tasks', '5', '1');
INSERT INTO `sys_menu` VALUES ('7', '1', '账目', 'accounts', 'modules/accounts', '', '1', null, '6', '1');
INSERT INTO `sys_menu` VALUES ('8', '1', '文件上传', 'file', 'modules/oss/oss', 'sys:oss:all', '1', 'fa fa-file-image-o', '6', '0');
INSERT INTO `sys_menu` VALUES ('9', '1', '参数管理', 'paramMgr', 'modules/sys/param_mgr', 'sys:config:list,sys:config:info,sys:config:save,sys:config:update,sys:config:delete', '1', 'fa fa-sun-o', '7', '0');
INSERT INTO `sys_menu` VALUES ('21', '2', '进货订单', 'purchaseOrder', 'modules/purchase/order', '', '1', null, '1', '1');
INSERT INTO `sys_menu` VALUES ('22', '2', '入库单', 'storeOrder', 'modules/purchase/store', '', '1', null, '2', '1');
INSERT INTO `sys_menu` VALUES ('23', '2', '进货退货单', 'purchaseReturnOrder', 'modules/purchase/return', '', '1', null, '3', '1');
INSERT INTO `sys_menu` VALUES ('24', '2', '上传订单', 'uploadOrder', 'modules/purchase/upload', 'purchase:save,purchase:select', '1', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('31', '3', '销售订单', 'saleOrder', 'modules/sale/order', null, '1', null, '1', '1');
INSERT INTO `sys_menu` VALUES ('32', '3', '出库单', 'deliveryOrder', 'modules/sale/delivery', null, '1', null, '2', '1');
INSERT INTO `sys_menu` VALUES ('33', '3', '销售退货单', 'saleReturnOrder', 'modules/sale/return', null, '1', null, '3', '1');
INSERT INTO `sys_menu` VALUES ('41', '4', '商品列表', 'goodsList', 'modules/inventory/goodslist', null, '1', null, '1', '1');
INSERT INTO `sys_menu` VALUES ('51', '5', '历史单据', 'billHistory', 'modules/statistics/bill_history', null, '1', null, '1', '1');
INSERT INTO `sys_menu` VALUES ('52', '6', '日志管理', 'logMgr', 'modules/statistics/log', 'sys:log:list', '1', 'fa fa-file-text-o', '2', '1');
INSERT INTO `sys_menu` VALUES ('61', '6', '用户管理', 'userMgr', 'modules/sys/user', null, '1', null, '1', '1');
INSERT INTO `sys_menu` VALUES ('62', '6', '角色管理', 'roleMgr', 'modules/sys/role', null, '1', null, '2', '1');
INSERT INTO `sys_menu` VALUES ('63', '6', '部门管理', 'departMgr', 'modules/sys/depart', null, '1', 'fa fa-file-code-o', '3', '0');
INSERT INTO `sys_menu` VALUES ('64', '6', '菜单管理', 'menuMgr', 'modules/sys/menu', null, '1', null, '4', '1');
INSERT INTO `sys_menu` VALUES ('65', '6', '仓库管理', 'warehouseMgr', 'modules/sys/warehouse', null, '1', null, '5', '1');
INSERT INTO `sys_menu` VALUES ('66', '6', '商品管理', 'goodsMgr', 'modules/sys/goods', null, '1', null, '6', '1');
INSERT INTO `sys_menu` VALUES ('611', '61', '查看', null, null, 'sys:user:list,sys:user:info', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('612', '61', '新增', null, null, 'sys:user:save,sys:role:select', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('613', '61', '修改', null, null, 'sys:user:update,sys:role:select', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('614', '61', '删除', null, null, 'sys:user:delete', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('621', '62', '查看', null, null, 'sys:role:list,sys:role:info', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('622', '62', '新增', null, null, 'sys:role:save,sys:menu:perms', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('623', '62', '修改', null, null, 'sys:role:update,sys:menu:perms', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('624', '62', '删除', null, null, 'sys:role:delete', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('631', '63', '查看', null, null, 'sys:dept:list,sys:dept:info', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('632', '63', '新增', null, null, 'sys:dept:save,sys:dept:select', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('633', '63', '修改', null, null, 'sys:dept:update,sys:dept:select', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('634', '63', '删除', null, null, 'sys:dept:delete', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('641', '64', '查看', null, null, 'sys:menu:list,sys:menu:info', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('642', '64', '新增', null, null, 'sys:menu:save,sys:menu:select', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('643', '64', '修改', null, null, 'sys:menu:update,sys:menu:select', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('644', '64', '删除', null, null, 'sys:menu:delete', '2', null, '0', '1');
INSERT INTO `sys_menu` VALUES ('661', '66', '查看', null, null, 'sys:goods:list,sys:goods:info', '2', null, '1', '1');
INSERT INTO `sys_menu` VALUES ('662', '66', '新增', null, null, 'sys:goods:save,sys:goods:select', '2', null, '2', '1');
INSERT INTO `sys_menu` VALUES ('663', '66', '修改', null, null, 'sys:goods:update,sys:goods:select', '2', null, '3', '1');
INSERT INTO `sys_menu` VALUES ('664', '66', '删除', null, null, 'sys:goods:delete', '2', null, '4', '1');
INSERT INTO `sys_menu` VALUES ('665', '66', '设置最低价格', null, null, 'sys:goods:min_price', '2', null, '5', '1');

-- ----------------------------
-- Table structure for sys_oss
-- ----------------------------
DROP TABLE IF EXISTS `sys_oss`;
CREATE TABLE `sys_oss` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `url` varchar(200) DEFAULT NULL COMMENT 'URL地址',
  `create_date` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='文件上传';

-- ----------------------------
-- Records of sys_oss
-- ----------------------------

-- ----------------------------
-- Table structure for sys_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
  `role_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(100) DEFAULT NULL COMMENT '角色名称',
  `remark` varchar(100) DEFAULT NULL COMMENT '备注',
  `create_user_id` bigint(20) DEFAULT NULL COMMENT '创建者ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COMMENT='角色';

-- ----------------------------
-- Records of sys_role
-- ----------------------------
INSERT INTO `sys_role` VALUES ('1', 'manager', '', '1', '2018-01-25 17:51:48');

-- ----------------------------
-- Table structure for sys_role_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_menu`;
CREATE TABLE `sys_role_menu` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `role_id` bigint(20) DEFAULT NULL COMMENT '角色ID',
  `menu_id` bigint(20) DEFAULT NULL COMMENT '菜单ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COMMENT='角色与菜单对应关系';

-- ----------------------------
-- Records of sys_role_menu
-- ----------------------------
INSERT INTO `sys_role_menu` VALUES ('1', '1', '1');

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `user_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `account` varchar(20) DEFAULT '' COMMENT '用户帐号',
  `username` varchar(50) DEFAULT NULL COMMENT '用户名',
  `password` varchar(100) DEFAULT NULL COMMENT '密码',
  `pinyin` varchar(50) DEFAULT NULL,
  `acronym` varchar(20) DEFAULT NULL,
  `salt` varchar(20) DEFAULT NULL COMMENT '盐',
  `email` varchar(30) DEFAULT NULL COMMENT '邮箱',
  `mobile` varchar(20) DEFAULT NULL COMMENT '手机号',
  `status` tinyint(4) DEFAULT NULL COMMENT '状态  0：禁用   1：正常',
  `sex` int(4) DEFAULT NULL COMMENT '性别:1-男，2-女',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COMMENT='系统用户';

-- ----------------------------
-- Records of sys_user
-- ----------------------------
INSERT INTO `sys_user` VALUES ('1', 'admin', 'admin', '0192023a7bbd73250516f069df18b500', 'admin', 'admin', '', 'ceozhangtao@qq.com', '13891884094', '1', '1', '2016-11-11 11:11:11');
INSERT INTO `sys_user` VALUES ('2', 'test', 'test', '0192023a7bbd73250516f069df18b500', '', '', null, 'ceozhangtao@qq.com', '13891884094', '1', '1', '2018-01-25 17:53:55');

-- ----------------------------
-- Table structure for sys_user_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE `sys_user_role` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL COMMENT '用户ID',
  `role_id` bigint(20) DEFAULT NULL COMMENT '角色ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COMMENT='用户与角色对应关系';

-- ----------------------------
-- Records of sys_user_role
-- ----------------------------
INSERT INTO `sys_user_role` VALUES ('1', '1', '1');

-- ----------------------------
-- Table structure for sys_user_token
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_token`;
CREATE TABLE `sys_user_token` (
  `user_id` bigint(20) NOT NULL,
  `token` varchar(100) NOT NULL COMMENT 'token',
  `expire_time` datetime DEFAULT NULL COMMENT '过期时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='系统用户Token';

-- ----------------------------
-- Records of sys_user_token
-- ----------------------------
INSERT INTO `sys_user_token` VALUES ('1', '230a09da1b413658d55d8bc4807f0b97', '2018-01-27 05:38:17', '2018-01-26 17:38:17');

-- ----------------------------
-- Table structure for tb_user
-- ----------------------------
DROP TABLE IF EXISTS `tb_user`;
CREATE TABLE `tb_user` (
  `user_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `mobile` varchar(20) NOT NULL COMMENT '手机号',
  `password` varchar(64) DEFAULT NULL COMMENT '密码',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COMMENT='用户';

-- ----------------------------
-- Records of tb_user
-- ----------------------------
INSERT INTO `tb_user` VALUES ('1', 'mark', '13612345678', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '2017-03-23 22:37:41');

-- ----------------------------
-- Table structure for warehouse
-- ----------------------------
DROP TABLE IF EXISTS `warehouse`;
CREATE TABLE `warehouse` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT '',
  `pinyin` varchar(64) DEFAULT NULL,
  `acronym` varchar(10) DEFAULT '' COMMENT '仓库名称缩写',
  `address` varchar(100) DEFAULT NULL,
  `manager` varchar(20) DEFAULT '' COMMENT '仓库管理员',
  `status` int(4) DEFAULT '1' COMMENT '状态 1:可用，0:禁用',
  `capacity` varchar(20) DEFAULT NULL,
  `remark` varchar(200) DEFAULT NULL COMMENT '备注信息',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='仓库信息';

-- ----------------------------
-- Records of warehouse
-- ----------------------------
