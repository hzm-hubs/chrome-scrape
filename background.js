// 主要与chrome进行后台交互

chrome.runtime.onInstalled.addListener(async () => {
	console.log("background ====== plugin_installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log("background ==== receive", request.action);
	switch (request.action) {
		case "getToken":
			getToken(request.data);
			break;
		case "uploadFile":
			uploadSyncTable({
				appInfo: request.appInfo,
				records: request.records,
			});
			break;
		// case "getAppInfo":
		//  // 改到 popupindex页面自己处理
		// 	chrome.storage.local.get("appInfo", (data) => {
		// 		sendResponse(data);
		// 	});
		default:
			break;
	}
	return true; //开启异步
});

// 飞书的请求放在 content-script.js 中会显示跨域
async function getToken(appInfo) {
	try {
		console.log("---开放token 开始");
		const existValue = await chrome.storage.local.get(); // 传不传key都一样
		if (existValue?.accessToken) {
			return existValue.accessToken;
		}
		const backData = await fetch(
			"https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json", // 设置请求头（根据实际需求调整）
				},
				body: JSON.stringify({
					app_id: appInfo.appId,
					app_secret: appInfo.appSecretId,
				}),
			}
		);
		const tempAuth = await backData.json();
		if (tempAuth?.tenant_access_token) {
			chrome.storage.local.set({
				accessToken: tempAuth.tenant_access_token,
			});
			console.log("---开放token 成功");
		}
		return tempAuth.tenant_access_token;
	} catch (error) {
		console.error("---开放token 失败：", error);
		return "";
	}
}

async function uploadSyncTable(data) {
	const accessToken = await getToken(data.appInfo);
	const tableUrlInfo = new URL(data.appInfo.tableUrlId);
	const appToken = tableUrlInfo.pathname.split("/base/")[1]; // 多维表唯一Id
	const tableId = tableUrlInfo.searchParams.get("table"); // 多维表格数据表的唯一标识
	let backData = await fetch(
		`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
		{
			method: "POST", // 指定方法为 POST
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify({ records: data.records }),
		}
	);
	backData = await backData.json();
	// 授权码无效需要重新授权
	if (backData.code == 99991663) {
		chrome.storage.local.remove("accessToken");
	}
}
