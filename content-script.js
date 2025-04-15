// 提取标题、链接、选中的文本
console.log("content-script ====== start");

chrome.runtime.sendMessage({
	id: "scrapePlugin",
	action: "getToken",
});

