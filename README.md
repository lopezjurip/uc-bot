# UC Bot

[![Docker Automated build][dockerhub-image]][dockerhub-url] [![dependencies][dependencies-image]][dependencies-url] [![dev-dependencies][dev-dependencies-image]][dev-dependencies-url] [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Telegram bot built with [`SerjoPepper/bot-brother`](https://github.com/SerjoPepper/bot-brother).

> [Start conversation here](https://t.me/uc_bot)

## Development

**Requirements:**
*   Node.js 8
*   Yarn
*   Redis (at `127.0.0.1:6379`)

Clone this repository:

```sh
git clone https://github.com/mrpatiwi/uc-bot.git
cd uc-bot
```

Install dependencies:
```sh
yarn
```

Make sure to set the next enviorement variables:

```txt
URL=https://asdfg.ngrok.io
TELEGRAM__TOKEN=20**********************VeQYT
```

These can be set with a `.env` files (ignored by git).

Start this bot:

```sh
yarn start
```

## Production

**Requirements:**
*   Docker
*   Docker-Compose

Create the same `.env` file but with the production values. Then:

```sh
docker-compose up -d --build
```

[dockerhub-image]: https://img.shields.io/docker/automated/mrpatiwi/uc-bot.svg
[dockerhub-url]: https://hub.docker.com/r/mrpatiwi/uc-bot/
[dependencies-image]: https://david-dm.org/mrpatiwi/uc-bot.svg
[dependencies-url]: https://david-dm.org/mrpatiwi/uc-bot
[dev-dependencies-image]: https://david-dm.org/mrpatiwi/uc-bot/dev-status.svg
[dev-dependencies-url]: https://david-dm.org/mrpatiwi/uc-bot#info=devDependencies
