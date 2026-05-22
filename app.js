const camera = document.querySelector("#camera");
const snapshot = document.querySelector("#snapshot");
const cameraEmpty = document.querySelector("#cameraEmpty");
const scanButton = document.querySelector("#scanButton");
const stopButton = document.querySelector("#stopButton");
const linkForm = document.querySelector("#linkForm");
const urlInput = document.querySelector("#tiktokUrl");
const embedHost = document.querySelector("#embedHost");
const previewTitle = document.querySelector("#preview-title");
const clearButton = document.querySelector("#clearButton");
const statusText = document.querySelector("#statusText");
const errorText = document.querySelector("#errorText");

let stream;
let scanTimer;
let detector;

const tiktokHostPattern = /(^|\.)tiktok\.com$/i;
const deepLinkParam = "tiktokUrl";
const defaultTikTokUrl = "https://www.tiktok.com/@daroodkanool10/live";
const videoPathPattern = /^\/@([^/]+)\/video\/(\d+)\/?$/;
const profilePathPattern = /^\/@([^/]+)\/?$/;
const livePathPattern = /^\/@([^/]+)\/live\/?$/;

function setStatus(message) {
  statusText.textContent = message;
}

function setError(message = "") {
  errorText.textContent = message;
}

function normalizeTikTokUrl(rawValue) {
  const trimmed = rawValue.trim();
  const url = new URL(trimmed);

  if (!tiktokHostPattern.test(url.hostname)) {
    throw new Error("That link is not on tiktok.com.");
  }

  url.searchParams.delete("is_from_webapp");
  url.searchParams.delete("sender_device");
  return url.toString();
}

function getTikTokTarget(tiktokUrl) {
  const url = new URL(tiktokUrl);
  const videoMatch = url.pathname.match(videoPathPattern);
  const profileMatch = url.pathname.match(profilePathPattern);
  const liveMatch = url.pathname.match(livePathPattern);

  if (videoMatch) {
    return {
      type: "video",
      username: videoMatch[1],
      videoId: videoMatch[2]
    };
  }

  if (profileMatch) {
    return {
      type: "profile",
      username: profileMatch[1]
    };
  }

  if (liveMatch) {
    return {
      type: "live",
      username: liveMatch[1]
    };
  }

  return { type: "link" };
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

function renderTikTokHandoff(tiktokUrl, username) {
  previewTitle.textContent = "TikTok Live";
  urlInput.value = tiktokUrl;
  embedHost.innerHTML = `
    <div class="handoff-state">
      <strong>@${username} is live</strong>
      <span>TikTok Live does not render through the public embed script, but it can open as the real TikTok web page for scrolling.</span>
      <a class="open-link" href="${tiktokUrl}">Browse TikTok Web</a>
      <a class="secondary-link" target="_blank" rel="noopener noreferrer" href="${tiktokUrl}">Open in new tab</a>
    </div>
  `;
  setStatus("Web mode");
}

function renderEmbed(tiktokUrl) {
  const safeUrl = normalizeTikTokUrl(tiktokUrl);
  const target = getTikTokTarget(safeUrl);

  setError();
  urlInput.value = safeUrl;
  embedHost.innerHTML = "";

  if (target.type === "live") {
    renderTikTokHandoff(safeUrl, target.username);
    return;
  }

  previewTitle.textContent = "TikTok loaded";

  if (target.type === "video") {
    embedHost.innerHTML = `
      <blockquote class="tiktok-embed" cite="${safeUrl}" data-video-id="${target.videoId}">
        <section>
          <a target="_blank" rel="noopener noreferrer" href="${safeUrl}">Open on TikTok</a>
        </section>
      </blockquote>
    `;
  } else if (target.type === "profile") {
    embedHost.innerHTML = `
      <blockquote class="tiktok-embed" cite="${safeUrl}" data-unique-id="${target.username}" data-embed-type="creator">
        <section>
          <a target="_blank" rel="noopener noreferrer" href="${safeUrl}">Open on TikTok</a>
        </section>
      </blockquote>
    `;
  } else {
    embedHost.innerHTML = `
      <div class="handoff-state">
        <strong>TikTok link ready</strong>
        <span>This TikTok URL is not a public video or profile embed, but it can open as the real TikTok web page for scrolling.</span>
        <a class="open-link" href="${safeUrl}">Browse TikTok Web</a>
        <a class="secondary-link" target="_blank" rel="noopener noreferrer" href="${safeUrl}">Open in new tab</a>
      </div>
    `;
    setStatus("Web mode");
    return;
  }

  refreshTikTokEmbed();
  setStatus("Loaded");
}

function loadDeepLinkedTikTok() {
  const params = new URLSearchParams(window.location.search);
  const deepLinkedUrl = params.get(deepLinkParam) || defaultTikTokUrl;

  try {
    renderEmbed(deepLinkedUrl);
  } catch (error) {
    urlInput.value = deepLinkedUrl;
    setStatus("Check link");
    setError(error.message);
  }
}

function clearPreview() {
  previewTitle.textContent = "No TikTok loaded";
  embedHost.innerHTML = `
    <div class="empty-state">
      <strong>Allowed integration</strong>
      <span>Uses TikTok embeds for public videos, profiles, and supported TikTok web links. Login Kit or Display API can be added once app credentials and scopes are approved.</span>
    </div>
  `;
  setError();
  setStatus("Ready");
}

async function getDetector() {
  if (!("BarcodeDetector" in window)) {
    throw new Error("This browser does not support QR scanning. Paste a TikTok URL instead.");
  }

  if (!detector) {
    const supportedFormats = await window.BarcodeDetector.getSupportedFormats();
    if (!supportedFormats.includes("qr_code")) {
      throw new Error("QR scanning is unavailable here. Paste a TikTok URL instead.");
    }

    detector = new window.BarcodeDetector({ formats: ["qr_code"] });
  }

  return detector;
}

async function scanFrame() {
  if (!stream || camera.readyState < 2) {
    return;
  }

  const barcodeDetector = await getDetector();
  const width = camera.videoWidth;
  const height = camera.videoHeight;

  if (!width || !height) {
    return;
  }

  snapshot.width = width;
  snapshot.height = height;
  const context = snapshot.getContext("2d", { willReadFrequently: true });
  context.drawImage(camera, 0, 0, width, height);

  const codes = await barcodeDetector.detect(snapshot);
  const hit = codes.find((code) => code.rawValue && code.rawValue.includes("tiktok.com"));

  if (hit) {
    renderEmbed(hit.rawValue);
    stopCamera();
  }
}

async function startCamera() {
  try {
    setError();
    await getDetector();
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    camera.srcObject = stream;
    await camera.play();
    cameraEmpty.hidden = true;
    setStatus("Scanning");
    scanTimer = window.setInterval(() => {
      scanFrame().catch((error) => setError(error.message));
    }, 700);
  } catch (error) {
    setStatus("Manual entry");
    setError(error.message);
    stopCamera();
  }
}

function stopCamera() {
  if (scanTimer) {
    window.clearInterval(scanTimer);
    scanTimer = undefined;
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = undefined;
  }

  camera.srcObject = null;
  cameraEmpty.hidden = false;
  if (statusText.textContent === "Scanning") {
    setStatus("Stopped");
  }
}

scanButton.addEventListener("click", startCamera);
stopButton.addEventListener("click", stopCamera);
clearButton.addEventListener("click", clearPreview);

linkForm.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    renderEmbed(urlInput.value);
  } catch (error) {
    setStatus("Check link");
    setError(error.message);
  }
});

window.addEventListener("pagehide", stopCamera);
loadDeepLinkedTikTok();
