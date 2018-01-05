/*!
 * jQuery timepicker addon
 * By: Trent Richardson [http://trentrichardson.com]
 */

// define(function(require, exports, module) {

// require('jquery');
// require('jquery.ui');
// require('jquery.ui.css');

(function($) {
	if ($.ui.timepicker = $.ui.timepicker || {}, !$.ui.timepicker.version) {
		$.extend($.ui, {
			timepicker: {
				version: "1.2"
			}
		});
		var Timepicker = function() {
			this.regional = [], this.regional[""] = {
				currentText: "当前时间",
				closeText: "确定",
				amNames: ["AM", "A"],
				pmNames: ["PM", "P"],
				timeFormat: "HH:mm",
				timeSuffix: "",
				timeOnlyTitle: "选择时间",
				timeText: "Time",
				hourText: "Hour",
				minuteText: "Minute",
				secondText: "Second",
				millisecText: "Millisecond",
				timezoneText: "Time Zone",
				isRTL: !1
			}, this._defaults = {
				showButtonPanel: !0,
				timeOnly: !1,
				showHour: !0,
				showMinute: !0,
				showSecond: !1,
				showMillisec: !1,
				showTimezone: !1,
				showTime: !0,
				stepHour: 1,
				stepMinute: 1,
				stepSecond: 1,
				stepMillisec: 1,
				hour: 0,
				minute: 0,
				second: 0,
				millisec: 0,
				timezone: null,
				useLocalTimezone: !1,
				defaultTimezone: "+0000",
				hourMin: 0,
				minuteMin: 0,
				secondMin: 0,
				millisecMin: 0,
				hourMax: 23,
				minuteMax: 59,
				secondMax: 59,
				millisecMax: 999,
				minDateTime: null,
				maxDateTime: null,
				onSelect: null,
				hourGrid: 0,
				minuteGrid: 0,
				secondGrid: 0,
				millisecGrid: 0,
				alwaysSetTime: !0,
				separator: " ",
				altFieldTimeOnly: !0,
				altTimeFormat: null,
				altSeparator: null,
				altTimeSuffix: null,
				pickerTimeFormat: null,
				pickerTimeSuffix: null,
				showTimepicker: !0,
				showManaulTimepicker: !0, // by songxj add
				timezoneIso8601: !1,
				timezoneList: null,
				addSliderAccess: !1,
				sliderAccessArgs: null,
				controlType: "slider",
				defaultValue: null,
				parse: "strict"
			}, $.extend(this._defaults, this.regional[""])
		};
		$.extend(Timepicker.prototype, {
			$input: null,
			$altInput: null,
			$timeObj: null,
			inst: null,
			hour_slider: null,
			minute_slider: null,
			second_slider: null,
			millisec_slider: null,
			timezone_select: null,
			hour: 0,
			minute: 0,
			second: 0,
			millisec: 0,
			timezone: null,
			defaultTimezone: "+0000",
			hourMinOriginal: null,
			minuteMinOriginal: null,
			secondMinOriginal: null,
			millisecMinOriginal: null,
			hourMaxOriginal: null,
			minuteMaxOriginal: null,
			secondMaxOriginal: null,
			millisecMaxOriginal: null,
			ampm: "",
			formattedDate: "",
			formattedTime: "",
			formattedDateTime: "",
			timezoneList: null,
			units: ["hour", "minute", "second", "millisec"],
			control: null,
			setDefaults: function(e) {
				return extendRemove(this._defaults, e || {}), this
			},
			_newInst: function($input, o) {
				var tp_inst = new Timepicker,
					inlineSettings = {},
					fns = {},
					overrides, i;
				for (var attrName in this._defaults)
					if (this._defaults.hasOwnProperty(attrName)) {
						var attrValue = $input.attr("time:" + attrName);
						if (attrValue) try {
							inlineSettings[attrName] = eval(attrValue)
						} catch (err) {
							inlineSettings[attrName] = attrValue
						}
					}
				overrides = {
					beforeShow: function(e, t) {
						return $.isFunction(tp_inst._defaults.evnts.beforeShow) ? tp_inst._defaults.evnts.beforeShow.call($input[0], e, t, tp_inst) : void 0
					},
					onChangeMonthYear: function(e, t, i) {
						tp_inst._updateDateTime(i), $.isFunction(tp_inst._defaults.evnts.onChangeMonthYear) && tp_inst._defaults.evnts.onChangeMonthYear.call($input[0], e, t, i, tp_inst)
					},
					onClose: function(e, t) {
						tp_inst.timeDefined === !0 && "" !== $input.val() && tp_inst._updateDateTime(t), $.isFunction(tp_inst._defaults.evnts.onClose) && tp_inst._defaults.evnts.onClose.call($input[0], e, t, tp_inst)
					}
				};
				for (i in overrides) overrides.hasOwnProperty(i) && (fns[i] = o[i] || null);
				if (tp_inst._defaults = $.extend({}, this._defaults, inlineSettings, o, overrides, {
						evnts: fns,
						timepicker: tp_inst
					}), tp_inst.amNames = $.map(tp_inst._defaults.amNames, function(e) {
						return e.toUpperCase()
					}), tp_inst.pmNames = $.map(tp_inst._defaults.pmNames, function(e) {
						return e.toUpperCase()
					}), "string" == typeof tp_inst._defaults.controlType ? (void 0 === $.fn[tp_inst._defaults.controlType] && (tp_inst._defaults.controlType = "select"), tp_inst.control = tp_inst._controls[tp_inst._defaults.controlType]) : tp_inst.control = tp_inst._defaults.controlType, null === tp_inst._defaults.timezoneList) {
					var timezoneList = ["-1200", "-1100", "-1000", "-0930", "-0900", "-0800", "-0700", "-0600", "-0500", "-0430", "-0400", "-0330", "-0300", "-0200", "-0100", "+0000", "+0100", "+0200", "+0300", "+0330", "+0400", "+0430", "+0500", "+0530", "+0545", "+0600", "+0630", "+0700", "+0800", "+0845", "+0900", "+0930", "+1000", "+1030", "+1100", "+1130", "+1200", "+1245", "+1300", "+1400"];
					tp_inst._defaults.timezoneIso8601 && (timezoneList = $.map(timezoneList, function(e) {
						return "+0000" == e ? "Z" : e.substring(0, 3) + ":" + e.substring(3)
					})), tp_inst._defaults.timezoneList = timezoneList
				}
				return tp_inst.timezone = tp_inst._defaults.timezone, tp_inst.hour = tp_inst._defaults.hour < tp_inst._defaults.hourMin ? tp_inst._defaults.hourMin : tp_inst._defaults.hour > tp_inst._defaults.hourMax ? tp_inst._defaults.hourMax : tp_inst._defaults.hour, tp_inst.minute = tp_inst._defaults.minute < tp_inst._defaults.minuteMin ? tp_inst._defaults.minuteMin : tp_inst._defaults.minute > tp_inst._defaults.minuteMax ? tp_inst._defaults.minuteMax : tp_inst._defaults.minute, tp_inst.second = tp_inst._defaults.second < tp_inst._defaults.secondMin ? tp_inst._defaults.secondMin : tp_inst._defaults.second > tp_inst._defaults.secondMax ? tp_inst._defaults.secondMax : tp_inst._defaults.second, tp_inst.millisec = tp_inst._defaults.millisec < tp_inst._defaults.millisecMin ? tp_inst._defaults.millisecMin : tp_inst._defaults.millisec > tp_inst._defaults.millisecMax ? tp_inst._defaults.millisecMax : tp_inst._defaults.millisec, tp_inst.ampm = "", tp_inst.$input = $input, o.altField && (tp_inst.$altInput = $(o.altField).css({
					cursor: "pointer"
				}).focus(function() {
					$input.trigger("focus")
				})), (0 === tp_inst._defaults.minDate || 0 === tp_inst._defaults.minDateTime) && (tp_inst._defaults.minDate = new Date), (0 === tp_inst._defaults.maxDate || 0 === tp_inst._defaults.maxDateTime) && (tp_inst._defaults.maxDate = new Date), void 0 !== tp_inst._defaults.minDate && tp_inst._defaults.minDate instanceof Date && (tp_inst._defaults.minDateTime = new Date(tp_inst._defaults.minDate.getTime())), void 0 !== tp_inst._defaults.minDateTime && tp_inst._defaults.minDateTime instanceof Date && (tp_inst._defaults.minDate = new Date(tp_inst._defaults.minDateTime.getTime())), void 0 !== tp_inst._defaults.maxDate && tp_inst._defaults.maxDate instanceof Date && (tp_inst._defaults.maxDateTime = new Date(tp_inst._defaults.maxDate.getTime())), void 0 !== tp_inst._defaults.maxDateTime && tp_inst._defaults.maxDateTime instanceof Date && (tp_inst._defaults.maxDate = new Date(tp_inst._defaults.maxDateTime.getTime())), tp_inst.$input.bind("focus", function() {
					tp_inst._onFocus()
				}), tp_inst
			},
			_addTimePicker: function(e) {
				var t = this.$altInput && this._defaults.altFieldTimeOnly ? this.$input.val() + " " + this.$altInput.val() : this.$input.val();
				this.timeDefined = this._parseTime(t), this._limitMinMaxDateTime(e, !1), this._injectTimePicker()
				this._bindTimeInputNumberEvent();
			},
			_parseTime: function(e, t) {
				if (this.inst || (this.inst = $.datepicker._getInst(this.$input[0])), t || !this._defaults.timeOnly) {
					var i = $.datepicker._get(this.inst, "dateFormat");
					try {
						var s = parseDateTimeInternal(i, this._defaults.timeFormat, e, $.datepicker._getFormatConfig(this.inst), this._defaults);
						if (!s.timeObj) return !1;
						$.extend(this, s.timeObj)
					} catch (a) {
						return $.timepicker.log("Error parsing the date/time string: " + a + "\ndate/time string = " + e + "\ntimeFormat = " + this._defaults.timeFormat + "\ndateFormat = " + i), !1
					}
					return !0
				}

				var n = $.datepicker.parseTime(this._defaults.timeFormat, e, this._defaults);
				return n ? ($.extend(this, n), !0) : !1
			},
			keypressFun: function($inputTime, K) {
		        var self = this,
		        	val = $inputTime.val() - 0,
		        	min = $inputTime.attr("min") - 0,
		        	max = $inputTime.attr("max") - 0,
		        	step = $inputTime.attr("step") - 0,
		        	value = val + K * step;

		        if (value === (max + 1)) {
		            value = min;
		        }
		        if (value === (min - 1)) {
		            value = max;
		        }

		        value = value < 10 ? "0" + value : value;
		        $inputTime.val(value);
		        self._onTimeAreaChange(self.$input);
			},
			_bindTimeInputNumberEvent: function() { // 时间文本框只可以输入数字 by songxj
				var self = this;
				jQuery("input.time")
				.on("input", function() {
					jQuery(this).val(this.value.replace(/\D+/g, ""));
					var value = jQuery(this).val()-0;
					var max = jQuery(this).attr("max")-0;
					var min = jQuery(this).attr("min")-0;
					if (value && value > max) {
						jQuery(this).val(max);
					} else if (value && value < min) {
						jQuery(this).val("0" + min);
					}

					self._onTimeAreaChange(self.$input);
				})
				.on("keydown", function(event) {
					var e = event || window.event || arguments.callee.caller.arguments[0];
					if (e && e.keyCode === 38) { // 上键
						self.keypressFun(jQuery(this), 1)
					} else if (e && e.keyCode === 40) { // 上键
						self.keypressFun(jQuery(this), -1)
					}
				});
			},
			_injectTimePicker: function() {
				var e = this.inst.dpDiv,
					t = this.inst.settings,
					i = this,
					s = "",
					a = "",
					n = {},
					r = {},
					l = null;
				if (0 === e.find("div.ui-timepicker-div").length && t.showTimepicker) {
					for (var o = ' style="display:none;"', u = '<div class="ui-timepicker-div' + (t.isRTL ? " ui-timepicker-rtl" : "") + (t.timeOnly ? "" : " ui-timepicker-margin") + '"><dl class="time-list-content">' + '<dt class="ui_tpicker_time_label"' + (t.showTime ? "" : o) + ">" + t.timeText + "</dt>" + '<dd class="ui_tpicker_time"' + (t.showTime ? "" : o) + "></dd>", d = 0, m = this.units.length; m > d; d++) {
						if (s = this.units[d], a = s.substr(0, 1).toUpperCase() + s.substr(1), n[s] = parseInt(t[s + "Max"] - (t[s + "Max"] - t[s + "Min"]) % t["step" + a], 10), r[s] = 0, u += '<dt class="ui_tpicker_' + s + '_label"' + (t["show" + a] ? "" : o) + ">" + t[s + "Text"] + "</dt>" + '<dd class="ui_tpicker_' + s + '"><div class="ui_tpicker_' + s + '_slider"' + (t["show" + a] ? "" : o) + "></div>"+'<div class="ui_tpicker_'+s+'_singletime '+ (s==='hour'? (t.showHour?"":" ui-datepicker-hidden") : (s==='minute'?(t.showMinute?"":" ui-datepicker-hidden"):(s==='second'?(t.showSecond?"":" ui-datepicker-hidden"):" ui-datepicker-hidden"))) +'">0</div>', t["show" + a] && t[s + "Grid"] > 0) {
							if (u += '<div style="padding-left: 1px"><table class="ui-tpicker-grid-label"><tr>', "hour" == s)
								for (var c = t[s + "Min"]; n[s] >= c; c += parseInt(t[s + "Grid"], 10)) {
									r[s] ++;
									var h = $.datepicker.formatTime(useAmpm(t.pickerTimeFormat || t.timeFormat) ? "hht" : "HH", {
										hour: c
									}, t);
									u += '<td data-for="' + s + '">' + h + "</td>"
								} else
									for (var p = t[s + "Min"]; n[s] >= p; p += parseInt(t[s + "Grid"], 10)) r[s] ++, u += '<td data-for="' + s + '">' + (10 > p ? "0" : "") + p + "</td>";
							u += "</tr></table></div>"
						}
						u += "</dd>"
					}
					u += '<dt class="ui_tpicker_timezone_label"' + (t.showTimezone ? "" : o) + ">" + t.timezoneText + "</dt>", u += '<dd class="ui_tpicker_timezone" ' + (t.showTimezone ? "" : o) + "></dd>", u += "</dl></div>";
					var _ = $(u);
					// songxj update
					var inputHour = this.hour < 10 ? "0" + this.hour : this.hour;
					var inputMinute = this.minute < 10 ? "0" + this.minute : this.minute;
					var inputSecond = this.second < 10 ? "0" + this.second : this.second;
					if (t.showManaulTimepicker) {
						_.find(".time-list-content").hide().end().append('<div class="time-area"><span class="time-label">时间</span><span class="time-content"><input type="text" class="time hour ui-time-picker-mousewheel" min="0" max="23" step="1" maxlength="2" value="'+inputHour+'" />:<input type="text" class="time minute ui-time-picker-mousewheel" min="0" max="59" step="1" maxlength="2" value="'+inputMinute+'" />' + (t.showSecond ? ":" : "") + '<input type="text" class="time second ui-time-picker-mousewheel" min="0" max="59" step="1" maxlength="2" ' + (t.showSecond ? "" : "style='display:none;'") + ' value="'+inputSecond+'" /></span></div>');
					}

					t.timeOnly === !0 && (_.prepend('<div class="ui-widget-header ui-helper-clearfix ui-corner-all ui-timepicker-header-margin"><div class="ui-datepicker-title">' + t.timeOnlyTitle + "</div>" + "</div>"), e.find(".ui-datepicker-header, .ui-datepicker-calendar").hide());
					for (var d = 0, m = i.units.length; m > d; d++) s = i.units[d], a = s.substr(0, 1).toUpperCase() + s.substr(1), i[s + "_slider"] = i.control.create(i, _.find(".ui_tpicker_" + s + "_slider"), s, i[s], t[s + "Min"], n[s], t["step" + a]), t["show" + a] && t[s + "Grid"] > 0 && (l = 100 * r[s] * t[s + "Grid"] / (n[s] - t[s + "Min"]), _.find(".ui_tpicker_" + s + " table").css({
						width: l + "%",
						marginLeft: t.isRTL ? "0" : l / (-2 * r[s]) + "%",
						marginRight: t.isRTL ? l / (-2 * r[s]) + "%" : "0",
						borderCollapse: "collapse"
					}).find("td").click(function() {
						var e = $(this),
							t = e.html(),
							a = parseInt(t.replace(/[^0-9]/g), 10),
							n = t.replace(/[^apm]/gi),
							r = e.data("for");
						"hour" == r && (-1 !== n.indexOf("p") && 12 > a ? a += 12 : -1 !== n.indexOf("a") && 12 === a && (a = 0)), i.control.value(i, i[r + "_slider"], s, a), i._onTimeChange(), i._onSelectHandler()
					}).css({
						cursor: "pointer",
						width: 100 / r[s] + "%",
						textAlign: "center",
						overflow: "hidden"
					}));
					if (this.timezone_select = _.find(".ui_tpicker_timezone").append("<select></select>").find("select"), $.fn.append.apply(this.timezone_select, $.map(t.timezoneList, function(e) {
							return $("<option />").val("object" == typeof e ? e.value : e).text("object" == typeof e ? e.label : e)
						})), this.timezone !== void 0 && null !== this.timezone && "" !== this.timezone) {
						var f = new Date(this.inst.selectedYear, this.inst.selectedMonth, this.inst.selectedDay, 12),
							g = $.timepicker.timeZoneOffsetString(f);
						g == this.timezone ? selectLocalTimeZone(i) : this.timezone_select.val(this.timezone)
					} else this.hour !== void 0 && null !== this.hour && "" !== this.hour ? this.timezone_select.val(t.defaultTimezone) : selectLocalTimeZone(i);
					this.timezone_select.change(function() {
						i._defaults.useLocalTimezone = !1, i._onTimeChange(), i._onSelectHandler()
					});
					var _s = $("<div class='ui-datepicker-split-line " + (t.showManaulTimepicker ? "" : !t.timeOnly ? "ui-datepicker-hidden" : "ui-timepick-split-line") + "' ></div>");
					var v = e.find(".ui-datepicker-buttonpane");
					if (v.length ? v.before(_).before(_s) : e.append(_), this.$timeObj = _.find(".ui_tpicker_time"), null !== this.inst) {
						var k = this.timeDefined;
						this._onTimeChange(), this.timeDefined = k
					}
					if (this._defaults.addSliderAccess) {
						var T = this._defaults.sliderAccessArgs,
							M = this._defaults.isRTL;
						T.isRTL = M, setTimeout(function() {
							if (0 === _.find(".ui-slider-access").length) {
								_.find(".ui-slider:visible").sliderAccess(T);
								var e = _.find(".ui-slider-access:eq(0)").outerWidth(!0);
								e && _.find("table:visible").each(function() {
									var t = $(this),
										i = t.outerWidth(),
										s = ("" + t.css(M ? "marginRight" : "marginLeft")).replace("%", ""),
										a = i - e,
										n = s * a / i + "%",
										r = {
											width: a,
											marginRight: 0,
											marginLeft: 0
										};
									r[M ? "marginRight" : "marginLeft"] = n, t.css(r)
								})
							}
						}, 10)
					}
				}
			},
			_limitMinMaxDateTime: function(e, t) {
				var i = this._defaults,
					s = new Date(e.selectedYear, e.selectedMonth, e.selectedDay);
				if (this._defaults.showTimepicker) {
					if (null !== $.datepicker._get(e, "minDateTime") && void 0 !== $.datepicker._get(e, "minDateTime") && s) {
						var a = $.datepicker._get(e, "minDateTime"),
							n = new Date(a.getFullYear(), a.getMonth(), a.getDate(), 0, 0, 0, 0);
						(null === this.hourMinOriginal || null === this.minuteMinOriginal || null === this.secondMinOriginal || null === this.millisecMinOriginal) && (this.hourMinOriginal = i.hourMin, this.minuteMinOriginal = i.minuteMin, this.secondMinOriginal = i.secondMin, this.millisecMinOriginal = i.millisecMin), e.settings.timeOnly || n.getTime() == s.getTime() ? (this._defaults.hourMin = a.getHours(), this.hour <= this._defaults.hourMin ? (this.hour = this._defaults.hourMin, this._defaults.minuteMin = a.getMinutes(), this.minute <= this._defaults.minuteMin ? (this.minute = this._defaults.minuteMin, this._defaults.secondMin = a.getSeconds(), this.second <= this._defaults.secondMin ? (this.second = this._defaults.secondMin, this._defaults.millisecMin = a.getMilliseconds()) : (this.millisec < this._defaults.millisecMin && (this.millisec = this._defaults.millisecMin), this._defaults.millisecMin = this.millisecMinOriginal)) : (this._defaults.secondMin = this.secondMinOriginal, this._defaults.millisecMin = this.millisecMinOriginal)) : (this._defaults.minuteMin = this.minuteMinOriginal, this._defaults.secondMin = this.secondMinOriginal, this._defaults.millisecMin = this.millisecMinOriginal)) : (this._defaults.hourMin = this.hourMinOriginal, this._defaults.minuteMin = this.minuteMinOriginal, this._defaults.secondMin = this.secondMinOriginal, this._defaults.millisecMin = this.millisecMinOriginal)
					}
					if (null !== $.datepicker._get(e, "maxDateTime") && void 0 !== $.datepicker._get(e, "maxDateTime") && s) {
						var r = $.datepicker._get(e, "maxDateTime"),
							l = new Date(r.getFullYear(), r.getMonth(), r.getDate(), 0, 0, 0, 0);
						(null === this.hourMaxOriginal || null === this.minuteMaxOriginal || null === this.secondMaxOriginal) && (this.hourMaxOriginal = i.hourMax, this.minuteMaxOriginal = i.minuteMax, this.secondMaxOriginal = i.secondMax, this.millisecMaxOriginal = i.millisecMax), e.settings.timeOnly || l.getTime() == s.getTime() ? (this._defaults.hourMax = r.getHours(), this.hour >= this._defaults.hourMax ? (this.hour = this._defaults.hourMax, this._defaults.minuteMax = r.getMinutes(), this.minute >= this._defaults.minuteMax ? (this.minute = this._defaults.minuteMax, this._defaults.secondMax = r.getSeconds(), this.second >= this._defaults.secondMax ? (this.second = this._defaults.secondMax, this._defaults.millisecMax = r.getMilliseconds()) : (this.millisec > this._defaults.millisecMax && (this.millisec = this._defaults.millisecMax), this._defaults.millisecMax = this.millisecMaxOriginal)) : (this._defaults.secondMax = this.secondMaxOriginal, this._defaults.millisecMax = this.millisecMaxOriginal)) : (this._defaults.minuteMax = this.minuteMaxOriginal, this._defaults.secondMax = this.secondMaxOriginal, this._defaults.millisecMax = this.millisecMaxOriginal)) : (this._defaults.hourMax = this.hourMaxOriginal, this._defaults.minuteMax = this.minuteMaxOriginal, this._defaults.secondMax = this.secondMaxOriginal, this._defaults.millisecMax = this.millisecMaxOriginal)
					}
					if (void 0 !== t && t === !0) {
						var o = parseInt(this._defaults.hourMax - (this._defaults.hourMax - this._defaults.hourMin) % this._defaults.stepHour, 10),
							u = parseInt(this._defaults.minuteMax - (this._defaults.minuteMax - this._defaults.minuteMin) % this._defaults.stepMinute, 10),
							d = parseInt(this._defaults.secondMax - (this._defaults.secondMax - this._defaults.secondMin) % this._defaults.stepSecond, 10),
							m = parseInt(this._defaults.millisecMax - (this._defaults.millisecMax - this._defaults.millisecMin) % this._defaults.stepMillisec, 10);
						this.hour_slider && (this.control.options(this, this.hour_slider, "hour", {
							min: this._defaults.hourMin,
							max: o
						}), this.control.value(this, this.hour_slider, "hour", this.hour - this.hour % this._defaults.stepHour)), this.minute_slider && (this.control.options(this, this.minute_slider, "minute", {
							min: this._defaults.minuteMin,
							max: u
						}), this.control.value(this, this.minute_slider, "minute", this.minute - this.minute % this._defaults.stepMinute)), this.second_slider && (this.control.options(this, this.second_slider, "second", {
							min: this._defaults.secondMin,
							max: d
						}), this.control.value(this, this.second_slider, "second", this.second - this.second % this._defaults.stepSecond)), this.millisec_slider && (this.control.options(this, this.millisec_slider, "millisec", {
							min: this._defaults.millisecMin,
							max: m
						}), this.control.value(this, this.millisec_slider, "millisec", this.millisec - this.millisec % this._defaults.stepMillisec))
					}
				}
			},
			_onTimeChange: function() {
				var e = this.hour_slider ? this.control.value(this, this.hour_slider, "hour") : !1,
					t = this.minute_slider ? this.control.value(this, this.minute_slider, "minute") : !1,
					i = this.second_slider ? this.control.value(this, this.second_slider, "second") : !1,
					s = this.millisec_slider ? this.control.value(this, this.millisec_slider, "millisec") : !1,
					a = this.timezone_select ? this.timezone_select.val() : !1,
					n = this._defaults,
					r = n.pickerTimeFormat || n.timeFormat,
					l = n.pickerTimeSuffix || n.timeSuffix;

				"object" == typeof e && (e = !1), "object" == typeof t && (t = !1), "object" == typeof i && (i = !1), "object" == typeof s && (s = !1), "object" == typeof a && (a = !1), e !== !1 && (e = parseInt(e, 10)), t !== !1 && (t = parseInt(t, 10)), i !== !1 && (i = parseInt(i, 10)), s !== !1 && (s = parseInt(s, 10));
				var o = n[12 > e ? "amNames" : "pmNames"][0],
					u = e != this.hour || t != this.minute || i != this.second || s != this.millisec || this.ampm.length > 0 && 12 > e != (-1 !== $.inArray(this.ampm.toUpperCase(), this.amNames)) || null === this.timezone && a != this.defaultTimezone || null !== this.timezone && a != this.timezone;
				u && (e !== !1 && (this.hour = e), t !== !1 && (this.minute = t), i !== !1 && (this.second = i), s !== !1 && (this.millisec = s), a !== !1 && (this.timezone = a), this.inst || (this.inst = $.datepicker._getInst(this.$input[0])), this._limitMinMaxDateTime(this.inst, !0)), useAmpm(n.timeFormat) && (this.ampm = o), this.formattedTime = $.datepicker.formatTime(n.timeFormat, this, n),this._updateSingleTime(e,t,i), this.$timeObj && (r === n.timeFormat ? this.$timeObj.text(this.formattedTime + l) : this.$timeObj.text($.datepicker.formatTime(r, this, n) + l)), this.timeDefined = !0, u && this._updateDateTime()
			},
			_getCurrentDateOnIsEmpty: function() { // 获取当前日期  by songxj
				var date = new Date(),
					year = date.getFullYear();
					month = date.getMonth() + 1,
					day = date.getDate();
					month = month<10?"0"+month:month;
					day = day<10?"0"+day:day;
				return year + "-" + month + "-" + day;
			},
			_onTimeAreaChange: function($input) { // time改变时 by songxj
				var oldVal = $input.val(),
					oldVal = oldVal.split(" "),
					oldDate = oldVal[0] || this._getCurrentDateOnIsEmpty(),
					$content = jQuery(".ui-timepicker-div"),
					newHour = $content.find(".hour").val()-0,
					newMinute = $content.find(".minute").val()-0,
					newSecond = $content.find(".second").val()-0,
					newHour = newHour < 10 ? "0" + newHour : newHour,
					newMinute = newMinute < 10 ? "0" + newMinute : newMinute,
					newSecond = newSecond < 10 ? "0" + newSecond : newSecond,
					newTime = this.inst.settings.showSecond ? (newHour + ":" + newMinute + ":" + newSecond) : (newHour + ":" + newMinute);
					oldDate = this._defaults.timeOnly?"":oldDate;
				$input.val(oldDate + " " + newTime);
				this.formattedTime = newTime;
			},
			//更新拖拽条右侧的时间，by mayue on 2015/3/17
			_updateSingleTime:function(h,m,s){
				$('.ui_tpicker_hour_singletime').text((h < 10) ? "0" + h : h);
				$('.ui_tpicker_minute_singletime').text((m < 10) ? "0" + m : m);
				$('.ui_tpicker_second_singletime').text((s < 10) ? "0" + s : s);
			},
			_onSelectHandler: function() {
				var e = this._defaults.onSelect || this.inst.settings.onSelect,
					t = this.$input ? this.$input[0] : null;
				e && t && e.apply(t, [this.formattedDateTime, this])
			},
			_updateDateTime: function(e) {
				e = this.inst || e;
				var t = $.datepicker._daylightSavingAdjust(new Date(e.selectedYear, e.selectedMonth, e.selectedDay)),
					i = $.datepicker._get(e, "dateFormat"),
					s = $.datepicker._getFormatConfig(e),
					a = null !== t && this.timeDefined;
				this.formattedDate = $.datepicker.formatDate(i, null === t ? new Date : t, s);
				var n = this.formattedDate;
				if ("" == e.lastVal && (e.currentYear = e.selectedYear, e.currentMonth = e.selectedMonth, e.currentDay = e.selectedDay), this._defaults.timeOnly === !0 ? n = this.formattedTime : this._defaults.timeOnly !== !0 && (this._defaults.alwaysSetTime || a) && (n += this._defaults.separator + this.formattedTime + this._defaults.timeSuffix), this.formattedDateTime = n, this._defaults.showTimepicker)
					if (this.$altInput && this._defaults.altFieldTimeOnly === !0) this.$altInput.val(this.formattedTime), this.$input.val(this.formattedDate);
					else if (this.$altInput) {
					this.$input.val(n);
					var r = "",
						l = this._defaults.altSeparator ? this._defaults.altSeparator : this._defaults.separator,
						o = this._defaults.altTimeSuffix ? this._defaults.altTimeSuffix : this._defaults.timeSuffix;
					r = this._defaults.altFormat ? $.datepicker.formatDate(this._defaults.altFormat, null === t ? new Date : t, s) : this.formattedDate, r && (r += l), r += this._defaults.altTimeFormat ? $.datepicker.formatTime(this._defaults.altTimeFormat, this, this._defaults) + o : this.formattedTime + o, this.$altInput.val(r)
				} else this.$input.val(n);
				else this.$input.val(this.formattedDate);
				this.$input.trigger("change")
			},
			_onFocus: function() {
				if (!this.$input.val() && this._defaults.defaultValue) {
					this.$input.val(this._defaults.defaultValue);
					var e = $.datepicker._getInst(this.$input.get(0)),
						t = $.datepicker._get(e, "timepicker");
					if (t && t._defaults.timeOnly && e.input.val() != e.lastVal) try {
						$.datepicker._updateDatepicker(e)
					} catch (i) {
						$.timepicker.log(i)
					}
				}
			},
			_controls: {
				slider: {
					create: function(e, t, i, s, a, n, r) {
						var l = e._defaults.isRTL;
						return t.prop("slide", null).slider({
							orientation: "horizontal",
							value: l ? -1 * s : s,
							min: l ? -1 * n : a,
							max: l ? -1 * a : n,
							step: r,
							slide: function(t, s) {
								e.control.value(e, $(this), i, l ? -1 * s.value : s.value), e._onTimeChange()
							},
							stop: function() {
								e._onSelectHandler()
							}
						})
					},
					options: function(e, t, i, s, a) {
						if (e._defaults.isRTL) {
							if ("string" == typeof s) return "min" == s || "max" == s ? void 0 !== a ? t.slider(s, -1 * a) : Math.abs(t.slider(s)) : t.slider(s);
							var n = s.min,
								r = s.max;
							return s.min = s.max = null, void 0 !== n && (s.max = -1 * n), void 0 !== r && (s.min = -1 * r), t.slider(s)
						}
						return "string" == typeof s && void 0 !== a ? t.slider(s, a) : t.slider(s)
					},
					value: function(e, t, i, s) {
						return e._defaults.isRTL ? void 0 !== s ? t.slider("value", -1 * s) : Math.abs(t.slider("value")) : void 0 !== s ? t.slider("value", s) : t.slider("value")
					}
				},
				select: {
					create: function(e, t, i, s, a, n, r) {
						var l = '<select class="ui-timepicker-select" data-unit="' + i + '" data-min="' + a + '" data-max="' + n + '" data-step="' + r + '">'; - 1 !== e._defaults.timeFormat.indexOf("t") ? "toLowerCase" : "toUpperCase";
						for (var o = a; n >= o; o += r) l += '<option value="' + o + '"' + (o == s ? " selected" : "") + ">", l += "hour" == i && useAmpm(e._defaults.pickerTimeFormat || e._defaults.timeFormat) ? $.datepicker.formatTime("hh TT", {
							hour: o
						}, e._defaults) : "millisec" == i || o >= 10 ? o : "0" + ("" + o), l += "</option>";
						return l += "</select>", t.children("select").remove(), $(l).appendTo(t).change(function() {
							e._onTimeChange(), e._onSelectHandler()
						}), t
					},
					options: function(e, t, i, s, a) {
						var n = {},
							r = t.children("select");
						if ("string" == typeof s) {
							if (void 0 === a) return r.data(s);
							n[s] = a
						} else n = s;
						return e.control.create(e, t, r.data("unit"), r.val(), n.min || r.data("min"), n.max || r.data("max"), n.step || r.data("step"))
					},
					value: function(e, t, i, s) {
						var a = t.children("select");
						return void 0 !== s ? a.val(s) : a.val()
					}
				}
			}
		}), $.fn.extend({
			timepicker: function(e) {
				e = e || {};
				var t = Array.prototype.slice.call(arguments);
				return "object" == typeof e && (t[0] = $.extend(e, {
					timeOnly: !0
				})), $(this).each(function() {
					$.fn.datetimepicker.apply($(this), t)
				})
			},
			datetimepicker: function(e) {
				e = e || {};
				var t = arguments;
				return "string" == typeof e ? "getDate" == e ? $.fn.datepicker.apply($(this[0]), t) : this.each(function() {
					var e = $(this);
					e.datepicker.apply(e, t)
				}) : this.each(function() {
					var t = $(this);
					t.datepicker($.timepicker._newInst(t, e)._defaults)
				})
			},
			datetimepickerSmall: function(OPTION) { // by songxj
				/**
				 * [getValue 获取时间的函数]
				 * @author huzc
				 * @date   2015-07-09
				 * @return {[type]}   [description]
				 */
				var options ={};
				if(OPTION){
					options.isShowDay = OPTION.isShowDay;
					options.isShowTime = OPTION.isShowTime;
					options.callback = OPTION.callback || jQuery.noop
				}
				var getValue = function($input,callback) {

					var YEAR = jQuery(".datetime-picker-small-panel ").find("input.year").val()-0,
						MONTH = jQuery(".datetime-picker-small-panel ").find("input.month").val()-0,
						DAY = jQuery(".datetime-picker-small-panel ").find("input.date").val()-0,
						MONTH = MONTH < 10 &&  MONTH > 0 ? "0" + MONTH : MONTH,
						DAY = DAY < 10 &&  DAY > 0 ? "0" + DAY : DAY,
						HOUR = jQuery(".datetime-picker-small-panel .hour-minute-second ").find(".preshow:first").html(),
						MINUTE = jQuery(".datetime-picker-small-panel .hour-minute-second ").find(".preshow:eq(1)").html(),
						SECOND = jQuery(".datetime-picker-small-panel .hour-minute-second ").find(".preshow:last").html(),
						$content = jQuery(".datetime-picker-small-panel"),
						newHour = $content.find(".time.hour").val()-0,
						newMinute = $content.find(".time.minute").val()-0,
						newSecond = $content.find(".time.second").val()-0,
						newHour = newHour < 10 ? "0" + newHour : newHour,
						newMinute = newMinute < 10 ? "0" + newMinute : newMinute,
						newSecond = newSecond < 10 ? "0" + newSecond : newSecond,
						newTime = newHour + ":" + newMinute + ":" + newSecond;
					if (YEAR && MONTH && DAY && newHour && newMinute && newSecond) {
						$input.val(YEAR + "-" + MONTH + "-" + DAY + " " + newTime);
					}
					
					if(options.isShowDay){
						callback && callback();
						return $input.val(YEAR + "-" + MONTH);
					}
					
					//inputNode.val(YEAR + "-" + MONTH + "-" + DAY + " " + HOUR + ":" + MINUTE + ":" + SECOND);
				};
				var bindEvents = function($input, hour, minute, second) {
					//确定按钮
					jQuery(".datetime-picker-small-panel").on("click", ".sure", function() {
						getValue($input);
						jQuery(".datetime-picker-small-panel").hide();
						options.callback && options.callback();
					});

					//点击生成当前时刻
					jQuery(".datetime-picker-small-panel").on("click", ".now", function() {
						var currentDate = new Date(),
							currentHour = currentDate.getHours(),
							currentMinute = currentDate.getMinutes(),
							currentSecond = currentDate.getSeconds(),
							currentHour = currentHour < 10 ? "0" + currentHour : currentHour,
							currentMinute = currentMinute < 10 ? "0" + currentMinute : currentMinute,
							currentSecond = currentSecond < 10 ? "0" + currentSecond : currentSecond;


						jQuery(".datetime-picker-small-panel ").find("input.year").val(currentDate.getFullYear());
						jQuery(".datetime-picker-small-panel ").find("input.month").val(currentDate.getMonth() + 1);
						
						jQuery(".datetime-picker-small-panel ").find("input.date").val(currentDate.getDate());
						
						
						jQuery(".datetime-picker-small-panel #slider-hour").slider({
							value: currentHour
						});
						jQuery(".datetime-picker-small-panel #slider-minute").slider({
							value: currentMinute
						});
						jQuery(".datetime-picker-small-panel #slider-second").slider({
							value: currentSecond
						});

						jQuery(".datetime-picker-small-panel .time.hour").val(currentHour);
						jQuery(".datetime-picker-small-panel .time.minute").val(currentMinute);
						jQuery(".datetime-picker-small-panel .time.second").val(currentSecond);

						jQuery(".datetime-picker-small-panel .hour-minute-second ").find(".preshow:first").html(currentHour < 10 ? "0" + currentHour : currentHour);
						jQuery(".datetime-picker-small-panel .hour-minute-second ").find(".preshow:eq(1)").html(currentMinute < 10 ? "0" + currentMinute : currentMinute);
						jQuery(".datetime-picker-small-panel .hour-minute-second ").find(".preshow:last").html(currentSecond < 10 ? "0" + currentSecond : currentSecond);

						getValue($input,function(){
							jQuery(".datetime-picker-small-panel").find(".sure").click();
						});
					});

					jQuery(".datetime-picker-small-panel").hover(function(e) {
						jQuery(this).removeClass("leave");
					}, function() {
						jQuery(this).addClass("leave");
					});

					var keypressFun = function($inputTime, K) {
				        var val = $inputTime.val() - 0,
				        	min = $inputTime.attr("min") - 0,
				        	max = $inputTime.attr("max") - 0,
				        	step = $inputTime.attr("step") - 0,
				        	value = val + K * step;

				        if (value === (max + 1)) {
				            value = min;
				        }
				        if (value === (min - 1)) {
				            value = max;
				        }

				        value = value < 10 ? "0" + value : value;
				        $inputTime.val(value).trigger("input");
					}
					var $inputTime = jQuery(".datetime-picker-small-panel input.time");
					// 时间文本框只可以输入数字 by songxj
					$inputTime.on("input", function(){
						jQuery(this).val(this.value.replace(/\D+/g, ""));
						var value = jQuery(this).val()-0;
						var max = jQuery(this).attr("max")-0;
						var min = jQuery(this).attr("min")-0;
						if (value && value > max) {
							jQuery(this).val(max);
						} else if (value && value < min) {
							jQuery(this).val("0" + min);
						}

						getValue($input);
					});
					$inputTime.keydown(function(event) {
						var e = event || window.event || arguments.callee.caller.arguments[0];
						if (e && e.keyCode === 38) { // 上键
							keypressFun(jQuery(this), 1)
						} else if (e && e.keyCode === 40) { // 下键
							keypressFun(jQuery(this), -1)
						}
					});

					//小时滑动条
					jQuery(".datetime-picker-small-panel #slider-hour").slider({
						orientation: "horizontal",
						range: "min",
						max: 24,
						min: 0,
						value: hour,
						slide: function(event, ui) {
							var now = ui.value < 10 ? "0" + ui.value : ui.value;
							$input.next().html(now);
							getValue($input);
						}
					});

					//分钟滑动条
					jQuery(".datetime-picker-small-panel #slider-minute").slider({
						orientation: "horizontal",
						range: "min",
						max: 59,
						min: 0,
						value: minute,
						slide: function(event, ui) {
							var now = ui.value < 10 ? "0" + ui.value : ui.value;
							$input.next().html(now);
							getValue($input);
						}
					});

					//秒滑动条
					jQuery(".datetime-picker-small-panel #slider-second").slider({
						orientation: "horizontal",
						range: "min",
						max: 59,
						min: 0,
						value: second,
						slide: function(event, ui) {
							var now = ui.value < 10 ? "0" + ui.value : ui.value;
							$input.next().html(now);
							getValue($input);
						}
					});

					//加载滚轮插件的js
					jQuery.getScript('/libs/jquery/jquery-rollValue.js', function(data, textStatus) {
						if (textStatus === "success") {
							jQuery(".datetime-picker-small-panel").find("input.mydate,input.time").each(function(k) {
								jQuery(this).rollValue({
									minValue: jQuery(this).attr("min") - 0,
									maxValue: jQuery(this).attr("max") - 0,
									step: 1,
									callback: function() {
										getValue($input);
									}
								});
							})
						}
					});
				};

				if (!$.fn.datetimepickerSmall.inited) {
					jQuery(document).on("click", function(e) {
						if (jQuery(".datetime-picker-small-panel").hasClass("leave")) {
							if (jQuery(e.target).hasClass("datetime-picker-small")) {
								return;
							}

							jQuery(".datetime-picker-small-panel").remove();
						}
					});

					$.fn.datetimepickerSmall.inited = true;
				}
				this.each(function() {
					var $input = $(this);
					$input.off("focus").on("focus", function() {
						var inputValue = $input.val(),
							inputValue = inputValue.split(" "),
							date = inputValue[0],
							time = inputValue[1],
							hour,minute,second,
							currName,
							date = date.split("-");
							if(time!=="" &&  time !==undefined){
								time = time.split(":");
								hour = time[0];
								minute = time[1];
								second = time[2];
							}else{
								options.isShowTime = "hide";
								hour ="00";
								minute = "00";
								second = "00";
							}
						if(options.isShowDay){
							currName = "当前月";
						}else{
							currName = "当前时间";
						}
						var html = [
							'<div class="datetime-picker-small-panel dateBar" tabindex="0">',
							'<div class="year-month-day">',
							'<span class="item year"><input type="number1" maxLength="4" min="1979" max="2100" step="1" class="year first mydate mousewheelnum"  value="' + date[0] + '" readonly1/>年</span>',
							'<span class="item"><input type="number1" maxLength="2" min="1" max="12" step="1" class="month mydate mousewheelnum" value="' + date[1] + '" readonly1/>月</span>',
							'<span class="item '+options.isShowDay+'"><input type="number1" maxLength="2" min="1" max="31" step="1" class="date mydate mousewheelnum" value="' + date[2] + '" minValue="1" readonly1 />日</span>',
							'</div>',
							'<div class="hour-minute-second bar" style="display:none;">',
							'<div class="prbar">时:<div class="growbar" id="slider-hour"></div><span class="preshow">' + hour + '</span></div>',
							'<div class="prbar">分:<div class="growbar" id="slider-minute"></div><span class="preshow">' + minute + '</span></div>',
							'<div class="prbar">秒:<div class="growbar" id="slider-second"></div><span class="preshow">' + second + '</span></div>',
							'</div>',
							'<div class="time-area '+options.isShowTime+'"><span class="time-label">时间</span><span class="time-content"><input type="text" class="time hour ui-time-picker-mousewheel" min="0" max="23" step="1" maxlength="2" value="'+hour+'" />:<input type="text" class="time minute ui-time-picker-mousewheel" min="0" max="59" step="1" maxlength="2" value="'+minute+'" />:<input type="text" class="time second ui-time-picker-mousewheel" min="0" max="59" step="1" maxlength="2" value="'+second+'" /></span></div>',
							'<div class="sure-cancle" style="margin-top:10px"><span class="now">'+currName+'</span> <button  class="sure ui button blue">确定</button></div>',
							'</div>'
						].join("");

						if (jQuery(".datetime-picker-small-panel")[0]) {
							jQuery(".datetime-picker-small-panel").remove();
						}

						jQuery(document.body).append(html);
						var x = $input.offset().left;
						var y =options.isShowDay?$input.offset().top+8:$input.offset().top;
						var w = $input.width();
						var h = $input.height();
						//定位时间控件的位置
						jQuery(".datetime-picker-small-panel").css({
							"left": x,
							"top": y + h + 5,
							"width":options.isShowDay?w+12:"auto",
							"height": "auto",
							"position": "absolute"
						}).focus();
						bindEvents($input, hour, minute, second);
					});

					// if ($input.is(":focus") && jQuery(".datetime-picker-small-panel").length === 0) {
					// 	$input.trigger("focus");
					// }
				});
			}
		}), $.datepicker.parseDateTime = function(e, t, i, s, a) {
			var n = parseDateTimeInternal(e, t, i, s, a);
			if (n.timeObj) {
				var r = n.timeObj;
				n.date.setHours(r.hour, r.minute, r.second, r.millisec)
			}
			return n.date
		}, $.datepicker.parseTime = function(e, t, i) {
			var s = extendRemove(extendRemove({}, $.timepicker._defaults), i || {}),
				a = function(e, t, i) {
					var s, a = function(e, t) {
							var i = [];
							return e && $.merge(i, e), t && $.merge(i, t), i = $.map(i, function(e) {
								return e.replace(/[.*+?|()\[\]{}\\]/g, "\\$&")
							}), "(" + i.join("|") + ")?"
						},
						n = function(e) {
							var t = e.toLowerCase().match(/(h{1,2}|m{1,2}|s{1,2}|l{1}|t{1,2}|z|'.*?')/g),
								i = {
									h: -1,
									m: -1,
									s: -1,
									l: -1,
									t: -1,
									z: -1
								};
							if (t)
								for (var s = 0; t.length > s; s++) - 1 == i[("" + t[s]).charAt(0)] && (i[("" + t[s]).charAt(0)] = s + 1);
							return i
						},
						r = "^" + ("" + e).replace(/([hH]{1,2}|mm?|ss?|[tT]{1,2}|[lz]|'.*?')/g, function(e) {
							var t = e.length;
							switch (e.charAt(0).toLowerCase()) {
								case "h":
									return 1 === t ? "(\\d?\\d)" : "(\\d{" + t + "})";
								case "m":
									return 1 === t ? "(\\d?\\d)" : "(\\d{" + t + "})";
								case "s":
									return 1 === t ? "(\\d?\\d)" : "(\\d{" + t + "})";
								case "l":
									return "(\\d?\\d?\\d)";
								case "z":
									return "(z|[-+]\\d\\d:?\\d\\d|\\S+)?";
								case "t":
									return a(i.amNames, i.pmNames);
								default:
									return "(" + e.replace(/\'/g, "").replace(/(\.|\$|\^|\\|\/|\(|\)|\[|\]|\?|\+|\*)/g, function(e) {
										return "\\" + e
									}) + ")?"
							}
						}).replace(/\s/g, "\\s?") + i.timeSuffix + "$",
						l = n(e),
						o = "";
					s = t.match(RegExp(r, "i"));
					var u = {
						hour: 0,
						minute: 0,
						second: 0,
						millisec: 0
					};
					if (s) {
						if (-1 !== l.t && (void 0 === s[l.t] || 0 === s[l.t].length ? (o = "", u.ampm = "") : (o = -1 !== $.inArray(s[l.t].toUpperCase(), i.amNames) ? "AM" : "PM", u.ampm = i["AM" == o ? "amNames" : "pmNames"][0])), -1 !== l.h && (u.hour = "AM" == o && "12" == s[l.h] ? 0 : "PM" == o && "12" != s[l.h] ? parseInt(s[l.h], 10) + 12 : Number(s[l.h])), -1 !== l.m && (u.minute = Number(s[l.m])), -1 !== l.s && (u.second = Number(s[l.s])), -1 !== l.l && (u.millisec = Number(s[l.l])), -1 !== l.z && void 0 !== s[l.z]) {
							var d = s[l.z].toUpperCase();
							switch (d.length) {
								case 1:
									d = i.timezoneIso8601 ? "Z" : "+0000";
									break;
								case 5:
									i.timezoneIso8601 && (d = "0000" == d.substring(1) ? "Z" : d.substring(0, 3) + ":" + d.substring(3));
									break;
								case 6:
									i.timezoneIso8601 ? "00:00" == d.substring(1) && (d = "Z") : d = "Z" == d || "00:00" == d.substring(1) ? "+0000" : d.replace(/:/, "")
							}
							u.timezone = d
						}
						return u
					}
					return !1
				},
				n = function(e, t, i) {
					try {
						var s = new Date("2012-01-01 " + t);
						if (isNaN(s.getTime()) && (s = new Date("2012-01-01T" + t), isNaN(s.getTime()) && (s = new Date("01/01/2012 " + t), isNaN(s.getTime())))) throw "Unable to parse time with native Date: " + t;
						return {
							hour: s.getHours(),
							minute: s.getMinutes(),
							second: s.getSeconds(),
							millisec: s.getMilliseconds(),
							timezone: $.timepicker.timeZoneOffsetString(s)
						}
					} catch (n) {
						try {
							return a(e, t, i)
						} catch (r) {
							$.timepicker.log("Unable to parse \ntimeString: " + t + "\ntimeFormat: " + e)
						}
					}
					return !1
				};
			return "function" == typeof s.parse ? s.parse(e, t, s) : "loose" === s.parse ? n(e, t, s) : a(e, t, s)
		}, $.datepicker.formatTime = function(e, t, i) {
			i = i || {}, i = $.extend({}, $.timepicker._defaults, i), t = $.extend({
				hour: 0,
				minute: 0,
				second: 0,
				millisec: 0,
				timezone: "+0000"
			}, t);
			var s = e,
				a = i.amNames[0],
				n = parseInt(t.hour, 10);
			return n > 11 && (a = i.pmNames[0]), s = s.replace(/(?:HH?|hh?|mm?|ss?|[tT]{1,2}|[lz]|('.*?'|".*?"))/g, function(e) {
				switch (e) {
					case "HH":
						return ("0" + n).slice(-2);
					case "H":
						return n;
					case "hh":
						return ("0" + convert24to12(n)).slice(-2);
					case "h":
						return convert24to12(n);
					case "mm":
						return ("0" + t.minute).slice(-2);
					case "m":
						return t.minute;
					case "ss":
						return ("0" + t.second).slice(-2);
					case "s":
						return t.second;
					case "l":
						return ("00" + t.millisec).slice(-3);
					case "z":
						return null === t.timezone ? i.defaultTimezone : t.timezone;
					case "T":
						return a.charAt(0).toUpperCase();
					case "TT":
						return a.toUpperCase();
					case "t":
						return a.charAt(0).toLowerCase();
					case "tt":
						return a.toLowerCase();
					default:
						return e.replace(/\'/g, "") || "'"
				}
			}), s = $.trim(s)
		}, $.datepicker._base_selectDate = $.datepicker._selectDate, $.datepicker._selectDate = function(e, t) {
			var i = this._getInst($(e)[0]),
				s = this._get(i, "timepicker");
			s ? (s._limitMinMaxDateTime(i, !0), i.inline = i.stay_open = !0, this._base_selectDate(e, t), i.inline = i.stay_open = !1, this._notifyChange(i), this._updateDatepicker(i)) : this._base_selectDate(e, t)
		}, $.datepicker._base_updateDatepicker = $.datepicker._updateDatepicker, $.datepicker._updateDatepicker = function(e) {
			var t = e.input[0];
			if (!($.datepicker._curInst && $.datepicker._curInst != e && $.datepicker._datepickerShowing && $.datepicker._lastInput != t || "boolean" == typeof e.stay_open && e.stay_open !== !1)) {
				this._base_updateDatepicker(e);
				var i = this._get(e, "timepicker");
				i && i._addTimePicker(e)
			}
		}, $.datepicker._base_doKeyPress = $.datepicker._doKeyPress, $.datepicker._doKeyPress = function(e) {
			var t = $.datepicker._getInst(e.target),
				i = $.datepicker._get(t, "timepicker");
			if (i && $.datepicker._get(t, "constrainInput")) {
				var s = useAmpm(i._defaults.timeFormat),
					a = $.datepicker._possibleChars($.datepicker._get(t, "dateFormat")),
					n = ("" + i._defaults.timeFormat).replace(/[hms]/g, "").replace(/TT/g, s ? "APM" : "").replace(/Tt/g, s ? "AaPpMm" : "").replace(/tT/g, s ? "AaPpMm" : "").replace(/T/g, s ? "AP" : "").replace(/tt/g, s ? "apm" : "").replace(/t/g, s ? "ap" : "") + " " + i._defaults.separator + i._defaults.timeSuffix + (i._defaults.showTimezone ? i._defaults.timezoneList.join("") : "") + i._defaults.amNames.join("") + i._defaults.pmNames.join("") + a,
					r = String.fromCharCode(void 0 === e.charCode ? e.keyCode : e.charCode);
				return e.ctrlKey || " " > r || !a || n.indexOf(r) > -1
			}
			return $.datepicker._base_doKeyPress(e)
		}, $.datepicker._base_updateAlternate = $.datepicker._updateAlternate, $.datepicker._updateAlternate = function(e) {
			var t = this._get(e, "timepicker");
			if (t) {
				var i = t._defaults.altField;
				if (i) {
					var s = (t._defaults.altFormat || t._defaults.dateFormat, this._getDate(e)),
						a = $.datepicker._getFormatConfig(e),
						n = "",
						r = t._defaults.altSeparator ? t._defaults.altSeparator : t._defaults.separator,
						l = t._defaults.altTimeSuffix ? t._defaults.altTimeSuffix : t._defaults.timeSuffix,
						o = null !== t._defaults.altTimeFormat ? t._defaults.altTimeFormat : t._defaults.timeFormat;
					n += $.datepicker.formatTime(o, t, t._defaults) + l, t._defaults.timeOnly || t._defaults.altFieldTimeOnly || null === s || (n = t._defaults.altFormat ? $.datepicker.formatDate(t._defaults.altFormat, s, a) + r + n : t.formattedDate + r + n), $(i).val(n)
				}
			} else $.datepicker._base_updateAlternate(e)
		}, $.datepicker._base_doKeyUp = $.datepicker._doKeyUp, $.datepicker._doKeyUp = function(e) {
			var t = $.datepicker._getInst(e.target),
				i = $.datepicker._get(t, "timepicker");
			if (i && i._defaults.timeOnly && t.input.val() != t.lastVal) try {
				$.datepicker._updateDatepicker(t)
			} catch (s) {
				$.timepicker.log(s)
			}
			return $.datepicker._base_doKeyUp(e)
		}, $.datepicker._base_gotoToday = $.datepicker._gotoToday, $.datepicker._gotoToday = function(e) {
			var t = this._getInst($(e)[0]),
				i = t.dpDiv;
			this._base_gotoToday(e);
			var s = this._get(t, "timepicker");
			selectLocalTimeZone(s);
			var a = new Date;
			this._setTime(t, a), $(".ui-datepicker-today", i).click()
		}, $.datepicker._disableTimepickerDatepicker = function(e) {
			var t = this._getInst(e);
			if (t) {
				var i = this._get(t, "timepicker");
				$(e).datepicker("getDate"), i && (i._defaults.showTimepicker = !1, i._updateDateTime(t))
			}
		}, $.datepicker._enableTimepickerDatepicker = function(e) {
			var t = this._getInst(e);
			if (t) {
				var i = this._get(t, "timepicker");
				$(e).datepicker("getDate"), i && (i._defaults.showTimepicker = !0, i._addTimePicker(t), i._updateDateTime(t))
			}
		}, $.datepicker._setTime = function(e, t) {
			var i = this._get(e, "timepicker");
			if (i) {
				var s = i._defaults;
				i.hour = t ? t.getHours() : s.hour, i.minute = t ? t.getMinutes() : s.minute, i.second = t ? t.getSeconds() : s.second, i.millisec = t ? t.getMilliseconds() : s.millisec, i._limitMinMaxDateTime(e, !0), i._onTimeChange(), i._updateDateTime(e)
			}
		}, $.datepicker._setTimeDatepicker = function(e, t, i) {
			var s = this._getInst(e);
			if (s) {
				var a = this._get(s, "timepicker");
				if (a) {
					this._setDateFromField(s);
					var n;
					t && ("string" == typeof t ? (a._parseTime(t, i), n = new Date, n.setHours(a.hour, a.minute, a.second, a.millisec)) : n = new Date(t.getTime()), "Invalid Date" == "" + n && (n = void 0), this._setTime(s, n))
				}
			}
		}, $.datepicker._base_setDateDatepicker = $.datepicker._setDateDatepicker, $.datepicker._setDateDatepicker = function(e, t) {
			var i = this._getInst(e);
			if (i) {
				var s = t instanceof Date ? new Date(t.getTime()) : t;
				this._updateDatepicker(i), this._base_setDateDatepicker.apply(this, arguments), this._setTimeDatepicker(e, s, !0)
			}
		}, $.datepicker._base_getDateDatepicker = $.datepicker._getDateDatepicker, $.datepicker._getDateDatepicker = function(e, t) {
			var i = this._getInst(e);
			if (i) {
				var s = this._get(i, "timepicker");
				if (s) {
					void 0 === i.lastVal && this._setDateFromField(i, t);
					var a = this._getDate(i);
					return a && s._parseTime($(e).val(), s.timeOnly) && a.setHours(s.hour, s.minute, s.second, s.millisec), a
				}
				return this._base_getDateDatepicker(e, t)
			}
		}, $.datepicker._base_parseDate = $.datepicker.parseDate, $.datepicker.parseDate = function(e, t, i) {
			var s;
			try {
				s = this._base_parseDate(e, t, i)
			} catch (a) {
				s = this._base_parseDate(e, t.substring(0, t.length - (a.length - a.indexOf(":") - 2)), i), $.timepicker.log("Error parsing the date string: " + a + "\ndate string = " + t + "\ndate format = " + e)
			}
			return s
		}, $.datepicker._base_formatDate = $.datepicker._formatDate, $.datepicker._formatDate = function(e) {
			var t = this._get(e, "timepicker");
			return t ? (t._updateDateTime(e), t.$input.val()) : this._base_formatDate(e)
		}, $.datepicker._base_optionDatepicker = $.datepicker._optionDatepicker, $.datepicker._optionDatepicker = function(e, t, i) {
			var s, a = this._getInst(e);
			if (!a) return null;
			var n = this._get(a, "timepicker");
			if (n) {
				var r, l = null,
					o = null,
					u = null,
					d = n._defaults.evnts,
					m = {};
				if ("string" == typeof t) {
					if ("minDate" === t || "minDateTime" === t) l = i;
					else if ("maxDate" === t || "maxDateTime" === t) o = i;
					else if ("onSelect" === t) u = i;
					else if (d.hasOwnProperty(t)) {
						if (i === void 0) return d[t];
						m[t] = i, s = {}
					}
				} else if ("object" == typeof t) {
					t.minDate ? l = t.minDate : t.minDateTime ? l = t.minDateTime : t.maxDate ? o = t.maxDate : t.maxDateTime && (o = t.maxDateTime);
					for (r in d) d.hasOwnProperty(r) && t[r] && (m[r] = t[r])
				}
				for (r in m) m.hasOwnProperty(r) && (d[r] = m[r], s || (s = $.extend({}, t)), delete s[r]);
				if (s && isEmptyObject(s)) return;
				l ? (l = 0 === l ? new Date : new Date(l), n._defaults.minDate = l, n._defaults.minDateTime = l) : o ? (o = 0 === o ? new Date : new Date(o), n._defaults.maxDate = o, n._defaults.maxDateTime = o) : u && (n._defaults.onSelect = u)
			}
			return void 0 === i ? this._base_optionDatepicker.call($.datepicker, e, t) : this._base_optionDatepicker.call($.datepicker, e, s || t, i)
		};
		var isEmptyObject = function(e) {
				var t;
				for (t in e)
					if (e.hasOwnProperty(e)) return !1;
				return !0
			},
			extendRemove = function(e, t) {
				$.extend(e, t);
				for (var i in t)(null === t[i] || void 0 === t[i]) && (e[i] = t[i]);
				return e
			},
			useAmpm = function(e) {
				return -1 !== e.indexOf("t") && -1 !== e.indexOf("h")
			},
			convert24to12 = function(e) {
				return e > 12 && (e -= 12), 0 == e && (e = 12), e + ""
			},
			splitDateTime = function(e, t, i, s) {
				try {
					var a = s && s.separator ? s.separator : $.timepicker._defaults.separator,
						n = s && s.timeFormat ? s.timeFormat : $.timepicker._defaults.timeFormat,
						r = n.split(a),
						l = r.length,
						o = t.split(a),
						u = o.length;
					if (u > 1) return [o.splice(0, u - l).join(a), o.splice(0, l).join(a)]
				} catch (d) {
					if ($.timepicker.log("Could not split the date from the time. Please check the following datetimepicker options\nthrown error: " + d + "\ndateTimeString" + t + "\ndateFormat = " + e + "\nseparator = " + s.separator + "\ntimeFormat = " + s.timeFormat), d.indexOf(":") >= 0) {
						var m = t.length - (d.length - d.indexOf(":") - 2);
						return t.substring(m), [$.trim(t.substring(0, m)), $.trim(t.substring(m))]
					}
					throw d
				}
				return [t, ""]
			},
			parseDateTimeInternal = function(e, t, i, s, a) {
				var n, r = splitDateTime(e, i, s, a);
				if (n = $.datepicker._base_parseDate(e, r[0], s), "" !== r[1]) {
					var l = r[1],
						o = $.datepicker.parseTime(t, l, a);
					if (null === o) throw "Wrong time format";
					return {
						date: n,
						timeObj: o
					}
				}
				return {
					date: n
				}
			},
			selectLocalTimeZone = function(e, t) {
				if (e && e.timezone_select) {
					e._defaults.useLocalTimezone = !0;
					var i = t !== void 0 ? t : new Date,
						s = $.timepicker.timeZoneOffsetString(i);
					e._defaults.timezoneIso8601 && (s = s.substring(0, 3) + ":" + s.substring(3)), e.timezone_select.val(s)
				}
			};
		$.timepicker = new Timepicker, $.timepicker.timeZoneOffsetString = function(e) {
			var t = -1 * e.getTimezoneOffset(),
				i = t % 60,
				s = (t - i) / 60;
			return (t >= 0 ? "+" : "-") + ("0" + ("" + 101 * s)).slice(-2) + ("0" + ("" + 101 * i)).slice(-2)
		}, $.timepicker.timeRange = function(e, t, i) {
			return $.timepicker.handleRange("timepicker", e, t, i)
		}, $.timepicker.dateTimeRange = function(e, t, i) {
			$.timepicker.dateRange(e, t, i, "datetimepicker")
		}, $.timepicker.dateRange = function(e, t, i, s) {
			s = s || "datepicker", $.timepicker.handleRange(s, e, t, i)
		}, $.timepicker.handleRange = function(e, t, i, s) {
			function a(e, s, a) {
				s.val() && new Date(t.val()) > new Date(i.val()) && s.val(a)
			}

			function n(t, i, s) {
				if ($(t).val()) {
					var a = $(t)[e].call($(t), "getDate");
					a.getTime && $(i)[e].call($(i), "option", s, a)
				}
			}
			return $.fn[e].call(t, $.extend({
				onClose: function(e) {
					a(this, i, e)
				},
				onSelect: function() {
					n(this, i, "minDate")
				}
			}, s, s.start)), $.fn[e].call(i, $.extend({
				onClose: function(e) {
					a(this, t, e)
				},
				onSelect: function() {
					n(this, t, "maxDate")
				}
			}, s, s.end)), "timepicker" != e && s.reformat && $([t, i]).each(function() {
				var t = $(this)[e].call($(this), "option", "dateFormat"),
					i = new Date($(this).val());
				$(this).val() && i && $(this).val($.datepicker.formatDate(t, i))
			}), a(t, i, t.val()), n(t, i, "minDate"), n(i, t, "maxDate"), $([t.get(0), i.get(0)])
		}, $.timepicker.log = function(e) {
			window.console && console.log(e)
		}, $.timepicker.version = "1.2"
	}
})(jQuery);

// return jQuery.timepicker;
// // });

$.datepicker.regional['zh-CN'] = {
	clearText: '清除',
	clearStatus: '清除已选日期',
	closeText: '确定',
	closeStatus: '不改变当前选择',
	prevText: '上个月',
	prevYText: '上一年',
	prevStatus: '显示上月',
	prevBigText: '<<',
	prevBigStatus: '显示上一年',
	nextText: '下个月',
	nextYText: '下一年',
	nextStatus: '显示下月',
	nextBigText: '>>',
	nextBigStatus: '显示下一年',
	currentText: '当前时间',
	currentStatus: '显示本月',
	monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
	monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
	monthStatus: '选择月份',
	yearStatus: '选择年份',
	weekHeader: '周',
	weekStatus: '年内周次',
	dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
	dayNamesShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
	dayNamesMin: ['日', '一', '二', '三', '四', '五', '六'],
	dayStatus: '设置 DD 为一周起始',
	dateStatus: '选择 m月 d日, DD',
	dateFormat: 'yy-mm-dd',
	firstDay: 0,
	initStatus: '请选择日期',
	isRTL: false
};
$.datepicker.setDefaults($.datepicker.regional['zh-CN']);
