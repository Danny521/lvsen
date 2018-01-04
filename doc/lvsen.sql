/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50628
Source Host           : localhost:3306
Source Database       : lvsen

Target Server Type    : MYSQL
Target Server Version : 50628
File Encoding         : 65001

Date: 2018-01-04 18:58:21
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
  `client_number` varchar(32) DEFAULT '',
  `category` int(8) DEFAULT NULL COMMENT '客户种类',
  `name` varchar(32) DEFAULT '',
  `pinyin` varchar(64) DEFAULT NULL,
  `acronym` varchar(16) DEFAULT NULL,
  `address` varchar(64) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `phone2` varchar(20) DEFAULT NULL,
  `type` varchar(8) DEFAULT '' COMMENT '客户类型(供货商，营销商)',
  `default_price_category` int(8) DEFAULT NULL COMMENT '默认的销售适用价格',
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
  `name` varchar(16) DEFAULT NULL,
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
  `goods_number` varchar(32) NOT NULL DEFAULT '' COMMENT '商品编号',
  `name` varchar(64) NOT NULL DEFAULT '',
  `pinyin` varchar(100) DEFAULT NULL,
  `acronym` varchar(20) DEFAULT NULL,
  `category_id` int(8) DEFAULT NULL,
  `specification` varchar(32) DEFAULT '' COMMENT '商品规格（例如:1x4x25）',
  `status` int(4) DEFAULT '1' COMMENT '状态 1:启用，0:禁用',
  `min_price` float(20,0) DEFAULT NULL COMMENT '最低价格',
  `capacity` int(11) DEFAULT NULL,
  `mini_unit` varchar(10) DEFAULT '' COMMENT '最小单位名称',
  `default_unit_id` int(11) DEFAULT NULL COMMENT '默认交易单位',
  `storage_partition_number` varchar(20) DEFAULT '' COMMENT '库位编号',
  `is_scan` tinyint(1) DEFAULT '1' COMMENT '是否需要扫码',
  `single_code` varchar(36) DEFAULT '' COMMENT '商系条形码编号',
  `weight` float(10,0) DEFAULT NULL COMMENT '重量，单位是千克',
  `volume` float(10,0) DEFAULT NULL COMMENT '体积，单位为立方米',
  `ext` varchar(200) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='商品信息';

-- ----------------------------
-- Records of goods
-- ----------------------------

-- ----------------------------
-- Table structure for goods_assist_unit
-- ----------------------------
DROP TABLE IF EXISTS `goods_assist_unit`;
CREATE TABLE `goods_assist_unit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `goods_id` int(11) DEFAULT NULL,
  `assist_unit` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of goods_assist_unit
-- ----------------------------

-- ----------------------------
-- Table structure for goods_bar_code
-- ----------------------------
DROP TABLE IF EXISTS `goods_bar_code`;
CREATE TABLE `goods_bar_code` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `goods_id` int(11) DEFAULT NULL,
  `code` varchar(30) DEFAULT NULL,
  `uint_id` int(8) DEFAULT NULL COMMENT '单位ID',
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
  `status` tinyint(1) DEFAULT '1' COMMENT '状态: 1-启用，0-禁用',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of goods_category
-- ----------------------------

-- ----------------------------
-- Table structure for goods_price_catetory
-- ----------------------------
DROP TABLE IF EXISTS `goods_price_catetory`;
CREATE TABLE `goods_price_catetory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `goods_id` int(11) DEFAULT NULL,
  `price_category` int(11) DEFAULT NULL,
  `price` float(16,0) DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of goods_price_catetory
-- ----------------------------

-- ----------------------------
-- Table structure for goods_unit_transfer
-- ----------------------------
DROP TABLE IF EXISTS `goods_unit_transfer`;
CREATE TABLE `goods_unit_transfer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `goods_id` int(11) DEFAULT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL COMMENT 'xx个/单位(对应每单位的数量)',
  `transform` varchar(50) DEFAULT '' COMMENT '单位容量换算(例如:1箱=10大袋=100袋)',
  `serial_number` varchar(32) DEFAULT '' COMMENT '对应单位商品的条码序列号',
  `retail_price` float(8,0) DEFAULT NULL COMMENT '零售价格',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of goods_unit_transfer
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
  `number` varchar(32) DEFAULT '' COMMENT '单据编号',
  `code` varchar(30) DEFAULT NULL COMMENT '条形码编号',
  `create_user_id` int(11) DEFAULT NULL COMMENT '制单人ID',
  `way_id` int(8) DEFAULT NULL COMMENT '订单来源途径',
  `create_date` datetime DEFAULT NULL COMMENT '创建日期',
  `delivery_date` datetime DEFAULT NULL COMMENT '交货日期',
  `handle_date` datetime DEFAULT NULL COMMENT '处理日期',
  `check_user_id` int(11) DEFAULT NULL COMMENT '过账人',
  `category_id` int(8) DEFAULT NULL COMMENT '单据类型(1-销售订单,2-销售退货,3-进货订单,4-进货退货,5-出库单,6-入库单)',
  `client_id` int(11) DEFAULT NULL COMMENT '客户ID',
  `handle_user_id` int(11) DEFAULT NULL COMMENT '处理人ID',
  `discount` float(8,0) DEFAULT NULL COMMENT '折扣',
  `digest` varchar(50) DEFAULT '' COMMENT '摘要信息',
  `storage_id` int(11) DEFAULT NULL,
  `remark` varchar(100) DEFAULT '' COMMENT '备注信息',
  `total_money` float(20,0) DEFAULT NULL COMMENT '单据总额',
  `paid_money` float(20,0) DEFAULT NULL COMMENT '已付金额',
  `is_changed` tinyint(1) DEFAULT '0' COMMENT '是否进行过修改0-未修改,1-被修改过',
  `print_count` int(8) DEFAULT '1' COMMENT '打印次数',
  `pay_status` tinyint(1) DEFAULT NULL COMMENT '结算状态，0-未完成，1-已完成',
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
  `unit_id` int(11) DEFAULT NULL COMMENT '单位ID',
  `spec` varchar(20) DEFAULT '' COMMENT '规格',
  `total_number` int(11) DEFAULT '0' COMMENT '单据预期数量',
  `real_number` int(11) DEFAULT NULL COMMENT '实际数量',
  `unit_tranfer` varchar(32) DEFAULT '' COMMENT '单位换算',
  `price` float(20,0) DEFAULT '0' COMMENT '价格',
  `discount` float(10,0) DEFAULT NULL COMMENT '折扣',
  `sum` float(20,0) DEFAULT '0' COMMENT '金额',
  `discount_price` float(20,0) DEFAULT '0' COMMENT '折后价格',
  `discount_sum` float(20,0) DEFAULT '0' COMMENT '折后金额',
  `is_largess` varchar(20) DEFAULT '' COMMENT '是否为赠品：1-是,0-不是',
  `storage_id` varchar(255) DEFAULT NULL,
  `comment` varchar(50) DEFAULT '' COMMENT '备注信息',
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='库存状况';

-- ----------------------------
-- Records of repertory
-- ----------------------------

-- ----------------------------
-- Table structure for storage
-- ----------------------------
DROP TABLE IF EXISTS `storage`;
CREATE TABLE `storage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) DEFAULT '',
  `pinyin` varchar(64) DEFAULT NULL,
  `acronym` varchar(10) DEFAULT '' COMMENT '仓库名称缩写',
  `address` varchar(100) DEFAULT NULL,
  `manager` varchar(20) DEFAULT '' COMMENT '仓库管理员',
  `status` int(4) DEFAULT '1' COMMENT '状态 1:可用，0:禁用',
  `capacity` varchar(20) DEFAULT NULL,
  `area_number` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='仓库信息';

-- ----------------------------
-- Records of storage
-- ----------------------------

-- ----------------------------
-- Table structure for storage_partition
-- ----------------------------
DROP TABLE IF EXISTS `storage_partition`;
CREATE TABLE `storage_partition` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partition_number` varchar(32) DEFAULT '' COMMENT '库位编号',
  `storage_id` int(11) DEFAULT NULL COMMENT '仓库ID',
  `area` varchar(4) DEFAULT '' COMMENT '区域编号',
  `row` int(4) DEFAULT NULL COMMENT '区域的行号',
  `layer` int(4) DEFAULT NULL COMMENT '层号',
  `place` int(8) DEFAULT '0' COMMENT '一层的位置',
  `status` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='仓库划分';

-- ----------------------------
-- Records of storage_partition
-- ----------------------------

-- ----------------------------
-- Table structure for sys_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `menu_code` varchar(16) DEFAULT NULL COMMENT '菜单权限码',
  `menu_name` varchar(20) DEFAULT NULL,
  `menu_order` int(8) DEFAULT NULL COMMENT '菜单顺序，按升序方式展示',
  `parent_id` int(11) DEFAULT NULL COMMENT '父菜单ID，顶级菜单默认-1',
  `menu_url` varchar(50) DEFAULT NULL COMMENT '菜单链接地址，父菜单URL为空',
  `menu_status` tinyint(1) DEFAULT NULL COMMENT '菜单状态0-禁用，1-启用',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of sys_menu
-- ----------------------------

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
-- Table structure for unit
-- ----------------------------
DROP TABLE IF EXISTS `unit`;
CREATE TABLE `unit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(10) DEFAULT '' COMMENT '单位名称',
  `pinyin` varchar(20) DEFAULT NULL,
  `acronym` varchar(10) DEFAULT NULL,
  `type` int(8) DEFAULT '0' COMMENT '计量单位类型',
  `belong` varchar(32) DEFAULT '' COMMENT '单位所属类型',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='计量单位信息';

-- ----------------------------
-- Records of unit
-- ----------------------------
