const fs = require("fs");
const https = require("https");
const http = require("http");

const db = JSON.parse(fs.readFileSync("db.json"));
let currentScript = fs.readFileSync("script.js", "utf8");

let tvMazeMovies = [];
const regex =
  /\{\s*"id":\s*\d+,\s*"title":\s*"([^"]+)",\s*"genre":\s*"([^"]+)",\s*"year":\s*"([^"]+)",\s*"time":\s*"([^"]+)",\s*"image":\s*"([^"]+)",\s*"isTrending":\s*(true|false),\s*"isOscar":\s*(true|false)\s*\}/g;

let match;
while ((match = regex.exec(currentScript)) !== null) {
  tvMazeMovies.push({
    title: match[1],
    genre: match[2],
    year: match[3],
    time: match[4],
    image: match[5],
    isTrending: match[6] === "true",
    isOscar: match[7] === "true",
  });
}

const genreMap = {
  Crime: "Aksiyon",
  Action: "Aksiyon",
  Adventure: "Macera",
  "Sci-Fi": "Bilim Kurgu",
  Comedy: "Komedi",
  Horror: "Korku",
  Drama: "Drama",
  Fantasy: "Bilim Kurgu",
  Romance: "Drama",
  Thriller: "Gerilim",
  Mystery: "Gerilim",
  Animation: "Komedi",
  Biography: "Drama",
};

async function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        resolve(res.statusCode === 200);
        res.resume();
      })
      .on("error", (err) => {
        resolve(false);
      });
  });
}

async function run() {
  console.log("Starting validation...");
  let validMovies = [];

  for (let m of tvMazeMovies) {
    if (validMovies.length >= 100) break;
    let isValid = await checkUrl(m.image);
    if (isValid) {
      validMovies.push(m);
      console.log("Verified:", m.title);
    } else {
      console.log("BROKEN (Removed):", m.title);
    }
  }

  let addedTitles = validMovies.map((m) => m.title);

  for (let m of db.movies) {
    if (validMovies.length >= 100) break;

    let title = m.title.replace(" or (The Unexpected Virtue of Ignorance)", "");
    if (addedTitles.includes(title)) continue;

    let url = m.posterUrl;
    if (!url) continue;
    if (url.startsWith("http://ia.media-imdb.com")) {
      url = url.replace(
        "http://ia.media-imdb.com",
        "https://images-na.ssl-images-amazon.com",
      );
    }

    let isValid = await checkUrl(url);
    if (isValid) {
      let genre = m.genres[0] || "Drama";
      validMovies.push({
        title: title,
        genre: genreMap[genre] || "Drama",
        year: m.year,
        time: m.runtime + "dk",
        image: url,
        isTrending: false,
        isOscar: false,
      });
      addedTitles.push(title);
      console.log("Added new verified:", title);
    } else {
      console.log("BROKEN DB (Skipped):", title);
    }
  }

  validMovies.forEach((m, i) => (m.id = i + 1));

  let arrayStr =
    "allMovies = [\n" +
    validMovies.map((m) => "  " + JSON.stringify(m)).join(",\n") +
    "\n];";

  let code = fs.readFileSync("script.js", "utf8");
  const startIdx = code.indexOf("allMovies = [");
  const endIdx = code.indexOf("];", startIdx) + 2;
  const oldArray = code.substring(startIdx, endIdx);

  code = code.replace(oldArray, arrayStr);
  fs.writeFileSync("script.js", code);

  console.log(
    `\nSuccessfully built database with ${validMovies.length} VERIFIED working images.`,
  );
}

run();
