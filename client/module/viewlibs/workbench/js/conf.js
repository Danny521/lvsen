define(function () {
    var typeObj = {
        type: 'isType',
        data: {
            incident: 'incident',
            video: 'ivideo',
            image: 'iimage',
            person: 'iperson',
            car: 'icar',
            scene: 'iscene',
            exhibit: 'iexhibit',
            moving: 'imove',
            rest: 'iothers'
        }
    };
    var unIncidentTypeObj = {
        type: 'isType',
        data: {
            video: 'video',
            image: 'image',
            person: 'person',
            car: 'car',
            scene: 'scene',
            exhibit: 'exhibit',
            moving: 'move',
            rest: 'others'
        }
    };

    var statueObj = {
        type: 'statue',
        data: ['','[未提交]', '[待审核]', '[未通过]', '[已通过]', '[再审核]']
    };


    var classStatueObj = {
        type: 'classstatue',
        data: ['','uncommit', 'willaudit', 'unpass', 'passed', 'againaudit']
    };

    var trackObj = {
        type: 'trackType',
        data: {
            car: '车辆',
            person: '人员',
            scene: '场景',
            exhibit: '物品',
            moving: '运动目标',
            rest: '其他'
        }
    };

    var showNameObj = {
        type: 'showName',
        data: {
            traillist: '线索列表信息',
            structlist: '结构化列表信息'
        }
    }

    var showHomeObj = {
        type: 'showHome',
        data: {
            workbench: '我的工作台',
            caselib: '案事件信息库',
            carlib: '车辆信息库',
            peoplelib: '人员信息库',
            personlib: '人员信息库',
            doubtlib: '疑情信息库'
        }
    }

    var showHomeHrefObj = {
        type: 'showHomeHref',
        data: {
            workbench: '/module/viewlibs/workbench/index.html',
            caselib: '/module/viewlibs/caselib/index.html',
            carlib: '/module/viewlibs/carlib/index.html',
            personlib: '/module/viewlibs/peoplelib/index.html',
            peoplelib: '/module/viewlibs/peoplelib/index.html',
            doubtlib: '/module/viewlibs/doubtlib/index.html'
        }
    }

    var urlObj = {
        incident: {
            plusName: true,
            data: '/module/viewlibs/details/incident/incident_detail.html?incidentname='
        },
        iimage: {
            plusName: true,
            data: '/module/viewlibs/details/media/picture.html?fileType=2&incidentname='
        },
        image: {
            plusName: false,
            data: '/module/viewlibs/details/media/picture.html?fileType=2'
        },
        ivideo: {
            plusName: true,
            data: '/module/viewlibs/details/media/video.html?fileType=1&incidentname='
        },
        video: {
            plusName: false,
            data: '/module/viewlibs/details/media/video.html?fileType=1'
        },
        icar: {
            plusName: true,
            data: '/module/viewlibs/details/struct/car.html?origntype=car&incidentname='
        },
        car: {
            plusName: false,
            data: '/module/viewlibs/details/struct/car.html?origntype=car'
        },
        iperson: {
            plusName: true,
            data: '/module/viewlibs/details/struct/person.html?origntype=person&incidentname='
        },
        person: {
            plusName: false,
            data: '/module/viewlibs/details/struct/person.html?origntype=person'
        },
        iexhibit: {
            plusName: true,
            data: '/module/viewlibs/details/struct/exhibit.html?origntype=exhibit&incidentname='
        },
        exhibit: {
            plusName: false,
            data: '/module/viewlibs/details/struct/exhibit.html?origntype=exhibit'
        },
        iscene: {
            plusName: true,
            data: '/module/viewlibs/details/struct/scene.html?origntype=scene&incidentname='
        },
        scene: {
            plusName: false,
            data: '/module/viewlibs/details/struct/scene.html?origntype=scene'
        },
        imove: {
            plusName: true,
            data: '/module/viewlibs/details/struct/move.html?origntype=move&incidentname='
        },
        move: {
            plusName: false,
            data: '/module/viewlibs/details/struct/move.html?origntype=move'
        },
        iothers: {
            plusName: true,
            data: '/module/viewlibs/details/struct/others.html?origntype=others&incidentname='
        },
        others: {
            plusName: false,
            data: '/module/viewlibs/details/struct/others.html?origntype=others'
        }
    };

    var incidentMsg = {
        associateId: {
            maxlength: "不超过50个字符",
            departmentCode: "由字母数字组成"
        },
        name: {
            required: "请输入案事件名",
            maxlength: "不超过100字符",
            nameFormat: "格式不正确"
        },
        category: {
            required: "请输入案事件类别"
        },
        timeUpper: {
            required: "请输入起始时间",
            datetime: "时间格式不正确",
            compareCurrent: "时间大于当前时间",
            timeCompareBig: "大于下限时间"
        },
        timeLower: {
            required: "请输入结束时间",
            datetime: "时间格式不正确",
            compareCurrent: "时间大于当前时间",
            timeCompareSmall: "小于上限时间"
        },
        province: {
            required: "请选择省份"
        },
        streets: {
            maxlength: "不超过200个字符"
        },
        description: {
            required: "请输入案件描述信息",
            maxlength: "不超过200字符"
        },
        suspectCount: {
            positiveInteger: "数量只能为正整数",
            maxlength: "不超过2个字符"
        },
        crimeMethod: {
            maxlength: "不超过200个字符"
        },
        reporter: {
            maxlength: "不超过20个字符"
        },
        reporterCompany: {
            maxlength: "不超过100个字符"
        },
        archive: {
            maxlength: "不超过50个字符"
        },
        reporterCardnumb: {
            identificationSelect: "格式不对",
            maxlength: "不超过50个字符"
        }
    };

    var videoValidMsg = {
        fileFormat: {
            required: "请选择文件格式"
        },
        shootTime: {
            required: "请选择拍摄时间",
            datetime: "时间格式不正确",
            compareCurrent: "拍摄时间不能晚于当前时间"
        },
        category: {
            required: "请输入视频分类"
        },
        name: {
            required: "请输入题名",
            minlength: "题名至少为两个字符",
            maxlength: "题名不得超过30字符",
            nameFormat: "名称不能包含下列任何字符 \\ / : * ? \" \' < > |"
        },
        description: {
            required: "请输入视频描述",
            maxlength: "内容描述不得超过200字符"
        },
        province: {
            required: "请选择省份"
        },
        streets: {
            maxlength: "街道地址不得超过200字符"
        },

        longitude: {
            required: "请输入拍摄地点经度",
            maxlength: "拍摄地点经度不得超过12字符",
            longitude: "经度范围为-180~180之间"
        },
        latitude: {
            required: "请输入拍摄地点纬度",
            maxlength: "拍摄地点纬度不得超过12字符",
            latitude: "纬度范围为-90~90之间"
        },
        duration: {
            required: "请输入视频长度",
            maxlength: "视频长度不能超过6字符串",
            positiveInteger: "视频长度必须为正整数"
        },
        enterTime: {
            required: "请选择视频入点",
            maxlength: "宽度不得超过50字符",
            datetime: "时间格式不正确",
            compareCurrent: "视频入点不能晚于当前时间"
        },
        startTime: {
            required: "请输入开始绝对时间",
            datetime: "时间格式不正确",
            timeCompareBig: "开始绝对时间必须早于结束绝对时间",
            compareCurrent: "开始绝对时间必须早于当前时间"
        },
        endTime: {
            required: "请输入结束绝对时间",
            datetime: "时间格式不正确",
            compareCurrent: "结束时间必须早于当前时间",
            timeCompare: "结束绝对时间必须晚于开始绝对时间"
        },
        width: {
            required: "请输入宽度",
            maxlength: "宽度不得超过5字符",
            positiveInteger: "所输入的宽度必须为正整数",
            compareWH: "宽度不得超过10000"
        },
        height: {
            required: "请输入高度",
            maxlength: "高度不得超过5字符",
            positiveInteger: "所输入的高度必须为正整数",
            compareWH: "高度不得超过10000"
        },
        device: {
            maxlength: "设备编码不得超过20个字符"
        },
        supplement: {
            maxlength: "题名补充不得超过30个字符"
        },
        earmark: {
            maxlength: "专项名不得超过230个字符"
        },
        subject: {
            maxlength: "主题词不得超过30个字符"
        },
        keywords: {
            maxlength: "关键词不得超过30个字符"
        },
        keyman: {
            maxlength: "主题人物不得超过30个字符"
        }
    }

    var imageValidMsg = {
        fileFormat: {
            required: "请选择图片格式"
        },
        shootTime: {
            required: "请选择拍摄日期",
            compareCurrent: "拍摄日期不能晚于当前时间"
        },
        category: {
            required: "请选择分类"
        },
        name: {
            required: "请输入题名",
            maxlength: "题名信息不得超过30字符",
            nameFormat: "名称不能包含下列任何字符 \\ / : * ? \" \' < > |"
        },
        province: {
            required: "请选择省份"
        },
        streets: {
            maxlength: "街道地址不得超过200字符"
        },
        longitude: {
            required: "请输入拍摄地点经度",
            maxlength: "经度不得超过12字符",
            longitude: "经度范围为-180~180之间"
        },
        latitude: {
            required: "请输入拍摄地点纬度",
            maxlength: "纬度不得超过12字符",
            latitude: "纬度范围为-90~90之间"
        },
        description: {
            required: "请输入内容描述信息",
            maxlength: "案件描述信息不得超过200字符"
        },
        width: {
            required: "请输入宽度",
            positiveInteger: "所输入的高度必须大于0"
        },
        height: {
            required: "请输入高度",
            positiveInteger: "所输入的高度必须大于0"
        },
        device: {
            maxlength: "嫌疑人数量不得超过20个字符"
        },
        supplement: {
            maxlength: "题名补充不得超过30个字符"
        },
        earmark: {
            maxlength: "专项名不得超过230个字符"
        },
        subject: {
            maxlength: "主题词不得超过30个字符"
        },
        keywords: {
            maxlength: "关键词不得超过30个字符"
        },
        keyman: {
            maxlength: "主题人物不得超过30个字符"
        }
    }

    var validateFormMsg = {
        associateId: {
            maxlength: "不超过50个字符",
            departmentCode: "由字母数字组成"
        },
        name: {
            required: "请输入案事件名",
            maxlength: "不超过100字符",
            nameFormat: "格式不正确"
        },
        category: {
            required: "请输入案事件类别"
        },
        timeUpper: {
            required: "请输入起始时间",
            datetime: "时间格式不正确",
            compareCurrent: "时间大于当前时间",
            timeCompareBig: "大于下限时间"
        },
        timeLower: {
            required: "请输入结束时间",
            datetime: "时间格式不正确",
            compareCurrent: "时间大于当前时间",
            timeCompareSmall: "小于上限时间"
        },
        province: {
            required: "请选择省份"
        },
        streets: {
            maxlength: "不超过200个字符"
        },
        description: {
            required: "请输入案件描述信息",
            maxlength: "不超过200字符"
        },
        suspectCount: {
            positiveInteger: "数量只能为正整数",
            maxlength: "不超过2个字符"
        },
        crimeMethod: {
            maxlength: "不超过200个字符"
        },
        reporter: {
            maxlength: "不超过20个字符"
        },
        reporterCompany: {
            maxlength: "不超过100个字符"
        },
        archive: {
            maxlength: "不超过50个字符"
        },
        reporterCardnumb: {
            identificationSelect: "格式不对",
            maxlength: "不超过50个字符"
        }
    }

    var fileNameObj = {
        bmp: '01',
        gif: '02',
        jpg: '03',
        jfif: '04',
        kdc: '05',
        pcd: '06',
        pcx: '07',
        pic: '08',
        pix: '09',
        png: '10',
        psd: '11',
        tapga: '12',
        tiff: '13',
        wmf: '14'
    }

    var fileVideoObj = {
        mpg: '01',
        mov: '02',
        avi: '03',
        rm: '04',
        rmvb: '05',
        xvid: '06',
        vob: '07',
        m2ts: '08',
        mp4: '09'
    }

    var dateTimePickerConf = {
	    showSecond: true,
	    dateFormat: 'yy-mm-dd',
	    timeFormat: 'HH:mm:ss',
	    timeText: '',
	    hourText: '时',
	    minuteText: '分',
	    secondText: '秒',
	    showAnim: '',
	    maxDate: new Date()
    }

    return {
        typeObj: typeObj,
        unIncidentTypeObj: unIncidentTypeObj,
        statueObj: statueObj,
        classStatueObj: classStatueObj,
        trackObj: trackObj,
        showHomeObj: showHomeObj,
        showNameObj: showNameObj,
        showHomeHrefObj: showHomeHrefObj,
        urlObj: urlObj,
        incidentMsg: incidentMsg,
        videoValidMsg: videoValidMsg,
        imageValidMsg: imageValidMsg,
        validateFormMsg: validateFormMsg,
        fileNameObj: fileNameObj,
        fileVideoObj: fileVideoObj,
        dateTimePickerConf : dateTimePickerConf
    }
})