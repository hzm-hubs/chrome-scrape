console.log("myseller ====== start");

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log("myseller ====== receive", request.action);
  if (request.action == "readTableField") {
    sendResponse(fieldScrape());
  }
  return true;
});

// 监听自定义事件，当表格更新时触发
// document.addEventListener("tableUpdated", (event) => {
//   console.log("表格更新", e);
// });

let observer;

// 使用MutationObserver监听表格变化
function setupTableObserver(tableList) {
  const targetNode = document.getElementsByTagName("tbody")[1] || null;
  if (targetNode) {
    const config = { attributes: true, childList: true, subtree: true };

    const callback = (mutationsList) => {
      // Use traditional 'for loops' for IE 11
      for (let mutation of mutationsList) {
        if (mutation.type === "childList" || mutation.type === "subtree") {
          console.log("A child node has been added or removed.");
          getCurrentTables(tableList);
        }
      }
    };

    observer = new MutationObserver(callback);

    // 以上述配置开始观察目标节点
    observer.observe(targetNode, config);

    // 之后，可停止观察
    // observer.disconnect();
  }
}

// 判断是否还有可以点击获取的内容
async function getOthers(tableList) {
  setupTableObserver(tableList);
  const nodeSelectors = document.getElementsByClassName("asiYysdGuS");
  console.log("nodeSelectors", nodeSelectors);
  for (let i = 1; i < nodeSelectors.length; i++) {
    nodeSelectors[i].click();
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
}

function getCurrentTables(result) {
  Array.from(
    document
      .getElementsByTagName("table")[2]
      .getElementsByTagName("tbody")[0]
      .getElementsByTagName("tr")
  ).forEach((it, index) => {
    // 排除子项下方操作项
    if (Array.from(it.children).length > 2) {
      const detailUrl =
        it.getElementsByTagName("a")?.[0]?.getAttribute("href") || "";
      const goodsInfo = Array.from(it.children).map((item) => {
        // 双引号使其表内换行
        return '"' + item.innerText + '"';
      });
      goodsInfo.splice(2, 0, detailUrl);
      result.push(goodsInfo);
    }
  });
}

function fieldScrape() {
  try {
    const tables = document.getElementsByTagName("table");
    if (!tables?.length) {
      return {
        tableHeads: [],
        tableList: [],
      };
    }

    // 获取表头
    const tableHeads = Array.from(
      tables[1].getElementsByTagName("thead")?.[0].getElementsByTagName("th")
    ).map((it) => it.innerText.split("\n")[0]);
    tableHeads.splice(2, 0, "详情页");

    // 设置表数据
    const tableList = [];

    getCurrentTables(tableList);

    getOthers(tableList);

    // document.getElementsByClassName("asiYysdGuS")[1].click();
    const excelData = {
      tableHeads,
      tableList,
      //   pageTitle: document.title,
      //   pageUrl: window.location.href,
    };

    // 发送数据到 popup.js
    return excelData;
  } catch (e) {
    console.log("uploadFile error", e);
  }
}

function getTableField() {}

function loopRead() {
  let paginations = Array.from(document.getElementsByClassName("asiYysdGuS"));
}
