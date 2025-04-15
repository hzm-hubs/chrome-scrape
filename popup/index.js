console.log("popup ====== start");

function addClick(targetId, callBack = null) {
	if (!document) {
		return;
	}
	document.getElementById(targetId).addEventListener("click", () => {
		callBack && callBack();
	});
}

function handleFeisu() {
	console.log("点击");
}

addClick("exportFeisu", handleFeisu);
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "scrapedData") {
	}
});

// 方法 2：从 chrome.storage 读取
// chrome.storage.local.get("scrapedData", (result) => {
//     if (result.scrapedData) console.log(result.scrapedData);
//   });

function exportCSV(data) {
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
