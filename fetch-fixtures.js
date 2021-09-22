const fs = require("fs/promises");
const { createWriteStream, createReadStream } = require("fs");
const crypto = require("crypto");
const { buildNum, sha } = require("./_test/all.meta.json");
const update = process.argv[2] === "latest";
const dataUrl = `https://raw.githubusercontent.com/nornagon/cdda-data/main/data/${
  update ? "latest" : buildNum
}/all.json`;

function computeSha(file) {
  return new Promise((resolve) => {
    const hash = crypto.createHash("sha256");
    const s = createReadStream(file);
    s.on("data", (d) => hash.update(d));
    s.on("end", () => {
      resolve(hash.digest("hex"));
    });
  });
}

async function matchesSha(file, sha) {
  return sha === (await computeSha(file));
}

(async () => {
  const filename = __dirname + "/_test/all.json";
  if (
    !(await fs.access(filename).then(
      () => true,
      () => false
    ))
  ) {
    console.log("Test data not present, fetching...");
  } else if (!(await matchesSha(filename, sha)) || update) {
    if (update) console.log("Updating test data...");
    else console.log("Test data not up-to-date, fetching...");
  } else {
    return;
  }
  const res = await require("node-fetch")(dataUrl);
  const dest = createWriteStream(filename);
  res.body.pipe(dest);
  res.body.on("end", async () => {
    const sha = await computeSha(filename);
    const buildNum = JSON.parse(
      await fs.readFile(filename, "utf8")
    ).build_number;
    await fs.writeFile(
      __dirname + "/_test/all.meta.json",
      JSON.stringify({ buildNum, sha })
    );
  });
})();
