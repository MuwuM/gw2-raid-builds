const fs = require("fs-extra");
const path = require("path");
const puppeteer = require("puppeteer");

(async() => {
  const buildsFile = path.resolve(process.cwd(), "builds.json");
  const builds = await fs.readJSON(buildsFile);

  const browser = await puppeteer.launch({headless: true});
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
    if (matchingBuilds.length < 1 && matchingBuildsByLink.length < 1) {
      console.log({
        info: "Missing/invalid sc build",
        bench: row.benchName,
        Yt: row.youtube,
        ScLink: row.buildUrl
      });
      continue;
    }
    if (matchingBuilds.length === 1 && matchingBuildsInBoth.length < 1) {
      const build = matchingBuilds[0];
      console.log({
        info: "Missing/invalid sc build",
        build: `${build.spec}: ${build.name}`,
        bench: row.benchName,
        Yt: row.youtube,
        ScLink: row.buildUrl,
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
        ScYt: row.youtube,
        yt: `https://www.youtube.com/watch/${build.youtube}`
      });
      continue;
    }
    console.log({
      bench: row.benchName,
      builds: matchingBuilds.map((b) => b.name),
      buildsLink: matchingBuildsByLink.map((b) => b.name),
      Yt: row.youtube,
      ScLink: row.buildUrl
    });
  }

  await page.goto("https://snowcrows.com/builds?profession=Any&role=Any&damage=Any&beginner=0", {waitUntil: "networkidle2"});

  const fullScMetaBuildRows = await page.$$eval("#app .shadow-sm.rounded.overflow-y-hidden a", (rows) => rows.map((row) => {

    const buildUrl = row.href;
    const benchName = row.querySelector(".block.font-medium.w-52").textContent;
    return {
      benchName,
      buildUrl
    };
  }));

  for (const row of fullScMetaBuildRows) {
    const plainScLink = row.buildUrl.replace(/^https:\/\/snowcrows\.com/, "");
    const matchingBuildsByLink = builds.filter((b) => b.snowcrows === plainScLink);
    if (matchingBuildsByLink.length < 1) {
      console.log({
        info: "Missing/invalid sc build",
        bench: row.benchName,
        Yt: row.youtube,
        ScLink: row.buildUrl
      });
      continue;
    }
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
    const isKnownBuild = fullScMetaBuildRows.find((r) => r.buildUrl === fullScLink);
    if (isKnownBuild) {
      continue;
    }
    console.log({
      info: "SC build not listed",
      build: `${build.spec}: ${build.name}`,
      fullScLink
    });
    const res = await page.goto(fullScLink, {waitUntil: "networkidle2"});
    const status = res.status();
    if (status === 200) {
      continue;
    }

    console.log({
      info: "missing SC build",
      build: `${build.spec}: ${build.name}`,
      fullScLink,
      resStatus: status
    });
  }

  const lnBuildOverviewList = [
    "https://lucky-noobs.com/klassen/warrior?category=builds",
    "https://lucky-noobs.com/klassen/guard?category=builds",
    "https://lucky-noobs.com/klassen/revenant?category=builds",
    "https://lucky-noobs.com/klassen/ranger?category=builds",
    "https://lucky-noobs.com/klassen/thief?category=builds",
    "https://lucky-noobs.com/klassen/engineer?category=builds",
    "https://lucky-noobs.com/klassen/elementalist?category=builds",
    "https://lucky-noobs.com/klassen/mesmer?category=builds",
    "https://lucky-noobs.com/klassen/necromancer?category=builds"
  ];

  let fullLnUrls = [];
  for (const lnBuildOverview of lnBuildOverviewList) {
    await page.goto(lnBuildOverview, {waitUntil: "networkidle2"});
    const rows = await page.$$eval(".ln-subnav.ln-build-subnav li a", (rows) => rows.map((row) => {
      const buildUrl = row.href;
      const benchName = row.querySelector(".uk-margin-small-left").textContent;
      return {
        benchName,
        buildUrl
      };
    }));
    fullLnUrls = fullLnUrls.concat(rows);

    for (const row of rows) {
      const plainLnLink = row.buildUrl.replace(/^https:\/\/lucky-noobs\.com/, "");
      const matchingBuildsByLink = builds.filter((b) => b.luckynoobs === plainLnLink);
      if (matchingBuildsByLink.length < 1) {
        console.log({
          info: "Missing/invalid LN build",
          bench: row.benchName,
          LnLink: row.buildUrl
        });
        continue;
      }
    }
  }

  for (const build of builds) {
    if (!build.luckynoobs) {
      continue;
    }
    const fullLnLink = (new URL(build.luckynoobs, "https://lucky-noobs.com")).href;
    const matchingBuildsByLink = fullLnUrls.filter((r) => r.buildUrl === fullLnLink);
    if (matchingBuildsByLink.length < 1) {
      console.log({
        info: "LN build not Listed",
        build: `${build.spec}: ${build.name}`,
        fullLnLink
      });
      continue;
    }
  }

  const hsBuildOverviewListJSON = ["https://beta.hardstuck.gg/api/builds/?gamemode=squad"];

  for (const hsBuildOverviewJson of hsBuildOverviewListJSON) {
    const res = await page.goto(hsBuildOverviewJson, {waitUntil: "networkidle2"});
    const hsBuilds = await res.json();

    for (const row of hsBuilds) {
      if (row.gamemode !== "Squad") {
        continue;
      }
      const plainHsLink = row.url.replace(/^https:\/\/beta\.hardstuck\.gg/, "");
      const matchingBuildsByLink = builds.filter((b) => typeof b.hardstuck === "string" && b.hardstuck.startsWith(plainHsLink));
      if (matchingBuildsByLink.length < 1) {
        console.log({
          info: "Missing/invalid HS build",
          bench: row.name,
          LnLink: row.url
        });
        continue;
      }
      const variants = Object.keys(row.variants);
      for (const variant of variants) {
        if ([
          "optimized",
          "universal",
          "flexible"
        ].includes(variant)) {
          continue;
        }
        const matchingBuildsByLink = builds.filter((b) => b.hardstuck === `${plainHsLink}?v=${variant}`);
        if (matchingBuildsByLink.length < 1) {
          console.log({
            info: "Missing/invalid HS build variant",
            bench: row.name,
            LnLink: `${row.url}?v=${variant}`
          });
          continue;
        }
      }
    }
    for (const build of builds) {
      if (typeof build.hardstuck !== "string") {
        continue;
      }
      const hsUrl = new URL(build.hardstuck, "https://beta.hardstuck.gg");
      const fullHSLink = hsUrl.href;
      const variant = hsUrl.searchParams.get("v");
      const stillExists = hsBuilds.find(((b) => {
        const u = new URL(b.url, "https://beta.hardstuck.gg");
        if (u.pathname !== hsUrl.pathname) {
          return false;
        }

        if (variant && typeof b.variants[variant] !== "string") {
          return false;
        }
        return true;
      }));
      if (!stillExists) {
        console.log({
          info: "HS build not listed",
          build: `${build.spec}: ${build.name}`,
          fullHSLink
        });
      }
    }
  }


  const awBuildOverviewList = ["https://accessibilitywars.com/builds/"];

  for (const awBuildOverview of awBuildOverviewList) {
    await page.goto(awBuildOverview, {waitUntil: "networkidle2"});
    const rows = await page.$$eval(".entries-list .list__item a[rel=permalink]", (rows) => rows.map((row) => {
      const buildUrl = row.href;
      const benchName = row.textContent;
      return {
        benchName,
        buildUrl
      };
    }));

    for (const row of rows) {
      const plainAwLink = row.buildUrl.replace(/^https:\/\/accessibilitywars\.com/, "");
      const matchingBuildsByLink = builds.filter((b) => b.accessibilitywars === plainAwLink);
      if (matchingBuildsByLink.length < 1) {
        console.log({
          info: "Missing/invalid AW build",
          bench: row.benchName,
          AwLink: row.buildUrl
        });

        continue;
      }
    }
  }

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
