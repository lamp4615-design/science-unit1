// 用法：node build.js  → 讀取 questions.json，把題目嵌入 template.html，產生 index.html
const fs = require("fs");
const qs = JSON.parse(fs.readFileSync("questions.json", "utf8"));
const html = fs.readFileSync("template.html", "utf8").replace("/*QUESTIONS*/[]", JSON.stringify(qs));
fs.writeFileSync("index.html", html);
console.log("已產生 index.html，共 " + qs.length + " 題");
