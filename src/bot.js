"use strict";

const bb = require("bot-brother");
const dedent = require("dedent");
const moment = require("moment");
const fs = require("mz/fs");
const path = require("path");

const PERIOD = {
  year: 2017,
  period: 2,
};

const match = {
  "course": /^(course|curso)$/, // eslint-disable-line
  "course_(NRC)": /^(course|curso)_\d+$/,
  "course_(course)": /^(course|curso)_[A-z]{1,3}\d+$/,
  "course_(course)_(section)": /^(course|curso)_[A-z]{1,3}\d+_\d+$/,

  "(NRC)": /^(\d+)$/,
  "(course)": /([A-z]{1,3}\d+)$/,
  "(course)-(section)": /([A-z]{1,3}\d+)[-\s]{1,3}(\d+)$/,
};

module.exports = function createBot(options) {
  const { manager, config, buscacursos, info } = options;
  const token = config.get("TELEGRAM:TOKEN");
  const COMMANDS_PATH = path.join(__dirname, "..", "docs", "commands.txt");

  const bot = bb({
    key: token,
    sessionManager: manager,
    webHook: {
      url: `${config.get("URL")}/bot${token}`,
      port: config.get("PORT"),
    },
  });

  bot.texts({
    start: dedent`
      *¡Hola <%= user.first_name %>!*

      Información y datos para realizar una donación y mantener este proyecto vivo al escribir /about.

      :crystal_ball: Los comandos disponibles son los siguientes:
      <% commands.forEach(command => { %>
      /<%= command -%>
      <% }); -%>
    `,
    about: dedent`
      *<%= info.name %> (<%= info.version %>)*
      *Licencia:* <%= info.license %>
      *Repositorio:* <%= info.repository.url %>

      :bust_in_silhouette: *Autor:*
       • <%= info.author.name %>
       • <%= info.author.email %>
       • <%= info.author.url %>
       • @<%= info.author.username %>

      :pray: *Ayúdame a mantener esto con alguna donación:*
      - PayPal:
        <%= info.author.paypal %>
      - Bitcoin:
        \`<%= info.author.btc %>\`
      - Ether:
        \`<%= info.author.eth %>\`
    `,
    cancel: dedent`
      OK, dejaré de hacer lo que estaba haciendo.
      ¿Necesitas ayuda? Escribe /help.
    `,
    courses: {
      ask: dedent`
        Escríbeme la *sigla*, *NRC*, o el *nombre del curso*.
      `,
      error: dedent`
        Ha ocurrido un error consultando el buscacursos.
      `,
      found: dedent`
        <% if (courses.length > 0) { %>
        Encontré lo siguiente para el periodo (<%= period.year %>-<%= period.period %>):
        <% courses.forEach(course => { %>
        <%= course.NRC %> | <%= course.initials %>-<%= course.section %> (<%= course.credits %> cr.)
        *<%= course.name %>*
        Vacantes: <%= course.vacancy.available %>/<%= course.vacancy.total %>
        Horario:
        <% course.schedule.raw.forEach(item => { -%>
          ↳ \`<%= item.type %>\`: <%= item.when %> @ /sala\_<%= item.where %>
        <% }) -%>
        Profesores:
        <% course.teachers.forEach(teacher => { -%>
          ↳ <%= teacher.name %>
        <% }) -%>
        <% }) -%>
        <% } else { %>
        Tu consulta no obtuvo resultados.
        <% } %>
      `,
    },
  });

  bot.command(/.*/).use("before", async ctx => {
    // eslint-disable-next-line no-console
    console.log(dedent`
      ${moment().format("YYYY/MM/DD HH:mm:ss")}
      USER: ${JSON.stringify(ctx.meta.user)}
      CHAT: ${JSON.stringify(ctx.meta.chat)}
      FROM: ${JSON.stringify(ctx.meta.from)}
      CMD: ${JSON.stringify(ctx.command)}
      ANSWER: ${JSON.stringify(ctx.answer)}
      CALLBACK: ${JSON.stringify(ctx.callbackData)}
      ---
    `);
  });

  /**
   * /start
   * Init bot showing this first message.
   */
  bot.command("start").invoke(async ctx => {
    const txt = await fs.readFile(COMMANDS_PATH, "utf8");
    // Use String.raw to fix scape problem.
    ctx.data.commands = txt.replace("_", String.raw`\_`).split("\n").filter(Boolean);
    ctx.data.user = ctx.meta.user;
    await ctx.sendMessage("start", { parse_mode: "Markdown" });
  });

  /**
   * /help
   * Help message, in this case we just redirect to /start
   */
  bot.command(/^(help|ayuda)/).invoke(async ctx => {
    await ctx.go("start");
  });

  /**
   * /about
   * Show information from `package.json` like version, author and donation addresses.
   */
  bot.command(/^(about|acerca)/).invoke(async ctx => {
    ctx.data.info = info;
    await ctx.sendMessage("about", { parse_mode: "Markdown" });
  });

  /**
   * /cancelar
   * Stop current action. FYI: calling any other /(action) stops the current state.
   */
  bot.command(/^(cancel|cancelar)/).invoke(async ctx => {
    ctx.hideKeyboard();
    await ctx.sendMessage("cancel", { parse_mode: "Markdown" });
  });

  /**
   * /course
   */
  bot
    .command(match["course"])
    .invoke(async ctx => {
      await ctx.sendMessage("courses.ask", { parse_mode: "Markdown" });
    })
    .answer(async ctx => {
      const answer = ctx.answer.toUpperCase();
      if (match["(course)"].test(answer)) {
        const [, course] = match["(course)"].exec(answer);
        return await ctx.go(`course_${course}`);
      } else if (match["(course)-(section)"].test(answer)) {
        const [, course, section] = match["(course)-(section)"].exec(answer);
        return await ctx.go(`course_${course}_${section}`);
      } else if (match["(NRC)"].test(answer)) {
        const [, NRC] = match["(NRC)"].exec(answer);
        return await ctx.go(`course_${NRC}`);
      }

      // By name
      const query = {
        cxml_semestre: [PERIOD.year, PERIOD.period].join("-"),
        cxml_nombre: answer,
      };

      ctx.data.period = PERIOD;

      try {
        ctx.data.courses = await buscacursos.getCourses(query);
        await ctx.sendMessage("courses.found", { parse_mode: "Markdown" });
      } catch (e) {
        console.error(e);
        await ctx.sendMessage("courses.error", { parse_mode: "Markdown" });
      }
    });

  /**
   * /course_(NRC)
   */
  bot.command(match["course_(NRC)"]).invoke(async ctx => {
    const [, NRC] = ctx.command.name.split("_").map(s => s.toUpperCase());
    const query = {
      cxml_semestre: [PERIOD.year, PERIOD.period].join("-"),
      cxml_nrc: NRC,
    };

    ctx.data.period = PERIOD;

    try {
      ctx.data.courses = await buscacursos.getCourses(query);
      await ctx.sendMessage("courses.found", { parse_mode: "Markdown" });
    } catch (e) {
      console.error(e);
      await ctx.sendMessage("courses.error", { parse_mode: "Markdown" });
    }
  });

  /**
   * /course_(course)
   */
  bot.command(match["course_(course)"]).invoke(async ctx => {
    const [, initials] = ctx.command.name.split("_").map(s => s.toUpperCase());
    const query = {
      cxml_semestre: [PERIOD.year, PERIOD.period].join("-"),
      cxml_sigla: initials,
    };

    ctx.data.period = PERIOD;

    try {
      ctx.data.courses = await buscacursos.getCourses(query);
      await ctx.sendMessage("courses.found", { parse_mode: "Markdown" });
    } catch (e) {
      console.error(e);
      await ctx.sendMessage("courses.error", { parse_mode: "Markdown" });
    }
  });

  /**
   * /course_(course)-(section)
   */
  bot.command(match["course_(course)_(section)"]).invoke(async ctx => {
    const [, initials, section] = ctx.command.name.split("_").map(s => s.toUpperCase());
    const query = {
      cxml_semestre: [PERIOD.year, PERIOD.period].join("-"),
      cxml_sigla: initials,
    };

    ctx.data.period = PERIOD;

    try {
      ctx.data.courses = (await buscacursos.getCourses(query)).filter(
        course => String(course.section) === String(section)
      );
      await ctx.sendMessage("courses.found", { parse_mode: "Markdown" });
    } catch (e) {
      console.error(e);
      await ctx.sendMessage("courses.error", { parse_mode: "Markdown" });
    }
  });

  /**
   * /classroom
   */
  bot.command(/^(classroom|place|sala)(_.+)?$/).invoke(async ctx => {
    ctx.sendMessage("No está lista esta funcionalidad todavía.");
  });
};
