const fs = require("fs");
const https = require("https");
const http = require("http");

let code = fs.readFileSync("script.js", "utf8");

const regex = /allMovies = \[\s*\{[\s\S]*?\}\n\s*\];/;
let match = regex.exec(code);

if (match) {
  let oldArray = match[0];
  console.log("Found old array, length:", oldArray.length);

  const db = JSON.parse(fs.readFileSync("db.json"));

  let tvMazeMovies = [];
  const movieRegex =
    /\{\s*"id":\s*\d+,\s*"title":\s*"([^"]+)",\s*"genre":\s*"([^"]+)",\s*"year":\s*"([^"]+)",\s*"time":\s*"([^"]+)",\s*"image":\s*"([^"]+)",\s*"isTrending":\s*(true|false),\s*"isOscar":\s*(true|false)\s*\}/g;

  let m;
  while ((m = movieRegex.exec(oldArray)) !== null) {
    tvMazeMovies.push({
      title: m[1],
      genre: m[2],
      year: m[3],
      time: m[4],
      image: m[5],
      isTrending: m[6] === "true",
      isOscar: m[7] === "true",
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
    let validMovies = [];
    for (let mv of tvMazeMovies) {
      if (validMovies.length >= 100) break;
      let isValid = await checkUrl(mv.image);
      if (isValid) {
        validMovies.push(mv);
      }
    }

    let addedTitles = validMovies.map((v) => v.title);

    for (let mv of db.movies) {
      if (validMovies.length >= 100) break;
      let title = mv.title.replace(
        " or (The Unexpected Virtue of Ignorance)",
        "",
      );
      if (addedTitles.includes(title)) continue;

      let url = mv.posterUrl;
      if (!url) continue;
      if (url.startsWith("http://ia.media-imdb.com")) {
        url = url.replace(
          "http://ia.media-imdb.com",
          "https://images-na.ssl-images-amazon.com",
        );
      }

      let isValid = await checkUrl(url);
      if (isValid) {
        let genre = mv.genres[0] || "Drama";
        validMovies.push({
          title: title,
          genre: genreMap[genre] || "Drama",
          year: mv.year,
          time: mv.runtime + "dk",
          image: url,
          isTrending: false,
          isOscar: false,
        });
        addedTitles.push(title);
      }
    }

    validMovies.forEach((v, i) => (v.id = i + 1));

    validMovies.forEach((v, i) => {
      v.isTrending = i < 10;
      v.isOscar = i >= 10 && i < 20;
    });

    let newArrayStr =
      "allMovies = [\n" +
      validMovies.map((v) => "  " + JSON.stringify(v)).join(",\n") +
      "\n];";

    let newCode = code.replace(oldArray, newArrayStr);
    if (newCode === code) {
      console.log("REPLACE FAILED");
    } else {
      fs.writeFileSync("script.js", newCode);
      console.log(
        "Successfully saved " +
          validMovies.length +
          " VERIFIED working movies to script.js",
      );
    }
  }
  run();
} else {
  console.log("Could not match array in script.js");
}
