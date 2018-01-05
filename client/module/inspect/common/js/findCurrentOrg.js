/**
 * 根据当前摄像机id展开组织树并高亮对应的节点
 */
define([
	"jquery",
	"ajaxModel"
], function(jQuery, ajaxModel) {

	var //当前摄像机id
		cId = "",
		Index = 0,
		cameraOrgsId = [],
        orgIdsL = 0,
		url = "/service/defence/get_orgs_by_cameraId";

	/**
	 * [showCrruentOrg 已知摄像机id时，选中左侧摄像机树]
	 * @param  {[type]} id   [description]
	 * @return {[type]}      [description]
	 */
	function checkCameraNodeById(id) {
		//存储当前的摄像机id
		cId = id;
		//清除现有的选中节点[bug45248, add by zhangyu 2016.04.13]
		jQuery(".node.selected").removeClass("selected");
		//若人为收起当前摄像机所在的组织机构节点，再反向定位的话是不能展开摄像机列表的，所以注释以下代码
		var $leaf = jQuery(".leaf").closest(".node[data-id='" + id + "']");
		//如果摄像机节点已经存在，则直接选择并展开父级
		if ($leaf.length) {
			//递归展开父节点
			checkParentOrgs($leaf);
			//滚动到视野范围内
			moveScroll($leaf);
			//高亮摄像机
			$leaf.removeClass("selected").addClass("selected");
			return;
		}
		//获取根组织机构
		getCameraOrgs(id, function (orgs) {
			orgs = orgs.split(",");

            cameraOrgsId = orgs;//全局
            orgIdsL = cameraOrgsId.length;//全局
			checkOrgOrCamera(orgs);
		});
	}

	/**
	 * 递归展开父节点
	 * @param  {[type]} node [叶子节点]
	 */
	function checkParentOrgs(node) {
		var $parentNode = node.closest(".tree").closest(".node");
		if ($parentNode.length !== 0) {
			if (!$parentNode.hasClass("active")) {
				//没有展开则展开节点
				$parentNode.children("a").trigger("click");
			}
			//递归展开父节点
			checkParentOrgs($parentNode);
		}
	}

	/**
	 * [getCameraOrgs 获取摄像机所在组织]
	 * @param  {[type]}   id       [description]
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	function getCameraOrgs(id, callback) {
		ajaxModel.getData(url, {
			cameraId: id
		}).then(function (res) {
			if (res.code !== 200) {
				return notify.error("获取摄像机所在组织失败");
			}
			callback(res.data);
		}, function () {
			notify.error("获取摄像机所在组织失败");
		});
	}

	var delayTimer = null;

	function checkLeafNodeExist(cId){
		$cleaf = jQuery(".leaf").closest(".node[data-id='" + cId + "']");
		if ($cleaf.length) {
			$cleaf.addClass("selected").siblings().removeClass("selected");
			moveScroll($cleaf);
			return true;
		}
		return false;
	}

	function selectLeafNode(cId){
		if (!checkLeafNodeExist(cId)) {
			if(delayTimer) {
				clearTimeout(delayTimer);
			}
			delayTimer = setTimeout(function(){
				selectLeafNode(cId);
			}, 200);
		}else{
			if(delayTimer) {
				clearTimeout(delayTimer);
			}
		}
	}
	/**
	 * [checkOrgOrCamera 循环选中组织和摄像机]
	 * @param  {[type]} orgs        [description]
	 * @param  {[type]} cameraId    [description]
	 * @return {[type]}             [description]
	 */
	function checkOrgOrCamera(orgs) {
		var id = orgs[Index];
		if ((typeof id === "string") || (typeof id === "number")) {
			var $org = jQuery(".node[data-id='org_" + id + "']");
			if ($org.length && !$org.hasClass("active")) {
				$org.find("a").trigger("click");
				findChildLeaf($org);
			}else {
				Index++;
                if(checkLastOrg()) {
                    return;
                }
				checkOrgOrCamera(cameraOrgsId);
			}
		}
	}

    /**
     * 为了使组织层层遍历 寻找节点需要在上一层子租住渲染之后才能进行，此处定义Timeout来来段
     * @type {null}
     */
    var findChildTimmer = null;

    /**
     * 寻找子节点 找到则进行下一层组织id展开操作
     * @param $parent
     */
    function findChildLeaf($parent) {
        if ($parent.find("ul.tree").length > 0) {
            if (findChildTimmer) {
                clearTimeout(findChildTimmer);
            }
            Index++;
            if(checkLastOrg()) {
                return;
            }
            checkOrgOrCamera(cameraOrgsId);
        } else {
            findChildTimmer = setTimeout(function () {
                findChildLeaf($parent);
            }, 200);
        }
    }

    /**
     * 额外处理最后可能存在的虚拟组织，如[1,11,12,12] 最后虚拟组织id 12 后端没有返回
     * @returns {boolean}
     */
    function checkLastOrg() {
        if (Index === orgIdsL) {//如果是最后一个组织 去判断是不是下层还有本部虚拟组织（虚拟组织id不在orgs数组中 需要多处理一次）
            var $lastVorg = jQuery(".node[data-id='vorg_" + cameraOrgsId[orgIdsL - 1] + "']");
            if ($lastVorg.length && !$lastVorg.hasClass("active")) {
                $lastVorg.find("a").trigger("click");
                selectLeafNode(cId);
                Index = 0;
                return true;
            } else{
                selectLeafNode(cId);
            }
            Index = 0;
            return true;
        }
        return false;
    }
	/**
	 * [moveScroll 滚动条的联动定位]
	 * @param  {[type]}   $leaf       [当前节点]
	 */
	function moveScroll($leaf) {
		var $container = jQuery(".sidebar-tree"),
			containerH = $container.height(),
			curPosH = $leaf.position().top,
			curContainerScrollTop = $container.scrollTop();
		//强制滚动到具体容器顶部100像素的地方
		if (curPosH > containerH) {
			//在视野的下面
			$container.scrollTop(curContainerScrollTop + curPosH - 100);
		} else {
			//在视野内 、 在视野上面
			$container.scrollTop(curContainerScrollTop + curPosH - 100);
		}
	}

	return {
		checkCameraNodeById: checkCameraNodeById
	};
});