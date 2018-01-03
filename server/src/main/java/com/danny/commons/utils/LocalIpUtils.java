package com.danny.commons.utils;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Enumeration;

import javax.servlet.http.HttpServletRequest;

public class LocalIpUtils {

    public static String getLocalIP() {
        String ipStr = "127.0.0.1";
        try {
            InetAddress ip = null; //声明一个InetAddress类型ip地址
            Enumeration<NetworkInterface> e1 = NetworkInterface.getNetworkInterfaces();
            while (e1.hasMoreElements()) {
                NetworkInterface netInterface = e1.nextElement();
                String NetworkCardName = netInterface.getDisplayName();
                if (null != NetworkCardName && (NetworkCardName.toLowerCase().contains("VMware".toLowerCase())
                        || NetworkCardName.toLowerCase().contains("VirtualBox".toLowerCase()))) {
                    continue;//排除虚拟机ip
                } else {
                    Enumeration<InetAddress> addresses = netInterface.getInetAddresses(); //同样再定义网络地址枚举类
                    while (addresses.hasMoreElements()) {
                        ip = addresses.nextElement();
                        if (ip != null && (ip instanceof Inet4Address)) {
                            String ipInfo = ip.getHostAddress();
                            if (!ipInfo.contains("127.0.0.1")) {
                                ipStr = ipInfo;
                                break;
                            }
                        }
                    }
                }
            }
        } catch (SocketException e) {
            e.printStackTrace();
            ipStr = "127.0.0.1";
        }
        return ipStr;
    }

	public static String getAddress(HttpServletRequest request) {
		// String url = "http://" + getLocalIP() + ":"
		// + request.getLocalPort();
		String url = "";
		return url;

	}
}
