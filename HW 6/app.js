import {
  getData,
  checkIfFileExists,
  checkIfFolderExists,
} from "./coinsData.js";
import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import chalkAnimation from "chalk-animation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sleep = (ms = 2000) => new Promise((res) => setTimeout(res, ms));
let userChoice;
let tokenIdArray;
let userCoinChoice;

async function cliapp() {
  console.log(
    chalk.bold.green(` ⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠱⣠⠀⢁⣄⠔⠁⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠀⣷⣶⣾⣾⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⢀⡔⠙⠈⢱⡟⣧⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⡠⠊⠀⠀⣀⡀⠀⠘⠕⢄⠀⠀⠀⠀⠀
    ⠀⠀⠀⢀⠞⠀⠀⢀⣠⣿⣧⣀⠀⠀⢄⠱⡀⠀⠀⠀
    ⠀⠀⡰⠃⠀⠀⢠⣿⠿⣿⡟⢿⣷⡄⠀⠑⢜⢆⠀⠀
    ⠀⢰⠁⠀⠀⠀⠸⣿⣦⣿⡇⠀⠛⠋⠀⠨⡐⢍⢆⠀
    ⠀⡇⠀⠀⠀⠀⠀⠙⠻⣿⣿⣿⣦⡀⠀⢀⠨⡒⠙⡄
    ⢠⠁⡀⠀⠀⠀⣤⡀⠀⣿⡇⢈⣿⡷⠀⠠⢕⠢⠁⡇
    ⠸⠀⡕⠀⠀⠀⢻⣿⣶⣿⣷⣾⡿⠁⠀⠨⣐⠨⢀⠃
    ⠀⠣⣩⠘⠀⠀⠀⠈⠙⣿⡏⠁⠀⢀⠠⢁⡂⢉⠎⠀
    ⠀⠀⠈⠓⠬⢀⣀⠀⠀⠈⠀⠀⠀⢐⣬⠴⠒⠁⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠉⠉⠀⠀⠀⠀⠀⠀
    `)
  );

  const rainbowTitle = chalkAnimation.rainbow("Welcome to CoinGecko cli app");
  await sleep();
  rainbowTitle.stop();
}

await cliapp();

await inquirer
  .prompt([
    {
      type: "list",
      name: "userChoice",
      message: chalk.cyan.bold("What do you want me to do ?"),
      choices: ["Show coin list", "Start the server"],
      default: "Show coin list",
    },
  ])
  .then((res) => {
    userChoice = res.userChoice;
  });

if (userChoice == "Show coin list") {
  tokenIdArray = await checkIfFileExists(
    path.join(__dirname, "cache", "coins.json")
  );
  tokenIdArray = tokenIdArray.splice(0, 30);
  await inquirer
    .prompt([
      {
        type: "list",
        name: "userCoinChoice",
        choices: tokenIdArray,
        message: chalk.cyan("Choose one of the coins"),
        default: tokenIdArray[0],
      },
    ])
    .then((res) => {
      userCoinChoice = res.userCoinChoice;
    });

  let coinInfo = await getData(
    `https://api.coingecko.com/api/v3/coins/${userCoinChoice}/market_chart?vs_currency=usd&days=max`
  );
  coinInfo = JSON.stringify(coinInfo.data);

  await checkIfFolderExists(userCoinChoice);

  let date = new Date();
  date = date.toISOString();
  date = date.split(":").join("-");
  fs.writeFileSync(
    path.join(
      __dirname,
      "cache",
      "market-charts",
      userCoinChoice,
      `${date}.json`
    ),
    coinInfo
  );
  console.log(
    chalk.green.bold(date + ".json file has been created successfully!")
  );
} else {
  tokenIdArray = await checkIfFileExists(
    path.join(__dirname, "cache", "coins.json"),
    true
  );
  let data = fs.readFileSync(path.join(__dirname, "cache", "coins.json"));
  const app = express();

  app.get("/coins/all", (req, res) => {
    res.send(JSON.parse(data.toString()));
  });

  app.get("/market-chart/:coinId", async (req, res) => {
    await checkIfFolderExists(req.params.coinId);

    var content = fs.readdirSync(
      path.join(__dirname, "cache", "market-charts", req.params.coinId)
    );
    if (content.length == 0) {
      let coinInfo = await getData(
        `https://api.coingecko.com/api/v3/coins/${req.params.coinId}/market_chart?vs_currency=usd&days=max`
      );
      coinInfo = JSON.stringify(coinInfo.data);
      let date = new Date();
      date = date.toISOString();
      date = date.split(":").join("-");
      fs.writeFileSync(
        path.join(
          __dirname,
          "cache",
          "market-charts",
          req.params.coinId,
          `${date}.json`
        ),
        coinInfo
      );
      res.send(JSON.parse(coinInfo));
    } else {
      let jsonData = fs.readFileSync(
        path.join(
          __dirname,
          "cache",
          "market-charts",
          req.params.coinId,
          content[content.length - 1]
        )
      );
      res.send(JSON.parse(jsonData));
    }
  });

  //   app.listen(3000, () => {
  //     console.log(
  //       chalk.green(
  //         `Server running at http://localhost:3000/coins/all\nCheck http://localhost:3000/market-chart/{${chalk.red(
  //           "coin-name"
  //         )}}`
  //       )
  //     );
  //   });
}
