// 可与background交互
console.log("common ====== start");

const version = 1.0;

function scrapePlugin() {
  try {
    const tables = document.getElementsByTagName("table");
    if (!tables?.length) {
      return;
    }
    // 获取表头
    const tableHeads = Array.from(
      tables[1].getElementsByTagName("thead")?.[0].getElementsByTagName("th")
    ).map((it) => it.innerText.split("\n")[0]);
    tableHeads.splice(2, 0, "详情页");
    const tableList = [];
    
    Array.from(
      document
        .getElementsByTagName("table")[2]
        .getElementsByTagName("tbody")[0]
        .getElementsByTagName("tr")
    ).forEach((it, index) => {
      // 排除操作项
      if (Array.from(it.children).length > 2) {
        const detailUrl =
          it.getElementsByTagName("a")?.[0]?.getAttribute("href") || "";
        const goodsInfo = Array.from(it.children).map((item) => {
          // 双引号使其表内换行
          return '"' + item.innerText + '"';
        });
        goodsInfo.splice(2, 0, detailUrl);
        tableList.push(goodsInfo);
      }
    });

    // const selectedText = window.getSelection().toString().trim();

    const excelData = {
      tableHeads,
      tableList,
      pageTitle: document.title,
      pageUrl: window.location.href,
    };

    // 发送数据到 popup.js
    chrome.runtime.sendMessage({
      action: "uploadFile",
      data: excelData,
    });
  } catch (e) {
    console.log("uploadFile error", e);
  }
}
