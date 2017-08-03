"use strict";

const dedent = require("dedent");
const _ = require("lodash");
const moment = require("moment");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const buscacursos = require("buscacursos-uc").default;

const createBot = require("./bot");
const createSessionManager = require("./manager");
const configuration = require("./configuration");
const info = require("../package.json");

const config = configuration();

const manager = createSessionManager(config);
const baseUrl = "http://buscacursos.uc.cl";

const bot = createBot({
  manager,
  config,
  buscacursos: buscacursos({ baseUrl, fetch, $: cheerio }),
  info,
});

module.exports = bot;

// eslint-disable-next-line no-console
console.log(dedent`
  Bot Started with:
  - NODE_ENV: ${config.get("NODE_ENV")}
  - URL: ${config.get("URL")}
  - PORT: ${config.get("PORT")}
  - TOKEN: ${_.fill([...config.get("TELEGRAM:TOKEN")], "*", 0, -5).join("")}
  - SESSION: ${config.get("SESSION")}
  - STARTED: ${moment().format()}
`);
