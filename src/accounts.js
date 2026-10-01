import { readFileSync } from "node:fs";
import { config } from "./config.js";

const users = JSON.parse(readFileSync(config.usersPath, "utf8"));

console.log("USERS...", users);

export const findAccount = async (ctx, id) => {
  const user = users[id];
  if (!user) return undefined;

  return {
    accountId: id,
    claims: async () => ({ sub: id, ...user }),
  };
};
