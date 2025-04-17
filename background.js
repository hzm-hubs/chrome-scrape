// 主要与chrome进行后台交互

chrome.runtime.onInstalled.addListener(async () => {
  console.log("background ====== plugin_installed");
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log("background ==== receive");
  switch (request.action) {
    case "getToken":
      getToken(request.data);
      break;
    case "uploadFile":
      uploadSyncFile(request.data);
      break;
    default:
      break;
  }
  return true; //开启异步
});

// 飞书的请求放在 content-script.js 中会显示跨域
async function getToken(params) {
  try {
    const existValue = await chrome.storage.local.get(); // 传不传key都一样
    console.log("---开放token 开始");
    const backData = await fetch(
      "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 设置请求头（根据实际需求调整）
        },
        body: JSON.stringify(params),
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
  }
}

async function uploadSyncFile(records) {
  const existValue = await chrome.storage.local.get();
  const data = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/RFwHb89ztawvSusGzTzcDHKdnid/tables/tblowQSvTIZI5i5g/records/batch_create`,
    {
      method: "POST", // 指定方法为 POST
      headers: {
        Authorization: `Bearer ${existValue.accessToken}`,
      },
      body: JSON.stringify({ records }),
    }
  );
  console.log("upload =====", data);
}
