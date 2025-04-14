// 创建右键菜单项
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "scrapePage",
        title: "扫描商品",
        contexts: ["page", "selection"]  // 在页面或选中文本时显示
    });
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "scrapePage") {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content-script.js"],
            });
            console.log("Content script injected successfully!");
        } catch (error) {
            console.error("Failed to inject content script:", error);
        }
    }
});

