// 主要与chrome进行后台交互

function createTip(msg = "操作失败") {
  // chrome.notifications.create("fieldScrape_notification", {
  //   type: "basic",
  //   title: "提示",
  //   message: msg,
  //   iconUrl: "icons/48.png",
  // });
  chrome.runtime.sendMessage({
    from: "background",
    action: "updateTipContent",
    data: msg,
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  console.log("background ====== plugin_installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("background ==== receive", request.action);
  switch (request.action) {
    case "getToken":
      getToken(request.data);
      break;
    case "uploadFile":
      handleRun({
        appInfo: request.appInfo,
        tableInfo: request.data,
      });
      break;
    // case "getAppInfo":
    //  // 改到 popupindex页面自己处理
    // 	chrome.storage.local.get("appInfo", (data) => {
    // 		sendResponse(data);
    // 	});
    default:
      break;
  }
  return true; //开启异步
});

// 飞书的请求放在 content-script.js 中会显示跨域
async function getToken(appInfo) {
  try {
    console.log("---开放token 开始");
    const existValue = await chrome.storage.local.get(); // 传不传key都一样
    if (existValue?.accessToken) {
      return existValue.accessToken;
    }
    const backData = await fetch(
      "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 设置请求头（根据实际需求调整）
        },
        body: JSON.stringify({
          app_id: appInfo.appId,
          app_secret: appInfo.documentLink,
        }),
      }
    );
    const tempAuth = await backData.json();
    if (tempAuth?.tenant_access_token) {
      chrome.storage.local.set({
        accessToken: tempAuth.tenant_access_token,
      });
      console.log("---开放token 成功");
    }
    return tempAuth.tenant_access_token;
  } catch (error) {
    console.error("---开放token 失败：", error);
    createTip("获取ai应用鉴权失败");
    return "";
  }
}

async function handleRun(params) {
  let backData = await fetch(`https://api.coze.cn/v1/workflow/run`, {
    method: "POST", // 指定方法为 POST
    headers: {
      Authorization: `Bearer ${params.appInfo.cozeToken}`,
    },
    body: JSON.stringify({
      parameters: {
        input: {
          app_id: params.appInfo.appId,
          documentLink: params.appInfo.documentLink,
          tableHeads: params.tableInfo.tableHeads,
          tableList: params.tableInfo.tableList,
        },
      },
      workflow_id: "7496441633937866793",
    }),
  });
  backData = await backData.json();
  console.log("结果输出", backData);
  if (backData.code !== 0) {
    createTip(backData.msg);
    return;
  }
  backData = JSON.parse(backData.data);
  createTip(backData.msg);
}
