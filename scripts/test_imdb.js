const https = require("https");

const urls = [
  "https://m.media-amazon.com/images/M/MV5BMDZkYmVhNjMtNWU4MC00MDQxLWE3NjYtYWNhMzRhOGRmZjJhXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg",
  "https://m.media-amazon.com/images/M/MV5BZmFlMTA0NDYtMDk4Yi00ZjJhLWFhM2ItYjg2YWU4NDUyNWFlXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_SX300.jpg",
  "https://m.media-amazon.com/images/M/MV5BYWE3MDVkN2ItZGYwNy00NTI2LWIzMTgwZTllNDRhNTM3NWVjXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_SX300.jpg",
];

async function check() {
  for (const url of urls) {
    await new Promise((resolve) => {
      https
        .get(url, (res) => {
          console.log(url, res.statusCode);
          res.resume();
          resolve();
        })
        .on("error", (err) => {
          console.log("ERROR:", url, err.message);
          resolve();
        });
    });
  }
}
check();
