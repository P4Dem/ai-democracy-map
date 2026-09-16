import sharp from "sharp";
import { copyFileSync } from "fs";

const src = "public/logo.png";

await sharp(src).resize(16, 16).toFile("public/favicon-16x16.png");
await sharp(src).resize(32, 32).toFile("public/favicon-32x32.png");
await sharp(src).resize(180, 180).toFile("public/apple-touch-icon.png");
await sharp(src).resize(192, 192).toFile("public/favicon-192x192.png");

copyFileSync("public/favicon-32x32.png", "public/favicon.ico");

console.log("Favicons generated.");
