console.log("sycm trip ====== start");

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log("sycm ====== receive", request.action);
  if (request.action == "readTableField") {
    // 这里使用 await 会终止message port 链接，回调函数里有 await 也不行。改到通过sendMessage回传
    fieldScrape();
  }
  return true;
});

function getTargetTable(type = "thead") {
  const targetTable = document.getElementsByClassName("ant-table-content")[0];
  if (!targetTable) {
    // 这个页面是滚动加载
    window.scrollBy(0, 300);
    setTimeout(() => {
      getTargetTable(type);
    }, 2000);
    return;
  } else {
    return targetTable.getElementsByTagName(type)[0] || null;
  }
}

async function fieldScrape(callBack) {
  try {
    // 获取表头
    const targetHead = getTargetTable();

    if (!targetHead) {
      throw "no table data";
    }

    targetHead.scrollIntoView();

    console.log("targetHead", targetHead);

    // const tableHeads = Array.from(
    //   targetHead.getElementsByTagName("thead")?.[0].getElementsByTagName("th")
    // ).map((it) => it.innerText.split("\n")[0]);

    // tableHeads.splice(2, 0, "详情页");

    return;

    // 设置表数据
    const tableList = [];

    await getPageData(tableList);

    chrome.runtime.sendMessage({
      from: "trip",
      action: "tripBackData",
      data: {
        tableHeads,
        tableList,
      },
    });
  } catch (e) {
    chrome.runtime.sendMessage({
      from: "trip",
      action: "tripBackData",
      data: {
        tableHeads: [],
        tableList: [],
      },
    });
    console.log("uploadFile error: ", e);
  }
}
