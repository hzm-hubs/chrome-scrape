// 加载其他文件
function loadScript(url, callback) {
  const script = document.createElement("script");
  script.src = url;
  script.onload = callback;
  document.head.appendChild(script);
}

loadScript(chrome.runtime.getURL("/common/index.js"), function () {
  console.log("Script loaded!");
  // 这里可以使用index.js中的函数
});

// 由页面自己监听处理
chrome.runtime.sendMessage(
  {
    action: "getAppInfo",
  },
  (response) => {
    console.log("response", response);
  }
);
