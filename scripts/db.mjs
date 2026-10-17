// Portable local PostgreSQL for development (no system install needed). Keep running while using the app.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";

const pg = new EmbeddedPostgres({ databaseDir: "./.pgdata", user: "tatkal", password: "tatkal", port: 5433, persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"], // Hindi text needs UTF-8 (Windows default is WIN1252)
});
if (!existsSync("./.pgdata/PG_VERSION")) await pg.initialise();
await pg.start();
try {
  await pg.createDatabase("bhopal_tatkal");
} catch {
  /* already exists */
}
console.log("POSTGRES READY on localhost:5433");
process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});
