const video = document.querySelector("#feedVideo");
const videoFallback = document.querySelector("#videoFallback");
const fallbackText = document.querySelector("#fallbackText");
const statusText = document.querySelector("#statusText");
const feedMeta = document.querySelector("#feedMeta");
const previousButton = document.querySelector("#previousButton");
const nextButton = document.querySelector("#nextButton");
const playButton = document.querySelector("#playButton");

const feedItems = [
  {
    title: "Flower one",
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  },
  {
    title: "Flower two",
    src: "https://www.w3schools.com/html/mov_bbb.mp4"
  }
];

let currentIndex = 0;

function setStatus(message) {
  statusText.textContent = message;
}

function updateMeta(item) {
  feedMeta.textContent = `${item.title} - ${currentIndex + 1} of ${feedItems.length}`;
}

function showFallback(message) {
  video.hidden = true;
  videoFallback.hidden = false;
  fallbackText.textContent = message;
  setStatus("Load failed");
}

async function playCurrentVideo() {
  const item = feedItems[currentIndex];

  videoFallback.hidden = true;
  video.hidden = false;
  video.src = item.src;
  video.load();
  updateMeta(item);
  setStatus("Loading");

  try {
    await video.play();
    playButton.textContent = "Pause";
    setStatus("Playing");
  } catch (error) {
    playButton.textContent = "Play";
    setStatus("Tap play");
  }
}

function showNext() {
  currentIndex = (currentIndex + 1) % feedItems.length;
  playCurrentVideo();
}

function showPrevious() {
  currentIndex = (currentIndex - 1 + feedItems.length) % feedItems.length;
  playCurrentVideo();
}

async function togglePlayback() {
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
previousButton.addEventListener("click", showPrevious);
nextButton.addEventListener("click", showNext);
playButton.addEventListener("click", togglePlayback);

playCurrentVideo();
