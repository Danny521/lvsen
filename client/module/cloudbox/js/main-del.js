/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/6/12
 * @version $
 */

require(['/require-conf.js'],function(){
    require(['base.self','jquery-ui-timepicker-addon','js/showDetail-list','js/pageMouseEvent.js'],function(base,timepicker,showDetailList,pageMouseEvent){
        showDetailList.init();
        pageMouseEvent.bindEventInit()


        /*jQuery(document).on('focus', '.datepicker', function() {
                jQuery(this).datetimepicker({
                    showSecond: true,
                    dateFormat: 'yy-mm-dd',
                    timeFormat: 'HH:mm:ss',
                    stepHour: 1,
                    stepMinute: 1,
                    stepSecond: 1,
                    timeText: '',
                    hourText: 'ʱ',
                    minuteText: '��',
                    secondText: '��',
                    maxDate: new Date(),
                    showAnim: ''
                }).datetimepicker('show');
        });
*/


    })

})