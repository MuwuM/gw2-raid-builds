const fs = require("fs-extra");
const path = require("path");
const puppeteer = require("puppeteer");

(async() => {
  const buildsFile = path.resolve(process.cwd(), "builds.json");
  const builds = await fs.readJSON(buildsFile);

  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

  await page.goto("https://snowcrows.com/benchmarks", {waitUntil: "networkidle2"});

  const rows = await page.$$eval("#app .rounded-t", (rows) => rows.map((row) => {
    const hrefs = row.querySelectorAll("a");
    const buildUrl = hrefs[0].href;
    const benchName = hrefs[0].textContent;
    const youtube = hrefs[1].href;
    const benchElement = row.querySelector(".flex-grow.text-right");
    const bench = parseInt(benchElement.textContent.replace(/^\s*([\d,.]+)\s*DPS\s*$/, "$1").replace(/,/g, ""), 10);
    let hitBoxElem = row.parentElement;
    while (hitBoxElem.previousElementSibling && hitBoxElem.tagName !== "H2") {
      hitBoxElem = hitBoxElem.previousElementSibling;
    }
    let hitbox = "unknown";
    if (hitBoxElem) {
      hitbox = hitBoxElem.textContent.replace(/^\s*(\w+)\s*hitbox\s*$/i, "$1").toLowerCase();
    }
    return {
      benchName,
      buildUrl,
      youtube,
      bench,
      hitbox
    };
  }));

  for (const row of rows) {
    const plainYt = row.youtube.replace(/^https:\/\/youtube\.com\/watch\//, "");
    const matchingBuilds = builds.filter((b) => b.youtube === plainYt || b.oldYoutube.includes(plainYt));
    const plainScLink = row.buildUrl.replace(/^https:\/\/snowcrows\.com/, "");
    const matchingBuildsByLink = builds.filter((b) => b.snowcrows === plainScLink);
    const matchingBuildsInBoth = matchingBuildsByLink.filter((b) => matchingBuilds.includes(b));
    if (matchingBuilds.length === 1 && matchingBuildsInBoth.length === 1) {
      continue;
    }
    if (matchingBuilds.length === 1 && matchingBuildsInBoth.length < 1) {
      const build = matchingBuilds[0];
      console.log({
        info: "Missing/invalid sc build",
        build: `${build.spec}: ${build.name}`,
        bench: row.benchName,
        plainYt: `https://www.youtube.com/watch/${plainYt}`,
        plainScLink,
        oldScLink: build.snowcrows
      });
      continue;
    }
    if (matchingBuildsByLink.length === 1 && matchingBuilds.length < 1) {
      const build = matchingBuildsByLink[0];
      console.log({
        info: "Youtube doesn't match",
        bench: row.benchName,
        build: `${build.spec}: ${build.name}`,
        plainYt: `https://www.youtube.com/watch/${plainYt}`,
        yt: `https://www.youtube.com/watch/${build.youtube}`
      });
      continue;
    }
    console.log({
      bench: row.benchName,
      builds: matchingBuilds.map((b) => b.name),
      buildsLink: matchingBuildsByLink.map((b) => b.name),
      plainYt
    });
  }

  for (const build of builds) {
    if (!build.snowcrows) {
      continue;
    }
    const fullScLink = `https://snowcrows.com${build.snowcrows}`;
    const hasBench = rows.find((r) => r.buildUrl === fullScLink);
    if (hasBench) {
      continue;
    }
    const res = await page.goto(fullScLink, {waitUntil: "networkidle2"});
    const status = res.status();
    if (status === 200) {
      continue;
    }

    console.log({
      info: "missing SC build",
      fullScLink,
      resStatus: status
    });
  }

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
