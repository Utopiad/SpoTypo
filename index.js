const fs = require("fs");
const path = require("path");
const util = require("util");

const distances = require("./lib/distances");

const log = obj => console.log(util.inspect(obj, false, null, true /* enable colors */));

const ignoredEntries = [".git", 'node_modules'];
const getCurrentDirectoryBase = (src = null) => {
  console.log("\n*** getCurrentDirectoryBase ***");
  const srcPath = src != null ? src : process.cwd();
  console.log("Directory base: ", fs.realpathSync(srcPath));
  return fs.realpathSync(process.cwd());
};

const justDoIt = () => console.log("just Do It");

function walkDir(valueToSearch, dir, callback) {
  console.log("dir", dir);
  console.log("--");
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    // console.log('dirPath', dirPath)
    const toBeParsed = !ignoredEntries.find(entry => dirPath.indexOf(entry) !== -1);
    if (toBeParsed) {
      let isDirectory = fs.statSync(dirPath).isDirectory();
      isDirectory ? walkDir(valueToSearch, dirPath, callback) : callback(path.join(dir, f), valueToSearch);
    }
  });
}

function findMatches(line, index, target) {
  const rgx = RegExp(target, "g");
  let match;
  const payload = [];
  while ((match = rgx.exec(line)) !== null) {
    payload.push({ line: index, char: rgx.lastIndex, text: outputLine });
  }

  return payload;
}

function findSimilarities(line, index, target) {
  const halfTargetLength = Math.ceil(target.length / 2)
  return line
    .split(" ")
    .filter(x => x) // because empty lines are falsy in javascript
    .map(w => {
      const payload = {
        word: w,
        score: { levenshtein: distances.levenshtein(target, w), hammer: null },
        char: line.indexOf(w),
        line: index,
        exactMatch: false
      };
      payload.similarMatch = payload.score.levenshtein <= halfTargetLength;

      if (w.length === target.length) {
        payload.score.hammer = distances.hammer(target, w);
        payload.exactMatch = payload.score.hammer === 4 && payload.score.levenshtein === 0;
        
        return payload;
      }
      return payload;
    });
}

const parseIt = (txt, value) => {
  const txtByLines = txt.split("\n");
  console.log("txtByLines ----");
  const rgx = RegExp(`${value}`, "g");
  const occurrences = txtByLines.reduce(
    (output, line, index) => {
      outputLine = line.trim();
      const payload = {
        presenceOfCloseMatches: output.similarities.some(entry => !entry.exactMatch && entry.similarMatch)
      }
      if (!outputLine.length) {
        if (index === txtByLines.length - 1) {
          console.log(index)
          payload.presenceOfCloseMatches = output.similarities.some(entry => !entry.exactMatch && entry.similarMatch)
        }
        return output;
      }

      payload.matches = output.matches.concat(findMatches(line, index, value))
      payload.similarities = output.similarities.concat(findSimilarities(line, index, value))
      
      if (index === txtByLines.length - 1) {
        payload.presenceOfCloseMatches = payload.similarities.some(entry => !entry.exactMatch && entry.similarMatch)
        // console.log(payload.presenceOfCloseMatches)
      }

      return payload
    },
    { matches: [], similarities: [] }
  );
  // console.log(occurrences.hasOwnProperty('presenceOfCloseMatches'))
  log({presenceOfCloseMatches: occurrences.presenceOfCloseMatches})
  if (occurrences.presenceOfCloseMatches) {
    log(occurrences)
    log('length of close matches', occurrences.similarities.filter(entry => !entry.exactMatch && entry.similarMatch).length)
  }
  return occurrences;
};

walkDir("just", getCurrentDirectoryBase(), function(filePath, valueToSearch) {
  const fileContents = fs.readFileSync(filePath, "utf8");
  console.log(filePath);
  if (filePath.endsWith(".js")) {
    const mactches = parseIt(fileContents, valueToSearch);
  }
});
