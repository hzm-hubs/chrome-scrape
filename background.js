// 主要与chrome进行后台交互
console.log("background ====== start");
// 创建右键菜单子项 scrapePlugin
// chrome.runtime.onInstalled.addListener(() => {
// 	console.log("scrapePlugin");
// 	chrome.contextMenus.create({
// 		id: "scrapePlugin",
// 		title: "扫描商品",
// 		contexts: ["page", "selection"], // 在页面或选中文本时显示
// 	});
// });

// 监听右键菜单点击，如果选择 scrapePlugin 执行对应脚本
// chrome.contextMenus.onClicked.addListener(async (info, tab) => {
// 	if (info.menuItemId === "scrapePlugin") {
// 		try {
// 			await chrome.scripting.executeScript({
// 				target: { tabId: tab.id },
// 				files: ["content-script.js"],
// 			});
// 			console.log("Content script injected successfully!");
// 		} catch (error) {
// 			console.error("Failed to inject content script:", error);
// 		}
// 	}
// });

chrome.runtime.onMessage.addListener(async (data) => {
	console.log("data", data);
	if (data.action == "getToken") {
		let existValue = await chrome.storage.sync.get(); // 传不传key都一样
		// console.log("1", existValue.accessToken);
		if (existValue?.accessToken) {
			return existValue.accessToken;
		}
		return getToken();
	}
});

// 飞书的请求放在 content-script.js 中会显示跨域
async function getToken(params) {
	try {
		console.log("---开放token 开始");
		const backData = await fetch(
			"https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json", // 设置请求头（根据实际需求调整）
				},
				body: JSON.stringify({
					app_id: "cli_a771e2da6b78d00e",
					app_secret: "SzssAEpxhP6AYNq23H3cWFMIUVfEFWQl",
				}),
			}
		);
		const tempAuth = await backData.json();
		if (tempAuth?.tenant_access_token) {
			chrome.storage.sync.set({
				accessToken: tempAuth.tenant_access_token,
			});
			console.log("---开放token 成功");
		}
		return tempAuth.tenant_access_token;
	} catch (error) {
		console.error("---开放token 失败：", error);
	}
}
