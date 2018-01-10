/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50628
Source Host           : localhost:3306
Source Database       : lvsen

Target Server Type    : MYSQL
Target Server Version : 50628
File Encoding         : 65001

Date: 2018-01-10 10:29:14
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
-- Table structure for sys_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `menu_name` varchar(20) DEFAULT '',
  `menu_order` int(8) DEFAULT NULL COMMENT '菜单顺序，按升序方式展示',
  `parent_id` int(11) DEFAULT NULL COMMENT '父菜单ID，顶级菜单默认0',
  `menu_code` varchar(16) DEFAULT NULL COMMENT '菜单权限码',
  `menu_url` varchar(50) DEFAULT NULL COMMENT '菜单链接地址，父菜单URL为空',
  `menu_status` tinyint(1) DEFAULT NULL COMMENT '菜单状态0-禁用，1-启用',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of sys_menu
-- ----------------------------
INSERT INTO `sys_menu` VALUES ('1', '单据管理', '1', '0', null, null, '1');
INSERT INTO `sys_menu` VALUES ('2', '配置管理', '2', '0', null, null, null);
INSERT INTO `sys_menu` VALUES ('3', null, null, null, null, null, null);

-- ----------------------------
-- Table structure for sys_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(20) DEFAULT NULL COMMENT '角色名称',
  `role_code` varchar(20) DEFAULT NULL COMMENT '角色代号',
  `role_status` tinyint(1) DEFAULT NULL COMMENT '状态:0-禁用，1-启用',
  `remark` varchar(200) DEFAULT NULL COMMENT '备注信息',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of sys_role
-- ----------------------------

-- ----------------------------
-- Table structure for sys_role_privilege
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_privilege`;
CREATE TABLE `sys_role_privilege` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) DEFAULT NULL COMMENT '角色ID',
  `menu_id` int(11) DEFAULT NULL COMMENT '权限ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of sys_role_privilege
-- ----------------------------

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account` varchar(20) DEFAULT '' COMMENT '用户帐号',
  `password` varchar(36) DEFAULT '' COMMENT '登录密码',
  `name` varchar(20) DEFAULT NULL,
  `pinyin` varchar(36) DEFAULT '' COMMENT '姓名拼音',
  `acronym` varchar(10) DEFAULT '' COMMENT '姓名缩写',
  `sex` tinyint(1) DEFAULT NULL COMMENT '性别 1-男，2-女',
  `phone` varchar(20) DEFAULT '' COMMENT '联系电话',
  `birthday` varchar(20) DEFAULT NULL,
  `score` int(8) DEFAULT NULL COMMENT '权限分值',
  `job_desc` varchar(64) DEFAULT '' COMMENT '职位描述',
  `phone2` varchar(20) DEFAULT '',
  `department` varchar(20) DEFAULT '' COMMENT '所属部门',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态，0-禁用，1-启用',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COMMENT='用户信息';

-- ----------------------------
-- Records of sys_user
-- ----------------------------
INSERT INTO `sys_user` VALUES ('1', 'admin', '0192023a7bbd73250516f069df18b500', '管理员', 'chaojiguanliyuan', 'cjgly', null, '', null, '100', '超级管理员', '', '', '1');

-- ----------------------------
-- Table structure for sys_user_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE `sys_user_role` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of sys_user_role
-- ----------------------------

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
