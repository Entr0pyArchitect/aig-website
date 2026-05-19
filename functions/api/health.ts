import { json, type Env } from "../types";

/*
  Public health endpoint.
  Keep this response intentionally minimal so public checks do not expose runtime,
  infrastructure, database, or provider details.
*/
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return json({
    ok: true,
    data: {
      service: env.PUBLIC_SITE_NAME || "American Innovations Group",
      status: "online"
    }
  });
};
