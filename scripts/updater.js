const fs = require("fs");
const https = require("https");

let code = fs.readFileSync("script.js", "utf8");

const regex = /allMovies = \[\s*\{[\s\S]*?\}\n\s*\];/;
let match = regex.exec(code);
let oldArray = match[0];

let tvMazeMovies = [];
const movieRegex =
  /\{\s*"id":\s*\d+,\s*"title":\s*"([^"]+)",\s*"genre":\s*"([^"]+)",\s*"year":\s*"([^"]+)",\s*"time":\s*"([^"]+)",\s*"image":\s*"([^"]+)",\s*"isTrending":\s*(true|false),\s*"isOscar":\s*(true|false)(?:,\s*"rating":\s*"[^"]+")?\s*\}/g;

let m;
while ((m = movieRegex.exec(oldArray)) !== null) {
  let score = 7.5 + (m[1].length % 20) / 10;
  if (m[7] === "true") score += 0.5;
  if (score > 9.8) score = 9.8;

  tvMazeMovies.push({
    title: m[1],
    genre: m[2],
    year: m[3],
    time: m[4],
    image: m[5],
    isTrending: m[6] === "true",
    isOscar: m[7] === "true",
    rating: score.toFixed(1),
  });
}

const famousShows = [
  "Chernobyl",
  "Band of Brothers",
  "The Wire",
  "The Sopranos",
  "Dexter",
  "Sherlock",
  "True Detective",
  "Fargo",
  "Dark",
  "Mindhunter",
  "Black Mirror",
  "Narcos",
  "House of Cards",
  "The Crown",
  "Vikings",
  "Better Call Saul",
  "Succession",
  "The Last of Us",
  "Friends",
  "Seinfeld",
];

async function getShowData(query) {
  return new Promise((resolve) => {
    https
      .get(
        "https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(query),
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed && parsed.length > 0 && parsed[0].show.image) {
                let s = parsed[0].show;
                resolve({
                  title: s.name,
                  genre: s.genres[0] || "Drama",
                  year: s.premiered ? s.premiered.substring(0, 4) : "2015",
                  time: (s.averageRuntime || 45) + "dk",
                  image: s.image.original || s.image.medium,
                  isTrending: true,
                  isOscar: false,
                  rating:
                    s.rating && s.rating.average
                      ? s.rating.average.toFixed(1)
                      : "8.5",
                });
              } else {
                resolve(null);
              }
            } catch (e) {
              resolve(null);
            }
          });
        },
      )
      .on("error", () => resolve(null));
  });
}

async function run() {
  console.log("Fetching 20 famous shows from TVMaze...");
  for (let show of famousShows) {
    let data = await getShowData(show);
    if (data) {
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
      };
      if (genreMap[data.genre]) data.genre = genreMap[data.genre];

      tvMazeMovies.push(data);
      console.log("Added:", data.title);
    }
  }

  tvMazeMovies.forEach((v, i) => (v.id = i + 1));

  let newArrayStr =
    "allMovies = [\n" +
    tvMazeMovies.map((v) => "  " + JSON.stringify(v)).join(",\n") +
    "\n];";
  let newCode = code.replace(oldArray, newArrayStr);
  fs.writeFileSync("script.js", newCode);
  console.log("Total movies now:", tvMazeMovies.length);
}
run();
