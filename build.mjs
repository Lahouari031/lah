// Rassemble public/index.html + style.css + app.js en un seul fichier HTML :
//  - mobile/app-html.js : la page complète, chargée par l'appli Expo (WebView)
//  - dist/mon-parcoursup.html : la même page sans <html>/<head>, pour un aperçu en ligne
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(root, "public", f), "utf8");

const html = read("index.html");
const css = read("style.css");
const js = read("app.js").replace(/<\/script/gi, "<\\/script");

const inlined = html
  .replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script src="app.js"></script>', () => `<script>\n${js}\n</script>`);

if (inlined.includes('href="style.css"') || inlined.includes('src="app.js"')) {
  throw new Error("index.html a changé : impossible d'intégrer style.css / app.js");
}

// Appli mobile
fs.mkdirSync(path.join(root, "mobile"), { recursive: true });
fs.writeFileSync(
  path.join(root, "mobile", "app-html.js"),
  "// Fichier généré par `npm run build` à partir de public/. Ne pas modifier à la main.\n" +
    `export default ${JSON.stringify(inlined)};\n`,
);

// Aperçu en ligne : uniquement le contenu de <head> et <body>
const head = inlined.match(/<head>([\s\S]*)<\/head>/)[1]
  .replace(/<meta charset[^>]*>\s*/, "")
  .replace(/<meta name="viewport"[^>]*>\s*/, "")
  .replace(/<title>[^<]*<\/title>/, '<title>Mon Parcoursup</title>\n  <meta name="claude:viewport-fit-sides" content="cover">');
const body = inlined.match(/<body>([\s\S]*)<\/body>/)[1];
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist", "mon-parcoursup.html"), `${head.trim()}\n${body.trim()}\n`);

console.log("✅ mobile/app-html.js et dist/mon-parcoursup.html générés");
