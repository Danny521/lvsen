define([], function () {
    //图像处理解释文件配置
    var imageEnhance = {
            enhance: {
                mainText: '图像增强',
                explainText: '对于影像的色调、对比度、清晰度、饱和度进行简单地调整，会对每个像素进行相同程度的调整'
            }
        },
        noiseDeal = {
            noiseDeal: {
                mainText: '噪声处理',
                explainText: '该功能采用中值滤波去噪，以当前像素点为中心指定一个窗口，然后以窗口内像素的统计中间值代替当前点的像素值，去除噪声的同时保持图像的边缘等结构信息'
            }
        },
        sharpen = {
            sharpen: {
                mainText: '锐化',
                explainText: '补偿图像的轮廓，增强图像的边缘及灰度跳变的部分，使图像的边缘、轮廓线以及图像的细节变的清晰'
            },
            adaptSharpen: {
                mainText: '自适应锐化',
                explainText: '使细节区域的对比对增强，对图像的平滑区域进行很小或不增强对比度。'
            }
        },
        colorDeal = {
            greyTransform: {
                mainText: '色彩-灰度转换',
                explainText: '该功能可将图像灰度级转换为一种色彩的亮度值，从而产生一种通过彩色玻璃看图片的效果'
            },
            removeColor: {
                mainText: '去色',
                explainText: '该功能去除图像中的彩色，将彩色按一定规则转为灰度级'
            },
            colorBalance: {
                mainText: '自动色彩平衡',
                explainText: '该功能均匀图像中色彩'
            },
            reverseColor: {
                mainText: '反色',
                explainText: '反色又叫补色，将图像的颜色值反转'
            },
            whiteBalance: {
                mainText: '自动白平衡',
                explainText: '该功能通过拉伸直方图来自动调整颜色。对RGB 图，分别在三个通道上执行拉伸；对灰度图，在灰度通道上执行拉伸'
            },
            brightStretch: {
                mainText: '亮度拉伸',
                explainText: '该功能拉伸亮度，使最暗的点变成黑色，最亮的点变成白色，同时保持图像的色调不变。通常用于快速修复昏暗的图像或褪色的图像'
            },
            brightReversal: {
                mainText: '亮度反转',
                explainText: '该功能反转像素的亮度，同时保持像素的色调，饱和度不变'
            }
        },
        imageRevise = {
            distortionRevise: {
                mainText: '镜头畸变校正',
                explainText: '该功能可以对广角镜头拍摄所产生的镜头畸变进行校正'
            },
            exchangeRevise: {
                mainText: '透视变换校正',
                explainText: '该功能实现对图像透视形变的校正'
            }
        },
        dealFuzzy = {
            removeSport: {
                mainText: '去运动模糊',
                explainText: '该功能将由于运动影响造成的图像模糊清晰化'
            },
            removeDefocus: {
                mainText: '去散焦模糊',
                explainText: '该功能将焦距未对准造成的模糊图像清晰化'
            }
        },
        removeFog = {
            removeFog: {
                mainText: '去雾',
                explainText: '该功能去除图像中的雾罩现象'
            }
        },
        imageSmoothing = {
            midValueSmoothing: {
                mainText: '中值滤波',
                explainText: '该功能是一种统计滤波方法，以当前像素点为中心指定一个窗口，然后以窗口内像素的统计中间值代替当前点的像素值。特别适用于处理含有椒盐噪声的图像'
            },
            heiValueSmoothing: {
                mainText: '高通滤波',
                explainText: '该功能是容许高频信号通过、但减弱（或减少）频率低于截止频率信号通过'
            },
            lowValueSmoothing: {
                mainText: '低通滤波',
                explainText: '该功能容许低频信号通过，但减弱(或减少)频率高于截止频率的信号的通过'
            }
        },
        formOperation = {
            corrosion: {
                mainText: '腐蚀',
                explainText: '该功能是一种消除边界点，使边界向内部收缩的过程。腐蚀操作作用是：消除图像中小且无意义的物体'
            },
            swell: {
                mainText: '膨胀',
                explainText: '该功能是将与物体接触的所有背景点合并到物体中，使物体边界向外部扩张的过程。膨胀操作的作用是：填补物体中的空洞'
            }
        };

        picRecovery = {
            picRecovery: {
                mainText: '图像复原',
                explainText: '该功能用于消除图像中的马赛克失真,阶梯效应和噪声污染等'
            }
        };

        colorSeparate = {
            colorSeparate:{
                mainText: '色彩分离',
                explainText: '该功能可减少图像中的颜色数,同时尽量保持图像内容稳定'
            }
        };

        moveRow = {
            moveRow: {
                mainText: '移行',
                explainText: '奇数场与偶数场分别指图像中的奇数行像素和偶数行像素。该功能用于对齐视频图像中错开的奇数场和偶数场数据'
            }
        };

        oddEven = {
            oddEven: {
                mainText: '奇偶场',
                explainText: '奇数场与偶数场分别指图像中的奇数行像素和偶数行像素。该功能针对奇偶场错位或者混乱的对象,通过参数设置实现只播放图像中的奇场内容或者偶场内容的功能'
            }
        };

        overDpi = {
            overDpi: {
                mainText: '超分辨率',
                explainText: '该功能是一种对单张图像进行超分辨率的方法,即只由一副图像即可提高分辨率'
            }
        }

    return{
        noiseDeal: noiseDeal,
        imageEnhance: imageEnhance,
        sharpen: sharpen,
        colorDeal: colorDeal,
        imageRevise: imageRevise,
        dealFuzzy: dealFuzzy,
        removeFog: removeFog,
        imageSmoothing: imageSmoothing,
        formOperation: formOperation,
        picRecovery: picRecovery,
        colorSeparate:colorSeparate,
        moveRow:moveRow,
        oddEven:oddEven,
        overDpi:overDpi
    }
})