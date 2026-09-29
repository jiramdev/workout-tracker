const fs = require("fs");
let p = fs.readFileSync("src/data/defaultPlans.ts", "utf8");
p = p.replace(/lastReps\s+"7"/g, "lastReps: \"7\"");
fs.writeFileSync("src/data/defaultPlans.ts", p);

let c = fs.readFileSync("src/components/ExerciseCard.tsx", "utf8");
c = c.replace(/focus:outline-none"\s*\/\s*<\/div>/g, "focus:outline-none\" />
                </div>");
fs.writeFileSync("src/components/ExerciseCard.tsx", c);
console.log("Klaar!");
