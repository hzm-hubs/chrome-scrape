console.log("popup ====== start");

const appInfo = {
	appId: "",
	appSecretId: "",
	tableUrlId: "",
};

let readResult = "";

function setTipsContent(message) {
	if (document) {
		document.getElementById("fieldScrape_tip").innerText = message;
	}
}

window["setTipsContent"] = setTipsContent;

function setInitValue(targetId, value) {
	document.getElementById(targetId).value = value;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log("popup index ==== receive", request.action);
	switch (request.action) {
		case "updateTip":
			setTipsContent(request.data);
			break;
		default:
			break;
	}
	return true; //开启异步
});

// 由页面自己监听处理
// chrome.runtime.sendMessage(
// 	{
// 		action: "getAppInfo",
// 	},
// 	(response) => {
// 		console.log("response", response);
// 	}
// );

// 读取缓存信息
chrome.storage.local.get("appInfo", (result) => {
	if (chrome.runtime.lastError) {
		console.log("读取 appInfo 失败", chrome.runtime.lastError);
	} else {
		for (let i in appInfo) {
			appInfo[i] = result.appInfo[i];
			setInitValue(i, result.appInfo[i]);
		}
	}
});

function addListen(targetId, callBack = null, type = "click") {
	if (!document) {
		return;
	}
	switch (type) {
		case "change":
			document.getElementById(targetId).addEventListener("change", (e) => {
				callBack && callBack(e.target.value);
			});
			break;
		default: // click
			document.getElementById(targetId).addEventListener("click", (e) => {
				callBack && callBack(e);
			});
			break;
	}
}

addListen("start", (e) => {
	setTipsContent("字段读取中……");
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		// 向content script发送消息
		chrome.tabs.sendMessage(
			tabs[0].id,
			{
				action: "readTableField",
			}
			// function (response) {
			// 	if (chrome.runtime.lastError) {
			// 		console.log("读取数据失败");
			// 		setTipsContent("未获取到字段数据，请检查是否是目标网址");
			// 		readResult = response;
			// 	} else {
			// 		console.log("读取数据结果", response);
			// 		setTipsContent(`获取到${response?.tableList?.length || 0}条数据`);
			// 		readResult = response;
			// 	}
			// }
		);
	});
});

chrome.runtime.onMessage.addListener((request) => {
	if (request.action == "mysellerBackData") {
		setTipsContent(`获取到${request?.data.tableList?.length || 0}条数据`);
		readResult = request.data;
	}
});

addListen("exportFeiSu", handleFeisu);

addListen("exportCsv", handleCsv);

function handleCsv() {
	setTipsContent("开始整理数据…");
	let csv = "\n";

	// 表头
	if (readResult?.tableHeads?.length) {
		csv += `\n${readResult.tableHeads.join(",")}\n`;
	}

	// 表内
	if (readResult?.tableList?.length) {
		readResult.tableList.forEach((l) => (csv += `${l.join(",")}\n`));
	}

	// 触发下载
	const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `商品${new Date().toLocaleString()}.csv`;
	a.click();
}

function handleFeisu() {
	setTipsContent("开始整理数据…");
	chrome.runtime.sendMessage({
		id: "fieldScrape",
		action: "uploadFile",
		appInfo,
		data: readResult,
	});
}

function handleChange(key, value) {
	appInfo[key] = value;
	chrome.storage.local.set({
		appInfo,
	});
}

["appId", "appSecretId", "tableUrlId"].map((it) =>
	addListen(it, (e) => handleChange(it, e), "change")
);
