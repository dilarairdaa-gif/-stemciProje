const fs = require("fs");
const db = JSON.parse(fs.readFileSync("db.json"));
let code = fs.readFileSync("script.js", "utf8");

let currentTitles = [];
let match;
const regex = /"title":\s*"([^"]+)"/g;
while ((match = regex.exec(code)) !== null) {
  currentTitles.push(match[1]);
}

let extraMovies = [];
let idCounter = 41;

for (let m of db.movies) {
  if (extraMovies.length >= 60) break;
  let title = m.title.replace(" or (The Unexpected Virtue of Ignorance)", "");
  if (!currentTitles.includes(title)) {
    let url = m.posterUrl;
    if (url.startsWith("http://ia.media-imdb.com")) {
      url = url.replace(
        "http://ia.media-imdb.com",
        "https://images-na.ssl-images-amazon.com",
      );
    }
    extraMovies.push({
      id: idCounter++,
      title: title,
      genre: m.genres[0] || "Drama",
      year: m.year,
      time: m.runtime + "dk",
      image: url,
      isTrending: false,
      isOscar: false,
    });
  }
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

extraMovies.forEach((m) => {
  if (genreMap[m.genre]) m.genre = genreMap[m.genre];
  else m.genre = "Drama";
});

let extraString =
  ",\n" + extraMovies.map((m) => "  " + JSON.stringify(m)).join(",\n");
code = code.replace(/    \}\n\];/, "    }" + extraString + "\n];");
fs.writeFileSync("script.js", code);
console.log("Added " + extraMovies.length + " movies.");
