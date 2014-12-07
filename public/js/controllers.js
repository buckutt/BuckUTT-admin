'use strict';

/* Controllers */

var buckuttControllers = angular.module('buckuttControllers', []);

buckuttControllers.controller('MenuCtrl', ['$rootScope', '$scope', '$http',
  function($rootScope,$scope,$http) {
      $rootScope.$watch(function(){
        $scope.page = $rootScope.page;
        $scope.funId = $rootScope.funId;
      });
      
      $http.get('/api/fundations').success(function(data) {
        $scope.funList = data.data;
        
        // create fundList in rootScope
        var fundList = {};
        for(var f in data.data)
          fundList[data.data[f].id.toString()] = data.data[f];
        $rootScope.fundList = fundList;
      });
  }]
);

buckuttControllers.controller('CrudMatrixReadCtrl', ['$rootScope', '$scope', '$routeParams', '$http',
  function($rootScope,$scope,$routeParams,$http) {
    $scope.page = $routeParams.page;
    $scope.fun = $routeParams.funId ? $rootScope.fundList[$routeParams.funId.toString()] : $routeParams.funId;
    $scope.parseInt = parseInt; // to be moved away somewhere else
    $scope.angular = angular; // to be moved away somewhere else
    $rootScope.page = $scope.page;
    $rootScope.funId = $scope.fun ? $scope.fun.id : $scope.fun;

    create_crud_matrix($scope, $http, function() {
      var req = '/api'+$scope.matrix.get_url;
      if($scope.fun)
        req += '&FundationId='+$scope.fun.id;
      $http.get(req).success(function(data2) {
        //set dataLength for counting number of values on multi-valued fields
        for(var i in data2.data){
          var entry = data2.data[i];
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
                foreign_field_replace($http, col.name, col.subFields[sf], data2.data);
              }
            }
          }
          else {//mono valued
            if(col.foreign){
              foreign_field_replace($http, col.name, col, data2.data);
            }
          }
        }
        $scope.table = data2.data;
      });
    });
    
    $scope.mvSelect = function(select_id) {
      $scope.mv_selected = select_id;
    }
  }]
);

buckuttControllers.controller('CrudMatrixCreateUpdateCtrl', ['$rootScope', '$scope', '$routeParams', '$http',
  function($rootScope,$scope,$routeParams,$http) {
    $scope.page = $routeParams.page;
    $scope.funId = $routeParams.funId;
    $scope.entryId = $routeParams.entry ? $routeParams.entry : 0;
    $scope.parseInt = parseInt; // to be moved away somewhere else
    $scope.angular = angular; // to be moved away somewhere else
    $rootScope.page = $scope.page;
    $rootScope.funId = $scope.funId;
    
    create_crud_matrix($scope, $http, function() {
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
    $scope.page = 'treasury';
    $scope.funId = $routeParams.funId;
    $scope.parseInt = parseInt; // to be moved away somewhere else
    $scope.angular = angular; // to be moved away somewhere else
    $rootScope.page = $scope.page;
    $rootScope.funId = $scope.funId;
  }]
);

