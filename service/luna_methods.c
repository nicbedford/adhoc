/*=============================================================================
 Copyright (C) 2010 WebOS Internals <support@webos-internals.org>

 This program is free software; you can redistribute it and/or
 modify it under the terms of the GNU General Public License
 as published by the Free Software Foundation; either version 2
 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 =============================================================================*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "luna_service.h"
#include "luna_methods.h"

#define API_VERSION "1"

char *g_adhocAddress = NULL;

void log(const char *trace)
{
	FILE *f = fopen("/media/internal/uk.co.nicbedford.adhoc.log", "a");
	if(f != NULL)
	{
		fwrite(trace, strlen(trace), 1, f);
		fputc('\n', f);
		fclose(f);
	}
}

bool stopPalmWifiService()
{
	log("stopPalmWifiService");
	bool result = false;

	FILE *fp = popen("/sbin/stop PmWiFiService 2>&1", "r");

	if(fp != NULL)
	{
		char buffer[100];
		while(fgets(buffer, sizeof(buffer)-1, fp) != NULL)
		{
			char *ptr = strstr(buffer, "PmWiFiService (stop) post-stop");
			if(ptr != NULL)
			{
				log("PmWiFiService stopped");
				result = true;
			}
		}

		pclose(fp);
	}

	return result;
}

bool detectHardware()
{
	log("detectHardware");
	bool result = false;

	FILE *fp = popen("modprobe ar6000", "r");

	if(fp != NULL)
	{
		pclose(fp);
		result = true;
	}

	return result;
}

bool bringUpHardware()
{
	log("bringUpHardware");
	bool result = false;

	FILE *fp = popen("ifconfig eth0 up", "r");

	if(fp != NULL)
	{
		pclose(fp);
		result = true;
	}

	return result;
}

bool configureWifiInterface(const char *ssid)
{
	log("configureWifiInterface");
	bool result = false;
	char buffer[256];

	sprintf(buffer, "iwconfig eth0 mode ad-hoc essid \"%s\" power off", ssid);
	FILE *fp = popen(buffer, "r");

	if(fp != NULL)
	{
		pclose(fp);
		result = true;
	}

	return result;
}

char *getDhcpAddress()
{
	log("getDhcpAddress");
	bool result = false;
	static char address[16];
	memset(address, 0, sizeof(address));
	
	FILE *fp = popen("dhclient eth0 2>&1", "r");

	if(fp != NULL)
	{
		char buffer[100];

		while(fgets(buffer, sizeof(buffer)-1, fp) != NULL)
		{
			int octet1, octet2, octet3, octet4;

			if(sscanf(buffer, "bound to %d.%d.%d.%d", &octet1, &octet2, &octet3, &octet4) == 4)
			{
				sprintf(address, "%d.%d.%d.%d", octet1, octet2, octet3, octet4);
			}
		}

		pclose(fp);
	}

	if(strlen(address) > 0)
	{
		char temp[100];
		sprintf(temp, "IP address received: %s", address);
		log(temp);

		g_adhocAddress = address;
		return address;
	}
	else
	{
		log("Unable to get IP address");
		g_adhocAddress = NULL;
	}
	
	return NULL;
}

bool updateDns(const char *dns)
{
	log("updateDns");
	bool result = false;
	char buffer[256];

	sprintf(buffer, "echo \"nameserver %s\" >> /etc/resolv.conf", dns);
	FILE *fp = popen(buffer, "r");

	if(fp != NULL)
	{
		pclose(fp);
		result = true;
	}

	return result;
}

bool resetDns()
{
	log("resetDns");
	bool result = false;

	FILE *fp = popen("echo \"search config\" > /etc/resolv.conf;echo \"nameserver 127.0.0.1\" >> /etc/resolv.conf", "r");

	if(fp != NULL)
	{
		pclose(fp);
		result = true;
	}

	return result;
}

bool startPalmWifiService()
{
	log("startPalmWifiService");
	bool result = false;

	FILE *fp = popen("/sbin/start PmWiFiService", "r");

	if(fp != NULL)
	{
		char buffer[100];

		while(fgets(buffer, sizeof(buffer)-1, fp) != NULL)
		{
			char *ptr = strstr(buffer, "PmWiFiService (start) post-start");
			if(ptr != NULL)
			{
				log("PmWiFiService started");
				result = true;
			}
		}

		pclose(fp);
	}

	return result;
}

//
// A dummy method, useful for unimplemented functions or as a status function.
// Called directly from webOS, and returns directly to webOS.
//
bool dummy_method(LSHandle* lshandle, LSMessage *message, void *ctx)
{
	log("dummy_method");

	LSError lserror;
	LSErrorInit(&lserror);

	if (!LSMessageReply(lshandle, message, "{\"returnValue\": true}", &lserror))
	{
		LSErrorPrint(&lserror, stderr);
		LSErrorFree(&lserror);

		return false;
	}

	return true;
}

//
// Return the current API version of the service.
// Called directly from webOS, and returns directly to webOS.
//
bool version_method(LSHandle* lshandle, LSMessage *message, void *ctx)
{
	log("version_method");

	LSError lserror;
	LSErrorInit(&lserror);

	if (!LSMessageReply(lshandle, message, "{\"returnValue\": true, \"version\": \"" VERSION "\", \"apiVersion\": \"" API_VERSION "\"}", &lserror))
	{
		LSErrorPrint(&lserror, stderr);
		LSErrorFree(&lserror);

		return false;
	}

	return true;
}

//
// Return a polite response.
// Called directly from webOS, and returns directly to webOS.
//
bool start_adhoc_method(LSHandle* lshandle, LSMessage *message, void *ctx)
{
	log("start_adhoc_method");

	LSError lserror;
	LSErrorInit(&lserror);

	// Local buffer to store the reply
	char reply[MAXLINLEN];

	// Extract the id argument from the message
	json_t *object = json_parse_document(LSMessageGetPayload(message));
	json_t *ssid = json_find_first_label(object, "ssid");
	json_t *preferedDNS = json_find_first_label(object, "preferedDNS");
	json_t *alternateDNS = json_find_first_label(object, "alternateDNS");
               
	sprintf(reply, "ssid: %s, preferedDNS: %s, alternateDNS: %s", ssid->child->text, preferedDNS->child->text, alternateDNS->child->text);
	log(reply);

	if (!ssid || (ssid->child->type != JSON_STRING) ||
		!preferedDNS || (preferedDNS->child->type != JSON_STRING) ||
		!alternateDNS || (alternateDNS->child->type != JSON_STRING))
	{
		if (!LSMessageReply(lshandle, message, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Invalid or missing parameters\"}", &lserror))
		{
			LSErrorPrint(&lserror, stderr);
			LSErrorFree(&lserror);

			return false;
		}
	}

	stopPalmWifiService();
	detectHardware();
	bringUpHardware();
	configureWifiInterface(ssid->child->text);
	const char* address = getDhcpAddress();

	// If we got an IP address then update the DNS
	if(address != NULL)
	{
		if(strlen(preferedDNS->child->text) > 0)
		{
			updateDns(preferedDNS->child->text);
		}

		if(strlen(alternateDNS->child->text) > 0)
		{
			updateDns(alternateDNS->child->text);
		}

		sprintf(reply, "{\"returnValue\": true, \"address\": \"%s\"}", address);
	}
	else
	{
		// We didn't managed to get an IP address from the Ad-Hoc access point, so retart the Palm Wi-Fi Service
		startPalmWifiService();
		sprintf(reply, "{\"returnValue\": false, \"errorCode\": -1, \"errorText\": \"Could not obtain IP address\"}");
	}

	log(reply);

	if (!LSMessageReply(lshandle, message, reply, &lserror))
	{
		LSErrorPrint(&lserror, stderr);
		LSErrorFree(&lserror);

		return false;
	}

	return true;
}

//
// Return a polite response.
// Called directly from webOS, and returns directly to webOS.
//
bool stop_adhoc_method(LSHandle* lshandle, LSMessage *message, void *ctx)
{
	log("stop_adhoc_method");

	LSError lserror;
	LSErrorInit(&lserror);

	// Local buffer to store the reply
	char reply[MAXLINLEN];

	resetDns();
	startPalmWifiService();

	sprintf(reply, "{\"returnValue\": true}");
	log(reply);

	if (!LSMessageReply(lshandle, message, reply, &lserror))
	{
		LSErrorPrint(&lserror, stderr);
		LSErrorFree(&lserror);

		return false;
	}

	return true;	
}

//
// Return a polite response.
// Called directly from webOS, and returns directly to webOS.
//
bool query_adhoc_state_method(LSHandle* lshandle, LSMessage *message, void *ctx)
{
	log("query_adhoc_state_method");

	LSError lserror;
	LSErrorInit(&lserror);

	// Local buffer to store the reply
	char reply[MAXLINLEN];	

	if(g_adhocAddress != NULL)
	{
		sprintf(reply, "{\"returnValue\": true, \"connected\": true, \"address\": \"%s\"}", *g_adhocAddress);
	}
	else
	{
		sprintf(reply, "{\"returnValue\": true, \"connected\": false}");
	}

	log(reply);

	if (!LSMessageReply(lshandle, message, reply, &lserror))
	{
		LSErrorPrint(&lserror, stderr);
		LSErrorFree(&lserror);

		return false;
	}

	return true;	
}

LSMethod luna_methods[] = {
	{ "status",				dummy_method },
	{ "version",			version_method },

	{ "startAdhoc",			start_adhoc_method },
	{ "stopAdhoc",			stop_adhoc_method },
	{ "queryAdhocState", 	query_adhoc_state_method },

	{ 0, 0 }
};

bool register_methods(LSPalmService *serviceHandle, LSError lserror)
{
	log("register_methods");
	return LSPalmServiceRegisterCategory(serviceHandle, "/", luna_methods, NULL, NULL, NULL, &lserror);
}
