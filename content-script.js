// 提取标题、链接、选中的文本
var scrapeData = null

if (typeof scrapeData !== 'function' || !scrapeData) {
scrapeData = async () => {
    try {
        const headings = Array.from(document.querySelectorAll("h1, h2")).map(
          (el) => el.textContent.trim()
        );
        const tables = document.getElementsByTagName("table")
        // 获取表头
        const tableHeads = Array.from(tables[1].getElementsByTagName('thead')?.[0].getElementsByTagName('th')).map((it) => it.innerText.split('\n')[0])
        tableHeads.splice(2,0,'详情页')
        const tableList = [];
        Array.from(document.getElementsByTagName("table")[2].getElementsByTagName('tbody')[0].getElementsByTagName('tr')).forEach((it,index) => {
            // 排除操作项
            if (Array.from(it.children).length > 2) {
              const detailUrl = it.getElementsByTagName('a')?.[0]?.getAttribute('href') || ''
              const goodsInfo = Array.from(it.children).map((item) => {
                // 双引号使其表内换行
                return '"' + item.innerText + '"'
              })
              goodsInfo.splice(2,0,detailUrl)
              tableList.push(goodsInfo)
            }
        })

        const selectedText = window.getSelection().toString().trim();

        const excelData= {
            tableHeads,
            tableList,
            selectedText,
            pageTitle: document.title,
            pageUrl: window.location.href,
        }

        // exportCSVForFeishu(excelData)
        getAuthToken()

        // 发送数据到 popup.js
        chrome.runtime.sendMessage({
          action: "scrapedData",
          data: excelData,
        });
    } catch (e) {
        console.log('scrapePage error',e)
    }
    
    // chrome.storage.local.set({ scrapedData: data });
  };
}

scrapeData(); // 执行抓取


function exportCSVForFeishu(data) {
    let csv = "\n";
    // csv += `"${data.pageTitle}","${data.pageUrl}"\n\n`;
    
    // csv += "Headings\n";
    // data.headings.forEach(h => csv += `"${h}"\n`);
    
    // 表头
    csv += `\n${data.tableHeads.join(',')}\n`;
    // 表内
    data.tableList.forEach(l => csv += `${l.join(',')}\n`);
  
    // 触发下载
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `商品${new Date().toLocaleString()}.csv`;
    a.click();
}

async function getAuthToken() {
  const data = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',{
    method: "POST", // 指定方法为 POST
    headers: {
      "Content-Type": "application/json", // 设置请求头（根据实际需求调整）
    },
    body: JSON.stringify({ app_id: "cli_a771e2da6b78d00e",app_secret:"SzssAEpxhP6AYNq23H3cWFMIUVfEFWQl" }), // 请求体数据（可传字符串、FormData 等）
  })
  console.log('TH',data)
}

async function uploadFile(file, authToken) {
  const data = await fetch('https://open.feishu.cn/open-apis/im/v1/files',{
    method: "POST", // 指定方法为 POST
    headers: {
      "Authorization": authToken,
      "Content-Type": "multipart/form-data; boundary=---7MA4YWxkTrZu0gW", // 设置请求头（根据实际需求调整）
    },
    body: JSON.stringify({
      file_type:'xls',
      file_name:'测试视频.mp4',
      duration:3000,
      file:file,
    }), // 请求体数据（可传字符串、FormData 等）
  })
  console.log('TH',data)
}