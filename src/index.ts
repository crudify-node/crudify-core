import * as data from "./schema.json";
import * as fs from "fs";
import * as path from "path";

const appFolderName = path.join(__dirname, "../app");
console.log(appFolderName);

// Check if the folder exists else create it
try {
  if (!fs.existsSync(appFolderName)) {
    fs.mkdirSync(appFolderName);
  }
} catch (err) {
  console.log(err);
}

// Check if demo file exists else create a demo file
const content = `datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}

generator client {
    provider = "prisma-client-js"
}`;

fs.writeFile(path.join(appFolderName, "/schema.prisma"), content, (err) => {
  if (err) {
    console.log(err);
    return;
  }
});
