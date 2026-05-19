import { json, type Env } from "../../types";

/*
  Account profiles are not publicly available until a protected account system
  is implemented.
*/
export const onRequestGet: PagesFunction<Env> = async () => {
  return json({ ok: false, error: "Account profiles are not available." }, { status: 404 });
};
