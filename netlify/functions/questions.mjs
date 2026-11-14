// Cloud autosave for the workbench, kept in Netlify Blobs behind your passphrase.
import { getStore } from "@netlify/blobs";
export default async (req) => {
  const need = process.env.WILDWOOD_PASSPHRASE;
  if (!need) return new Response("set WILDWOOD_PASSPHRASE", { status: 500 });
  if (req.headers.get("x-wildwood-key") !== need) return new Response("nope", { status: 401 });
  const store = getStore("wildwood");
  if (req.method === "GET") {
    const data = await store.get("state", { type: "json" });
    return new Response(JSON.stringify(data || {}), { headers: { "content-type": "application/json" } });
  }
  if (req.method === "PUT") {
    const body = await req.text();
    if (body.length > 4000000) return new Response("too big", { status: 413 });
    let parsed;
    try { parsed = JSON.parse(body); } catch (e) { return new Response("bad json", { status: 400 }); }
    if (!parsed || !parsed.beats) return new Response("bad shape", { status: 400 });
    await store.setJSON("state", parsed);
    return new Response("ok");
  }
  return new Response("GET or PUT", { status: 405 });
};
