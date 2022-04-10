const fs = require("fs-extra");
const path = require("path");

function numberOrFalse(inp) {
  return (typeof inp === "number") ? inp : false;
}
function stringOrFalse(inp) {
  return (typeof inp === "string") ? inp : false;
}

(async() => {
  const buildsFile = path.resolve(process.cwd(), "builds.json");
  const builds = await fs.readJSON(buildsFile);

  const formattedBuilds = builds.map((build) => {
    const formatted = ({
      class: build.class,
      spec: build.spec,
      role: build.role,
      name: build.name,
      lowIntensity: build.lowIntensity || false,
      boons: {
        alac: numberOrFalse(build.boons && build.boons.alac),
        quick: numberOrFalse(build.boons && build.boons.quick),
        might: numberOrFalse(build.boons && build.boons.might),
        fury: numberOrFalse(build.boons && build.boons.fury),
        aegis: numberOrFalse(build.boons && build.boons.aegis),
        regen: numberOrFalse(build.boons && build.boons.regen),
        swiftness: numberOrFalse(build.boons && build.boons.swiftness)
      },
      gw2skills: stringOrFalse(build.gw2skills),
      snowcrows: stringOrFalse(build.snowcrows),
      luckynoobs: stringOrFalse(build.luckynoobs),
      hardstuck: stringOrFalse(build.hardstuck),
      accessibilitywars: stringOrFalse(build.accessibilitywars),
      youtube: stringOrFalse(build.youtube),
      oldYoutube: (build.oldYoutube || []).filter(stringOrFalse),
      bench: numberOrFalse(build.bench),
      benchWithAllies: numberOrFalse(build.benchWithAllies),
      benchLarge: numberOrFalse(build.benchLarge),
      benchWithAlliesLarge: numberOrFalse(build.benchWithAlliesLarge),
      benchConfusion: numberOrFalse(build.benchConfusion),
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
