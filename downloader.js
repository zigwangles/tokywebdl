let chapters = [];
let isPaused = false;
let currentDownload = null;

async function fetchChapters() {
  const url = document.getElementById('urlInput').value;
  const response = await fetch(url);
  const text = await response.text();

  const match = text.match(/tracks\s*=\s*(\[[^\]]+\])/);
  if (!match) {
    alert("No chapters found.");
    return;
  }

  const jsonStr = match[1] + ']'; // append closing bracket if needed
  try {
    chapters = JSON5.parse(jsonStr);
    chapters.shift(); // remove non-chapter entry
    showChapterButtons();
  } catch (e) {
    alert("Failed to parse chapter data.");
  }
}

function showChapterButtons() {
  const list = document.getElementById("chapterList");
  list.innerHTML = "<h3>Chapters:</h3>";
  chapters.forEach((chapter, index) => {
    const btn = document.createElement("button");
    btn.innerText = chapter.name;
    btn.onclick = () => downloadChapter(chapter);
    list.appendChild(btn);
  });
}

function togglePause() {
  isPaused = !isPaused;
  document.getElementById('pauseBtn').innerText = isPaused ? 'Resume' : 'Pause';
}

async function downloadChapter(chapter) {
  const baseUrls = [
    'https://files01.tokybook.com/audio/',
    'https://files02.tokybook.com/audio/'
  ];

  document.getElementById('pauseBtn').style.display = 'inline';

  for (let base of baseUrls) {
    const url = base + chapter.chapter_link_dropbox;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;

      const reader = res.body.getReader();
      const contentLength = +res.headers.get("Content-Length");
      let received = 0;
      const chunks = [];
      const startTime = Date.now();

      while (true) {
        if (isPaused) {
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }

        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;

        updateProgress(received, contentLength, startTime);
      }

      const blob = new Blob(chunks, { type: 'audio/mpeg' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = chapter.name + '.mp3';
      a.click();

      resetProgress();
      return;

    } catch (e) {
      console.error("Failed on URL:", url, e);
    }
  }

  alert("Download failed for: " + chapter.name);
}

function updateProgress(received, total, startTime) {
  const progress = document.getElementById("progress");
  const eta = document.getElementById("eta");
  const percent = (received / total) * 100;
  progress.style.width = percent + "%";

  const elapsed = (Date.now() - startTime) / 1000;
  const speed = received / elapsed;
  const remaining = ((total - received) / speed).toFixed(1);
  eta.innerText = `ETA: ${remaining}s`;
}

function resetProgress() {
  document.getElementById("progress").style.width = "0%";
  document.getElementById("eta").innerText = "";
}