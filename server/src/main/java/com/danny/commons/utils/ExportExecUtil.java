package com.danny.commons.utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;

import javax.servlet.http.HttpServletResponse;

public class ExportExecUtil {

    public static void showExec(File excelFile,String fileName,HttpServletResponse response) throws Exception{
		   response.setContentType("application/octet-stream");
	       fileName = new String(fileName.getBytes("gbk"),"ISO8859_1");
		   response.setHeader("Content-Disposition", "attachment;filename=\"" + fileName + ".xls" + "\"");
		   int len = (int)excelFile.length();
		   byte []buf = new byte[len];
		   FileInputStream fis = new FileInputStream(excelFile);
		   OutputStream out = response.getOutputStream();
		   len = fis.read(buf);
		   out.write(buf, 0, len);
		   out.flush();
		   fis.close();
	}

}
