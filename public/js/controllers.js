'use strict';

/* Controllers */

var buckuttControllers = angular.module('buckuttControllers', ['ui.bootstrap']);

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

buckuttControllers.controller('CrudMatrixReadCtrl', ['$rootScope', '$scope', '$location', '$routeParams', '$http',
  function($rootScope,$scope,$location,$routeParams,$http) {
    $rootScope.page = {};
    $rootScope.page.num = $routeParams.pageNum ? $routeParams.pageNum : 1;
    $rootScope.pageName = $routeParams.pageName;
    $rootScope.funId = $routeParams.funId;
    $scope.parseInt = parseInt; // to be moved away somewhere else
    $scope.angular = angular; // to be moved away somewhere else

    create_crud_matrix($rootScope, $scope, $http, function() {
      var base_req = '/api'+$scope.matrix.get_url;
      if($routeParams.funId)
        base_req += '&FundationId='+$routeParams.funId;
      
      //paging
      var page_size = 50;
      var offset = ($rootScope.page.num-1)*page_size;
      
      $http.get(base_req+'&limit='+page_size+'&offset='+offset).success(function(res) {
        //set dataLength for counting number of values on multi-valued fields
        for(var i in res.data){
          if (!angular.isNumber(parseInt(i)))
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
      
      var embed_s = base_req.indexOf('embed');
      var count_req = base_req;
      if (embed_s != 1){ //remove embed state for counting
        var embed_e = base_req.indexOf('&');
        count_req = base_req.substring(0,embed_s)+base_req.substring(embed_e+1);
      }
      $http.get(count_req+'&count').success(function(res) {
        var total_items = res.data;
        var nb_page = parseInt(total_items/page_size)+1;
        
        $rootScope.page.max = nb_page;// move to scope ?
        
        $scope.page_goto = function(num) {
          if (num > 0 && num <= $rootScope.page.max) {
            var path = $location.path().split('/');
            var page = path[path.length-1];
            if (Number.isInteger(parseInt(page)))
              $location.path($location.path().substring(0,$location.path().length-page.length)+num);
            else
              $location.path($location.path()+'/'+num);
          }
        };
        
        $scope.page_prev = function() {
          if ($rootScope.page.num > 1)
            $scope.page_goto(parseInt($rootScope.page.num)-1);
        };
        
        $scope.page_next = function() {
          if ($rootScope.page.num < $rootScope.page.max)
            $scope.page_goto(parseInt($rootScope.page.num)+1);
        };
        
        $scope.page_dropDown = function() {
          var r = [], x = 5;
          var start = parseInt($rootScope.page.num) - x;
          var end = parseInt($rootScope.page.num) + x;
          if (start < 1)
            start = 1;
          if (end > $rootScope.page.max)
            end = $rootScope.page.max;
          for(var i=start; i <= end; ++i)
            r.push(i);
          return r;
        };
      });
    });
    
    $scope.mvSelect = function(select_id) {
      $scope.mv_selected = select_id;
    };
  }]
);

buckuttControllers.controller('CrudMatrixCreateUpdateCtrl', ['$rootScope', '$scope', '$routeParams', '$http',
  function($rootScope,$scope,$routeParams,$http) {
    $rootScope.pageName = $routeParams.pageName;
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
    $rootScope.pageName = 'treasury';
    $rootScope.funId = $routeParams.funId;
    $scope.parseInt = parseInt; // to be moved away somewhere else
    $scope.angular = angular; // to be moved away somewhere else
      
    $scope.opened = {};
    $scope.open = function($event,field) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.opened[field] = true;
    };
    
    var date_watch = function() {
      if($scope.date_start && $scope.date_end){
        
      }
    };
    $scope.$watch('date_start', date_watch);
    $scope.$watch('date_end', date_watch);
  }]
);
