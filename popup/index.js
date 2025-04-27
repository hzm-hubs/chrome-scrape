console.log("popup ====== start");

const appInfo = {
  appId: "",
  documentLink: "",
  cozeToken: "",
};

let readResult = "";
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
let curAction = "";

function setTipsContent(message) {
  if (document) {
    document.getElementById("fieldScrape_tip").innerText = message;
  }
}

window["setTipsContent"] = setTipsContent;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("popup index ==== receive", request.action);
  switch (request.action) {
    case "updateTip":
      if (observeObj.loading) {
        observeObj.loading = false;
      }
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
  setTipsContent("数据读取中……");
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
    setTipsContent(`共获取到${request?.data.tableList?.length || 0}条数据`);
    readResult = request.data;
    if (observeObj.loading) {
      observeObj.loading = false;
    }
  }
});

addListen("exportFeiSu", handleFeisu);

addListen("exportCsv", handleCsv);

function handleCsv() {
  if (!readResult.tableList?.length) {
    setTipsContent("未读取到可用数据~");
    return;
  }
  if (observeObj.loading) {
    return;
  }
  observeObj.loading = true;
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
  setTipsContent("准备导出数据");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `商品${new Date().toLocaleString()}.csv`;
  a.click();
  setTipsContent("表格数据导出成功");
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

["appId", "documentLink", "cozeToken"].map((it) =>
  addListen(it, (e) => handleChange(it, e), "change")
);
