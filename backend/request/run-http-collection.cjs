"use strict";

const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

const files = ["auth", "health", "categories", "locations", "professionals", "service-requests", "zones"];

async function runHttpCollection(baseUrl) {
  let count = 0;
  for (const file of files) {
    const text = await readFile(path.join(__dirname, `${file}.http`), "utf8");
    const refs = { baseUrl };
    const expand = value => value.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const resolved = key.split(".").reduce((current, segment) => current?.[segment], refs);
      assert.notEqual(resolved, undefined, `Referencia sin resolver: ${file}.http / ${key}`);
      return resolved;
    });

    for (const block of text.split(/^### /m).slice(1)) {
      const [title, ...lines] = block.trimEnd().split(/\r?\n/);
      const name = lines.find(line => line.startsWith("# @name "))?.slice(8);
      const content = lines.filter(line => !line.startsWith("#"));
      const [method, url] = content.shift().split(/\s+/);
      const headers = {};

      while (content[0]?.trim()) {
        const line = content.shift();
        const separator = line.indexOf(":");
        headers[line.slice(0, separator)] = expand(line.slice(separator + 1).trim());
      }

      const body = content.join("\n").trim();
      const expected = title.match(/\((200|201|400|401|404|500)\b/)?.[1];
      assert.ok(expected, `Falta el estado esperado: ${file}.http / ${title}`);
      const response = await fetch(expand(url), {
        method, headers, body: body ? expand(body) : undefined, signal: AbortSignal.timeout(5000),
      });
      const json = await response.json();
      assert.equal(response.status, Number(expected), `${file}.http / ${title}: ${json.error?.message ?? "estado inesperado"}`);
      if (name) refs[name] = { response: { body: json } };
      count++;
    }
  }
  return count;
}

module.exports = runHttpCollection;
