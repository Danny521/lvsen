/**
 * 
 */
package com.danny.commons.utils;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;

import org.springframework.util.StringUtils;

public class DateUtil {
    public static final String DATE_FORMAT = "yyyy-MM-dd HH:mm:ss.SSS";
    public static final String DATE_SIMPLE_FORMAT = "yyyy-MM-dd";
    public static final String DATE_FULL_FORMAT = "yyyy-MM-dd HH:mm:ss";
    public static final String DATE_HOUR_FORMAT = "yyyy-MM-dd HH";
    public static final String DATE_MONTH_FORMAT = "yyyy-MM";
    public static final String TIME_SIMPLE_FORMAT = "HH:mm:ss";
    public static final String DATE_YEAR_FORMAT = "yyyy";
    public static final String DATE_FIXED_FORMAT = "yyyyMMddHHmmssSSS";

    public static final SimpleDateFormat DATE_FORMAT_S = new SimpleDateFormat(DATE_FORMAT);
    public static final SimpleDateFormat DATE_SIMPLE_FORMAT_S = new SimpleDateFormat(DATE_SIMPLE_FORMAT);
    public static final SimpleDateFormat DATE_HOUR_FORMAT_S = new SimpleDateFormat(DATE_HOUR_FORMAT);
    public static final SimpleDateFormat DATE_FULL_FORMAT_S = new SimpleDateFormat(DATE_FULL_FORMAT);
    public static final SimpleDateFormat DATE_MONTH_FORMAT_S = new SimpleDateFormat(DATE_MONTH_FORMAT);
    public static final SimpleDateFormat DATE_YEAR_FORMAT_S = new SimpleDateFormat(DATE_YEAR_FORMAT);

    /**
     * 解析指定格式的时间字符串为时间毫秒数
     * 
     * @param date
     * @param format
     * @return
     * @throws ParseException
     */
    public static long parseDate(String date, String format) throws ParseException {
        return toDate(date, format).getTime();
    }
    
//    public static void main(String[] args) throws ParseException {
//        System.out.println(""+parseDate("20160809000000000",DATE_FIXED_FORMAT));
//    }

    /**
     * 解析指定格式的时间字符串为时间
     * 
     * @param date
     * @param format
     * @return
     */
    public static Date toDate(String date, String format) {
        if ("".equals(format) || format == null) {
            format = DATE_FORMAT;
        }
        try {
            format = StringUtils.isEmpty(format) ? DATE_FORMAT : format;
            return new SimpleDateFormat(format).parse(date);
        } catch (ParseException e) {
            return getCurrentDate();
        }
    }

    public static Date toDate(String date) {
        try {
            return new SimpleDateFormat(DATE_FULL_FORMAT).parse(date);
        } catch (ParseException e) {
            return getCurrentDate();
        }
    }

    /**
     * 解析指定格式的时间字符串为时间
     * 
     * @param date
     * @param format
     * @return
     */
    public static Date toSafeDate(String date, String format) {
        return toDate(date, format);
    }

    /**
     * 按照时间戳返回相应的Date
     * 
     * @param time
     * @return
     */
    public static Date toDate(long time) {
        return new Date(time);
    }

    /**
     * 按照指定格式返回当前系统时间
     * 
     * @param format
     * @return
     */
    public static String getCurrentDate(String format) {
        if (StringUtils.isEmpty(format)) {
            format = DATE_FORMAT;
        }

        return toString(new Date(), format);
    }

    /**
     * 返回当前系统时间
     * 
     * @return Date
     */
    public static Date getCurrentDate() {
        return new Date();
    }

    /**
     * 按照yyyy-MM-dd格式显示指定日期
     * 
     * @param date
     * @return
     */
    public static String toSimpleDate(Date date) {
        return toString(date, DATE_SIMPLE_FORMAT);
    }

    /**
     * 按照yyyy-MM-dd HH:mm:ss格式显示指定日期
     * 
     * @param date
     * @return
     */
    public static String toFullDate(Date date) {
        return toString(date, DATE_FULL_FORMAT);
    }

    /**
     * 按照指定格式显示日期
     * 
     * @param date
     * @param format
     * @return
     */
    public static String toString(Date date, String format) {
        return new SimpleDateFormat(format).format(date);
    }

    /**
     * 根据指定的时间戳生成日期串
     * 
     * @param timeStamp
     * @return
     */
    public static String getDate(long timeStamp) {
        return getDate(timeStamp, DATE_FORMAT);
    }

    /**
     * 根据指定的时间戳生成日期串
     * 
     * @param timeStamp
     * @param format
     * @return
     */
    public static String getDate(long timeStamp, String format) {
        SimpleDateFormat df = new SimpleDateFormat(format);
        return df.format(new Date(timeStamp));
    }

    /**
     * 解析时间, 支持 yyyy-MM-dd HH:mm:ss, yyyy-MM-dd, yyyy-MM以及毫秒数格式
     * 
     * @param date
     * @return
     */
    public static Date parseDate(String date) {
        if (date == null) {
            return null;
        }

        String[] formats = { "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd", "yyyy-MM" };
        SimpleDateFormat format = new SimpleDateFormat();

        for (String fmt : formats) {
            format.applyPattern(fmt);

            try {
                return format.parse(date);
            } catch (Exception ex) {
            }
        }

        try {
            return new Date(Long.parseLong(date));
        } catch (Exception ex) {
            return null;
        }
    }

    /**
     * 获取年月日零时零分零秒, 如果为空，则获取当前时间所在日期的零时零分零秒
     * 
     * @param date
     * @return
     */
    public static Date getDateStart(Date date) {
        if (null == date) {
            date = getCurrentDate();
        }

        return getDateTime(date, 0, 0, 0);
    }

    /**
     * 获取年月日23时59分59秒,如果为空，则获取当前时间所在日期的23时59分59秒
     * 
     * @param date
     * @return
     */
    public static Date getDateEnd(Date date) {
        if (null == date) {
            date = getCurrentDate();
        }

        return getDateTime(date, 23, 59, 59);
    }

    /**
     * 获取指定日期所在月份的第一天
     * 
     * @param date
     * @return
     */
    public static Date getMonthStart(Date date) {
        return getMonthStart(date, false);
    }

    /**
     * 获取指定日期所在月份的第一天
     * 
     * @param date
     * @param reset
     *            是否将时间清空为0:0:0, true 清空, false 不清空
     * @return
     */
    public static Date getMonthStart(Date date, boolean reset) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.set(Calendar.DAY_OF_MONTH, 1);

        if (reset) {
            calendar.set(Calendar.HOUR, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
        }

        return calendar.getTime();
    }

    /**
     * 对指定时间增加指定的秒数
     * 
     * @param date
     * @param seconds
     * @return
     */
    public static Date addSecond(Date date, Integer seconds) {
        return addTime(date, Calendar.SECOND, seconds);
    }

    /**
     * 对指定时间增加指定的小时数
     * 
     * @param date
     * @param hours
     * @return
     */
    public static Date addHour(Date date, Integer hours) {
        return addTime(date, Calendar.HOUR_OF_DAY, hours);
    }

    /**
     * 对指定时间增加指定的天数
     * 
     * @param date
     * @param days
     * @return
     */
    public static Date addDays(Date date, Integer days) {
        return addTime(date, Calendar.DAY_OF_YEAR, days);
    }

    /**
     * 对指定时间增加指定的月数
     * 
     * @param date
     * @param days
     * @return
     */
    public static Date addMonths(Date date, Integer Months) {
        return addTime(date, Calendar.MONTH, Months);
    }

    /**
     * 对指定时间增加指定的年数
     * 
     * @param date
     * @param days
     * @return
     */
    public static Date addYears(Date date, Integer Years) {
        return addTime(date, Calendar.YEAR, Years);
    }

    /**
     * 修改指定的时间
     * 
     * @param date
     * @param value
     * @param field
     * @return
     */
    public static Date addTime(Date date, int field, int value) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.add(field, value);

        return calendar.getTime();
    }

    private static Date getDateTime(Date date, int hour, int minute, int second) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(date);
        calendar.set(Calendar.HOUR, hour);
        calendar.set(Calendar.MINUTE, minute);
        calendar.set(Calendar.SECOND, second);

        return calendar.getTime();
    }

    /**
     * 返回最小日期：0001-01-01 00:00:00
     * 
     * @return
     */
    public static Date getMinDate() {
        String strDate = "0001-01-01 00:00:00";
        String strDateFormat = "yyyy-MM-dd HH:mm:ss";
        Date minDate = new Date();
        SimpleDateFormat dateFormat = new SimpleDateFormat(strDateFormat);
        try {
            minDate = dateFormat.parse(strDate);
        } catch (ParseException ex) {
            ex.printStackTrace();
        }
        return minDate;
    }

    /**
     * 判断是否润年
     * 
     * @param ddate
     * @return
     */
    public static boolean isLeapYear(String date) {
        try {
            Date d = toDate(date, DATE_SIMPLE_FORMAT);
            GregorianCalendar gc = (GregorianCalendar) Calendar.getInstance();
            gc.setTime(d);
            int year = gc.get(Calendar.YEAR);
            if ((year % 400) == 0)
                return true;
            else if ((year % 4) == 0) {
                if ((year % 100) == 0)
                    return false;
                else
                    return true;
            } else
                return false;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 
     * @param date1
     * @param date2
     * @return 1--date1大于date2；-1--date1小于date2；0--date1等于date2
     */
    public static int compareDate(Date date1, Date date2) {
        Date dt1 = date1;
        Date dt2 = date2;
        if (dt1.getTime() > dt2.getTime()) {// 比较long型的毫秒数
            return 1;
        } else if (dt1.getTime() < dt2.getTime()) {
            return -1;
        } else {
            return 0;
        }
    }

    /**
     * 获得本周的第一天，周一
     * 
     * @return
     */
    public static Date getCurrentWeekDayStartTime() {
        Calendar c = Calendar.getInstance();
        try {
            int weekday = c.get(Calendar.DAY_OF_WEEK) - 2;
            c.add(Calendar.DATE, -weekday);
            c.setTime(DATE_FULL_FORMAT_S.parse(DATE_SIMPLE_FORMAT_S.format(c.getTime()) + " 00:00:00"));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return c.getTime();
    }

    /**
     * 获得本周的最后一天，周日
     * 
     * @return
     */
    public static Date getCurrentWeekDayEndTime() {
        Calendar c = Calendar.getInstance();
        try {
            int weekday = c.get(Calendar.DAY_OF_WEEK);
            c.add(Calendar.DATE, 8 - weekday);
            c.setTime(DATE_FULL_FORMAT_S.parse(DATE_SIMPLE_FORMAT_S.format(c.getTime()) + " 23:59:59"));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return c.getTime();
    }

    /**
     * 获得本天的开始时间，即2012-01-01 00:00:00
     * 
     * @return
     */
    public static Date getCurrentDayStartTime() {
        Date now = new Date();
        try {
            now = DATE_SIMPLE_FORMAT_S.parse(DATE_SIMPLE_FORMAT_S.format(now));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return now;
    }

    /**
     * 获得本天的结束时间，即2012-01-01 23:59:59
     * 
     * @return
     */
    public static Date getCurrentDayEndTime() {
        Date now = new Date();
        try {
            now = DATE_FULL_FORMAT_S.parse(DATE_SIMPLE_FORMAT_S.format(now) + " 23:59:59");
        } catch (Exception e) {
            e.printStackTrace();
        }
        return now;
    }

    /**
     * 获得本小时的开始时间，即2012-01-01 23:59:59
     * 
     * @return
     */
    public static Date getCurrentHourStartTime() {
        Date now = new Date();
        try {
            now = DATE_HOUR_FORMAT_S.parse(DATE_HOUR_FORMAT_S.format(now));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return now;
    }

    /**
     * 获得本小时的结束时间，即2012-01-01 23:59:59
     * 
     * @return
     */
    public static Date getCurrentHourEndTime() {
        Date now = new Date();
        try {
            now = DATE_FULL_FORMAT_S.parse(DATE_HOUR_FORMAT_S.format(now) + ":59:59");
        } catch (Exception e) {
            e.printStackTrace();
        }
        return now;
    }

    /**
     * 获得本月的开始时间，即2012-01-01 00:00:00
     * 
     * @return
     */
    public static Date getCurrentMonthStartTime() {
        Calendar c = Calendar.getInstance();
        Date now = null;
        try {
            c.set(Calendar.DATE, 1);
            now = DATE_SIMPLE_FORMAT_S.parse(DATE_SIMPLE_FORMAT_S.format(c.getTime()));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return now;
    }

    /**
     * 当前月的结束时间，即2012-01-31 23:59:59
     * 
     * @return
     */
    public static Date getCurrentMonthEndTime() {
        Calendar c = Calendar.getInstance();
        Date now = null;
        try {
            c.set(Calendar.DATE, 1);
            c.add(Calendar.MONTH, 1);
            c.add(Calendar.DATE, -1);
            now = DATE_FULL_FORMAT_S.parse(DATE_SIMPLE_FORMAT_S.format(c.getTime()) + " 23:59:59");
        } catch (Exception e) {
            e.printStackTrace();
        }
        return now;
    }

    /**
     * 当前年的开始时间，即2012-01-01 00:00:00
     * 
     * @return
     */
    public static Date getCurrentYearStartTime() {
        Calendar c = Calendar.getInstance();
        Date now = null;
        try {
            c.set(Calendar.MONTH, 0);
            c.set(Calendar.DATE, 1);
            now = DATE_SIMPLE_FORMAT_S.parse(DATE_SIMPLE_FORMAT_S.format(c.getTime()));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return now;
    }

    /**
     * 当前年的结束时间，即2012-12-31 23:59:59
     * 
     * @return
     */
    public static Date getCurrentYearEndTime() {
        Calendar c = Calendar.getInstance();
        Date now = null;
        try {
            c.set(Calendar.MONTH, 11);
            c.set(Calendar.DATE, 31);
            now = DATE_FULL_FORMAT_S.parse(DATE_SIMPLE_FORMAT_S.format(c.getTime()) + " 23:59:59");
        } catch (Exception e) {
            e.printStackTrace();
        }
        return now;
    }

    /**
     * 当前季度的开始时间，即2012-01-1 00:00:00
     * 
     * @return
     */
    public static Date getCurrentQuarterStartTime() {
        Calendar c = Calendar.getInstance();
        int currentMonth = c.get(Calendar.MONTH) + 1;
        Date now = null;
        try {
            if (currentMonth >= 1 && currentMonth <= 3)
                c.set(Calendar.MONTH, 0);
            else if (currentMonth >= 4 && currentMonth <= 6)
                c.set(Calendar.MONTH, 3);
            else if (currentMonth >= 7 && currentMonth <= 9)
                c.set(Calendar.MONTH, 4);
            else if (currentMonth >= 10 && currentMonth <= 12)
                c.set(Calendar.MONTH, 9);
            c.set(Calendar.DATE, 1);
            now = DATE_FULL_FORMAT_S.parse(DATE_SIMPLE_FORMAT_S.format(c.getTime()) + " 00:00:00");
        } catch (Exception e) {
            e.printStackTrace();
        }
        return now;
    }

    /**
     * 获取前/后半年的开始时间
     * 
     * @return
     */
    public static Date getHalfYearStartTime() {
        Calendar c = Calendar.getInstance();
        int currentMonth = c.get(Calendar.MONTH) + 1;
        Date now = null;
        try {
            if (currentMonth >= 1 && currentMonth <= 6) {
                c.set(Calendar.MONTH, 0);
            } else if (currentMonth >= 7 && currentMonth <= 12) {
                c.set(Calendar.MONTH, 6);
            }
            c.set(Calendar.DATE, 1);
            now = DATE_FULL_FORMAT_S.parse(DATE_SIMPLE_FORMAT_S.format(c.getTime()) + " 00:00:00");
        } catch (Exception e) {
            e.printStackTrace();
        }
        return now;

    }

    /**
     * 获取前/后半年的结束时间
     * 
     * @return
     */
    public static Date getHalfYearEndTime() {
        Calendar c = Calendar.getInstance();
        int currentMonth = c.get(Calendar.MONTH) + 1;
        Date now = null;
        try {
            if (currentMonth >= 1 && currentMonth <= 6) {
                c.set(Calendar.MONTH, 5);
                c.set(Calendar.DATE, 30);
            } else if (currentMonth >= 7 && currentMonth <= 12) {
                c.set(Calendar.MONTH, 11);
                c.set(Calendar.DATE, 31);
            }
            now = DATE_FULL_FORMAT_S.parse(DATE_SIMPLE_FORMAT_S.format(c.getTime()) + " 23:59:59");
        } catch (Exception e) {
            e.printStackTrace();
        }
        return now;
    }

    /**
     * 获取前一天开始日期
     */

    public static Date getIntStartDate() {
        Date now = null;
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DATE, -1);
        try {
            now = DATE_SIMPLE_FORMAT_S.parse(DATE_SIMPLE_FORMAT_S.format(cal.getTime()));
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return now;
    }

    /**
     * 获取前一天结束时间
     */
    public static Date getIntENdDate() {
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DATE, -1);
        Date now = null;
        try {
            now = getSimpleDateFormat(DATE_FULL_FORMAT).parse(getSimpleDateFormat(DATE_SIMPLE_FORMAT).format(cal.getTime()) + " 23:59:59");
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return now;
    }

    private static SimpleDateFormat getSimpleDateFormat(String format) {
        return new SimpleDateFormat(format);
    }

    /**
     * 获取当前时间前的时间
     * 
     * @param hour
     * @param minute
     * @param formatTimeType
     * @return
     */
    public static String getBeforeTime(int hour, int minute, String formatTimeType) {
        String formatType = DATE_FULL_FORMAT;
        if (!StringUtils.isEmpty(formatTimeType)) {
            formatType = formatTimeType;
        }
        SimpleDateFormat format = new SimpleDateFormat(formatType);
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.HOUR_OF_DAY, hour);
        calendar.add(Calendar.MINUTE, minute);
        return format.format(calendar.getTime());
    }
}
