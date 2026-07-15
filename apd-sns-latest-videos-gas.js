const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyXS4aOXEA_zRRlH1ScNojKkVilgt9dLwG1XBXMm8mvJd9QIxvdNv-dFbtyLZSozE_AEA/exec";

(function () {
  const target = document.getElementById("youtube-latest-videos");

  if (!target) return;

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  }

  function jsonp(url) {
    return new Promise((resolve, reject) => {
      const callbackName = `apdLatestVideos_${Date.now()}_${Math.round(Math.random() * 100000)}`;
      const script = document.createElement("script");
      const separator = url.includes("?") ? "&" : "?";

      window[callbackName] = (data) => {
        cleanup();
        resolve(data);
      };

      function cleanup() {
        delete window[callbackName];
        script.remove();
      }

      script.onerror = () => {
        cleanup();
        reject(new Error("動画データを読み込めませんでした。"));
      };

      script.src = `${url}${separator}callback=${encodeURIComponent(callbackName)}`;
      document.head.appendChild(script);
    });
  }

  function renderLoading() {
    target.innerHTML = `
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-[#bedfc2]/50 text-center text-gray-600 md:col-span-3">
        最新動画を読み込んでいます...
      </div>
    `;
  }

  function renderError(message) {
    target.innerHTML = `
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-orange-200 text-center text-orange-700 md:col-span-3">
        ${escapeHtml(message)}
      </div>
    `;
  }

  function renderVideos(videos) {
    target.innerHTML = videos
      .map((video, index) => {
        const title = video.title || "";
        const date = formatDate(video.publishedAt);
        const summary = video.summary || "";
        const category = video.category || "業務改善";
        const thumbnail = video.thumbnailUrl || "";
        const url = video.url || `https://www.youtube.com/watch?v=${video.videoId}`;

        return `
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="yt-card group block overflow-hidden transition-all duration-300 hover:scale-[1.01]">
            <div class="yt-card-media relative">
              <img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(title)}" class="yt-thumbnail w-full h-full object-cover" loading="lazy">
              <div class="placeholder-fallback absolute inset-0 bg-gradient-to-br from-emerald-500 via-brandGreen to-teal-600 flex items-center justify-center hidden">
                <i class="fa-solid fa-video text-white/10 text-9xl absolute pointer-events-none"></i>
                <span class="text-white font-extrabold text-sm tracking-widest bg-black/25 px-4 py-1.5 rounded-full border border-white/20 relative z-10 uppercase">
                  解説動画 #${index + 1}
                </span>
              </div>
            </div>
            <div class="yt-card-body">
              <div class="yt-meta">
                <span class="yt-category">${escapeHtml(category)}</span>
                <span class="yt-date">${escapeHtml(date)}</span>
              </div>
              <h4 class="yt-title" style="font-feature-settings: 'halt';">
                ${escapeHtml(title)}
              </h4>
              <p class="yt-description text-gray-600" style="font-feature-settings: 'halt';">
                【解説】<br>
                ${escapeHtml(summary)}
              </p>
            </div>
          </a>
        `;
      })
      .join("");

    target.querySelectorAll(".yt-thumbnail").forEach((img) => {
      img.addEventListener("error", () => {
        img.classList.add("hidden");
        const placeholder = img.nextElementSibling;
        if (placeholder) placeholder.classList.remove("hidden");
      });
    });
  }

  async function load() {
    if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL === "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
      renderError("Google Apps ScriptのWebアプリURLを設定してください。");
      return;
    }

    renderLoading();

    try {
      const data = await jsonp(GAS_WEB_APP_URL);
      const videos = Array.isArray(data.videos) ? data.videos.slice(0, 3) : [];

      if (!videos.length) {
        renderError("表示できる動画が見つかりませんでした。");
        return;
      }

      renderVideos(videos);
    } catch (error) {
      renderError(error.message || "最新動画を取得できませんでした。");
    }
  }

  load();
})();
