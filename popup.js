chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "scrapedData") {
		const { headings, links, selectedText, pageTitle, pageUrl } = request.data;

		let outputHTML = `
        <p><strong>Page:</strong> <a href="${pageUrl}" target="_blank">${pageTitle}</a></p>
        <p><strong>Selected Text:</strong> ${selectedText || "None"}</p>
      `;

		if (headings.length > 0) {
			outputHTML += `<h4>Headings (${headings.length})</h4><ul>`;
			headings.forEach((h) => (outputHTML += `<li>${h}</li>`));
			outputHTML += `</ul>`;
		}

		if (links.length > 0) {
			outputHTML += `<h4>Links (${links.length})</h4><ul>`;
			links.slice(0, 10).forEach((link) => {
				outputHTML += `<li><a href="${link.url}" target="_blank">${
					link.text || link.url
				}</a></li>`;
			});
			outputHTML += `</ul>`;
			if (links.length > 10)
				outputHTML += `<p>+ ${links.length - 10} more links...</p>`;
		}

		document.getElementById("output").innerHTML = outputHTML;
	}
});

try {
	fetch(
		"https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				app_id: "YOUR_APP_ID",
				app_secret: "YOUR_APP_SECRET",
			}),
		}
	).then((res) => {
		console.log(res);
	});
	// 处理token...
} catch (error) {
	console.error("Error:", error);
}

// 方法 2：从 chrome.storage 读取
// chrome.storage.local.get("scrapedData", (result) => {
//     if (result.scrapedData) console.log(result.scrapedData);
//   });
