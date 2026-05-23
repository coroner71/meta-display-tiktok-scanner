const embedHost = document.querySelector("#embedHost");
const statusText = document.querySelector("#statusText");
const feedMeta = document.querySelector("#feedMeta");
const previousButton = document.querySelector("#previousButton");
const nextButton = document.querySelector("#nextButton");
const autoButton = document.querySelector("#autoButton");

const feedItems = [
  {
    url: "https://www.tiktok.com/@brookemonk_/video/7621285419719691550",
    title: "Brooke Monk"
  },
  {
    url: "https://www.tiktok.com/@tiktok/video/7122145258645425454",
    title: "TikTok"
  }
];

const autoAdvanceDelay = 18000;
let currentIndex = 0;
let autoAdvance = true;
let autoTimer;

function setStatus(message) {
  statusText.textContent = message;
}

function normalizeTikTokUrl(rawValue) {
  const url = new URL(rawValue);

  if (!/(^|\.)tiktok\.com$/i.test(url.hostname)) {
    throw new Error("Feed item is not a TikTok URL.");
  }

  url.searchParams.delete("is_from_webapp");
  url.searchParams.delete("sender_device");
  return url.toString();
}

function getVideoId(tiktokUrl) {
  const match = new URL(tiktokUrl).pathname.match(/^\/@[^/]+\/video\/(\d+)\/?$/);
  return match ? match[1] : "";
}

function refreshTikTokEmbed() {
  if (window.tiktokEmbedLoad) {
    window.tiktokEmbedLoad();
    return;
  }

  const script = document.createElement("script");
  script.src = "https://www.tiktok.com/embed.js";
  script.async = true;
  document.body.appendChild(script);
}

function renderFeedItem(index) {
  const item = feedItems[index];
  const safeUrl = normalizeTikTokUrl(item.url);
  const videoId = getVideoId(safeUrl);

  if (!videoId) {
    embedHost.innerHTML = `
      <div class="empty-state">
        <strong>Unsupported TikTok link</strong>
        <span>This feed item is not a public TikTok video URL.</span>
      </div>
    `;
    setStatus("Unsupported");
    return;
  }

  embedHost.innerHTML = `
    <blockquote class="tiktok-embed" cite="${safeUrl}" data-video-id="${videoId}">
      <section>
        <a target="_blank" rel="noopener noreferrer" href="${safeUrl}">${item.title}</a>
      </section>
    </blockquote>
  `;
  feedMeta.textContent = `${item.title} - ${index + 1} of ${feedItems.length}`;
  setStatus(autoAdvance ? "Auto scanning" : "Paused");
  refreshTikTokEmbed();
  scheduleAutoAdvance();
}

function scheduleAutoAdvance() {
  window.clearTimeout(autoTimer);

  if (!autoAdvance || feedItems.length < 2) {
    return;
  }

  autoTimer = window.setTimeout(() => {
    showNext();
  }, autoAdvanceDelay);
}

function showNext() {
  currentIndex = (currentIndex + 1) % feedItems.length;
  renderFeedItem(currentIndex);
}

function showPrevious() {
  currentIndex = (currentIndex - 1 + feedItems.length) % feedItems.length;
  renderFeedItem(currentIndex);
}

function toggleAutoAdvance() {
  autoAdvance = !autoAdvance;
  autoButton.textContent = autoAdvance ? "Auto scan on" : "Auto scan off";
  autoButton.setAttribute("aria-pressed", String(autoAdvance));
  setStatus(autoAdvance ? "Auto scanning" : "Paused");
  scheduleAutoAdvance();
}

previousButton.addEventListener("click", showPrevious);
nextButton.addEventListener("click", showNext);
autoButton.addEventListener("click", toggleAutoAdvance);

renderFeedItem(currentIndex);
