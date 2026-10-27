const fs = require("fs");
const https = require("https");
const http = require("http");

let code = fs.readFileSync(
  "C:/Users/dilaraa/OneDrive/Desktop/İrfanİstemci/script.js",
  "utf8",
);

let urls = [];
const regex = /"image":\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(code)) !== null) {
  urls.push(match[1]);
}

async function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        resolve(res.statusCode);
        res.resume();
      })
      .on("error", (err) => {
        resolve("ERROR");
      });
  });
}

async function run() {
  console.log("Checking " + urls.length + " URLs...");
  for (let url of urls) {
    let status = await checkUrl(url);
    if (status !== 200) {
      console.log("BROKEN:", status, url);
    }
  }
  console.log("Done.");
}
run();
