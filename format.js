const fs = require("fs-extra");
const path = require("path");

(async() => {
  const buildsFile = path.resolve(process.cwd(), "builds.json");
  const builds = await fs.readJSON(buildsFile);

  const formattedBuilds = builds.map((build) => {
    const formatted = ({
      class: build.class,
      spec: build.spec,
      role: build.role,
      name: build.name,
      boons: {
        alac: (build.boons && typeof build.boons.alac === "number") ? build.boons.alac : false,
        quick: (build.boons && typeof build.boons.quick === "number") ? build.boons.quick : false,
        might: (build.boons && typeof build.boons.might === "number") ? build.boons.might : false,
        fury: (build.boons && typeof build.boons.fury === "number") ? build.boons.fury : false,
        aegis: (build.boons && typeof build.boons.aegis === "number") ? build.boons.aegis : false,
        regen: (build.boons && typeof build.boons.regen === "number") ? build.boons.regen : false,
        swiftness: (build.boons && typeof build.boons.swiftness === "number") ? build.boons.swiftness : false
      },
      gw2skills: build.gw2skills || false,
      snowcrows: build.snowcrows || false,
      luckynoobs: build.luckynoobs || false,
      bench: typeof build.bench === "number" ? build.bench : false,
      benchWithAllies: typeof build.benchWithAllies === "number" ? build.benchWithAllies : false,
      benchLarge: typeof build.benchLarge === "number" ? build.benchLarge : false,
      benchConfusion: typeof build.benchConfusion === "number" ? build.benchConfusion : false,
      benchOld: build.benchOld || false
    });
    return formatted;
  });
  //console.log({count: formattedBuilds.length});
  await fs.outputJSON(buildsFile, formattedBuilds, {spaces: 2});

})().catch((err) => {
  console.error(err);
  process.exit(1);
});
