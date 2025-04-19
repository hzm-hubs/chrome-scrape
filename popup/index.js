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

addListen("start", (e) => {
  setTipsContent("开始读取数据……");
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // 向content script发送消息
    chrome.tabs.sendMessage(
      tabs[0].id,
      {
        action: "readTableField",
      },
      function (response) {
        console.log("读取数据结果", response);
        setTipsContent(`获取到${response.tableList?.length}条数据`);
        readResult = response;
      }
    );
  });
});

addListen("exportFeiSu", handleFeisu);

addListen("exportCsv", handleCsv);

function handleCsv() {
  setTipsContent("开始整理数据…");
  let csv = "\n";

  // 表头
  if (readResult.tableHeads?.length) {
    csv += `\n${readResult.tableHeads.join(",")}\n`;
  }

  // 表内
  if (readResult.tableList?.length) {
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
  console.log("点击", document.getElementById("fileInput"));
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
