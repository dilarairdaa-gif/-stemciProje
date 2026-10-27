const fs = require("fs");
const https = require("https");

let code = fs.readFileSync("script.js", "utf8");

const regex = /allMovies = (\[[\s\S]*?\]);/;
let match = regex.exec(code);
let movies = JSON.parse(match[1]);

const additions = [
  { q: "Stranger Things", genre: "Bilim Kurgu" },
  { q: "Fringe", genre: "Bilim Kurgu" },
  { q: "Westworld", genre: "Bilim Kurgu" },
  { q: "The X-Files", genre: "Bilim Kurgu" },
  { q: "Doctor Who", genre: "Bilim Kurgu" },
  { q: "Altered Carbon", genre: "Bilim Kurgu" },
  { q: "The Mandalorian", genre: "Bilim Kurgu" },
  { q: "The Walking Dead", genre: "Korku" },
  { q: "American Horror Story", genre: "Korku" },
  { q: "Penny Dreadful", genre: "Korku" },
  { q: "Bates Motel", genre: "Korku" },
  { q: "Hannibal", genre: "Korku" },
  { q: "Supernatural", genre: "Korku" },
  { q: "The Haunting of Hill House", genre: "Korku" },
];

async function getShowData(query, forcedGenre) {
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
                  genre: forcedGenre,
                  year: s.premiered ? s.premiered.substring(0, 4) : "2015",
                  time: (s.averageRuntime || 45) + "dk",
                  image: s.image.original || s.image.medium,
                  isTrending: true,
                  isOscar: false,
                  rating:
                    s.rating && s.rating.average
                      ? s.rating.average.toFixed(1)
                      : (8.0 + Math.random() * 1.5).toFixed(1),
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
  console.log("Fetching Sci-Fi and Horror shows...");
  let currentId = Math.max(...movies.map((m) => m.id)) + 1;

  for (let item of additions) {
    if (movies.find((m) => m.title.toLowerCase() === item.q.toLowerCase())) {
      console.log("Skipping " + item.q + " (already exists)");
      continue;
    }
    let data = await getShowData(item.q, item.genre);
    if (data) {
      data.id = currentId++;
      movies.push(data);
      console.log("Added:", data.title, "-", data.genre);
    }
  }

  let newArrayStr = "allMovies = " + JSON.stringify(movies, null, 2) + ";";
  let newCode = code.replace(match[0], newArrayStr);
  fs.writeFileSync("script.js", newCode);
  console.log("Successfully saved. Total movies:", movies.length);
}
run();
