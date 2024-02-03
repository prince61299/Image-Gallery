var app = angular.module("ImageGalleryApp", ["ngRoute"]);
var isAuth = false;
var pageReloaded = false;

// Check if user data exists in localStorage
app.run(function ($rootScope, $location) {
  $rootScope.$on("$routeChangeStart", function (event, next, current) {
    if (isAuth === false && next.templateUrl !== "signup.html") {
      // Redirect to the signin page if isAuth is false and the next route is not signin.html
      $location.path("/signin");
    }
    var userData = localStorage.getItem("userData");
    if (userData) {
      isAuth = true;
    }
  });
});
app.config(function ($routeProvider) {
  $routeProvider
    .when("/", {
      templateUrl: "Home.html",
      controller: "HomeController",
    })
    .when("/favourites", {
      templateUrl: "favourites.html",
    })
    .when("/share", {
      templateUrl: "share.html",
    })
    .when("/signin", {
      templateUrl: "signin.html",
    })
    .when("/signup", {
      templateUrl: "signup.html",
    })
    .otherwise({
      redirectTo: "/",
    });
});

// ----------------------------------------------------------------------------------

app.controller("indexController", function ($scope, $location, $http, $window) {
  // Check if user data is present in localStorage
  var userData = localStorage.getItem("userData");
  $scope.isAuth = !!userData; // true if userData exists, false otherwise

  $scope.logout = function () {
    localStorage.removeItem("userData");
    $location.path("/");

    setTimeout(function () {
      $scope.$apply(function () {
        location.reload();
      });
    }, 1000); // Delay in milliseconds (e.g., 2000 for 2 seconds)
  };
});
app.controller(
  "FavouritesController",
  function ($scope, $rootScope, $location, $http, $window) {
    // Check if user data is present in localStorage
    $rootScope.imageWrapper = document.querySelector(".images");
    let imagesArray = [];
    if (localStorage.getItem("userData")) {
      var loginUser = localStorage.getItem("userData");
      loginUser = JSON.parse(loginUser);
      imagesArray = loginUser.favorites;
    }
    console.log(imagesArray);
    $rootScope.imageWrapper.innerHTML += imagesArray
      .map(
        (img) =>
          `<li class="card">
              <img src="${img.img}" alt="img">
              <div class="details">
                  <div class="photographer">
                      <i class="uil uil-camera"></i>
                      <span>${img.name}</span>
                  </div>
                
              </div>
          </li>`
      )
      .join("");
  }
);

app.controller("SigninController", function ($scope, $location, $http) {
  // console.log("hello");
  $scope.signin = function () {
    // Fetch user data from JSON file or server-side endpoint
    $http.get("db.json").then(function (response) {
      var users = response.data.users;
      console.log(users);
      var flag = true;
      for (let obj of users) {
        if (
          obj.email === $scope.user.username &&
          obj.password === $scope.user.password
        ) {
          var loginuser = obj;
          console.log(loginuser);
          localStorage.setItem("userData", JSON.stringify(loginuser));
          alert("Congratulation you login sucessfully");
          setTimeout(function () {
            $location.path("/");
          }, 1000);
          // console.log(userData);
          flag = false;
          $location.path("/app");
        }
      }
      if (flag) {
        alert("Invalid Creditional");
      }
      // var matchedUser = users.find(function(user) {
      //   return user.email === $scope.user.email && user.password === $scope.user.password;
      // });
      // if (matchedUser) {
      //   // Login successful
      //   alert("Login successful");
      //   $location.path("/dashboard"); // Redirect to dashboard or desired page
      // } else {
      //   // Login failed
      //   alert("Invalid email or password");
      // }
    });
  };
});

app.controller("SignupController", function ($scope, $location, $http) {
  $scope.signup = function () {
    // Fetch user data from JSON file or server-side endpoint
    $http.get("db.json").then(function (response) {
      var users = response.data;
      // var existingUser = users.find(function(user) {
      //   return user.email === $scope.user.email;
      // });
      // if (existingUser) {
      //   // User already exists
      //   alert("User already exists");
      // } else {
      // Add new user to the JSON file or server-side endpoint
      // users.push($scope.user);
      // $http.put("db.json", users).then(function() {
      $http({
        method: "POST",
        url: "http://localhost:3000/users",
        data: $scope.user,
      }).then(
        function (response) {
          alert("Signup Successful");
          console.log(response);

          localStorage.setItem("userData", JSON.parse($scope.user));
          setTimeout(function () {
            $location.path("/");
          }, 1000);
        },
        function (error) {
          console.log(error);
        }
      );
      // Redirect to login page
    });
  };
});
// -------------------------------------------------------------------------

// for share
app.controller("shareCtrl", function ($scope) {
  $scope.shareOnWhatsApp = function () {
    var url = encodeURIComponent(window.location.href);
    window.open("https://api.whatsapp.com/send?text=" + url);
  };

  $scope.shareOnFacebook = function () {
    var url = encodeURIComponent(window.location.href);
    window.open("https://www.facebook.com/sharer.php?u=" + url);
  };

  $scope.shareOnTwitter = function () {
    var url = encodeURIComponent(window.location.href);
    window.open("https://twitter.com/intent/tweet?url=" + url);
  };
});

// ----------------------------------------------------------------------------
// for favourite

// -------------------------------------------------------------------------------------

app.controller("HomeController", [
  "$scope",
  "$rootScope",
  "$window",
  "$http",
  function ($scope, $rootScope, $window, $http) {
    $rootScope.apiKey =
      "Zezrq9hfnuxgjDIQVGM8H7xs7Sgf4InGHoU0GmJA0cOCS8zPQKA5kuBO";
    $rootScope.perPage = 15;
    $rootScope.currentPage = 1;
    $rootScope.searchTerm = null;
    $rootScope.imageWrapper = document.querySelector(".images");
    $rootScope.searchInput = document.querySelector(".search input");
    $rootScope.loadMoreBtn = document.querySelector(".gallery .load-more");
    $rootScope.lightbox = document.querySelector(".lightbox");
    $rootScope.downloadImgBtn =
      $rootScope.lightbox.querySelector(".uil-import");
    $rootScope.favoritesbtn = $rootScope.lightbox.querySelector(".uil-heart");
    $rootScope.closeImgBtn = $rootScope.lightbox.querySelector(".close-icon");

    $rootScope.topButton = document.getElementById("topBtn");

    const downloadImg = (imgUrl) => {
      // Converting received img to blob, creating its download link, & downloading it
      fetch(imgUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = new Date().getTime();
          a.click();
        })
        .catch(() => alert("Failed to download image!"));
    };

    const getImages = (apiURL) => {
      // Fetching images by API call with authorization header
      $rootScope.searchInput.blur();
      $rootScope.loadMoreBtn.innerText = "Loading...";
      $rootScope.loadMoreBtn.classList.add("disabled");
      fetch(apiURL, {
        headers: { Authorization: $rootScope.apiKey },
      })
        .then((res) => res.json())
        .then((data) => {
          generateHTML(data.photos);
          $rootScope.loadMoreBtn.innerText = "Load More";
          $rootScope.loadMoreBtn.classList.remove("disabled");
        })
        .catch(() => alert("Failed to load images!"));
    };

    const loadMoreImages = () => {
      $rootScope.currentPage++; // Increment currentPage by 1
      // If searchTerm has some value then call API with search term else call default API
      let apiUrl = `https://api.pexels.com/v1/curated?page=${$rootScope.currentPage}&per_page=${$rootScope.perPage}`;
      apiUrl = $rootScope.searchTerm
        ? `https://api.pexels.com/v1/search?query=${$rootScope.searchTerm}&page=${$rootScope.currentPage}&per_page=${$rootScope.perPage}`
        : apiUrl;
      getImages(apiUrl);
    };

    const loadSearchImages = (e) => {
      // Clear any existing timeout
      clearTimeout($rootScope.searchTimeout);

      // If the search input is empty, set the search term to null and return from here
      if (e.target.value === "") {
        $rootScope.searchTerm = null;
        getImages(
          `https://api.pexels.com/v1/curated?page=${$rootScope.currentPage}&per_page=${$rootScope.perPage}`
        );
        return;
      }

      // If pressed key is Enter, update the current page, search term & call the getImages
      if (e.key === "Enter") {
        $rootScope.currentPage = 1;
        $rootScope.searchTerm = e.target.value;
        $rootScope.imageWrapper.innerHTML = "";
        getImages(
          `https://api.pexels.com/v1/search?query=${$rootScope.searchTerm}&page=1&per_page=${$rootScope.perPage}`
        );
        return;
      }

      // Set a timeout to trigger the load images function after 3 seconds of inactivity
      $rootScope.searchTimeout = setTimeout(() => {
        $rootScope.currentPage = 1;
        $rootScope.searchTerm = e.target.value;
        $rootScope.imageWrapper.innerHTML = "";
        getImages(
          `https://api.pexels.com/v1/search?query=${$rootScope.searchTerm}&page=1&per_page=${$rootScope.perPage}`
        );
      }, 3000);
    };

    $scope.showLightbox = (name, img) => {
      // Showing lightbox and setting img source, name and button attribute
      $rootScope.lightbox.querySelector("img").src = img;
      $rootScope.lightbox.querySelector("span").innerText = name;
      $rootScope.downloadImgBtn.setAttribute("data-img", img);
      $rootScope.lightbox.classList.add("show");
      document.body.style.overflow = "hidden";
    };

    $scope.hideLightbox = () => {
      // Hiding lightbox on close icon click
      $rootScope.lightbox.classList.remove("show");
      document.body.style.overflow = "auto";
    };

    $window.downloadImg = downloadImg;

    $scope.addToFavorites = function (name, img) {
      // Create a data object containing the name and image URL\
      console.log("object");
      var data = {
        name: name,
        img: img,
      };

      // Make a GET request to fetch the user data
      $http
        .get("db.json")
        .then(function (response) {
          var users = response.data.users;

          // Find the current user
          var loginUser = localStorage.getItem("userData");
          loginUser = JSON.parse(loginUser);
          console.log(loginUser);
          var currentUser = users.find(function (user) {
            return user.email === loginUser.email;
          });
          console.log(currentUser);
          if (currentUser) {
            // Add the favorite to the current user's favorites array
            currentUser.favorites.push(data);

            // Make a PUT request to update the user's data
            $http({
              method: "PUT",
              url: "http://localhost:3000/users/" + currentUser.id,
              data: currentUser,
            })
              .then(function (response) {
                alert("Favorite added successfully:", response.data);
                localStorage.setItem("userData", JSON.stringify(currentUser));
              })
              .catch(function (error) {
                console.error("Failed to add favorite:", error);
              });
          } else {
            console.error("User not found");
          }
        })
        .catch(function (error) {
          console.error("Failed to fetch user data:", error);
        });
    };

    const generateHTML = (images) => {
      // Making li of all fetched images and adding them to the existing image wrapper
      $rootScope.imageWrapper.innerHTML += images
        .map(
          (img) =>
            `<li class="card">
              <img onclick="angular.element(this).scope().showLightbox('${img.photographer}', '${img.src.large2x}')" src="${img.src.large2x}" alt="img">
              <div class="details">
                  <div class="photographer">
                      <i class="uil uil-camera"></i>
                      <span>${img.photographer}</span>
                  </div>
                 <button style="color: black;" onmouseover="this.style.color='white';" onmouseout="this.style.color='black';" onclick="angular.element(this).scope().downloadImg('${img.src.large2x}');">
                   <i class="uil uil-import"></i>
                </button>
                     <button style="color: black;" onmouseover="this.style.color='white';" onmouseout="this.style.color='black';"  onclick="angular.element(this).scope().addToFavorites('${img.photographer}', '${img.src.large2x}')">
                  <i class="uil uil-heart"></i>
              </button>
              </div>
          </li>`
        )
        .join("");
    };

    // providing global scope
    $window.getImages = getImages;
    $window.loadMoreImages = loadMoreImages;
    $window.loadSearchImages = loadSearchImages;
    $window.generateHTML = generateHTML;

    // call get image when page get rendered first time or reload anytime
    getImages(
      `https://api.pexels.com/v1/curated?page=${$rootScope.currentPage}&per_page=${$rootScope.perPage}`
    );

    $rootScope.loadMoreBtn.addEventListener("click", loadMoreImages);
    $rootScope.searchInput.addEventListener("keyup", loadSearchImages);
    $rootScope.closeImgBtn.addEventListener("click", $scope.hideLightbox);
    $rootScope.downloadImgBtn.addEventListener("click", (e) =>
      downloadImg(e.target.dataset.img)
    );

    // When the user scrolls down 20px from the top of the document, show the button
    window.onscroll = function () {
      scrollFunction();
    };

    function scrollFunction() {
      if (
        document.body.scrollTop > 20 ||
        document.documentElement.scrollTop > 20
      ) {
        $rootScope.topButton.style.display = "block";
      } else {
        $rootScope.topButton.style.display = "none";
      }
    }

    // When the user clicks on the button, scroll to the top of the document
    $window.topFunction = function () {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    };
  },
]);
