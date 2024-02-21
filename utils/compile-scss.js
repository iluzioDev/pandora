/// Compile SCSS files to CSS
/// Usage: node utils/compile-scss.js

const sass = require("node-sass");
const fs = require("fs");
const path = require("path");

const sourceDir = "static/scss";
const destDir = "static/css";

const scssFiles = fs
  .readdirSync(sourceDir)
  .filter((file) => path.extname(file) === ".scss");

scssFiles.forEach((scssFile) => {
  const baseName = path.basename(scssFile, ".scss");
  const sourceFilePath = path.join(sourceDir, scssFile);
  const destFilePath = path.join(destDir, `${baseName}.css`);

  sass.render(
    {
      file: sourceFilePath,
      outputStyle: "expanded",
    },
    (error, result) => {
      if (!error) {
        fs.writeFileSync(destFilePath, result.css);
        console.log(`Compiled: ${scssFile} -> ${destFilePath}`);
      } else {
        console.error(`Error compiling: ${scssFile}`);
        console.error(error);
      }
    }
  );
});
