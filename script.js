document.addEventListener("DOMContentLoaded", () => {
  // 1. DOM Elements
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const searchSelect = document.getElementById("search-engine-select");
  const wallpaperInput = document.getElementById("wallpaper-link-input");
  const modal = document.getElementById("settings-modal");
  const addModal = document.getElementById("add-modal");
  const settingsBtn = document.getElementById("settings-btn");
  const saveBtn = document.getElementById("save-btn");
  const closeBtn = document.getElementById("close-btn");
  const shortcutGrid = document.getElementById("shortcut-grid");
  const toggleEditBtn = document.getElementById("toggle-edit-mode-btn");
  const settingsDropPanel = document.getElementById("settings-drop-panel");

  const voiceBtn = document.getElementById("voice-search-btn");
  const imageSearchBtn = document.getElementById("image-search-btn");

  const addCloseBtn = document.getElementById("add-close-btn");
  const addSaveBtn = document.getElementById("add-save-btn");
  const shortcutNameInput = document.getElementById("shortcut-name-input");
  const shortcutUrlInput = document.getElementById("shortcut-url-input");

  let isDeleteMode = false;

  const defaultShortcuts = [
    { title: "YouTube", url: "https://www.youtube.com" },
    { title: "Reddit", url: "https://www.reddit.com" },
    { title: "GitHub", url: "https://github.com" },
    { title: "Gmail", url: "https://mail.google.com" },
    { title: "Wikipedia", url: "https://wikipedia.org" }
  ];

  // 2. Load Shortcuts from localStorage or defaults
  let shortcuts = JSON.parse(localStorage.getItem("custom_shortcuts")) || defaultShortcuts;

  function renderShortcuts() {
    shortcutGrid.innerHTML = "";

    shortcuts.forEach((item, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "shortcut-wrapper";

      let faviconUrl = "";
      try {
        const domain = new URL(item.url).hostname;
        faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      } catch (e) {
        faviconUrl = "logo.png";
      }

      wrapper.innerHTML = `
        <button class="delete-btn" data-index="${index}">✕</button>
        <a href="${item.url}" class="shortcut">
          <div class="icon-box">
            <img src="${faviconUrl}" alt="${item.title}">
          </div>
          <span>${item.title}</span>
        </a>
      `;

      shortcutGrid.appendChild(wrapper);
    });

    const addWrapper = document.createElement("div");
    addWrapper.className = "shortcut-wrapper";
    addWrapper.innerHTML = `
      <div class="shortcut" id="open-add-modal-btn">
        <div class="icon-box add-shortcut-btn">
          <span>+</span>
        </div>
        <span>Add Shortcut</span>
      </div>
    `;
    shortcutGrid.appendChild(addWrapper);

    document.getElementById("open-add-modal-btn").addEventListener("click", () => {
      addModal.style.display = "flex";
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.style.display = isDeleteMode ? "flex" : "none";
      btn.addEventListener("click", (e) => {
        const idx = e.target.getAttribute("data-index");
        shortcuts.splice(idx, 1);
        localStorage.setItem("custom_shortcuts", JSON.stringify(shortcuts));
        renderShortcuts();
      });
    });
  }

  renderShortcuts();

  // 3. Add Shortcut Modal Logic
  addCloseBtn.addEventListener("click", () => {
    addModal.style.display = "none";
  });

  addSaveBtn.addEventListener("click", () => {
    const title = shortcutNameInput.value.trim();
    let url = shortcutUrlInput.value.trim();

    if (title && url) {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      shortcuts.push({ title, url });
      localStorage.setItem("custom_shortcuts", JSON.stringify(shortcuts));
      renderShortcuts();
      shortcutNameInput.value = "";
      shortcutUrlInput.value = "";
      addModal.style.display = "none";
    }
  });

  toggleEditBtn.addEventListener("click", () => {
    isDeleteMode = !isDeleteMode;
    toggleEditBtn.textContent = isDeleteMode ? "Disable Delete Mode" : "Toggle Delete Icons Mode";
    renderShortcuts();
  });

  // 4. Voice and Image Search
  voiceBtn.addEventListener("click", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.start();
      searchInput.placeholder = "Listening...";
      recognition.onresult = (event) => {
        searchInput.value = event.results[0][0].transcript;
        searchForm.submit();
      };
      recognition.onerror = () => {
        searchInput.placeholder = "Search Google...";
      };
    } else {
      alert("Voice search is not supported on this browser version.");
    }
  });

  imageSearchBtn.addEventListener("click", () => {
    window.location.href = "https://images.google.com";
  });

  // 5. Load Search Engine Preference
  const savedEngine = localStorage.getItem("search_engine") || "https://www.google.com/search?q=";
  searchSelect.value = savedEngine;
  updateSearchAction(savedEngine);

  function updateSearchAction(engineUrl) {
    if (engineUrl.includes("google.com")) {
      searchForm.action = "https://www.google.com/search";
      searchInput.name = "q";
      searchInput.placeholder = "Search Google...";
    } else if (engineUrl.includes("duckduckgo.com")) {
      searchForm.action = "https://duckduckgo.com/";
      searchInput.name = "q";
      searchInput.placeholder = "Search DuckDuckGo...";
    } else if (engineUrl.includes("bing.com")) {
      searchForm.action = "https://www.bing.com/search";
      searchInput.name = "q";
      searchInput.placeholder = "Search Bing...";
    } else if (engineUrl.includes("brave.com")) {
      searchForm.action = "https://search.brave.com/search";
      searchInput.name = "q";
      searchInput.placeholder = "Search Brave...";
    }
  }

  // 6. IndexedDB Wallpaper Storage
  let db;
  const request = indexedDB.open("WallpaperDB", 1);

  request.onupgradeneeded = function (e) {
    db = e.target.result;
    if (!db.objectStoreNames.contains("wallpapers")) {
      db.createObjectStore("wallpapers");
    }
  };

  request.onsuccess = function (e) {
    db = e.target.result;
    loadSavedWallpaper();
  };

  function loadSavedWallpaper() {
    const tx = db.transaction("wallpapers", "readonly");
    const store = tx.objectStore("wallpapers");
    const getReq = store.get("current_wallpaper");

    getReq.onsuccess = function () {
      if (getReq.result) {
        document.body.style.backgroundImage = `url(${getReq.result})`;
      }
    };
  }

  function saveWallpaperData(dataUrl) {
    document.body.style.backgroundImage = `url(${dataUrl})`;
    const tx = db.transaction("wallpapers", "readwrite");
    const store = tx.objectStore("wallpapers");
    store.put(dataUrl, "current_wallpaper");
  }

  // 7. Drag and Drop inside Settings Modal Panel
  settingsDropPanel.addEventListener("dragover", (e) => {
    e.preventDefault();
    settingsDropPanel.classList.add("drag-over");
  });

  settingsDropPanel.addEventListener("dragleave", () => {
    settingsDropPanel.classList.remove("drag-over");
  });

  settingsDropPanel.addEventListener("drop", (e) => {
    e.preventDefault();
    settingsDropPanel.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (event) {
        saveWallpaperData(event.target.result);
        settingsDropPanel.textContent = "✅ Wallpaper updated!";
      };
      reader.readAsDataURL(file);
    }
  });

  // 8. Settings Modal General Listeners
  settingsBtn.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  saveBtn.addEventListener("click", () => {
    const chosenEngine = searchSelect.value;
    localStorage.setItem("search_engine", chosenEngine);
    updateSearchAction(chosenEngine);

    const linkVal = wallpaperInput.value.trim();
    if (linkVal) {
      saveWallpaperData(linkVal);
    }
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
    if (e.target === addModal) addModal.style.display = "none";
  });
});