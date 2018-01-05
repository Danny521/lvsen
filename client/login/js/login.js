define([
    "jquery",
    "domReady",
    "md5",
    "../../component/base/self/notify",
    "ajaxModel",
    "pvaConfig"
], function ($, domReady, md5, Notify, ajaxModel) {
    //获取提示变量
    var notify = Notify.init();

    var URL = {
            loginUrl: window.projectMode === "develop" ? window.mockDataUrl + "/service/login" : "/service/login",
            resetPwd: window.projectMode === "develop" ? window.mockDataUrl + "/service/usr/password" : "/service/usr/password" 
        },
        /**
         * 清除上下文变量
         * @private
         */
        _clearContext = function() {
            //清除localStorage变量
            if (window.localStorage) {
                window.localStorage.clear();
            }
            // songxj new add
            if (window.sessionStorage) {
                window.sessionStorage.clear();
            }
        },
        /**
         * 用户名密码差错验证
         * @param username - 用户名
         * @param password - 密码
         * @returns {boolean} - 验证成功与否
         * @private
         */
        _validate = function(username, password) {
            if (username === "") {
                notify.warn("账户不能为空！");
                $("#username").focus();
                return false;
            }
            if (!(/^[a-zA-Z0-9_]{0,50}$/.test(username))) {
                notify.warn("用户名格式不对,由字母、数字、下划线组成");
                $("#username").focus();
                return false;
            }
            if (password === "") {
                notify.warn("密码不能为空！");
                $("#password").focus();
                return false;
            }
            return true;
        },
        /**
         * 用户名密码登录
         * @param params - 登录参数
         * @param password - 登陆密码
         * @private
         */
        _acountLogin = function(params, password) {
            ajaxModel.postData(URL.loginUrl, params, {}).then(function (res) {
                if (res.code === 200) {
                    //如果是初始化默认密码，则提示进行密码增强设置
                    if (password === "admin" || password === "123456" || password === "21232f297a57a5a743894a0e4a801fc3" || password === "e10adc3949ba59abbe56e057f20f883e") {
                        $("#loginWarn , #loginWarnMsg").show();
                        $("#setPass").hide();
                        $("#setPassBtn").focus();
                    } else {
                        //正常登录，写入缓存变量
                        window.localStorage.setItem("loginFlag", true);
                        window.localStorage.setItem("user_login_info", JSON.stringify(params));
                        //跳转页面到首页
                        location.href = "/module/index/index.html";
                    }
                } else {
                    notify.warn((res && res.data && res.data.message) ? res.data.message : "登录失败，用户名或密码错误");
                }
            }, function () {
                notify.error("服务器或网络异常");
            });
        },
        /**
         * 重置密码面板的鼠标校验事件处理
         * @private
         */
        _resetPwdValidate = function() {
            var len = this.value.length >= 6 && this.value.length <= 20,
                good = /^(?=.*[0-9])(?=.*[a-zA-Z])[0-9a-zA-Z]+$|^(?=.*[0-9])(?=.*[~!@#%&\$\^\*])[0-9~!@#%&\$\^\*]+$|^(?=.*[a-zA-Z])(?=.*[~!@#%&\$\^\*])[~!@#%&\$\^\*a-zA-Z]+$/.test(this.value),
                complex = /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[~!@#%&\$^\*])[0-9a-zA-Z~!@#%&\$^\*]+$/.test(this.value);

            if (!len && !good && !complex) {
                $("#newPassFst").attr("class", "new-pass-input-warn");
            } else if ((len && good) || (len && complex)) {
                $("#newPassFst").attr("class", "new-pass-input");
            } else if (!len) {
                $("#newPassFst").attr("class", "new-pass-input-warn1");
            } else if ((len && !complex) || (len && !good)) {
                $("#newPassFst").attr("class", "new-pass-input-warn2");
            }
            if ($("#newPass").val() == "") {
                $("#newPassFst").attr("class", "new-pass");
            }
        },
        /**
         * 重置密码差错验证
         * @param oldpass - 就密码
         * @param pass1 - 新密码
         * @param pass2 - 确认密码
         * @returns {boolean} - 是否验证通过
         * @private
         */
        _resetPassValidate = function(oldpass, pass1, pass2) {
            var num = /^[0-9]+$/,
                strX = /^[a-z]+$/,
                strD = /^[A-Z]+$/,
                vkeyWords= /^[~!@#%&\$\^\*]+$/,
                good = /^(?=.*[0-9])(?=.*[a-zA-Z])[0-9a-zA-Z]+$|^(?=.*[0-9])(?=.*[~!@#%&\$\^\*])[0-9~!@#%&\$\^\*]+$|^(?=.*[a-zA-Z])(?=.*[~!@#%&\$\^\*])[~!@#%&\$\^\*a-zA-Z]+$/.test(pass1),
                complex = /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[~!@#%&\$\^\*])[0-9a-zA-Z~!@#%&\$\^\*]{6,20}$/.test(pass1);
            if (oldpass === "" || pass1 === "" || pass2 === "" ){
                notify.warn("请填写完毕再提交！");
                return false;
            }
            if (pass1.length < 6 ) {
                notify.warn("密码最少6位！");
                return false;
            }
            if (pass1.length > 20 ) {
                notify.warn("密码最多20位！");
                return false;
            }
            if (pass1 == "123456") {
                notify.warn("密码格式错误！");
                return false;
            }
            if (num.test(pass1) || strX.test(pass1) || vkeyWords.test(pass1) || strD.test(pass1) || vkeyWords.test(pass1)) {
                notify.warn("您的密码太简单了！");
                return false;
            }
            return !!(good || complex);
        },
        /**
         * 重置密码-保存
         * @param params - 参数信息
         * @private
         */
        _updateNewPwd = function(params) {
            ajaxModel.postData(Url.resetPwd, params, {
                "async": false
            }).then(function(res){
                if (res.code === 200) {
                    location.href = "/logout/index.html";
                } else {
                    notify.warn(res.data.message);
                }
            });
        },
        /**
         * 登陆页面事件绑定
         * @private
         */
        _bindEvents = function() {
            console.log('login-method='+window.loginMethod)
            //用户名登录
            $(".login_name").show();
            $("#login_trigger ul .accout").show();
            //用户名鼠标事件
            $(".login_name .login-input").on({
                //触发焦点事件
                focus: function () {
                    if (this.defaultValue === this.value) {
                        this.value = "";
                        $(this).addClass("focus");
                    }
                    $(this).closest("li").addClass("current");
                },
                //焦点移出事件
                blur: function () {
                    if ("" === this.value) {
                        this.value = this.defaultValue;
                        $(this).removeClass("focus");
                    }
                    $(this).closest("li").removeClass("current");
                }
            });
            //登录表单提交事件
            $("form").submit(function () {
                var username = $.trim($("#username").val()),
                    password = $("#password").val();
                //差错验证
                if (!_validate(username, password)) {
                    return;
                }
                //获取登陆参数
                var params = {
                    "username": username,
                    "password": md5(password),
                    "remember": $("#login").find("input[name='remenber']").prop("checked")
                };
                //触发登录请求
                _acountLogin(params, password);
            });
           
           
            //重置密码按钮事件，点击进入密码重置流程
            $("#setPassBtn").bind("click keypress",function () {
                $("#loginWarnMsg").hide();
                $("#setPass").show().find("span").attr("class", "");
                $("#oldPass, #newPass, #repeatPass").val("");
                $("#oldPass").focus();
                $("#newPassFst").attr("class", "new-pass")
            });
            //重置密码框上的关闭事件
            $("#loginWarnCls, #setPassCls").click(function () {
                $("#loginWarn").hide();
            });
            //重置密码-填写旧密码
            $("#oldPass").change(function () {
                var pwd = $("#password").val(),
                    oldPass = $("#oldPass").val();
                if (oldPass === pwd){
                    $("#oldPassChk").attr("class","old-pass");
                } else if (oldPass === "") {
                    $("#oldPassChk").attr("class","");
                } else {
                    $("#oldPassChk").attr("class","old-pass-warn");
                }
            });
            //重置密码-填写新密码
            $("#newPass").on({
                focus: function () {
                    _resetPwdValidate.call(this);
                },
                input: function () {
                    _resetPwdValidate.call(this);
                },
                change: function () {
                    _resetPwdValidate.call(this);
                },
                blur: function () {
                    var len = this.value.length >= 6 && this.value.length <= 20,
                        good = /^(?=.*[0-9])(?=.*[a-zA-Z])[0-9a-zA-Z]+$|^(?=.*[0-9])(?=.*[~!@#%&\$\^\*])[0-9~!@#%&\$\^\*]+$|^(?=.*[a-zA-Z])(?=.*[~!@#%&\$\^\*])[~!@#%&\$\^\*a-zA-Z]+$/.test(this.value),
                        complex = /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[~!@#%&\$\^\*])[0-9a-zA-Z~!@#%&\$\^\*]{6,20}$/.test(this.value);

                    if (complex) {
                        $("#newPassFst").attr("class", "new-pass-complex");
                    } else if (good && len) {
                        $("#newPassFst").attr("class", "new-pass-mid");
                    }
                    if ($("#newPass").val() == "") {
                        $("#newPassFst").attr("class", "new-pass");
                    }
                }
            });
            //重置密码-填写重复新密码
            $("#repeatPass").change(function () {
                var $repeatPass = $("#repeatPass"),
                    $newPassRpt = $("#newPassRpt");
                if ($repeatPass.val() === $("#newPass").val() && $repeatPass.val() !== "") {
                    $newPassRpt.attr("class", "repeat-pass");
                } else if ($repeatPass.val() === "") {
                    $newPassRpt.attr("class", "");
                } else {
                    $newPassRpt.attr("class", "repeat-pass-warn");
                }
            });
            //重置密码-确认按钮事件
            $("#savePass").click(function () {
                var oldpass = $("#oldPass").val(),
                    pass1 = $("#newPass").val(),
                    pass2 = $("#repeatPass").val();
                //差错校验
                if(!_resetPassValidate(oldpass, pass1, pass2)){
                    return;
                }
                //更新密码
                _updateNewPwd({
                    "oldPassword": md5(oldpass).toString(),
                    "password1": md5(pass1).toString(),
                    "password2": md5(pass2).toString()
                });
            });
            // 关于的事件绑定
            $(".about").click(function () {
                require(["/about/about.js"], function(About) {
                    About.showAbout();
                });
            });
        };

    //页面加载完成后的处理
    domReady(function () {
        //清除上下文
        _clearContext();
        //事件绑定
        _bindEvents();
        //自动触发内容为空的焦点
        $("#username, #password").filter(function () {
            return $.trim($(this).val()) === "";
        }).end().first().focus();
    });
});