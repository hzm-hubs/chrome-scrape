// 提取标题、链接、选中的文本

const currentDomain = window.domainHelper.getDomain();

console.log("content-script ====== start", currentDomain);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getData") {
    console.log("收到获取数据请求");
    (async () => {
      try {
        const data = await scrapeAndRespond();
        sendResponse({
          data: data,
        });
      } catch (error) {
        console.error("抓取数据时出错:", error);
        sendResponse({
          error: error.message,
        });
      }
    })();
    return true;
  }
});

async function scrapeAndRespond() {
  const currentUrl = window.location.href;
  const encodedUrl = "data_" + btoa(currentUrl);
  try {
    if (currentDomain === "taobao" || currentDomain === "tmall") {
      if (document.querySelector(".baxia-dialog")) {
        document.querySelector(".baxia-dialog").remove();
      }
    }
    const extractedData = await extractData();
    console.log(`抓取到${currentDomain}数据:`, extractedData);
    await chrome.storage.local.set({
      storageKey: {
        domain: currentDomain,
        type: extractedData.type,
        data: extractedData.data,
        timestamp: new Date().getTime(),
        fetchTime: extractedData.fetchTime,
        url: currentUrl,
      },
    });
    return extractedData;
  } catch (error) {
    console.error("抓取过程中发生错误:", error);
    throw error;
  }
}

async function extractData(pageType) {
  let fetchedData = [];
  pageType = "search";
  const currentDomain =
    typeof domainHelper !== "undefined" ? domainHelper.getDomain() : "other";
  const currentUrl = window.location.href;
  console.log("当前域名:", currentDomain);
  console.log("当前URL:", currentUrl);
  if (currentDomain === "myseller") {
    console.log("检测到千牛全站推广页面，开始抓取列表数据");
    pageType = "list";
    fetchedData = await scrapeMysellerData();
  } else if (currentDomain === "taobao" || currentDomain === "tmall") {
    if (currentUrl.includes("/search")) {
      console.log("检测到淘宝/天猫搜索页面，开始抓取商品搜索数据");
      fetchedData = await scrapeTaobaoSearchData();
      pageType = "search";
    } else {
      if (
        currentUrl.includes("item.taobao.com") ||
        currentUrl.includes("detail.tmall.com")
      ) {
        console.log("检测到淘宝/天猫详情页面，开始抓取商品详情数据");
        fetchedData = await scrapeTaobaoDetailData();
        pageType = "detail";
      } else {
        console.log("不是支持的淘宝/天猫页面类型，抓取跳过");
      }
    }
  } else {
    if (currentDomain === "douyin") {
      if (currentUrl.includes("modal_id=")) {
        console.log("检测到抖音视频详情页面，开始抓取视频详情数据");
        fetchedData = await scrapeDouyinVideoModal();
        pageType = "video";
      } else {
        if (currentUrl.includes("/search/")) {
          console.log("检测到抖音视频搜索页面，开始抓取视频搜索数据");
          fetchedData = await scrapeDouyinSearchData();
          pageType = "search";
        } else {
          if (currentUrl.includes("/user/")) {
            console.log("检测到抖音用户详情页面，开始抓取用户详情数据");
            fetchedData = await scrapeDouyinUserData();
            pageType = "user";
          } else {
            console.log("不是支持的抖音页面类型，抓取跳过");
          }
        }
      }
    } else {
      if (currentDomain === "xiaohongshu") {
        if (
          currentUrl.includes("/search_result") ||
          currentUrl.includes("/explore?") ||
          currentUrl === "https://www.xiaohongshu.com/explore"
        ) {
          console.log("检测到小红书笔记搜索页面，开始抓取笔记搜索数据");
          fetchedData = await scrapeXiaohongshuSearchData();
          pageType = "search";
        } else {
          if (currentUrl.includes("/user/profile/")) {
            console.log("检测到小红书用户详情页面，开始抓取用户详情数据");
            fetchedData = await scrapeXiaohongshuUserData();
            pageType = "user";
          } else {
            if (currentUrl.includes("/explore/")) {
              console.log("检测到小红书笔记详情页面，开始抓取笔记详情数据");
              fetchedData = await scrapeXiaohongshuNoteData();
              pageType = "note";
            } else {
              console.log("不是支持的小红书页面类型，抓取跳过");
            }
          }
        }
      } else {
        console.log("不支持的域名:", currentDomain);
        return {
          domain: currentDomain,
          type: "unsupported",
          data: [],
          fetchTime: new Date().toLocaleString(),
        };
      }
    }
  }
  const fetchTime = new Date().toLocaleString();
  console.log("抓取结果:", {
    domain: currentDomain,
    type: pageType,
    data: fetchedData,
    fetchTime: fetchTime,
  });
  return {
    domain: currentDomain,
    type: pageType,
    data: fetchedData,
    fetchTime: fetchTime,
  };
}
