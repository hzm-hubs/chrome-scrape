// 可与background交互
console.log("common ====== start");

const version = 1.0;

window.getDomain = () => {
  if (!window) {
    return;
  }

  const locationName = window.location.hostname;
  console.log("当前域名", locationName);
};
