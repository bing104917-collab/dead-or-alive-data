const fs = require("fs");
const a = JSON.parse(fs.readFileSync("quote_texts.json","utf8"));
console.log(a.length, a[0]);