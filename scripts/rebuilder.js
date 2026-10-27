const fs = require("fs");
const https = require("https");
const http = require("http");

let code = fs.readFileSync("script.js", "utf8");

const regex = /allMovies = (\[[\s\S]*?\]);/;
let match = regex.exec(code);
let currentShows = JSON.parse(match[1]);

currentShows.forEach((s) => {
  if (!s.rating) {
    s.rating = (8.0 + (s.title.length % 15) / 10).toFixed(1);
  }
});

const db = JSON.parse(fs.readFileSync("db.json"));
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
  let addedTitles = currentShows.map((s) => s.title);

  for (let mv of db.movies) {
    if (validMovies.length >= 101) break;
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

      let rating = (7.5 + (title.length % 20) / 10).toFixed(1);

      validMovies.push({
        title: title,
        genre: genreMap[genre] || "Drama",
        year: mv.year,
        time: mv.runtime + "dk",
        image: url,
        isTrending: false,
        isOscar: false,
        rating: rating,
      });
      addedTitles.push(title);
    }
  }

  let allCombined = [...currentShows, ...validMovies];

  allCombined.forEach((v, i) => {
    v.id = i + 1;

    v.isTrending = i < 10;
    v.isOscar = i >= 10 && i < 20;

    if (v.isOscar && parseFloat(v.rating) < 8.5)
      v.rating = (parseFloat(v.rating) + 0.8).toFixed(1);
  });

  let newArrayStr = "allMovies = " + JSON.stringify(allCombined, null, 2) + ";";

  let newCode = code.replace(match[0], newArrayStr);
  fs.writeFileSync("script.js", newCode);
  console.log(
    "Successfully saved " + allCombined.length + " movies/shows with RATINGS!",
  );
}
run();
