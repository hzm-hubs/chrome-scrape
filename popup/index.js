console.log("popup ====== start");

const appInfo = {
	appId: "",
	appSecretId: "",
	tableUrlId: "",
};

function setInitValue(targetId, value) {
	document.getElementById(targetId).value = value;
}

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
		console.log("读取失败", chrome.runtime.lastError);
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

addListen("exportFeiSu", handleFeisu);

addListen("exportCsv", handleCsv);

function handleCsv(data) {
	let csv = "\n";
	// csv += `"${data.pageTitle}","${data.pageUrl}"\n\n`;

	// 表头
	csv += `\n${data.tableHeads.join(",")}\n`;
	// 表内
	data.tableList.forEach((l) => (csv += `${l.join(",")}\n`));

	// 触发下载
	const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `商品${new Date().toLocaleString()}.csv`;
	a.click();
}

function handleFeisu() {
	console.log("点击", document.getElementById("fileInput"));
	chrome.runtime.sendMessage({
		id: "scrapePlugin",
		action: "uploadFile",
		appInfo,
		records: [
			{
				fields: {
					名称: "茶叶",
					详情: "https://juejin.cn/post/7485631488115228726",
				},
			},
			{
				fields: {
					名称: "茶叶1",
					详情: "https://juejin.cn/post/7485631488115228726",
				},
			},
		],
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
