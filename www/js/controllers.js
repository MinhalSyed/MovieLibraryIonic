angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, Chats) {
  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  }
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('FriendsCtrl', function($scope, Friends) {
  $scope.friends = Friends.all();
})

.controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
  $scope.friend = Friends.get($stateParams.friendId);
})

.controller('AccountCtrl', function ($scope, $http, $q, APIService) {

    $scope.settings = {
        enableFriends: false
    }

    $scope.api_key = 'e830040a87c1ef71ce545dae4e754307';
    $scope.base_uri = "http://api.themoviedb.org/3/";

    $scope.itemsPerPage = 12;
    $scope.currentPage = 0;
    $scope.MovieJson = [];

    $scope.SaveCurrentLibrary = function () {
        localStorage.clear();
        localStorage.setItem('MovieJson', JSON.stringify($scope.MovieJson));
    }

    $scope.pageCount = function () {
        return Math.ceil($scope.MovieJson.length / $scope.itemsPerPage) - 1;
    };

    $scope.prevPage = function () {
        if ($scope.currentPage > 0) {
            $scope.currentPage--;
        }
    };

    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.pageCount()) {
            $scope.currentPage++;
        }
    }

    $scope.OpenLibrary = function () {
        var MovieJson = JSON.parse(localStorage.getItem('MovieJson'));

        if (MovieJson) {
            $scope.MovieJson = MovieJson;
            console.log('Found Previous Movie');
        }
        else {
            $scope.UpdateMovieLibrary();
        }
        $scope.$broadcast('ImportedMoviesJson', {});
    }

    $scope.UpdateMovieLibrary = function () {
        localStorage.clear();
        console.log('Adding files from library');
        $http.get('./json/movies.json').success(function (json) {
            for (var i = 0; i < json.length; i++) {
                var movie = json[i];
                movie.isUpdated = false;
                $scope.MovieJson.push(movie);
            }
            $scope.$broadcast('ImportedMoviesJson', {});
        });
    }


    $scope.GetMovieInfo = function () {        
        for (var i = 0; i < 10/*$scope.MovieJson.length*/; i++) {
            var movie = $scope.MovieJson[i];
            if (!movie.isUpdated) {

                var query = movie.title.replace(/\./g, ' ');

                query = movie.title.replace(/ *\([^)]*\) */g, "");
                query = movie.title.replace(/ *\[[^)]*\] */g, "");

                query = movie.title.replace("Extended", "");
                query = movie.title.replace("extended", "");
                query = movie.title.replace("editions", "");

                var getUrl = $scope.base_uri + 'search/movie' + '?query="' + query + '"&api_key=' + $scope.api_key;

                $http.get(encodeURI(getUrl))
                 .success((function (movie) {
                     return function (data, status, headers, config) {
                         if (data.results.length > 0) {
                             movie.id = data.results[0].id;
                             movie.original_title = data.results[0].original_title;
                             movie.img = 'https://image.tmdb.org/t/p/w130' + data.results[0].poster_path;
                             movie.vote_average = data.results[0].vote_average;
                             movie.backdrop_path = 'https://image.tmdb.org/t/p/w1280' + data.results[0].backdrop_path;
                             movie.isUpdated = true;

                             var getUrl = APIService.base_uri + 'movie/' + movie.id + '?api_key=' + APIService.api_key;
                            
                             $http.get(encodeURI(getUrl)).success(function (data) {
                                 movie.overview = data.overview;
                                 console.log('Got ' + movie.original_title + 'overview');
                                 $scope.SaveCurrentLibrary();
                             });

                             console.log('Got '+ movie.original_title);
                         }
                         else {
                             //alert('data = ' + data + ' status = ' + status);
                         }
                     }
                 })(movie))
            }
        }
    }

    $scope.prevPageDisabled = function () {
        return $scope.currentPage === 0 ? "disabled" : "";
    };

    $scope.nextPageDisabled = function () {
        return $scope.currentPage === $scope.pageCount() ? "disabled" : "";
    };

    $scope.deleteCache = function()
    {
        localStorage.clear();
        console.log('Cache Cleared.');
    };

    $scope.Open = function (movie) {
        var scope = $scope.$new();
        scope.movie = movie;
        ngDialog.open({
            template: 'partials/MovieDialog.html',
            scope: scope,
            controller: 'MovieDialogController'
        });
    }

    //Main Program:

    $scope.$on('ImportedMoviesJson', function () {
        console.log('ImportedMoviesJson');
        $scope.GetMovieInfo();
    });

    $scope.OpenLibrary();
    
})
.filter('offset', function () {
    return function (input, start) {
        start = parseInt(start, 10);
        return input.slice(start);
    };
})
