
var trackApp = angular.module('trackApp', ['ngRoute']);

    // configure our routes
    trackApp.config(function($routeProvider) {
        $routeProvider

        	// route for the home page
   		.when('/', {
                	templateUrl : '/static/home.html',
                	controller  : 'trackController'
            	})
		.when('/routes',{
			templateUrl : '/static/routes.html',
			controller : 'routeController'
		})
		.when('/cities',{
			templateUrl : '/static/cities.html',
			controller : 'cityController'
		});
		
	});
          

	trackApp.controller('trackController', function($scope, $http) {	
		$scope.map = "";
		$scope.from = '';
		$scope.to = "";
		$scope.distance = 0;
		$scope.result = ""

		function initMap() {
  			$scope.map = new google.maps.Map(document.getElementById('map'), {
    				center: {lat: 52.04, lng: 19.28},
    				zoom: 6
  			});
		};
		initMap();
		$scope.cities = [];
		$http.get("/api/cities").then(function(response) {
			for (var i in response.data) {
				$scope.cities.push(response.data[i]);
			}
			console.log($scope.cities);
		});
		$scope.message = 'Everyone come and see how good I look!';
    		$scope.findTrack = function() {
			console.log($scope.from._id+":"+$scope.to._id);
			$http.post("/api/tracks", {"from": $scope.from, "to": $scope.to}).then(function(response){
				console.log(response);
				if(response.data[response.data.length-1] == 110000000) {
					$scope.result = "Niestety, nie ma żadnego połączenia między podanymi przez Ciebie miastami!";
				}	
				else if (response.data.length == 1) {
					$scope.result = "Nakrótsze połączenie jest bezpośrednie i wynosi: "+response.data[0]+" km";
				}
				else {
					$scope.result = "Nakrótsze połączenie wynosi : "+response.data[response.data.length-1]+" km";
					$scope.result += " i przechodzi przez miasta: ";
					var path = []
					var srcGeo = [];
					var desGeo = [];
					for(var z in $scope.cities) {
						if($scope.cities[z]._id == $scope.from) {
							srcGeo = {lat: $scope.cities[z].latitude, lng: $scope.cities[z].longitude};
						}

						if($scope.cities[z]._id == $scope.to) {
                                                        desGeo = {lat: $scope.cities[z].latitude, lng: $scope.cities[z].longitude};
                                                }
					}
					path.push({lat: srcGeo.lat, lng: srcGeo.lng});
					for (var x = 0; x < response.data[0].length; x++) {
                                                $scope.result += response.data[0][x].name;
                                                path.push({lat: response.data[0][x].latitude, lng: response.data[0][x].longitude});
                                        }
					path.push({lat: desGeo.lat, lng: desGeo.lng});

					var poly = new google.maps.Polyline({
						path: path,
						geodesic: true,
    						strokeColor: '#FF0000',
    						strokeOpacity: 1.0,
    						strokeWeight: 2
					});
					
					poly.setMap($scope.map);
				}
			},
			function(){
				$scope.result="Proszę podać poprawne miasta!"
			});
		}
	});

	trackApp.controller('routeController', function($scope,$http) {
		
		$scope.from = "";
		$scope.to = "";		
		$scope.cities = [];
		$scope.message = "";		

		$scope.routes = [];
		
		$http.get("/api/cities").then(function(response) {
                        for (var i in response.data) {
                                $scope.cities.push(response.data[i]);
                        }
                });

		$scope.getCityById = function(id) {
			for (var i in $scope.cities) {
				if($scope.cities[i]._id.$oid == id.$oid) return $scope.cities[i].name;
			}
			return -1;
		}

		$scope.refreshRoutes = function(){
			$http.get("/api/routes").then(function(response) {
				$scope.routes = [];
				for (var i in response.data) {
					$scope.routes.push(response.data[i]);
				}
				console.log($scope.routes);
			});
		};	
		
		$scope.refreshRoutes();

		
		$scope.addRoute = function() {
			$http.post("/api/routes",{source: $scope.from, destination: $scope.to,distance: $scope.distance}).then(function(response){
				$scope.refreshRoutes();
				console.log(response);	
			});
		}

		$scope.removeRoute = function(e) {
			$http({method:"DELETE", url: "/api/routes",data:{_id: e}}).then(function(response){
				$scope.refreshRoutes();
				console.log(1);
			});

		}


	});

	trackApp.controller('cityController',function($scope,$http) {
		$scope.name = '';
		$scope.longitude = 0;
		$scope.latitude = 0;
		$scope.message = 0;
	
		$scope.cities = [];

		$scope.refreshCities = function() {
			$scope.cities = [];
			$http.get("/api/cities").then(function(response) {
                        	for (var i in response.data) {
                                	$scope.cities.push(response.data[i]);
                        	}
                	});

		}
		$scope.refreshCities();
		$scope.addCity = function() {
			$http.post("/api/cities",{name: $scope.name, longitude: $scope.longitude, latitude: $scope.latitude}).then(function() {
				$scope.refreshCities();
			});
		}
		
		$scope.removeCity = function (e) {
			$http({method:"DELETE", url: "/api/cities", data:{_id: e}}).then(function(response){
		        	$scope.refreshCities();
                        });
		}	

		$scope.autoGeo = function() {
			$http.get("https://maps.googleapis.com/maps/api/geocode/json?address="+$scope.name+"&key=AIzaSyBSyl8XTMur08HYra7Z9ARrjG5wFUsn3zY").then(function(response){
				if(response.data.results.length !=0) {
					console.log(response.data.results[0].geometry.location);
					$scope.longitude = response.data.results[0].geometry.location.lng;
					$scope.latitude = response.data.results[0].geometry.location.lat;
				}
				else {}
			});
		}
	});
