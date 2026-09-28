#!/usr/bin/env node
// `supabase gen types typescript` types every CHECK-constrained text column
// as plain `string`, and every RPC arg as non-nullable even when the SQL
// function legitimately accepts NULL (e.g. log_activity's p_tenant_id, for
// platform-level entries not scoped to a tenant). Several existing
// components (product-form.tsx, mini-app-list.tsx, core/activity-log/log.ts,
// ...) are written assuming the narrower types. Run this right after
// `npm run db:types` to reapply those narrowings on the freshly generated
// src/types/database.ts.
//
// Usage: node scripts/fix-database-types.mjs
import { readFileSync, writeFileSync } from "node:fs";

const path = "src/types/database.ts";
let text = readFileSync(path, "utf8");

const enumRules = [
  { table: "tenants", column: "status", values: ["active", "suspended"] },
  { table: "profiles", column: "locale", values: ["pt", "es", "en"] },
  { table: "tenant_memberships", column: "status", values: ["active", "invited", "suspended"] },
  { table: "tenant_settings", column: "locale", values: ["pt", "es", "en"] },
  {
    table: "mini_apps",
    column: "type",
    values: ["internal_app", "internal_page", "external_app", "iframe", "pwa", "ai_tool"],
  },
  { table: "mini_apps", column: "status", values: ["draft", "published", "archived"] },
  { table: "products", column: "status", values: ["draft", "published", "archived"] },
  { table: "products", column: "access_type", values: ["free", "paid"] },
  { table: "products", column: "card_orientation", values: ["square", "vertical", "horizontal"] },
  {
    table: "lessons",
    column: "content_type",
    values: ["video", "text", "image", "pdf", "audio", "file", "link", "quiz"],
  },
  { table: "lessons", column: "status", values: ["draft", "published"] },
  { table: "communities", column: "visibility", values: ["open", "closed"] },
  { table: "community_members", column: "role", values: ["member", "moderator", "vip"] },
  { table: "community_members", column: "status", values: ["active", "banned"] },
  {
    table: "posts",
    column: "content_type",
    values: ["text", "image", "video", "link", "announcement", "news"],
  },
  { table: "posts", column: "status", values: ["published", "hidden"] },
  { table: "comments", column: "status", values: ["published", "hidden"] },
  { table: "likes", column: "target_type", values: ["post", "comment"] },
  { table: "content_reports", column: "target_type", values: ["post", "comment"] },
  { table: "content_reports", column: "status", values: ["open", "resolved", "dismissed"] },
  {
    table: "integrations",
    column: "provider",
    values: ["hotmart", "kiwify", "cartpanda", "eduzz", "greenn", "celetus"],
  },
  { table: "webhook_logs", column: "status", values: ["processed", "ignored", "error"] },
  {
    table: "gamification_points",
    column: "reason",
    values: ["lesson_completed", "post_created", "comment_created", "community_joined"],
  },
  { table: "support_tickets", column: "status", values: ["open", "in_progress", "resolved", "closed"] },
  { table: "invitations", column: "status", values: ["pending", "accepted", "revoked", "expired"] },
];

function findTableBlock(source, table) {
  const headerRe = new RegExp(`\\n(\\s+)${table}: \\{\\n`);
  const m = headerRe.exec(source);
  if (!m) throw new Error(`table header not found: ${table}`);
  const indent = m[1];
  const start = m.index + m[0].length;
  const closeRe = new RegExp(`\\n${indent}\\}\\n`);
  const closeMatch = closeRe.exec(source.slice(start));
  if (!closeMatch) throw new Error(`closing brace not found for table: ${table}`);
  return { start, end: start + closeMatch.index };
}

for (const { table, column, values } of enumRules) {
  const { start, end } = findTableBlock(text, table);
  const union = values.map((v) => `"${v}"`).join(" | ");
  let block = text.slice(start, end);
  const before = block;
  block = block.replace(new RegExp(`\\b${column}: string\\b`, "g"), `${column}: ${union}`);
  block = block.replace(new RegExp(`\\b${column}\\?: string\\b`, "g"), `${column}?: ${union}`);
  if (block === before) throw new Error(`no replacement happened for ${table}.${column}`);
  text = text.slice(0, start) + block + text.slice(end);
}

// RPC args that legitimately accept null (activity_logs.tenant_id is
// nullable for platform-level, non-tenant-scoped entries).
text = text.replace(/(log_activity:\s*\{\s*Args:\s*\{[^}]*?p_tenant_id:\s*)string\b/, "$1string | null");

writeFileSync(path, text, "utf8");
console.log("Applied database.ts type fixups.");
