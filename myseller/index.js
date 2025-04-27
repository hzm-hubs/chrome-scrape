console.log("myseller ====== start");

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log("myseller ====== receive", request.action);
  if (request.action == "readTableField") {
    // 这里使用 await 会终止message port 链接，回调函数里有 await 也不行。改到通过sendMessage回传
    fieldScrape();
  }
  return true;
});

let mysellerObserver = "";

// 使用MutationObserver监听表格变化
// 当前任务队列清空之后，统一调用一次回调 脚本会连续创建
function setupTableObserver(tableList) {
  const targetNode = document.getElementsByTagName("tbody")[0] || null;
  if (targetNode) {
    const config = { attributes: false, childList: true, subtree: true };
    // let mutationPending = false;
    const callback = (mutationsList) => {
      // Use traditional 'for loops' for IE 11
      console.log("更新", mutationsList);
      for (let mutation of mutationsList) {
        console.log("更新", mutation.type);
        if (mutation.type === "childList") {
          console.log(
            "A child node has been added or removed.",
            JSON.stringify(targetNode.childNodes.length)
          );
          // getCurrentTables(tableList);
        }
      }

      // if (!mutationPending) {
      // 	mutationPending = true;
      // 	// 放在微任务队列末尾，只执行一次
      // 	queueMicrotask(() => {
      // 		mutationPending = false;
      // 		// 比如读取当前 DOM 状态，或者触发某个操作
      // 		console.log("表格变动结束，执行处理逻辑");
      // 	});
      // }
    };

    mysellerObserver = new MutationObserver(callback);

    // 以上述配置开始观察目标节点
    mysellerObserver.observe(targetNode, config);

    // mysellerObserver?.disconnect();

    // mysellerObserver = null;
  }
}

function getTargetTbody() {
  return (
    document
      ?.getElementsByTagName("table")[2]
      ?.getElementsByTagName("tbody")[0] || null
  );
}

// 判断是否还有可以获取的内容
let lastTableContent = "";
let timer = null;
let timeout = 20;
async function getPageData(tableList) {
  // 前一版本 asiYysdGuS （常规） asiYysdGuW（选中）
  const nodeSelectors = document.getElementsByClassName("asiYysqiuQ");
  // 当前选中的页码
  const curPageNum =
    document.getElementsByClassName("asiYysqiuU")[0].textContent;
  getCurrentTables(tableList);
  if (curPageNum == 1) {
    getCurrentTables(tableList);
  }
  for (let i = curPageNum == 1 ? 1 : 0; i < nodeSelectors.length; i++) {
    nodeSelectors[i].click();
    await new Promise((resolve) => {
      timer = setInterval(() => {
        if (
          timeout == 0 ||
          lastTableContent !== JSON.stringify(getTargetTbody()?.innerHTML)
        ) {
          clearInterval(timer);
          timer = null;
          timeout = 20;
          resolve(getCurrentTables(tableList));
        }
        --timeout;
      }, 1000);
    });
  }
}

function getCurrentTables(result) {
  lastTableContent = JSON.stringify(getTargetTbody()?.innerHTML);
  Array.from(getTargetTbody().getElementsByTagName("tr")).forEach(
    (it, index) => {
      // 排除子项下方操作项
      if (Array.from(it.children).length > 2) {
        const detailUrl =
          it.getElementsByTagName("a")?.[0]?.getAttribute("href") || "";
        const trInfo = Array.from(it.children).map((item) => {
          // 双引号使其表内换行
          return '"' + item.innerText + '"';
        });
        trInfo.splice(2, 0, detailUrl);
        result.push({
          fields: trInfo,
        });
      }
    }
  );
}

async function fieldScrape(callBack) {
  try {
    const tables = document.getElementsByTagName("table");
    if (!tables?.length) {
      throw "no table data";
    }

    // 获取表头
    const tableHeads = Array.from(
      tables[1].getElementsByTagName("thead")?.[0].getElementsByTagName("th")
    ).map((it) => it.innerText.split("\n")[0]);
    tableHeads.splice(2, 0, "详情页");

    // 设置表数据
    const tableList = [];

    await getPageData(tableList);

    chrome.runtime.sendMessage({
      from: "myseller",
      action: "mysellerBackData",
      data: {
        tableHeads,
        tableList,
      },
    });
  } catch (e) {
    chrome.runtime.sendMessage({
      from: "myseller",
      action: "mysellerBackData",
      data: {
        tableHeads: [],
        tableList: [],
      },
    });
    console.log("uploadFile error: ", e);
  }
}
