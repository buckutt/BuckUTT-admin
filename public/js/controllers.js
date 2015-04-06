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
    
    $rootScope.getUrl = function() {
      return $rootScope.funId ? '/fundation/'+$rootScope.funId+'/'+$rootScope.pageName : '/general/'+$rootScope.pageName;
    };
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
        //create funList in rootScope
        var funList = {};
        for(var f in data.data)
          funList[data.data[f].id.toString()] = data.data[f];
        $rootScope.funList = funList;
      });
  }]
);

buckuttControllers.controller('CrudMatrixReadCtrl', ['$rootScope', '$scope', '$location', '$routeParams', '$http',
  function($rootScope,$scope,$location,$routeParams,$http) {
    $rootScope.pageName = $routeParams.pageName;
    $rootScope.funId = $routeParams.funId;
    $scope.parseInt = parseInt;  //to be moved away somewhere else
    $scope.angular = angular;  //to be moved away somewhere else

    create_crud_matrix($rootScope.pageName, $scope, $http, function() {
      var base_req = '/api'+$scope.matrix.get_url;
      if($routeParams.funId){
        var fun_location = $scope.matrix.fun_location ? $scope.matrix.fun_location+'.' : '';
        base_req += '&'+fun_location+'FundationId='+$routeParams.funId;
      }
      
      //paging
      create_pagination($rootScope, $scope, $http, $location, base_req);
      
      $http.get(base_req+'&limit='+$rootScope.page.size+'&offset='+$rootScope.page.offset).success(function(res) {
        process_crud_matrix_data(res, $scope, $http, function() {
          $scope.table = res.data ? res.data : 'empty';
        });
      });
    });
    
    $scope.mvSelect = function(select_id) {
      $scope.mv_selected = select_id;
    };
  }]
);

buckuttControllers.controller('CrudMatrixCreateUpdateCtrl', ['$rootScope', '$scope', '$routeParams', '$http', '$filter', '$location',
  function($rootScope,$scope,$routeParams,$http,$filter,$location) {
    $rootScope.pageName = $routeParams.pageName;
    $rootScope.funId = $routeParams.funId;
    $rootScope.entryId = $routeParams.entry;
    
    //handling date fields
    create_date_options($scope);
    
    create_crud_matrix($rootScope.pageName, $scope, $http, function() {
      var base_req = '/api'+$scope.matrix.get_url+'&id='+$rootScope.entryId;
      
      $scope.selectedSf = {};
        
      if ($rootScope.entryId) { //update, load item
        $http.get(base_req).success(function(res) {
          process_crud_matrix_data(res, $scope, $http, function() {
            //add a time field to separate date and time
            for(var i in $scope.matrix.dataStructure)
              if($scope.matrix.dataStructure[i].form_type == 'datetime' && res.data)
                res.data[0][$scope.matrix.dataStructure[i].name+'_time'] = new Date(res.data[0][$scope.matrix.dataStructure[i].name]);
            
            if (!res.data[0])
              return;
            
            $scope.saved_entry = angular.copy(res.data[0]);
            $scope.entry = res.data[0];
            
            $scope.foreigns = {};
            for(var i=0 in $scope.matrix.dataStructure)
              if($scope.matrix.dataStructure[i].foreign && !$scope.matrix.dataStructure[i].multi_valued)
                make_drop_down($scope, $http, $filter, $scope.matrix.dataStructure[i], res.data[0][$scope.matrix.dataStructure[i].name]);
          });
        });
      }
    });//end http get crud structure
    
    $scope.submit = function() {
      var changes = {};
      changes[$scope.matrix.name] = {}; //for root object
      console.log($scope.entry);
      /*
      for (var i in $scope.matrix.dataStructure) {
        var field = $scope.matrix.dataStructure[i];
        if (field.multi_valued) {
          changes[i.toString()] = {};
          changes[i.toString()][field.name] = {};
          for (var j in $rootScope.entry[field.name]) {
            changes[i.toString()][field.name][j] = {};
            for (var sf in field.$scope.subFields) {
              if (JSON.stringify($rootScope.entry[field.name][j][sf]) != JSON.stringify($rootScope.saved_entry[field.name][j][sf]))
                changes[i.toString()][field.name][j][sf] = $rootScope.entry[field.name][j][sf];
            }
          }
        }
        else { //mono valued
          var comp = typeof $rootScope.entry[field.name] == 'object' ? $rootScope.entry[field.name].id : $rootScope.entry[field.name];
          if (JSON.stringify(comp) != JSON.stringify($rootScope.saved_entry[field.name]))
            changes[$scope.matrix.name][field.name] = $rootScope.entry[field.name];
        }
      }
      console.log('/api'+$scope.matrix.put_url+'/'+$rootScope.entryId);
      console.log(changes[$scope.matrix.name]);//*/
      
      /*
      $http.put('http://127.0.0.1/api/fundations/1',{"website":"test"}).success(function(data) {
        if (data.error) {
          console.log(data);
          alert(data.error.message);
        }
        else {
          console.log(data);
          
          
          delete $rootScope.entry;
          delete $rootScope.saved_entry;
          $location.path('/go_back');
        }
      });*/
    };
    
    $scope.sfLoadEntry = function(fieldId,fieldName,relativeId) {
      if ($scope.selectedSf[fieldName])
        return;
      
      $scope.selectedSf[fieldName] = {relativeId:relativeId,entry:angular.copy($scope.entry[fieldName][relativeId])};
      
      $scope.foreigns = {};// code to merge
      for(var i=0 in $scope.matrix.dataStructure[fieldId].subFields) {
        var sf = $scope.matrix.dataStructure[fieldId].subFields[i];
        if(sf.foreign)
          make_drop_down($scope, $http, $filter, sf, $scope.entry[fieldName][relativeId][sf.name].id);
        else if(sf.form_foreign)
          make_drop_down($scope, $http, $filter, sf, $scope.entry[fieldName][relativeId].id);
      }
    };
    
    $scope.sfAddEntry = function(fieldId,fieldName) {
      if ($scope.selectedSf[fieldName]) {
        $scope.sfCancel(fieldId,fieldName);
        return;
      }
      $scope.selectedSf[fieldName] = {entry:{}};
      
      $scope.foreigns = {};// code to merge
      for(var i=0 in $scope.matrix.dataStructure[fieldId].subFields) {
        var sf = $scope.matrix.dataStructure[fieldId].subFields[i];
        if(sf.foreign || sf.form_foreign)
          make_drop_down($scope, $http, $filter, sf, -1);
      }
    };
    
    $scope.sfDelEntry = function(fieldId,fieldName, entryId) {
      if ($scope.entry[fieldName][entryId]) {
        $scope.entry[fieldName].splice(entryId,1);
      }
    };
    
    $scope.sfSubmit = function(fieldId,fieldName) {
      if ($scope.selectedSf[fieldName].relativeId >= 0) { //case of update
        $scope.entry[fieldName][$scope.selectedSf[fieldName].relativeId] = $scope.selectedSf[fieldName].entry;
        console.log($scope.selectedSf[fieldName].entry);
      }
      else { //case of create
        $scope.entry[fieldName].push($scope.selectedSf[fieldName].entry);
      }
      delete $scope.selectedSf[fieldName];
    };
    
    $scope.sfCancel = function(fieldId,fieldName) {
      delete $scope.selectedSf[fieldName];
    };
  }]
);

buckuttControllers.controller('TreasuryCtrl', ['$rootScope', '$scope', '$location', '$routeParams', '$http', '$filter',
  function($rootScope,$scope,$location,$routeParams,$http,$filter) {
    $rootScope.pageName = 'treasury';
    $rootScope.funId = $routeParams.funId;
    $scope.include_url = 'partials/treasury_'+($rootScope.funId ? 'fundation' : 'general')+'.html';
    $scope.split_promo = false;
    //on initial load, having a page value induce not being in recap mode
    $scope.recap = !$location.search().page;
    
    $scope.date_start = $location.search().DateStart ? $location.search().DateStart.split(' ')[0] : null;
    $scope.date_end = $location.search().DateEnd ? $location.search().DateEnd.split(' ')[0] : null;
    
    var init_time = function(){
      $scope.time_start = $location.search().DateStart ? new Date($location.search().DateStart) : new Date(0, 0, 0, 0, 0, 0);//00h00
      $scope.time_end   = $location.search().DateEnd ? new Date($location.search().DateEnd) : new Date(0, 0, 0, 23, 59, 0);//23h59
      $scope.time_start.setSeconds(0);
      $scope.time_end.setSeconds(0);
    };
    init_time();

    //handling date fields
    create_date_options($scope);
    
    //get clearance on general treasury page only
    if (!$rootScope.funId) {
      $http.get('/api/services/treasury/clearance').success(function(res) {
        $scope.clearance = res.data.clearance;
      });
    }
    
    $scope.watcher = function(newValue, oldValue) {
      if (newValue == oldValue) //skip init calls
        return;
      
      //in case user deletes time put standard one again
      if(!$scope.time_start || !$scope.time_end)
        init_time();
      
      //do nothing if dates & time are not corrects
      if($scope.date_start && $scope.date_end   //check date exist
      && new Date($scope.date_start) <= new Date($scope.date_end)  //check date logic
      && $scope.time_start < $scope.time_end) {  //check time logic
      
        //stringify dates to format "yyyy-MM-dd HH:mm:ss"
        var str_start = $filter('date')($scope.date_start, 'yyyy-MM-dd')+' '+$filter('date')($scope.time_start, 'HH:mm')+':00';
        var str_end   = $filter('date')($scope.date_end, 'yyyy-MM-dd')+' '+$filter('date')($scope.time_end, 'HH:mm')+':59';
        
        //if datetime has changed, update $location and reset page.num
        if ($location.search().DateStart != str_start || $location.search().DateEnd != str_end) {
          $location.search('DateStart',str_start);
          $location.search('DateEnd',str_end);
          
          if ($rootScope.funId && !$scope.recap) {
            $location.search('page',1);
            $rootScope.page.num = 1;
          }
        }
        
        //#/fundation/funId/treasury
        if ($rootScope.funId) {
          if ($scope.recap) { //Recap mode (Show all purchases mode not activated)
            
            //delete paging argument in $location when in recap mode
            $location.search('page',null);
            
            var req = '/api/services/treasury/purchases?DateStart='+str_start+'&DateEnd='+str_end+'&FundationId='+$rootScope.funId;
            if ($scope.split_promo)
              req += '&split_promo=1';
            
            $http.get(req).success(function(res) {
              if (res.error) {
                $scope.error = res.error;
                return;
              }
              
              //calculate total amount of page on client side
              $scope.totalAmount = 0;
              for (var i in res.data)
                $scope.totalAmount += res.data[i].PurchasesSum;
              
              $scope.table = res.data ? res.data : 'empty';
            });
          }
          else { //Show all purchases mode
            create_crud_matrix($rootScope.pageName, $scope, $http, function() {
              var req = '/api'+$scope.matrix.get_url+'&between=date,'+str_start+','+str_end+'&FundationId='+$rootScope.funId;
              
              if (!$scope.split_promo)
                req += '&price=>1';
              
              //paging
              create_pagination($rootScope, $scope, $http, $location, req);
              
              $http.get(req+'&limit='+$rootScope.page.size+'&offset='+$rootScope.page.offset).success(function(res) {
                process_crud_matrix_data(res, $scope, $http, function() {
                  $scope.table = res.data ? res.data : 'empty';
                });
              });
            });
          }
        }
        else { //#/general/treasury
          $scope.tables = {'reloads':[],'purchases':[]};
          $scope.totals = {'reloads':0,'purchases':0};
          
          $http.get('/api/services/treasury/reloads?DateStart='+str_start+'&DateEnd='+str_end).success(function(res) {
            for (var i in res.data)
              $scope.totals.reloads += res.data[i].Amount;
            
            $scope.tables.reloads = res.data ? res.data : 'empty';
          });
          
          $http.get('/api/services/treasury/purchases?DateStart='+str_start+'&DateEnd='+str_end).success(function(res) {
            for (var i in res.data)
              $scope.totals.purchases += res.data[i].Amount;
            
            $scope.tables.purchases = res.data ? res.data : 'empty';
          });
        }
      }
    };
    
    $scope.$watch('date_start', $scope.watcher);
    $scope.$watch('date_end', $scope.watcher);
    $scope.$watch('recap', $scope.watcher);
    $scope.$watch('split_promo', $scope.watcher);
    $scope.watcher(0,1);
    
    $scope.doRecap = function() {
      $scope.recap = !$scope.recap;
    };
    
    $scope.splitPromo = function() {
      $scope.split_promo = !$scope.split_promo;
    };
  }]
);
