// 主要与chrome进行后台交互

const messageObj = {
  AuthExpired: "授权码失效，请重新操作",
};

function createTip(msg = "操作失败") {
  // chrome.notifications.create("fieldScrape_notification", {
  //   type: "basic",
  //   title: "提示",
  //   message: msg,
  //   iconUrl: "icons/48.png",
  // });
  chrome.runtime.sendMessage({
    from: "background",
    action: "updateTip",
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
      uploadSyncTable({
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
          app_secret: appInfo.appSecretId,
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

// 获取数据表字段信息
async function getTableFields({ accessToken, appToken, tableId, viewId }) {
  let result = [];
  let backData = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
    {
      method: "GET", // 指定方法为 POST
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  backData = await backData.json();
  // 授权码无效需要重新授权
  if (backData?.code == 99991663) {
    createTip(messageObj["AuthExpired"]);
    // 没有 window 属性
    // window.setTipsContent(messageObj["AuthExpired"]);
    chrome.storage.local.remove("accessToken");
    return false;
  }
  if (backData?.data?.items?.length) {
    result = backData.data.items.map((it) => it.field_name);
  }
  return result;
}

async function uploadSyncTable(data) {
  const accessToken = await getToken(data.appInfo);
  if (!accessToken) {
    return;
  }
  const tableUrlInfo = new URL(data.appInfo.tableUrlId);
  const appToken = tableUrlInfo.pathname.split("/base/")[1]; // 多维表唯一Id
  const tableId = tableUrlInfo.searchParams.get("table"); // 多维表格数据表的唯一标识
  const viewId = tableUrlInfo.searchParams.get("view"); // 多维表格数据表的唯一标识
  const tableFields = await getTableFields({
    accessToken,
    appToken,
    tableId,
    viewId,
  });

  if (!tableFields) {
    return;
  }

  let records = [];

  const existIndexList = data.tableInfo.tableHeads
    .map((it, index) => {
      if (tableFields.includes(it)) {
        return index;
      }
    })
    .filter((it) => it >= 0);

  // 根据多维表上的字段传递数据
  data.tableInfo.tableList.forEach((it) => {
    const itemInfo = {};
    existIndexList.forEach((sort) => {
      itemInfo[data.tableInfo.tableHeads[sort]] = it[sort];
    });
    records.push({
      fields: itemInfo,
    });
  });

  let backData = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
    {
      method: "POST", // 指定方法为 POST
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ records }),
    }
  );
  backData = await backData.json();
  // 授权码无效需要重新授权
  if (backData.code == 99991663) {
    createTip(messageObj["AuthExpired"]);
    chrome.storage.local.remove("accessToken");
  } else if (backData.code == 0) {
    createTip("数据已成功上传到您的多维文档中~");
  } else {
    createTip(backData.msg);
  }
}
