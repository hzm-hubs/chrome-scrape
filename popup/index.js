console.log("popup ====== start");

// 存储设置信息
const appInfo = {
  appId: "", // 应用唯一标识
  documentLink: "", // 文档链接
  cozeToken: "", // 授权码
};

// 判断执行状态
const observeObj = {};
let loading = false;
Object.defineProperty(observeObj, "loading", {
  get: function () {
    return loading;
  },
  set: function (newV) {
    loading = newV;
  },
});

// 检查是否是目标网页
function checkIfTargetPage(url) {
  return ["https://myseller.taobao.com"].some((it) => url.startsWith(it));
}

// 判断当前展示页面
let isTargetPage = false;
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const currentTab = tabs[0];
  const currentUrl = currentTab.url;
  isTargetPage = checkIfTargetPage(currentUrl); // 你的判断逻辑
  if (!isTargetPage) {
    observeObj.loading = true;
    setTipsContent("当前页面不支持使用~");
    document.getElementById("buttonArea").classList.add("hide-element");
  } else {
    // 正常显示插件内容
    setTipsContent("欢迎使用~");
  }
});

function setTipsContent(message) {
  if (document) {
    document.getElementById("contentTip").innerText = message;
  }
}

let readResult = ""; // 阅读结果

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("popup index ==== receive", request.action);
  switch (request.action) {
    case "updateTipContent":
      if (observeObj.loading) {
        observeObj.loading = false;
      }
      setTipsContent(request.data);
      break;
    case "mysellerBackData":
      setTipsContent(`共获取到${request?.data.tableList?.length || 0}条数据`);
      readResult = request.data;
      if (observeObj.loading) {
        observeObj.loading = false;
      }
      break;
    default:
      break;
  }
  return true; //开启异步
});

// 设置初始值
function setInitValue(targetId, value) {
  document.getElementById(targetId).value = value;
}

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
    case "negation":
      document.getElementById(targetId).addEventListener("click", (e) => {
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
  if (observeObj.loading) {
    return;
  }
  observeObj.loading = true;
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // 向content script发送消息
    try {
      if (!tabs[0].id) {
        throw "连接失败，请尝试关闭浮窗刷新页面";
      }
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "readTableField",
        }
        // function (response) {
        //   console.log("response", response);
        //   if (chrome.runtime.lastError) {
        //     // setTipsContent(chrome.runtime.lastError.message);
        //     // readResult = response;
        //     // observeObj.loading = false;
        //   }
        // }
      );
    } catch (e) {
      setTipsContent(e);
    }
  });
});

addListen("exportFeiSu", handleFeisu);

addListen("exportCsv", handleCsv);

addListen("settings", handleSetting);

function handleCsv() {
  if (!readResult.tableList?.length) {
    setTipsContent("未读取到可用数据~");
    return;
  }
  if (observeObj.loading) {
    return;
  }
  observeObj.loading = true;
  setTipsContent("开始整理数据……");
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
  setTipsContent("准备导出数据");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `商品${new Date().toLocaleString()}.csv`;
  a.click();
  setTipsContent("表格数据导出成功!");
  observeObj.loading = false;
}

function handleFeisu() {
  if (!readResult.tableList?.length) {
    setTipsContent("未读取到可用数据~");
    return;
  }
  if (!appInfo.appId) {
    setTipsContent("请填写app_id~");
    return;
  }
  if (!appInfo.documentLink) {
    setTipsContent("请填写文档链接~");
    return;
  }
  if (!appInfo.cozeToken) {
    setTipsContent("请填写授权码~");
    return;
  }
  if (observeObj.loading) {
    return;
  }
  observeObj.loading = true;
  setTipsContent("开始整理数据……");
  chrome.runtime.sendMessage({
    id: "fieldScrape",
    action: "uploadFile",
    appInfo,
    data: readResult,
  });
}

function handleSetting() {
  const triggerEle = document.getElementById("settings");
  const targetEle = document.getElementById("settingsPanel");
  if (targetEle.classList.contains("hide-element")) {
    targetEle.classList.remove("hide-element");
    triggerEle.innerText = "收起设置";
  } else {
    targetEle.classList.add("hide-element");
    triggerEle.innerText = "打开设置";
  }
}

function handleChange(key, value) {
  appInfo[key] = value;
  chrome.storage.local.set({
    appInfo,
  });
}

["appId", "documentLink", "cozeToken"].map((it) =>
  addListen(it, (e) => handleChange(it, e), "change")
);
