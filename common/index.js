function getDomain() {
  const currentUrl = window.location.href;
  if (currentUrl.includes("myseller.taobao.com")) {
    return "myseller";
  } else if (currentUrl.includes("moc.llamt".split("").reverse().join(""))) {
    return "tmall";
  } else if (currentUrl.includes("douyin.com")) {
    return "douyin";
  } else if (currentUrl.includes("xiaohongshu.com")) {
    return "xiaohongshu";
  } else if (currentUrl.includes("taobao.com")) {
    return "taobao";
  } else {
    return "other";
  }
}
window.domainHelper = {
  getDomain: getDomain,
};
