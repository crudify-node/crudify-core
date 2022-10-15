#!/usr/bin/env node

import crudify from "./index";
import { exec } from "child_process";

async function main() {
  const error = await crudify(process.argv[2].toString());
  if (error) {
    console.log(error);
    return;
  }
  console.log("Formatting your code");

  exec('prettier --write "app"', (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    // console.log(`stdout: ${stdout}`);
    console.log("All done, have fun!");
  });
}

main();
