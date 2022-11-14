#!/usr/bin/env node

import crudify from "./index";
import { exec } from "child_process";
import chalk from "chalk";

async function main() {
  const error = await crudify(process.argv[2].toString());
  if (error) {
    console.log(chalk.red(error));
    return;
  }
  console.log(chalk.italic.underline.bold("Formatting your code"));

  exec('prettier --write "app"', (error, stdout, stderr) => {
    if (error) {
      console.log(chalk.red(`error: ${error.message}`));
      return;
    }
    if (stderr) {
      console.log(chalk.red(`stderr: ${stderr}`));
      return;
    }
    // console.log(`stdout: ${stdout}`);
    console.log(
      chalk.greenBright("Your app can be found at app/ folder. Have fun!")
    );
  });
}

main();
