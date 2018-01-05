(function(jQuery) {

	jQuery.extend(jQuery.fn, {
		// http://docs.jquery.com/Plugins/Validation/validate
		validate: function(options) {
			// if nothing is selected, return nothing; can't chain anyway
			if (!this.length) {
				if (options && options.debug && window.console) {
					console.warn("没有选中任何内容.");
				}
				return;
			}

			// check if a validator for this form was already created
			var validator = jQuery.data(this[0], "validator");
			if (validator) {
				if(options && options.newValidator){
					// 初始化跳过 获取
				}else{
					return validator;
				}
			}

			// Add novalidate tag if HTML5.
			//this.attr( "novalidate", "novalidate" );

			validator = new jQuery.validator(options, this[0]);
			jQuery.data(this[0], "validator", validator);

			if (validator.settings.onsubmit) {

				this.validateDelegate(":submit,.input-button", "click", function(event) {
					if (validator.settings.submitHandler) {
						validator.submitButton = event.target;
					}
					// allow suppressing validation by adding a cancel class to the submit button
					if (jQuery(event.target).hasClass("cancel")) {
						validator.cancelSubmit = true;
					}

					// allow suppressing validation by adding the html5 formnovalidate attribute to the submit button
					if (jQuery(event.target).attr("formnovalidate") !== undefined) {
						validator.cancelSubmit = true;
					}
				});

				// validate the form on submit
				this.submit(function(event) {
					if (validator.settings.debug) {
						// prevent form submit to be able to see console output
						event.preventDefault();
					}

					function handle() {
						var hidden;
						if (validator.settings.submitHandler) {
							if (validator.submitButton) {
								// insert a hidden input as a replacement for the missing submit button
								hidden = jQuery("<input type='hidden'/>").attr("name", validator.submitButton.name).val(jQuery(validator.submitButton).val()).appendTo(validator.currentForm);
							}
							validator.settings.submitHandler.call(validator, validator.currentForm, event);
							if (validator.submitButton) {
								// and clean up afterwards; thanks to no-block-scope, hidden can be referenced
								hidden.remove();
							}
							return false;
						}
						return true;
					}

					// prevent submit for invalid forms or custom submit handlers
					if (validator.cancelSubmit) {
						validator.cancelSubmit = false;
						return handle();
					}
					if (validator.form()) {
						if (validator.pendingRequest) {
							validator.formSubmitted = true;
							return false;
						}
						return handle();
					} else {
						validator.focusInvalid();
						return false;
					}
				});
			}

			return validator;
		},
		// http://docs.jquery.com/Plugins/Validation/valid
		valid: function() {
			if (jQuery(this[0]).is("form")) {
				return this.validate().form();
			} else {
				var valid = true;
				var validator = jQuery(this[0].form).validate();
				this.each(function() {
					valid = valid && validator.element(this);
				});
				return valid;
			}
		},
		// attributes: space seperated list of attributes to retrieve and remove
		removeAttrs: function(attributes) {
			var result = {},
				jQueryelement = this;
			jQuery.each(attributes.split(/\s/), function(index, value) {
				result[value] = jQueryelement.attr(value);
				jQueryelement.removeAttr(value);
			});
			return result;
		},
		// http://docs.jquery.com/Plugins/Validation/rules
		rules: function(command, argument) {
			var element = this[0];

			if (command) {
				var settings = jQuery.data(element.form, "validator").settings;
				var staticRules = settings.rules;
				var existingRules = jQuery.validator.staticRules(element);
				switch (command) {
					case "add":
						jQuery.extend(existingRules, jQuery.validator.normalizeRule(argument));
						// remove messages from rules, but allow them to be set separetely
						delete existingRules.messages;
						staticRules[element.name] = existingRules;
						if (argument.messages) {
							settings.messages[element.name] = jQuery.extend(settings.messages[element.name], argument.messages);
						}
						break;
					case "remove":
						if (!argument) {
							delete staticRules[element.name];
							return existingRules;
						}
						var filtered = {};
						jQuery.each(argument.split(/\s/), function(index, method) {
							filtered[method] = existingRules[method];
							delete existingRules[method];
						});
						return filtered;
				}
			}

			var data = jQuery.validator.normalizeRules(
				jQuery.extend({},
					jQuery.validator.classRules(element),
					/*
			jQuery.validator.attributeRules(element),*/
					jQuery.validator.dataRules(element),
					jQuery.validator.staticRules(element)
				), element);

			// make sure required is at front
			if (data.required) {
				var param = data.required;
				delete data.required;
				data = jQuery.extend({
					required: param
				}, data);
			}

			return data;
		}
	});

	// Custom selectors
	jQuery.extend(jQuery.expr[":"], {
		// http://docs.jquery.com/Plugins/Validation/blank
		blank: function(a) {
			return !jQuery.trim("" + jQuery(a).val());
		},
		// http://docs.jquery.com/Plugins/Validation/filled
		filled: function(a) {
			return !!jQuery.trim("" + jQuery(a).val());
		},
		// http://docs.jquery.com/Plugins/Validation/unchecked
		unchecked: function(a) {
			return !jQuery(a).prop("checked");
		}
	});

	// constructor for validator
	jQuery.validator = function(options, form) {
		this.settings = jQuery.extend(true, {}, jQuery.validator.defaults, options);
		this.currentForm = form;
		this.init();
	};

	jQuery.validator.format = function(source, params) {
		if (arguments.length === 1) {
			return function() {
				var args = jQuery.makeArray(arguments);
				args.unshift(source);
				return jQuery.validator.format.apply(this, args);
			};
		}
		if (arguments.length > 2 && params.constructor !== Array) {
			params = jQuery.makeArray(arguments).slice(1);
		}
		if (params.constructor !== Array) {
			params = [params];
		}
		jQuery.each(params, function(i, n) {
			source = source.replace(new RegExp("\\{" + i + "\\}", "g"), function() {
				return n;
			});
		});
		return source;
	};

	jQuery.extend(jQuery.validator, {

		defaults: {
			messages: {},
			groups: {},
			rules: {},
			errorClass: "error",
			validClass: "valid",
			errorElement: "label",
			focusInvalid: true,
			errorContainer: jQuery([]),
			errorLabelContainer: jQuery([]),
			onsubmit: true,
			ignore: ":hidden",
			ignoreTitle: false,
			onfocusin: function(element, event) {
				this.lastActive = element;

				// hide error label and remove error class on focus if enabled
				if (this.settings.focusCleanup && !this.blockFocusCleanup) {
					if (this.settings.unhighlight) {
						this.settings.unhighlight.call(this, element, this.settings.errorClass, this.settings.validClass);
					}
					this.addWrapper(this.errorsFor(element)).hide();
				}
			},
			onfocusout: function(element, event) {
                var self    = this,
                    process = function(){
                        if (!self.checkable(element) && (element.name in self.submitted || !self.optional(element))) {
                            self.element(element);
                        }
                    };
                if($(element).hasClass("input-date")){
                    setTimeout(process,200);
                }else{
                    process();
                }

			},
			onkeyup: function(element, event) {
				if (event.which === 9 && this.elementValue(element) === "") {
					return;
				} else if (element.name in this.submitted || element === this.lastElement) {
					this.element(element);
				}
			},
			onclick: function(element, event) {
				// click on selects, radiobuttons and checkboxes
				if (element.name in this.submitted) {
					this.element(element);
				}
				// or option elements, check parent select in that case
				else if (element.parentNode.name in this.submitted) {
					this.element(element.parentNode);
				}
			},
			highlight: function(element, errorClass, validClass) {
				if (element.type === "radio") {
					this.findByName(element.name).addClass(errorClass).removeClass(validClass);
				} else {
					jQuery(element).addClass(errorClass).removeClass(validClass);
				}
			},
			unhighlight: function(element, errorClass, validClass) {
				if (element.type === "radio") {
					this.findByName(element.name).removeClass(errorClass).addClass(validClass);
				} else {
					jQuery(element).removeClass(errorClass).addClass(validClass);
				}
			}
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/setDefaults
		setDefaults: function(settings) {
			jQuery.extend(jQuery.validator.defaults, settings);
		},

		messages: {
			required: "必填字段",
			remote: "已存在，请重新输入",
			email: "请输入正确格式的电子邮件",
			url: "请输入合法的网址",
			date: "请输入合法的日期",
			dateISO: "请输入合法的日期 (ISO).",
			number: "请输入合法的数字",
			digits: "只能输入整数",
			creditcard: "请输入合法的信用卡号",
			equalTo: "两次输入不一致",
			accept: "请输入拥有合法后缀名的字符串",
			maxlength: jQuery.validator.format("请输入一个长度最多是 {0} 的字符串"),
			minlength: jQuery.validator.format("请输入一个长度最少是 {0} 的字符串"),
			rangelength: jQuery.validator.format("请输入一个长度介于 {0} 和 {1} 之间的字符串"),
			range: jQuery.validator.format("请输入一个介于 {0} 和 {1} 之间的值"),
			max: jQuery.validator.format("请输入一个最大为{0} 的值"),
			min: jQuery.validator.format("请输入一个最小为{0} 的值"),
			string: "输入不得超过20个字符",
			isExistIncident:"该案事件不存在，请重新输入",
			isChoseIncident:"请输入案事件名称",
			identificationSelect:"格式不对，请重新输入"
		},

		autoCreateRanges: false,

		prototype: {

			init: function() {
				this.labelContainer = jQuery(this.settings.errorLabelContainer);
				this.errorContext = this.labelContainer.length && this.labelContainer || jQuery(this.currentForm);
				this.containers = jQuery(this.settings.errorContainer).add(this.settings.errorLabelContainer);
				this.submitted = {};
				this.valueCache = {};
				this.pendingRequest = 0;
				this.pending = {};
				this.invalid = {};
				this.reset();

				var groups = (this.groups = {});
				jQuery.each(this.settings.groups, function(key, value) {
					if (typeof value === "string") {
						value = value.split(/\s/);
					}
					jQuery.each(value, function(index, name) {
						groups[name] = key;
					});
				});
				var rules = this.settings.rules;
				jQuery.each(rules, function(key, value) {
					rules[key] = jQuery.validator.normalizeRule(value);
				});

				function delegate(event) {
					var validator = jQuery.data(this[0].form, "validator"),
						eventType = "on" + event.type.replace(/^validate/, "");
					if (validator.settings[eventType]) {
						validator.settings[eventType].call(validator, this[0], event);
					}
				}
				jQuery(this.currentForm)
					.validateDelegate(":text, [type='password'], [type='file'], select, textarea, " +
						"[type='number'], [type='search'] ,[type='tel'], [type='url'], " +
						"[type='email'], [type='datetime'], [type='date'], [type='month'], " +
						"[type='week'], [type='time'], [type='datetime-local'], " +
						"[type='range'], [type='color'] ",
						"focusin focusout keyup", delegate)
					.validateDelegate("[type='radio'], [type='checkbox'], select, option", "click", delegate);

				if (this.settings.invalidHandler) {
					jQuery(this.currentForm).bind("invalid-form.validate", this.settings.invalidHandler);
				}
			},

			// http://docs.jquery.com/Plugins/Validation/Validator/form
			form: function() {
				this.checkForm();
				jQuery.extend(this.submitted, this.errorMap);
				this.invalid = jQuery.extend({}, this.errorMap);
				if (!this.valid()) {
					jQuery(this.currentForm).triggerHandler("invalid-form", [this]);
				}
				this.showErrors();
				return this.valid();
			},

			checkForm: function() {
				this.prepareForm();
				for (var i = 0, elements = (this.currentElements = this.elements()); elements[i]; i++) {
					this.check(elements[i]);
				}
				return this.valid();
			},

			// http://docs.jquery.com/Plugins/Validation/Validator/element
			element: function(element) {
				element = this.validationTargetFor(this.clean(element));
				this.lastElement = element;
				this.prepareElement(element);
				this.currentElements = jQuery(element);
				var result = this.check(element) !== false;
				if (result) {
					delete this.invalid[element.name];
				} else {
					this.invalid[element.name] = true;
				}
				if (!this.numberOfInvalids()) {
					// Hide error containers on last error
					this.toHide = this.toHide.add(this.containers);
				}
				this.showErrors();
				return result;
			},


			// http://docs.jquery.com/Plugins/Validation/Validator/showErrors
			showErrors: function(errors) {
				if (errors) {
					// add items to error list and map
					jQuery.extend(this.errorMap, errors);
					this.errorList = [];
					for (var name in errors) {
						this.errorList.push({
							message: errors[name],
							element: this.findByName(name)[0]
						});
					}
					// remove items from success list
					this.successList = jQuery.grep(this.successList, function(element) {
						return !(element.name in errors);
					});
				}
				if (this.settings.showErrors) {
					this.settings.showErrors.call(this, this.errorMap, this.errorList);
				} else {
					this.defaultShowErrors();
				}
			},

			// http://docs.jquery.com/Plugins/Validation/Validator/resetForm
			resetForm: function() {
				if (jQuery.fn.resetForm) {
					jQuery(this.currentForm).resetForm();
				}
				this.submitted = {};
				this.lastElement = null;
				this.prepareForm();
				this.hideErrors();
				this.elements().removeClass(this.settings.errorClass).removeData("previousValue");
			},

			numberOfInvalids: function() {
				return this.objectLength(this.invalid);
			},

			objectLength: function(obj) {
				var count = 0;
				for (var i in obj) {
					count++;
				}
				return count;
			},

			hideErrors: function() {
				this.addWrapper(this.toHide).hide();
			},

			valid: function() {
				return this.size() === 0;
			},

			size: function() {
				return this.errorList.length;
			},

			focusInvalid: function() {
				if (this.settings.focusInvalid) {
					try {
						jQuery(this.findLastActive() || this.errorList.length && this.errorList[0].element || [])
							.filter(":visible")
							.focus()
						// manually trigger focusin event; without it, focusin handler isn't called, findLastActive won't have anything to find
						.trigger("focusin");
					} catch (e) {
						// ignore IE throwing errors when focusing hidden elements
					}
				}
			},

			findLastActive: function() {
				var lastActive = this.lastActive;
				return lastActive && jQuery.grep(this.errorList, function(n) {
					return n.element.name === lastActive.name;
				}).length === 1 && lastActive;
			},

			elements: function() {
				var validator = this,
					rulesCache = {};

				// select all valid inputs inside the form (no submit or reset buttons)
				return jQuery(this.currentForm)
					.find(":input")
					.not(":submit, :reset, :image, [disabled]")
					.not(this.settings.ignore)
					.filter(function() {
						if (!this.name && validator.settings.debug && window.console) {
							console.error("%o has no name assigned", this);
						}

						// select only the first element for each name, and only those with rules specified
						if (this.name in rulesCache || !validator.objectLength(jQuery(this).rules())) {
							return false;
						}

						rulesCache[this.name] = true;
						return true;
					});
			},

			clean: function(selector) {
				return jQuery(selector)[0];
			},

			errors: function() {
				var errorClass = this.settings.errorClass.replace(" ", ".");
				return jQuery(this.settings.errorElement + "." + errorClass, this.errorContext);
			},

			reset: function() {
				this.successList = [];
				this.errorList = [];
				this.errorMap = {};
				this.toShow = jQuery([]);
				this.toHide = jQuery([]);
				this.currentElements = jQuery([]);
			},

			prepareForm: function() {
				this.reset();
				this.toHide = this.errors().add(this.containers);
			},

			prepareElement: function(element) {
				this.reset();
				this.toHide = this.errorsFor(element);
			},

			elementValue: function(element) {
				var type = jQuery(element).attr("type"),
					val = jQuery(element).val();

				if (type === "radio" || type === "checkbox") {
					return jQuery("input[name='" + jQuery(element).attr("name") + "']:checked").val();
				}

				if (typeof val === "string") {
					return val.replace(/\r/g, "");
				}
				return val;
			},

			check: function(element) {
				element = this.validationTargetFor(this.clean(element));

				var rules = jQuery(element).rules();
				var dependencyMismatch = false;
				var val = this.elementValue(element);
				var result;

				for (var method in rules) {
					var rule = {
						method: method,
						parameters: rules[method]
					};
					try {
						result = jQuery.validator.methods[method].call(this, val, element, rule.parameters);

						// if a method indicates that the field is optional and therefore valid,
						// don't mark it as valid when there are no other rules
						if (result === "dependency-mismatch") {
							dependencyMismatch = true;
							continue;
						}
						dependencyMismatch = false;

						if (result === "pending") {
							this.toHide = this.toHide.not(this.errorsFor(element));
							return;
						}

						if (!result) {
							this.formatAndAdd(element, rule);
							return false;
						}
					} catch (e) {
						if (this.settings.debug && window.console) {
							console.log("Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.", e);
						}
						throw e;
					}
				}
				if (dependencyMismatch) {
					return;
				}
				if (this.objectLength(rules)) {
					this.successList.push(element);
				}
				return true;
			},

			// return the custom message for the given element and validation method
			// specified in the element's HTML5 data attribute
			customDataMessage: function(element, method) {
				return jQuery(element).data("msg-" + method.toLowerCase()) || (element.attributes && jQuery(element).attr("data-msg-" + method.toLowerCase()));
			},

			// return the custom message for the given element name and validation method
			customMessage: function(name, method) {
				var m = this.settings.messages[name];
				return m && (m.constructor === String ? m : m[method]);
			},

			// return the first defined argument, allowing empty strings
			findDefined: function() {
				for (var i = 0; i < arguments.length; i++) {
					if (arguments[i] !== undefined) {
						return arguments[i];
					}
				}
				return undefined;
			},

			defaultMessage: function(element, method) {
				return this.findDefined(
					this.customMessage(element.name, method),
					this.customDataMessage(element, method),
					// title is never undefined, so handle empty string as undefined
					!this.settings.ignoreTitle && element.title || undefined,
					jQuery.validator.messages[method],
					"<strong>Warning: No message defined for " + element.name + "</strong>"
				);
			},

			formatAndAdd: function(element, rule) {
				var message = this.defaultMessage(element, rule.method),
					theregex = /\$?\{(\d+)\}/g;
				if (typeof message === "function") {
					message = message.call(this, rule.parameters, element);
				} else if (theregex.test(message)) {
					message = jQuery.validator.format(message.replace(theregex, "{$1}"), rule.parameters);
				}
				this.errorList.push({
					message: message,
					element: element
				});

				this.errorMap[element.name] = message;
				this.submitted[element.name] = message;
			},

			addWrapper: function(toToggle) {
				if (this.settings.wrapper) {
					toToggle = toToggle.add(toToggle.parent(this.settings.wrapper));
				}
				return toToggle;
			},

			defaultShowErrors: function() {
				var i, elements;
				for (i = 0; this.errorList[i]; i++) {
					var error = this.errorList[i];
					if (this.settings.highlight) {
						this.settings.highlight.call(this, error.element, this.settings.errorClass, this.settings.validClass);
					}
					this.showLabel(error.element, error.message);
				}
				if (this.errorList.length) {
					this.toShow = this.toShow.add(this.containers);
				}
				if (this.settings.success) {
					for (i = 0; this.successList[i]; i++) {
						this.showLabel(this.successList[i]);
					}
				}
				if (this.settings.unhighlight) {
					for (i = 0, elements = this.validElements(); elements[i]; i++) {
						this.settings.unhighlight.call(this, elements[i], this.settings.errorClass, this.settings.validClass);
					}
				}
				this.toHide = this.toHide.not(this.toShow);
				this.hideErrors();
				this.addWrapper(this.toShow).show();
			},

			validElements: function() {
				return this.currentElements.not(this.invalidElements());
			},

			invalidElements: function() {
				return jQuery(this.errorList).map(function() {
					return this.element;
				});
			},

			showLabel: function(element, message) {
				var label = this.errorsFor(element);
				if (label.length) {
					// refresh error/success class
					label.removeClass(this.settings.validClass).addClass(this.settings.errorClass);
					// replace message on existing label
					label.html(message);
				} else {
					// create label
					label = jQuery("<" + this.settings.errorElement + ">")
						.attr("for", this.idOrName(element))
						.addClass(this.settings.errorClass)
						.html(message || "");
					if (this.settings.wrapper) {
						// make sure the element is visible, even in IE
						// actually showing the wrapped element is handled elsewhere
						label = label.hide().show().wrap("<" + this.settings.wrapper + "/>").parent();
					}
					if (!this.labelContainer.append(label).length) {
						if (this.settings.errorPlacement) {
							this.settings.errorPlacement(label, jQuery(element));
						} else {
							label.insertAfter(element);
						}
					}
				}
				if (!message && this.settings.success) {
					label.text("");
					if (typeof this.settings.success === "string") {
						label.addClass(this.settings.success);
					} else {
						this.settings.success(label, element);
					}
				}
				this.toShow = this.toShow.add(label);
			},

			errorsFor: function(element) {
				var name = this.idOrName(element);
				return this.errors().filter(function() {
					return jQuery(this).attr("for") === name;
				});
			},

			idOrName: function(element) {
				return this.groups[element.name] || (this.checkable(element) ? element.name : element.id || element.name);
			},

			validationTargetFor: function(element) {
				// if radio/checkbox, validate first element in group instead
				if (this.checkable(element)) {
					element = this.findByName(element.name).not(this.settings.ignore)[0];
				}
				return element;
			},

			checkable: function(element) {
				return (/radio|checkbox/i).test(element.type);
			},

			findByName: function(name) {
				return jQuery(this.currentForm).find("[name='" + name + "']");
			},

			getLength: function(value, element) {
				switch (element.nodeName.toLowerCase()) {
					case "select":
						return jQuery("option:selected", element).length;
					case "input":
						if (this.checkable(element)) {
							return this.findByName(element.name).filter(":checked").length;
						}
				}
				// 区别中文
				var size = 0;
				for (var i = 0, l = value.length; i < l; i++) {
					size += value.charCodeAt(i) > 255 ? 2 : 1;
				}
				return size;
			},

			depend: function(param, element) {
				return this.dependTypes[typeof param] ? this.dependTypes[typeof param](param, element) : true;
			},

			dependTypes: {
				"boolean": function(param, element) {
					return param;
				},
				"string": function(param, element) {
					return !!jQuery(param, element.form).length;
				},
				"function": function(param, element) {
					return param(element);
				}
			},

			optional: function(element) {
				var val = this.elementValue(element);
				return !jQuery.validator.methods.required.call(this, val, element) && "dependency-mismatch";
			},

			startRequest: function(element) {
				if (!this.pending[element.name]) {
					this.pendingRequest++;
					this.pending[element.name] = true;
				}
			},

			stopRequest: function(element, valid) {
				this.pendingRequest--;
				// sometimes synchronization fails, make sure pendingRequest is never < 0
				if (this.pendingRequest < 0) {
					this.pendingRequest = 0;
				}
				delete this.pending[element.name];
				if (valid && this.pendingRequest === 0 && this.formSubmitted && this.form()) {
					jQuery(this.currentForm).submit();
					this.formSubmitted = false;
				} else if (!valid && this.pendingRequest === 0 && this.formSubmitted) {
					jQuery(this.currentForm).triggerHandler("invalid-form", [this]);
					this.formSubmitted = false;
				}
			},

			previousValue: function(element) {
				return jQuery.data(element, "previousValue") || jQuery.data(element, "previousValue", {
					old: null,
					valid: true,
					message: this.defaultMessage(element, "remote")
				});
			}

		},

		classRuleSettings: {
			required: {
				required: true
			},
			email: {
				email: true
			},
			url: {
				url: true
			},
			date: {
				date: true
			},
			dateISO: {
				dateISO: true
			},
			number: {
				number: true
			},
			digits: {
				digits: true
			},
			creditcard: {
				creditcard: true
			}
		},

		addClassRules: function(className, rules) {
			if (className.constructor === String) {
				this.classRuleSettings[className] = rules;
			} else {
				jQuery.extend(this.classRuleSettings, className);
			}
		},

		classRules: function(element) {
			var rules = {};
			var classes = jQuery(element).attr("class");
			if (classes) {
				jQuery.each(classes.split(" "), function() {
					if (this in jQuery.validator.classRuleSettings) {
						jQuery.extend(rules, jQuery.validator.classRuleSettings[this]);
					}
				});
			}
			return rules;
		},

		attributeRules: function(element) {
			var rules = {};
			var jQueryelement = jQuery(element);
			var type = jQueryelement.attr("type");

			for (var method in jQuery.validator.methods) {
				var value;

				// support for <input required> in both html5 and older browsers
				if (method === "required") {
					value = jQueryelement.attr(method);
					// Some browsers return an empty string for the required attribute
					// and non-HTML5 browsers might have required="" markup
					if (value === "") {
						value = true;
					}
					// force non-HTML5 browsers to return bool
					value = !! value;
				} else {
					value = jQueryelement.attr(method);
				}

				// convert the value to a number for number inputs, and for text for backwards compability
				// allows type="date" and others to be compared as strings
				if (/min|max/.test(method) && (type === null || /number|range|text/.test(type))) {
					value = Number(value);
				}

				if (value) {
					rules[method] = value;
				} else if (type === method && type !== 'range') {
					// exception: the jquery validate 'range' method
					// does not test for the html5 'range' type
					rules[method] = true;
				}
			}

			// maxlength may be returned as -1, 2147483647 (IE) and 524288 (safari) for text inputs
			if (rules.maxlength && /-1|2147483647|524288/.test(rules.maxlength)) {
				delete rules.maxlength;
			}

			return rules;
		},

		dataRules: function(element) {
			var method, value,
				rules = {}, jQueryelement = jQuery(element);
			for (method in jQuery.validator.methods) {
				value = jQueryelement.data("rule-" + method.toLowerCase());
				if (value !== undefined) {
					rules[method] = value;
				}
			}
			return rules;
		},

		staticRules: function(element) {
			var rules = {};
			var validator = jQuery.data(element.form, "validator");
			if (validator.settings.rules) {
				rules = jQuery.validator.normalizeRule(validator.settings.rules[element.name]) || {};
			}
			return rules;
		},

		normalizeRules: function(rules, element) {
			// handle dependency check
			jQuery.each(rules, function(prop, val) {
				// ignore rule when param is explicitly false, eg. required:false
				if (val === false) {
					delete rules[prop];
					return;
				}
				if (val.param || val.depends) {
					var keepRule = true;
					switch (typeof val.depends) {
						case "string":
							keepRule = !! jQuery(val.depends, element.form).length;
							break;
						case "function":
							keepRule = val.depends.call(element, element);
							break;
					}
					if (keepRule) {
						rules[prop] = val.param !== undefined ? val.param : true;
					} else {
						delete rules[prop];
					}
				}
			});

			// evaluate parameters
			jQuery.each(rules, function(rule, parameter) {
				rules[rule] = jQuery.isFunction(parameter) ? parameter(element) : parameter;
			});

			// clean number parameters
			jQuery.each(['minlength', 'maxlength'], function() {
				if (rules[this]) {
					rules[this] = Number(rules[this]);
				}
			});
			jQuery.each(['rangelength', 'range'], function() {
				var parts;
				if (rules[this]) {
					if (jQuery.isArray(rules[this])) {
						rules[this] = [Number(rules[this][0]), Number(rules[this][1])];
					} else if (typeof rules[this] === "string") {
						parts = rules[this].split(/[\s,]+/);
						rules[this] = [Number(parts[0]), Number(parts[1])];
					}
				}
			});

			if (jQuery.validator.autoCreateRanges) {
				// auto-create ranges
				if (rules.min && rules.max) {
					rules.range = [rules.min, rules.max];
					delete rules.min;
					delete rules.max;
				}
				if (rules.minlength && rules.maxlength) {
					rules.rangelength = [rules.minlength, rules.maxlength];
					delete rules.minlength;
					delete rules.maxlength;
				}
			}

			return rules;
		},

		// Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
		normalizeRule: function(data) {
			if (typeof data === "string") {
				var transformed = {};
				jQuery.each(data.split(/\s/), function() {
					transformed[this] = true;
				});
				data = transformed;
			}
			return data;
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/addMethod
		addMethod: function(name, method, message) {
			jQuery.validator.methods[name] = method;
			jQuery.validator.messages[name] = message !== undefined ? message : jQuery.validator.messages[name];
			if (method.length < 3) {
				jQuery.validator.addClassRules(name, jQuery.validator.normalizeRule(name));
			}
		},

		methods: {

			// http://docs.jquery.com/Plugins/Validation/Methods/required
			required: function(value, element, param) {
				// check if dependency is met
				if (!this.depend(param, element)) {
					return "dependency-mismatch";
				}
				if (element.nodeName.toLowerCase() === "select") {
					// could be an array for select-multiple or a string, both are fine this way
					var val = jQuery(element).val();
					return val && val.length > 0;
				}
				if (this.checkable(element)) {
					return this.getLength(value, element) > 0;
				}
				return jQuery.trim(value).length > 0;
			},
			// http://docs.jquery.com/Plugins/Validation/Methods/email
			email: function(value, element) {
				// contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
				return this.optional(element) || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(value);
			},

			// http://docs.jquery.com/Plugins/Validation/Methods/url
			url: function(value, element) {
				// contributed by Scott Gonzalez: http://projects.scottsplayground.com/iri/
				return this.optional(element) || /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
			},

			// http://docs.jquery.com/Plugins/Validation/Methods/date
			date: function(value, element) {
				return this.optional(element) || !/Invalid|NaN/.test(new Date(value).toString());
			},
			shortDate: function(value, element) { //短时间时间格式，如：2013-07-01
				if(value === ""){return true;}
				return this.optional(element) || /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/.test(value);
			},
			datetime: function(value, element) { //长时间格式，如：2013-07-01 12:12:12
				return this.optional(element) || /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/.test(value);
			},
			// http://docs.jquery.com/Plugins/Validation/Methods/dateISO
			dateISO: function(value, element) {
				return this.optional(element) || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(value);
			},

			// http://docs.jquery.com/Plugins/Validation/Methods/number
			number: function(value, element) { //数值类型
				return this.optional(element) || /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
			},
			numberExt: function(value, element) { //数值类型 0~
				return this.optional(element) ||  value == "0" || /^[1-9]\d*$/.test(value);
			},
			/*
			*	座机号  数字 - 空格 
			*/
			fixedPhoneNumber: function(value, element) { //数值类型
				return this.optional(element) || /((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/.test(value);
			},

			telephone: function(value,element){
				//数值类型
				return this.optional(element) || /^\d{11}$/.test(value);
			},
			positivenumber: function(value, element) { //非负数
				return this.optional(element) || /^(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
			},
			// http://docs.jquery.com/Plugins/Validation/Methods/digits
			digits: function(value, element) { //整数
				return this.optional(element) || /^\d+$/.test(value);
			},
			ip: function(value, element) {
				return this.optional(element) ||/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-4])){3}$/.test(value);
			},
			// http://docs.jquery.com/Plugins/Validation/Methods/creditcard
			// based on http://en.wikipedia.org/wiki/Luhn
			creditcard: function(value, element) { //信用卡号
				if (this.optional(element)) {
					return "dependency-mismatch";
				}
				// accept only spaces, digits and dashes
				if (/[^0-9 \-]+/.test(value)) {
					return false;
				}
				var nCheck = 0,
					nDigit = 0,
					bEven = false;

				value = value.replace(/\D/g, "");

				for (var n = value.length - 1; n >= 0; n--) {
					var cDigit = value.charAt(n);
					nDigit = parseInt(cDigit, 10);
					if (bEven) {
						if ((nDigit *= 2) > 9) {
							nDigit -= 9;
						}
					}
					nCheck += nDigit;
					bEven = !bEven;
				}

				return (nCheck % 10) === 0;
			},
			//经度
			longitude: function(value, element) {
				var reg = /^(-)?(([1-9][0-9])?)([0]?|([1-9]?[0-9]?))(\.(\d+))?$/;
				var tem = function() {
					if (reg.test(value.trim())) {
						if (value < -180 || value > 180) {
							return false;
						} else {
							return true;
						}
					}
					return false
				};
				return this.optional(element) || tem()
			},
			//纬度
			latitude: function(value, element) {
				var reg = /^(-)?([1-9]?)(0|[1-9]*)(\.(\d+))?$/;
				var tem = function() {
					if (reg.test(value.trim())) {
						if (value < -90 || value > 90) {
							return false;
						} else {
							return true;
						}
					}
					return false
				};
				return this.optional(element) || tem()
			},

			// 验证端口
			port:function(value,element){
				var reg = /^\d+$/;
				var tem =function(){
					if (reg.test(value.trim())) {
						if (value < 1 || value > 65535) {
							return false;
						} else {
							return true;
						}
					}
					return false
				};
					return this.optional(element) || tem()
			},

			// 验证缓冲范围
			bufferrange:function(value,element){
				var reg = /^\d+$/;
				var tem =function(){
					if (reg.test(value.trim())) {
						if (value < 0 || value > 1000) {
							return false;
						} else {
							return true;
						}
					}
					return false
				};
					return this.optional(element) || tem()
			},

			//验证通道数
			compareChannel:function(value, element){
				if(value>5000){
					return false;
				} else{
					return true;
				}
			},
			/*验证高宽*/
			compareWH: function(value, element) {
				if (value > 10000) {
					return false;
				} else {
					return true;
				}
			},
			// 保质期比较
			compareLife: function(value, element) {
				if (value > 1000) {
					return false;
				} else {
					return true;
				}
			},
			// 和当前时间比较，如果晚于当前时间返回true
			afterDate: function(value, element) {
				if(jQuery.trim(value) === ""){return true;}
				var inputTime = new Date(value.substr(0, 4), value.substr(5, 2) - 1, value.substr(8, 2), value.substr(11, 2), value.substr(14, 2), value.substr(17, 2));
				var now = new Date();
				return now < inputTime;
			},
            // 和当前时间比较，如果晚于当前时间返回true 非必填 for BUG  #1291
            GTNow: function(value, element) {
                var inputTime = new Date(value.substr(0, 4), value.substr(5, 2) - 1, value.substr(8, 2), value.substr(11, 2), value.substr(14, 2), value.substr(17, 2));
                var now = new Date();
                return value ? now < inputTime : true;
            },
			//正整数
			positiveInteger: function(value, element) {
				return this.optional(element) || /^[1-9](\d)*$/.test(value.trim());
			},
			/*用户名*/
			usernamereg: function(value, element) {
				return this.optional(element) || /^[a-zA-Z0-9_]{0,}$/.test(value);
			},
			/*真实姓名*/
			realnamereg: function(value, element) {
				return this.optional(element) || /^([\u4E00-\u9FA5]+[a-zA-Z0-9_]*|[a-zA-Z]+[a-zA-Z0-9_]{1,})$/.test(value);
			},
			//部门名称
			departmentName: function(value, element) {
				return this.optional(element) || /^[\u4E00-\u9FA5 | a-zA-Z0-9]*$/.test(value);
			},
			// 部门编码
			departmentCode: function(value, element) {
				return this.optional(element) || /^[a-zA-Z0-9]*$/.test(value);
			},
			/*密码验证*/
			passwordreg: function(value, element) {
				return this.optional(element) || /^\w+$/.test(value);
			},

			positiveFloat: function(value, element) {
				return this.optional(element) || /^[1-9](\d)*[.]?(\d)*$/.test(value);
			},
			nameFormat: function(value, element, param) { //文件名称格式
				var pattern = /([?"*'\/\\<>:|？“”‘’]|(?!\s)'\s+|\s+'(?!\s))/ig;
				if (value.test(pattern)) {
					return false;
				} else {
					return true;
				}
			},
			sizeFormat: function(value) { //大小，格式1-2
				return !/^[-]\d+/.test(value);
			},
			//	关联案事件
			isExistIncident: function(value, element) { 
				if(jQuery(element).attr("data-id") && jQuery(element).attr("data-id") === 'notexist'){
					return false;
				}
				return true;
			},
			//关联案事件后必须输入名称
			isChoseIncident :function(value, element){
				if(jQuery(element).disabled !== "disabled" && jQuery(element).attr("data-id") === undefined){
					return false;
				}
				return true;
			},
			licenseNumber: function(value, element) { //车牌号码校验，如浙D124A1或浙D.124A1或浙D-124A1
				return this.optional(element) || /^[\u4e00-\u9fa5]{1}[a-zA-Z]{1}[a-zA-Z_0-9]{4}[a-zA-Z_0-9_\u4e00-\u9fa5]$|^[a-zA-Z]{2}\d{7}$/.test(value);
			},
			// 全是英文 [非中文]
			english:function(value,element){
				return this.optional(element) || /^[^\u4e00-\u9fa5]*$/.test(value);
			},
            // 英文和数字
            englishDigits:function(value,element) {
                return this.optional(element) || /[A-Za-z0-9\.]*/.test(value);
            },
			idcard: function(value, element, param) { //身份证号码
				if (jQuery.trim(value) != "") {					
					if (/(^\d{15}$)|(^\d{17}(\d|X)$)/.test(value) === false) {
						return false;
					}
					if (checkProvince(value) === false) { /*省份校验*/
						return false;
					}
					if (checkBirthday(value) === false) { /*出生日期*/
						return false;
					}
					if (checkParity(value) === false) { /*校验位*/
						return false;
					}					
					var mVal = value.match(/\d{10}|\d{14}/)[0];
					if(/^(\d{1,5})\1+$/.test(value) === true || /^(\d{1,5})\1+$/.test(mVal) === true){  //检验是否全为重复的数字					
						return false;
					}
				}

				return true;
				//校验省份
				function checkProvince(card) {
					var province = card.substr(0, 2);
					var vcity = {
						11: "北京",
						12: "天津",
						13: "河北",
						14: "山西",
						15: "内蒙古",
						21: "辽宁",
						22: "吉林",
						23: "黑龙江",
						31: "上海",
						32: "江苏",
						33: "浙江",
						34: "安徽",
						35: "福建",
						36: "江西",
						37: "山东",
						41: "河南",
						42: "湖北",
						43: "湖南",
						44: "广东",
						45: "广西",
						46: "海南",
						50: "重庆",
						51: "四川",
						52: "贵州",
						53: "云南",
						54: "西藏",
						61: "陕西",
						62: "甘肃",
						63: "青海",
						64: "宁夏",
						65: "新疆",
						71: "台湾",
						81: "香港",
						82: "澳门",
						91: "国外"
					};

					if (vcity[province] == undefined) {
						return false;
					}
					return true;
				};

				//检查生日是否正确
				function checkBirthday(card) {
					var len = card.length;
					//身份证15位时，次序为省（2位）市（2位）区（2位）年（2位）月（2位）日（2位）校验位（3位），皆为数字
					if (len == '15') {
						var re_fifteen = /^(\d{6})(\d{2})(\d{2})(\d{2})(\d{3})$/;
						var arr_data = card.match(re_fifteen);
						var year = arr_data[2];
						var month = arr_data[3];
						var day = arr_data[4];
						var birthday = new Date('19' + year + '/' + month + '/' + day);
						return verifyBirthday('19' + year, month, day, birthday);
					}
					//身份证18位时，次序为省（2位）市（2位）区（2位）年（4位）月（2位）日（2位）顺序位（3位）校验位（1位），校验位可能为X
					if (len == '18') {
						var re_eighteen = /^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/;
						var arr_data = card.match(re_eighteen);
						var year = parseInt(arr_data[2],10);
						var month = parseInt(arr_data[3],10);
						var day = parseInt(arr_data[4],10);

						var birthday = new Date(year + '/' + month + '/' + day);

						return verifyBirthday(year, month, day, birthday);
					}
					return false;
				};
				//校验日期
				function verifyBirthday(year, month, day, birthday) {
					var now = new Date();
					var now_year = now.getFullYear();
					//年月日是否合理
					if (birthday.getFullYear() == year && (birthday.getMonth() + 1) == month && birthday.getDate() == day) {
						//判断年份的范围（2岁到150岁之间)
						var time = now_year - year;
						if (time >= 2 && time <= 150) {
							return true;
						}
						return false;
					}
					return false;
				};
				//校验位的检测
				function checkParity(card) {
					//15位转18位
					card = changeFivteenToEighteen(card);
					var len = card.length;
					if (len == '18') {
						var arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
						var arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
						var cardTemp = 0,i, valnum;

						for (i = 0; i < 17; i++) {
							cardTemp += card.substr(i, 1) * arrInt[i];
						}
						valnum = arrCh[cardTemp % 11];
						if (valnum == card.substr(17, 1)) {
							return true;
						}
						return false;
					}
					return false;
				};

				function changeFivteenToEighteen(card) {
					if (card.length == '15') {
						var arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
						var arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
						var cardTemp = 0,
							i;
						card = card.substr(0, 6) + '19' + card.substr(6, card.length - 6);
						for (i = 0; i < 17; i++) {
							cardTemp += card.substr(i, 1) * arrInt[i];
						}
						card += arrCh[cardTemp % 11];
						return card;
					}
					return card;
				};
			},
			identificationSelect: function(value, element, param) { //文件名称格式
				// [01:身份证 02:临时身份证 03:军官证 04:驾驶证 05:护照 06:其他]
				if(param !== ""){
					var type = jQuery(param).find('option:selected').val();
					switch(type) {
						case "01":
							return jQuery.validator.methods.idcard(value, element, param);
							break;
						case "02":
							// TODO
							break;
					}
				}else{
					jQuery("form").find("[for="+jQuery(element).attr("id")+"]").remove();
				}
				return  true;
			},
			timeCompare: function(value, element, param) { //与某个时间比较
				var start = jQuery(param).val();
				return start < value;
			},
			
			//与当前时间比较
			compareDateToCur: function(value, element, param) { //与某个时间比较
				var arr = value.split("-");
			    var times = new Date(arr[0], arr[1], arr[2]).getTime();
			    var curTimes = new Date().getTime();

				return times > curTimes;

			},
			// 大于 某个日期比较
			compareDateTo: function(value, element, param) { //与某个时间比较
				if(value !=="" && jQuery(param).val().trim() !==""){
					var arr1 = value.split("-");
					var arr2 = jQuery(param).val().trim().split("-");

				    var curs = new Date(arr1[0], arr1[1], arr1[2]).getTime();
				    var ends = new Date(arr2[0], arr2[1], arr2[2]).getTime();
					return curs > ends;
				}else{
					return true;
				}
			},

			timeCompareBig: function(value, element, param) { //与某个时间比较，小于指定时间返回true，大于返回false
				var bigEl = jQuery(this.currentForm).find(param);
				var start = bigEl.val();
				if (bigEl.length > 0 && bigEl.val().trim() !== "") {
					if(start > value && start < Toolkit.getCurDateTime()){
						bigEl.closest("li").find("label.error").remove();
					}
				}
				if (start.length > 0)
					return start > value;
				else return true;
			},
			timeCompareSmall: function(value, element, param) { //与某个时间比较，小于指定时间返回true，大于返回false
				var smallEl = jQuery(this.currentForm).find(param);
				var start = smallEl.val();
				if (smallEl.length > 0 && smallEl.val().trim() !== "") {
					if(start < value && start < Toolkit.getCurDateTime()){
						smallEl.closest("li").find("label.error").remove();
					}
				}
				if (start.length > 0)
					return start < value;
				else return true;
			},
			//整数之间的比较 用在小的标签上
			digitCompare: function(value, element, param) {
				var big = jQuery(param).val().trim();
				if (big && value) {
					return value <= big;
				} else {
					return true;
				}

			},

			compareCurrent: function(value, element) { //与当前时间比较
				var inputTime = new Date(value.substr(0, 4), value.substr(5, 2) - 1, value.substr(8, 2), value.substr(11, 2), value.substr(14, 2), value.substr(17, 2));
				var now = new Date();
				return now > inputTime;
			},

			// http://docs.jquery.com/Plugins/Validation/Methods/minlength
			minlength: function(value, element, param) {
				var length = jQuery.isArray(value) ? value.length : this.getLength(jQuery.trim(value), element);
				return this.optional(element) || length >= param;
			},

			// http://docs.jquery.com/Plugins/Validation/Methods/maxlength
			maxlength: function(value, element, param) {
				var length = jQuery.isArray(value) ? value.length : this.getLength(jQuery.trim(value), element);
				return this.optional(element) || length <= param;
			},

			// http://docs.jquery.com/Plugins/Validation/Methods/rangelength
			rangelength: function(value, element, param) {
				var length = jQuery.isArray(value) ? value.length : this.getLength(jQuery.trim(value), element);
				return this.optional(element) || (length >= param[0] && length <= param[1]);
			},

			// http://docs.jquery.com/Plugins/Validation/Methods/min
			min: function(value, element, param) {
				return this.optional(element) || value >= param;
			},

			// http://docs.jquery.com/Plugins/Validation/Methods/max
			max: function(value, element, param) {
				return this.optional(element) || value <= param;
			},

			// http://docs.jquery.com/Plugins/Validation/Methods/range
			range: function(value, element, param) {
				return this.optional(element) || (value >= param[0] && value <= param[1]);
			},


			// http://docs.jquery.com/Plugins/Validation/Methods/equalTo
			equalTo: function(value, element, param) {
				// bind to the blur event of the target in order to revalidate whenever the target field is updated
				// TODO find a way to bind the event just once, avoiding the unbind-rebind overhead
				var target = jQuery(param);
				if (this.settings.onfocusout) {
					target.unbind(".validate-equalTo").bind("blur.validate-equalTo", function() {
						jQuery(element).valid();
					});
				}
				return value === target.val();
			},

			// http://docs.jquery.com/Plugins/Validation/Methods/remote
			remote: function(value, element, param) {
				if (this.optional(element)) {
					return "dependency-mismatch";
				}

				var previous = this.previousValue(element);
				if (!this.settings.messages[element.name]) {
					this.settings.messages[element.name] = {};
				}
				previous.originalMessage = this.settings.messages[element.name].remote;
				this.settings.messages[element.name].remote = previous.message;

				param = typeof param === "string" && {
					url: param
				} || param;

				if (previous.old === value) {
					return previous.valid;
				}

				previous.old = value;
				var validator = this;
				this.startRequest(element);
				var data = {};
				data[element.name] = value;

				// 与默认值比较：如果有默认值 data-default 且跟value 一样，则不发请求 [常用于编辑]
				var el = jQuery(element);
				if(el.attr("data-default") && el.val().trim() === el.attr("data-default")){
					var submitted = validator.formSubmitted;
						validator.prepareElement(element);
						validator.formSubmitted = submitted;
						validator.successList.push(element);
						delete validator.invalid[element.name];
						validator.showErrors();

						previous.valid = true;
						validator.stopRequest(element, true);
					return "pending";
				}
				// END OF 与默认值比较 

				jQuery.ajax(jQuery.extend(true, {
					url: param.url,
					mode: "abort",
					port: "validate" + element.name,
					dataType: "json",
					data: data,
					success: function(response) {
						validator.settings.messages[element.name].remote = previous.originalMessage;
						// var valid = response === true || response === "true";
						var valid = false;
						if(response.code === 200){
							valid = response.data.message === true || response.data.message === "true";
						}else{
							valid = false;
						}
						
						if (valid) {
							var submitted = validator.formSubmitted;
							validator.prepareElement(element);
							validator.formSubmitted = submitted;
							validator.successList.push(element);
							delete validator.invalid[element.name];
							validator.showErrors();
						} else {
							var errors = {};
							// var message = response || validator.defaultMessage(element, "remote");
							var message = validator.defaultMessage(element, "remote");
							errors[element.name] = previous.message = jQuery.isFunction(message) ? message(value) : message;
							validator.invalid[element.name] = true;
							validator.showErrors(errors);
						}
						previous.valid = valid;
						validator.stopRequest(element, valid);
					}
				}, param));
				return "pending";
			},
			string: function(value, element) {
				return this.optional(element) || /^\s*[\u4E00-\u9FA5\uf900-\ufa2d\w]{0,20}\s*$/.test(value);
			},
			//中国护照
			chinaPassport: function(value, element){
				if (jQuery.trim(value) != "") {
					if (/^[A-Za-z0-9]{8,30}$/.test(value)) {
						return true;
					};
				}
				return false;
			},
			//外国护照
			foreignPassport: function(value, element){
				if (jQuery.trim(value) != "") {
				}
				return true;
			},
			//居民户口簿
			residenceBooklet: function(value, element){
				if (jQuery.trim(value) != "") {
				}
				return true;
			},
			//旅行证
			travelCertificate: function(value, element){
				if (jQuery.trim(value) != "") {
				}
				return true;
			},
			//回乡证
			homeVisitPermit: function(value, element){
				if (jQuery.trim(value) != "") {
				}
				return true;
			},
			//居留证件
			residenceCertificate: function(value, element){
				if (jQuery.trim(value) != "") {
				}
				return true;
			},
			//驻华机构证明
			agenciesInChinaProve: function(value, element){
				if (jQuery.trim(value) != "") {
				}
				return true;
			},
			//使领馆人员身份证明
			consularStaffIdentification: function(value, element){
				if (jQuery.trim(value) != "") {
				}
				return true;
			},
			//军官离退休证
			theOfficerRetired: function(value, element){
				if (jQuery.trim(value) != "") {
				}
				return true;
			},
			//士兵证
			Soldiers: function(value, element){
				if (jQuery.trim(value) != "") {
				}
				return true;
			},
			//军官证
			certificateOfOfficers: function(value, element){
				if (jQuery.trim(value) != "") {
					if (/^[A-Za-z0-9]{8,30}$/.test(value)) {
						return true;
					};
				}
				return false;
			},
			//组织机构代码证书
			organizationCodeCertificate: function(value, element){
				if (jQuery.trim(value) != "") {
				}
				return true;
			}
		}

	});

	// deprecated, use jQuery.validator.format instead
	jQuery.format = jQuery.validator.format;

	/*}(jQuery));*/

	// ajax mode: abort
	// usage: jQuery.ajax({ mode: "abort"[, port: "uniqueport"]});
	// if mode:"abort" is used, the previous request on that port (port can be undefined) is aborted via XMLHttpRequest.abort()
	/*(function(jQuery) {*/
	var pendingRequests = {};
	// Use a prefilter if available (1.5+)
	if (jQuery.ajaxPrefilter) {
		jQuery.ajaxPrefilter(function(settings, _, xhr) {
			var port = settings.port;
			if (settings.mode === "abort") {
				if (pendingRequests[port]) {
					pendingRequests[port].abort();
				}
				pendingRequests[port] = xhr;
			}
		});
	} else {
		// Proxy ajax
		var ajax = jQuery.ajax;
		jQuery.ajax = function(settings) {
			var mode = ("mode" in settings ? settings : jQuery.ajaxSettings).mode,
				port = ("port" in settings ? settings : jQuery.ajaxSettings).port;
			if (mode === "abort") {
				if (pendingRequests[port]) {
					pendingRequests[port].abort();
				}
				pendingRequests[port] = ajax.apply(this, arguments);
				return pendingRequests[port];
			}
			return ajax.apply(this, arguments);
		};
	}
}(jQuery));

// provides delegate(type: String, delegate: Selector, handler: Callback) plugin for easier event delegation
// handler is only called when jQuery(event.target).is(delegate), in the scope of the jquery-object for event.target
(function(jQuery) {
	jQuery.extend(jQuery.fn, {
		validateDelegate: function(delegate, type, handler) {
			return this.bind(type, function(event) {
				var target = jQuery(event.target);
				if (target.is(delegate)) {
					return handler.apply(target, arguments);
				}
			});
		}
	});
}(jQuery));