/**
 * preview.html for the launch pack: the profile as it will look (picture,
 * name, bio, highlights), the 3-column grid with the pinned posts first,
 * every carousel scrollable and every caption with a copy button. One
 * self-contained light page with relative image paths, for a phone or a
 * desktop browser.
 */
import { captionText, slideFile } from "../../src/lib/social/captions";
import type { LaunchPack, LaunchPost } from "../../src/lib/social/launch-types";
import type { ProfileOption } from "../../src/lib/social/profile";
import { HANDLE } from "../../src/lib/updates/social-spec";
import { cardTokenCss } from "./tokens";

const escape = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const slidePath = (post: LaunchPost, i: number) =>
  `${post.slug}/${slideFile(i)}`;

/** Instagram's grid: pinned posts first, then the rest newest first. */
export function gridOrder(posts: LaunchPost[]): LaunchPost[] {
  const pinned = posts.filter((p) => p.pinned);
  const rest = posts.filter((p) => !p.pinned).reverse();
  return [...pinned, ...rest];
}

const PIN = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l-1 6 3 3v2h-4v6l-1 1-1-1v-6H7v-2l3-3z"/></svg>`;

function header(
  pack: LaunchPack,
  profile: ProfileOption,
  posts: number,
): string {
  const highlights = pack.highlights
    .map(
      (h) =>
        `<figure class="hl"><img src="profile/highlight-${h.icon}.png" alt=""><figcaption>${escape(h.name)}</figcaption></figure>`,
    )
    .join("");
  return `<header class="profile">
  <div class="who">
    <img class="avatar" src="profile/avatar.png" alt="Profile picture">
    <div><h1>${escape(HANDLE.slice(1))}</h1><p class="count"><b>${posts}</b> posts</p></div>
  </div>
  <p class="name">${escape(profile.name)}</p>
  <p class="bio">${escape(profile.bio)}</p>
  <p class="web">migratelens.com</p>
  <div class="highlights">${highlights}</div>
</header>`;
}

function grid(posts: LaunchPost[]): string {
  const tiles = gridOrder(posts)
    .map(
      (post) =>
        `<a class="tile" href="#${post.slug}"><img src="${slidePath(post, 0)}" alt="${escape(post.title)}">${post.pinned ? `<span class="pin">${PIN}</span>` : ""}</a>`,
    )
    .join("");
  return `<section class="grid" aria-label="Profile grid">${tiles}</section>`;
}

function postSection(post: LaunchPost, index: number): string {
  const slides = post.slides
    .map(
      (slide, i) =>
        `<img src="${slidePath(post, i)}" alt="${escape(slide.alt)}" loading="lazy">`,
    )
    .join("");
  const alts = post.slides
    .map(
      (slide, i) =>
        `<li><code>${slideFile(i)}</code> ${escape(slide.alt)}</li>`,
    )
    .join("");
  const id = `caption-${post.slug}`;
  return `<article class="post" id="${post.slug}">
  <h2>Post ${index + 1}: ${escape(post.title)}${post.pinned ? ' <span class="badge">Pinned</span>' : ""}</h2>
  <p class="meta">${post.slides.length} slides · swipe or scroll</p>
  <div class="carousel">${slides}</div>
  <div class="caption"><button type="button" data-copy="${id}">Copy caption</button><pre id="${id}">${escape(captionText(post.caption))}</pre></div>
  <details><summary>Alt text</summary><ol>${alts}</ol></details>
</article>`;
}

function stories(pack: LaunchPack): string {
  const frames = pack.stories
    .map(
      (s) =>
        `<figure><img src="stories/${s.slug}.png" alt="${escape(s.alt)}" loading="lazy"><figcaption>${escape(s.slug)}</figcaption></figure>`,
    )
    .join("");
  return `<section class="stories" id="stories"><h2>Stories</h2><div class="carousel story-row">${frames}</div></section>`;
}

const STYLE = `
*{box-sizing:border-box}
body{margin:0;background:var(--desk);color:var(--ink);font:16px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:600px;margin:0 auto;padding:16px;background:var(--paper);min-height:100vh}
h1{margin:0;font-size:20px}
h2{margin:0;font-size:18px}
.who{display:flex;gap:20px;align-items:center}
.avatar{width:86px;height:86px;border-radius:50%;border:1px solid var(--line)}
.count{margin:4px 0 0;color:var(--muted)}
.name{margin:14px 0 0;font-weight:700}
.bio{margin:2px 0 0;white-space:pre-line}
.web{margin:2px 0 0;color:var(--green);font-weight:600}
.highlights{display:flex;gap:14px;margin-top:16px;overflow-x:auto}
.hl{margin:0;text-align:center;font-size:12px;flex:0 0 auto}
.hl img{display:block;width:64px;height:64px;border-radius:50%;object-fit:cover;border:1px solid var(--line);padding:2px;background:var(--paper)}
.hl figcaption{margin-top:4px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin:20px -16px 0}
.tile{position:relative;display:block;aspect-ratio:3/4;overflow:hidden;background:var(--desk)}
.tile img{width:100%;height:100%;object-fit:cover;display:block}
.pin{position:absolute;top:6px;right:6px;width:20px;height:20px}
.pin svg{width:100%;height:100%;fill:var(--paper);stroke:var(--ink);stroke-width:1.2}
.post,.stories{margin-top:32px;padding-top:20px;border-top:1px solid var(--line)}
.badge{font-size:12px;padding:2px 8px;border-radius:99px;background:var(--green);color:var(--paper);vertical-align:2px}
.meta{margin:4px 0 10px;color:var(--muted);font-size:14px}
.carousel{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.carousel img{flex:0 0 100%;width:100%;scroll-snap-align:start;border-radius:6px;border:1px solid var(--line)}
.story-row figure{flex:0 0 60%;margin:0;scroll-snap-align:start}
.story-row img{width:100%;border-radius:10px}
.story-row figcaption{font-size:13px;color:var(--muted)}
.caption{position:relative;margin-top:12px;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--paper-soft)}
.caption pre{margin:0;white-space:pre-wrap;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.caption button{float:right;margin:0 0 8px 8px;padding:8px 14px;min-height:44px;border:0;border-radius:99px;background:var(--ink);color:var(--paper);font-weight:700;cursor:pointer}
details{margin-top:10px;font-size:14px;color:var(--lede)}
summary{cursor:pointer;font-weight:600}
`;

const SCRIPT = `
document.querySelectorAll("[data-copy]").forEach(function (button) {
  button.addEventListener("click", function () {
    var text = document.getElementById(button.dataset.copy).textContent;
    navigator.clipboard.writeText(text).then(function () {
      button.textContent = "Copied";
      setTimeout(function () { button.textContent = "Copy caption"; }, 1500);
    });
  });
});`;

/** The whole page. */
export function previewHtml(pack: LaunchPack, profile: ProfileOption): string {
  return [
    "<!doctype html>",
    '<html lang="en-AU">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>MigrateLens launch pack</title>",
    `<style>${cardTokenCss("light")}${STYLE}</style>`,
    "</head>",
    "<body><main>",
    header(pack, profile, pack.posts.length),
    grid(pack.posts),
    ...pack.posts.map(postSection),
    stories(pack),
    `</main><script>${SCRIPT}</script></body>`,
    "</html>",
    "",
  ].join("\n");
}
