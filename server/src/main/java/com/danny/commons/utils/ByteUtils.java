/**
 * Copyright: Copyright (c) 2016 
 * Company:东方网力科技股份有限公司
 * 
 * @author yuwenhao
 * @date 2016年11月24日 下午5:20:05
 * @version V1.0
 */
package com.danny.commons.utils;

/**
  * @ClassName: ByteUtils
  * @Description: TODO
  * @author zhangtao
  * @date 2016年11月24日 下午5:20:05
  *
  */
public class ByteUtils {
    public static short readInt16HighFirst(byte[] buf, int offset) {
        short r = buf[offset++];
        r = (short) ((r << 8) | buf[offset++]);

        return r;
    }

    // 高位在后
    public static short readInt16HighLast(byte[] buf, int offset) {
        short r = buf[offset++];
        r = (short) (r | (short) ((buf[offset++] & 0xFF) << 8));

        return r;
    }

     public static void writeInt16(byte[] buf, int offset, short value) {
        buf[offset++] = (byte) ((value >> 8) & 0xff);
        buf[offset++] = (byte) (value & 0xff);
    }

    // 高位在前
     public static int readInt32HighFirst(byte[] buf, int offset) {
        int num = 0;
        for (int i = 0; i < 4; i++) {
            num = (int) ((num << 8) & 0xFFFFFF00);
            num = num | (buf[offset] & 0xFF);
            offset++;
        }
        return num;
    }

    // 高位在后
     public static int readInt32HighLast(byte[] buf, int offset) {
        int num = 0;
        for (int i = 0; i < 4; i++) {
            num = ((buf[offset] & 0xFF) << (8 * i)) | num;
            offset++;
        }
        return num;
    }

     public static void writeInt32(byte[] buf, int offset, int value) {
        for (int i = 3; i >= 0; i--) {
            buf[offset + i] = (byte) (value & 0xFF);
            value >>= 8;
        }
        offset += 4;
    }

     public static int shiftLeft(int val, int step, int size) {
        int v1 = val << step;
        int v2 = val >> (size - step);
        return (v1 | v2);
    }

     public static String hex2Str(byte[] buf, int offset, int count) {
        final char[] HexTable = "0123456789ABCDEF".toCharArray();
        StringBuilder sb = new StringBuilder();
        int iLast = count < 0 ? buf.length - 1 : offset + count - 1;
        if (iLast >= buf.length)
            iLast = buf.length - 1;

        for (int i = offset; i <= iLast; i++) {
            sb.append(HexTable[((buf[i] >> 4) & 0x0f)]);
            sb.append(HexTable[(buf[i] & 0x0f)]);
        }
        return sb.toString();
    }
}
