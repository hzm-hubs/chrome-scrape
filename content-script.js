// 提取标题、链接、选中的文本
console.log("content-script ====== start");

chrome.runtime.sendMessage({
	id: "scrapePlugin",
	action: "getToken",
});

if (typeof scrapePlugin !== "function" || !scrapePlugin) {
	scrapePlugin = async () => {
		try {
			const tables = document.getElementsByTagName("table");
			if (!tables?.length) {
				return;
			}
			// 获取表头
			const tableHeads = Array.from(
				tables[1].getElementsByTagName("thead")?.[0].getElementsByTagName("th")
			).map((it) => it.innerText.split("\n")[0]);
			tableHeads.splice(2, 0, "详情页");
			const tableList = [];
			Array.from(
				document
					.getElementsByTagName("table")[2]
					.getElementsByTagName("tbody")[0]
					.getElementsByTagName("tr")
			).forEach((it, index) => {
				// 排除操作项
				if (Array.from(it.children).length > 2) {
					const detailUrl =
						it.getElementsByTagName("a")?.[0]?.getAttribute("href") || "";
					const goodsInfo = Array.from(it.children).map((item) => {
						// 双引号使其表内换行
						return '"' + item.innerText + '"';
					});
					goodsInfo.splice(2, 0, detailUrl);
					tableList.push(goodsInfo);
				}
			});

			// const selectedText = window.getSelection().toString().trim();

			const excelData = {
				tableHeads,
				tableList,
				pageTitle: document.title,
				pageUrl: window.location.href,
			};

			exportCSV(excelData);

			// 发送数据到 popup.js
			chrome.runtime.sendMessage({
				action: "scrapedData",
				data: excelData,
			});
		} catch (e) {
			console.log("scrapePlugin error", e);
		}

		// chrome.storage.local.set({ scrapedData: data });
	};
}

async function uploadFile(file, authToken) {
	const data = await fetch("https://open.feishu.cn/open-apis/im/v1/files", {
		method: "POST", // 指定方法为 POST
		headers: {
			Authorization: authToken,
			"Content-Type": "multipart/form-data; boundary=---7MA4YWxkTrZu0gW", // 设置请求头（根据实际需求调整）
		},
		body: JSON.stringify({
			file_type: "xls",
			file_name: "测试视频.mp4",
			duration: 3000,
			file: file,
		}), // 请求体数据（可传字符串、FormData 等）
	});
	console.log("TH", data);
}
