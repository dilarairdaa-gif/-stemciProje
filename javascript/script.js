$(document).ready(function () {
  let allMovies = movieData,
    filteredMovies = [],
    currentPage = 1,
    itemsPerPage = 20;

  let currentGenre = "Tümü",
    currentYear = "Tümü",
    searchQuery = "",
    showWatchlistOnly = false;

  let favorites = JSON.parse(localStorage.getItem("cinemaFavorites")) || [];

  function renderSpecialSections() {
    $("#oscarGrid").html(
      allMovies
        .filter((m) => m.isOscar)
        .map(createCardHTML)
        .join(""),
    );

    $("#trendingGrid").html(
      allMovies
        .filter((m) => m.isTrending)
        .map(createCardHTML)
        .join(""),
    );
  }

  function applyFilters() {
    filteredMovies = allMovies.filter((m) => {
      if (showWatchlistOnly && !favorites.includes(m.id)) return false;

      const isDefault =
        currentGenre === "Tümü" &&
        currentYear === "Tümü" &&
        !searchQuery &&
        !showWatchlistOnly;

      if (isDefault && (m.isOscar || m.isTrending)) return false;

      const matchGenre = currentGenre === "Tümü" || m.genre === currentGenre;

      const matchYear =
        currentYear === "Tümü" ||
        (currentYear === "Eski"
          ? parseInt(m.year) <= 2020 || isNaN(parseInt(m.year))
          : String(m.year) === currentYear);

      const matchSearch =
        !searchQuery ||
        m.title.toLowerCase().startsWith(searchQuery.toLowerCase());

      return matchGenre && matchYear && matchSearch;
    });

    if (
      currentGenre !== "Tümü" ||
      currentYear !== "Tümü" ||
      searchQuery ||
      showWatchlistOnly
    ) {
      $(".horizontal-section").slideUp(300);

      $(".main-list-title").html(
        showWatchlistOnly
          ? '<i class="fa-solid fa-heart"></i> İzleme Listem'
          : '<i class="fa-solid fa-list"></i> Filtrelenen Sonuçlar',
      );
    } else {
      $(".horizontal-section").slideDown(300);

      $(".main-list-title").html(
        '<i class="fa-solid fa-list"></i> Tüm Dizi ve Filmler',
      );
    }

    currentPage = 1;

    renderMovies();

    renderPagination();
  }

  function createCardHTML(m) {
    const isFav = favorites.includes(m.id);

    return `
            <div class="movie-card">
                <div class="poster-wrapper">
                    <!-- Filmin afiş resmi ve alt (alt) bilgi etiketi -->
                    <img src="${m.image}" alt="${m.title}" class="movie-poster">
                    <!-- Resmin üzerine IMDB puanını yazar -->
                    <div class="movie-rating"><i class="fa-solid fa-star" style="color: #f5c518;"></i> ${m.rating}</div>
                </div>
                <div class="movie-info">
                    <div>
                      
                        <div class="movie-title">${m.title}</div>
                        
                        <div class="movie-meta"><span>${m.genre} • ${m.year}</span><span class="movie-time"><i class="fa-regular fa-clock"></i> ${m.time}</span></div>
                    </div>
                    <!-- Favorilere Ekle/Çıkar butonu. Eğer isFav 'true' ise butona 'favorited' CSS sınıfı eklenir -->
                    <button class="fav-btn ${isFav ? "favorited" : ""}" data-id="${m.id}">
                        <!-- Kalp ikonunu duruma göre içi dolu(solid) veya boş(regular) yapar ve buton metnini ayarlar -->
                        <i class="${isFav ? "fa-solid fa-heart" : "fa-regular fa-heart"}"></i> <span class="btn-text">${isFav ? "Favorilerde" : "Favoriye Ekle"}</span>
                    </button>
                </div>
            </div>`;
  }

  function renderMovies() {
    const grid = $("#movieGrid").empty();

    if (!filteredMovies.length)
      return grid.html(
        '<div class="loader">Arama kriterlerinize uygun sonuç bulunamadı.</div>',
      );

    filteredMovies
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      .forEach((m) => {
        $(createCardHTML(m)).hide().appendTo(grid).fadeIn(400);
      });
  }

  function renderPagination() {
    const total = Math.ceil(filteredMovies.length / itemsPerPage);

    const container = $("#paginationContainer").empty();

    if (total <= 1) return;

    for (let i = 1; i <= total; i++) {
      container.append(
        `<button class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`,
      );
    }
  }

  $("#searchForm").on("submit", (e) => {
    e.preventDefault();
    searchQuery = $("#searchInput").val().trim();
    applyFilters();
  });

  $("#searchInput").on("keyup", function () {
    searchQuery = $(this).val().trim();
    applyFilters();
  });

  $("#genreList, #yearList").on("click", "li", function () {
    const isGenre = $(this).parent().attr("id") === "genreList";

    const isActive = $(this).hasClass("active");

    $(this).siblings().removeClass("active");

    $(this).toggleClass("active");

    if (isGenre) currentGenre = isActive ? "Tümü" : $(this).data("genre");
    else currentYear = isActive ? "Tümü" : $(this).data("year");

    applyFilters();
  });

  $("#paginationContainer").on("click", ".page-btn", function () {
    const page = $(this).data("page");

    if (page !== currentPage) {
      currentPage = page;

      $(".page-btn").removeClass("active");
      $(this).addClass("active");

      history.pushState({ page }, "", "?page=" + page);

      if (page > 1) $(".horizontal-section").slideUp(300);
      else if (
        currentGenre === "Tümü" &&
        currentYear === "Tümü" &&
        !searchQuery &&
        !showWatchlistOnly
      )
        $(".horizontal-section").slideDown(300);

      renderMovies();

      $("html, body").animate(
        { scrollTop: $(".main-list-title").offset().top - 80 },
        "slow",
      );
    }
  });

  $(window).on("popstate", (e) => {
    const page = e.originalEvent.state
      ? e.originalEvent.state.page
      : parseInt(new URLSearchParams(window.location.search).get("page")) || 1;
    if (page !== currentPage) {
      currentPage = page;
      $(".page-btn").removeClass("active");
      $(`.page-btn[data-page="${page}"]`).addClass("active");
      if (page > 1) $(".horizontal-section").slideUp(300);
      else if (
        currentGenre === "Tümü" &&
        currentYear === "Tümü" &&
        !searchQuery &&
        !showWatchlistOnly
      )
        $(".horizontal-section").slideDown(300);
      renderMovies();
    }
  });

  $("body").on("click", ".fav-btn", function () {
    const btn = $(this);
    const id = btn.data("id");
    const isFav = favorites.includes(id);

    if (isFav) {
      favorites = favorites.filter((f) => f !== id);

      $(`.fav-btn[data-id="${id}"]`)
        .removeClass("favorited")
        .find("i")
        .removeClass("fa-solid")
        .addClass("fa-regular")
        .end()
        .find(".btn-text")
        .text("Favoriye Ekle");
    } else {
      favorites.push(id);

      $(`.fav-btn[data-id="${id}"]`)
        .addClass("favorited")
        .find("i")
        .removeClass("fa-regular")
        .addClass("fa-solid")
        .end()
        .find(".btn-text")
        .text("Favorilerde");
    }

    localStorage.setItem("cinemaFavorites", JSON.stringify(favorites));

    if (showWatchlistOnly) applyFilters();
  });

  $("#watchlistBtn").on("click", function () {
    showWatchlistOnly = !showWatchlistOnly;

    $(this).toggleClass("active", showWatchlistOnly);

    if (showWatchlistOnly) {
      currentGenre = currentYear = "Tümü";

      $("#genreList li, #yearList li")
        .removeClass("active")
        .first()
        .addClass("active");

      $("#searchInput").val("");
      searchQuery = "";
    }

    applyFilters();
  });

  renderSpecialSections();

  applyFilters();
});
