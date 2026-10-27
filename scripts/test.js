const fs = require("fs");
const https = require("https");

const content = fs.readFileSync(
  "C:/Users/dilaraa/OneDrive/Desktop/İrfanİstemci/script.js",
  "utf8",
);
const urls = [];
const regex = /image:\s*tmdb\s*\+\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  urls.push(match[1]);
}
console.log("Found", urls.length, "URLs");

async function check() {
  for (const path of urls) {
    const url = "https://image.tmdb.org/t/p/w500" + path;
    await new Promise((resolve) => {
      https
        .get(url, (res) => {
          if (res.statusCode !== 200)
            console.log("BROKEN:", path, res.statusCode);
          res.resume();
          resolve();
        })
        .on("error", (err) => {
          console.log("ERROR:", path, err.message);
          resolve();
        });
    });
  }
  console.log("Done checking.");
}
check();
