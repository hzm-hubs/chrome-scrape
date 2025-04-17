console.log("popup ====== start");

const appInfo = {
	appId: "",
	appSecretId: "",
	tableUrl: "",
};

function setIninValue(targetId, value) {
	document.getElementById(targetId).value = value;
}

function addListen(targetId, callBack = null, type = "click") {
	if (!document) {
		return;
	}
	switch (type) {
		case "change":
			document.getElementById(targetId).addEventListener("change", () => {
				callBack && callBack();
			});
			break;
		default: // click
			document.getElementById(targetId).addEventListener("click", () => {
				callBack && callBack();
			});
			break;
	}
}

chrome.runtime.sendMessage(
	{
		action: "getAppInfo",
	},
	(data) => {
		console.log("data134", data);
	}
);

chrome.runtime.onMessage.addListener(async (data) => {
	console.log("popup ==== receive", data);
	if (data.action == "readAppInfo") {
		for (let i in appInfo) {
			appInfo[i] = data.data[i];
			setIninValue(i, data.data[i]);
		}
		appInfo = data.data;
	}
});

addListen("exportFeiSu", handleFeisu);

addListen("exportCsv", handleCsv);

function handleChange(key, value) {
	console.log("value", key, value);
	chrome.runtime.sendMessage({
		id: "scrapePlugin",
		from: "popup",
		action: "saveAppInfo",
		data: {
			...appInfo,
			[key]: value,
		},
	});
}

["appId", "appSecretId", "tableUrlId"].map((it) =>
	addListen(it, (e) => handleChange(it, e), "change")
);

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
