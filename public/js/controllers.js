'use strict';

/* Controllers */

var buckuttControllers = angular.module('buckuttControllers', []);

buckuttControllers.controller('AppCtrl', ['$rootScope', '$scope', '$location', '$http',
  function($rootScope,$scope,$location,$http) {
    $http.get('/user').success(function(data) {
      if (data.error) {
        $location.path('/login');
      }
      else {
        $rootScope.user = data.user;
      }
    });
  }]
);

buckuttControllers.controller('LoginCtrl', ['$rootScope', '$scope', '$location', '$http',
  function($rootScope,$scope,$location,$http) {
    $scope.login = function(credentials) {
      $http.post('/login',{'username':credentials.username,'password':credentials.password}).success(function(data) {
        if (data.error) {
          alert(data.error.message);
        }
        else {
          $rootScope.user = data.user;
          $location.path('/');
        }
      });
    };
    
    $scope.logout = function() {
      $http.post('/logout').success(function(data) {
        if (data.error) {
          alert(data.error.message);
        }
        else {
          delete $rootScope.user;
          $location.path('/login');
        }
      });
    };
  }]
);

buckuttControllers.controller('MenuCtrl', ['$rootScope', '$scope', '$http',
  function($rootScope,$scope,$http) {
      $http.get('/api/fundations').success(function(data) {
        // create funList in rootScope
        var funList = {};
        for(var f in data.data)
          funList[data.data[f].id.toString()] = data.data[f];
        $rootScope.funList = funList;
      });
  }]
);

buckuttControllers.controller('CrudMatrixReadCtrl', ['$rootScope', '$scope', '$routeParams', '$http',
  function($rootScope,$scope,$routeParams,$http) {
    $rootScope.page = $routeParams.page;
    $rootScope.funId = $routeParams.funId;
    $scope.parseInt = parseInt; // to be moved away somewhere else
    $scope.angular = angular; // to be moved away somewhere else

    create_crud_matrix($rootScope, $scope, $http, function() {
      var req = '/api'+$scope.matrix.get_url;
      if($routeParams.funId)
        req += '&FundationId='+$routeParams.funId;
      
      $http.get(req).success(function(res) {
        //set dataLength for counting number of values on multi-valued fields
        for(var i in res.data){
          if (!angular.isNumber(i))
            break;// if one only line returned by api, data is not a numeric array but directly the one object
          
          var entry = res.data[i];
          entry.mv_lengths = {};
          for(var j in $scope.mv_cols){
            entry.mv_lengths[$scope.mv_cols[j].pos] = entry[$scope.mv_cols[j].name].length;
          }
        }
        
        //find columns where foreign link is defined
        for(var i in $scope.matrix.dataStructure){
          var col = $scope.matrix.dataStructure[i];
          if(col.multi_valued){
            //go through subfields
            for(var sf in col.subFields) {
              if(col.subFields[sf].foreign){
                foreign_field_replace($http, col.name, col.subFields[sf], res.data);
              }
            }
          }
          else {//mono valued
            if(col.foreign){
              foreign_field_replace($http, col.name, col, res.data);
            }
          }
        }
        $scope.table = res.data;
      });
    });
    
    $scope.mvSelect = function(select_id) {
      $scope.mv_selected = select_id;
    }
  }]
);

buckuttControllers.controller('CrudMatrixCreateUpdateCtrl', ['$rootScope', '$scope', '$routeParams', '$http',
  function($rootScope,$scope,$routeParams,$http) {
    $rootScope.page = $routeParams.page;
    $rootScope.funId = $routeParams.funId;
    $scope.entryId = $routeParams.entry ? $routeParams.entry : 0;
    $scope.parseInt = parseInt; // to be moved away somewhere else
    $scope.angular = angular; // to be moved away somewhere else
    
    create_crud_matrix($rootScope, $scope, $http, function() {
      $http.get('/api'+$scope.matrix.get_url+'_'+$scope.entryId).success(function(entry) {
        //set dataLength for counting number of values on multi-valued fields
        entry.mv_lengths = {};
        for(var j in $scope.mv_cols){
          entry.mv_lengths[$scope.mv_cols[j].pos] = entry[$scope.mv_cols[j].name].length;
        }
        $scope.entry = entry;
      });
    });//end http get crud structure
  }]
);

buckuttControllers.controller('TreasuryCtrl', ['$rootScope', '$scope', '$routeParams', '$http',
  function($rootScope,$scope,$routeParams,$http) {
    $rootScope.page = 'treasury';
    $rootScope.funId = $routeParams.funId;
    $scope.parseInt = parseInt; // to be moved away somewhere else
    $scope.angular = angular; // to be moved away somewhere else
  }]
);

