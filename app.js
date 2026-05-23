const video = document.querySelector("#feedVideo");
const loadButton = document.querySelector("#loadButton");
const loadTitle = document.querySelector("#loadTitle");
const videoFallback = document.querySelector("#videoFallback");
const fallbackText = document.querySelector("#fallbackText");
const statusText = document.querySelector("#statusText");
const feedMeta = document.querySelector("#feedMeta");
const previousButton = document.querySelector("#previousButton");
const nextButton = document.querySelector("#nextButton");
const randomButton = document.querySelector("#randomButton");
const playButton = document.querySelector("#playButton");

const fallbackFeedItems = [
  {
    title: "Sample clip one",
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  },
  {
    title: "Sample clip two",
    src: "https://www.w3schools.com/html/mov_bbb.mp4"
  }
];

let feedItems = fallbackFeedItems;
let currentIndex = 0;
let loadedIndex = -1;

function setStatus(message) {
  statusText.textContent = message;
}

function getCurrentItem() {
  return feedItems[currentIndex];
}

function getRandomIndex() {
  if (feedItems.length < 2) {
    return 0;
  }

  let nextIndex = currentIndex;

  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * feedItems.length);
  }

  return nextIndex;
}

function updateCard() {
  const item = getCurrentItem();
  loadTitle.textContent = item.title;
  feedMeta.textContent = `${item.title} - ${currentIndex + 1} of ${feedItems.length}`;
  setStatus("Ready");
}

function showLoadCard() {
  video.pause();
  video.removeAttribute("src");
  video.load();
  video.hidden = true;
  videoFallback.hidden = true;
  loadButton.hidden = false;
  playButton.textContent = "Play";
  loadedIndex = -1;
  updateCard();
}

function showFallback(message) {
  video.hidden = true;
  loadButton.hidden = false;
  videoFallback.hidden = false;
  fallbackText.textContent = message;
  playButton.textContent = "Play";
  setStatus("Load failed");
}

async function loadAndPlayCurrentVideo() {
  const item = getCurrentItem();

  loadButton.hidden = true;
  videoFallback.hidden = true;
  video.hidden = false;
  video.src = item.src;
  video.load();
  loadedIndex = currentIndex;
  setStatus("Loading");

  try {
    await video.play();
    playButton.textContent = "Pause";
    setStatus("Playing");
  } catch (error) {
    playButton.textContent = "Play";
    setStatus("Press play");
  }
}

function showNext() {
  currentIndex = (currentIndex + 1) % feedItems.length;
  showLoadCard();
}

function showPrevious() {
  currentIndex = (currentIndex - 1 + feedItems.length) % feedItems.length;
  showLoadCard();
}

function showRandom() {
  currentIndex = getRandomIndex();
  showLoadCard();
}

async function togglePlayback() {
  if (loadedIndex !== currentIndex || video.hidden) {
    await loadAndPlayCurrentVideo();
    return;
  }

  if (video.paused) {
    try {
      await video.play();
      playButton.textContent = "Pause";
      setStatus("Playing");
    } catch (error) {
      showFallback("This browser blocked video playback.");
    }
    return;
  }

  video.pause();
  playButton.textContent = "Play";
  setStatus("Paused");
}

video.addEventListener("error", () => {
  showFallback("The current video URL could not be loaded.");
});

video.addEventListener("ended", showNext);
loadButton.addEventListener("click", loadAndPlayCurrentVideo);
previousButton.addEventListener("click", showPrevious);
nextButton.addEventListener("click", showNext);
randomButton.addEventListener("click", showRandom);
playButton.addEventListener("click", togglePlayback);

async function loadFeedItems() {
  try {
    const response = await fetch("./videos.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Video list unavailable.");
    }

    const items = await response.json();
    const usableItems = items.filter((item) => item.title && item.src);

    if (usableItems.length) {
      feedItems = usableItems;
    }
  } catch (error) {
    feedItems = fallbackFeedItems;
  }

  currentIndex = getRandomIndex();
  showLoadCard();
}

loadFeedItems();
