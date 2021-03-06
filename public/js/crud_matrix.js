
/* Crud Matrix functions used by controllers */


/*
 * Create a crud_matrix table structure with no data (the "matrix" variable in HTML view)
 */
var create_crud_matrix = function(pageName, $scope, $http, callback) {
  $http.get('crud_matrix/'+pageName+'.json').success(function(data) {
    //set dataLength for counting sub fields on multi-valued fields
    //also create a sub-dataStructure in mv_cols with the sub-fields instead of parent field (eg : for article, price/period/group instead of prices)
    var i = 0, mv_cols = [], mv_count = 0;//mv = multi-valued
    while( i < data.dataStructure.length) {
      var col = data.dataStructure[i];
      
      if (col.multi_valued) {
        col['dataLength'] = angular.isArray(col.subFields) ? col.subFields.length : 0;
        mv_cols.push({"pos" : i, "name" : col.name});
        ++mv_count;
        
        //creating the sub structure
        col.subStructure = [];
        
        for (var j in data.dataStructure) {
          if (data.dataStructure[j].name == col.name && angular.isArray(col.subFields)) { //here are the sub-fields
            for (var k in data.dataStructure[j].subFields) {
              col.subStructure.push(data.dataStructure[j].subFields[k]);
              col.subStructure[col.subStructure.length-1].parent = data.dataStructure[j].name;
            }
          }
          else{
            col.subStructure.push(data.dataStructure[j]);
          }
        }
        
        if (col.id)
          col.id = col.id.split('.');
        
      }//end if col.multi_valued
      i++;
    }
    
    $scope.matrix = data;
    $scope.mv_count = mv_count;
    $scope.mv_cols = mv_cols;
    $scope.mv_selected = mv_count == 0 ? 0 : mv_cols[0].pos;
    
    callback();
  });
};

/*
 * Replace id with the object they are representing
 * For example: '3' will become this json string '{"id":3,"name":"Foyer","isRemoved":false}'
 * Replacement is done for a whole column (colName)
 * DataStructure is a sample of the crudMatrix
 * When column has no subFields dataStructure.name == colName
 * When column has subFields dataStructure while be the description of the subField
 */
var foreign_field_replace = function($http, colName, dataStructure, data) {
  var uniq_list = [];

  //make a uniq list of ids
  for (var e in data) {
    if (colName == dataStructure.name) { //not in a sub-field
      var value = data[e][colName];
        if (uniq_list.indexOf(value) == -1)
          uniq_list.push(value);
    }
    else { //replace have to be done in a sub-field
      for (var se in data[e][colName]) {
        var value = data[e][colName][se][dataStructure.name];
        if (uniq_list.indexOf(value) == -1)
          uniq_list.push(value);
      }
    }
  }
  
  //get the text that belongs to those ids
  var req = '/api'+dataStructure.foreign+'/'+uniq_list.join();
  var subFieldsName = dataStructure.name;
  
  
  $http.get(req).success(function(foreign_data) {
    //fetch assoc using id as key for object
    var foreign_assoc = {};
    
     //check if result is array of objects
    if (angular.isArray(foreign_data.data)) {
      for (var f in foreign_data.data)
        foreign_assoc[foreign_data.data[f].id.toString()] = foreign_data.data[f];
    }
    else { //case if we get just one result
      foreign_assoc[foreign_data.data.id] = foreign_data.data;
    }
    
     //go through data and make replacement
    for (var e in data) {
      if (colName == dataStructure.name) { //not in a sub-field
        var old_value = data[e][colName];
        if (old_value)
          data[e][colName] = foreign_assoc[old_value.toString()];
      }
      else { //replace have to be done in a sub-field
        for (var se in data[e][colName]) {
          var old_value = data[e][colName][se][subFieldsName];
          if (old_value)
            data[e][colName][se][subFieldsName] = foreign_assoc[old_value.toString()];
        }
      }
    }

  });
};

/*
 * for cols with "." in name like "ArticlesPoints.priority"
 * copy data.x.y to data.y when name is x.y so that y can be accessed directly
 * also changes name in dataStructure from x.y to y
 */
var sub_field_replace = function(colName, dataStructure, data) {
  if (colName == dataStructure.name) { //not in a sub-field
    var values = colName.split('.');
    for (var e in data) {
        if (data[e][values[0]])
          data[e][values[1]] = data[e][values[0]][values[1]];
    }
    dataStructure[colName] = values[1];
  }
  else { //replace have to be done in a sub-field
    var values = dataStructure.subFields[colName].name.split('.');
    for (var e in data) {
      var field = data[e][dataStructure.name];
      for (var se in field) {
        field[se][values[1]] = field[se][values[0]] ? field[se][values[0]][values[1]] : null;
      }
    }
    dataStructure.subFields[colName].name = values[1];
  }
};

/*
 * To be called after you got data back from API
 * This function does following things:
 * - Populates mv_lengths for multi-valued fields
 * - Calls sub_field_replace() for cols with "." in name like "ArticlesPoints.priority"
 * - Calls foreign_field_replace() with the rights arguments
 */
var process_crud_matrix_data = function(res, $scope, $http, callback) {
  
  if (res.error || !res.data) {
    if (res.error)
      $scope.error = res.error;
    callback();
    return;
  }
  
  //if one only line returned by api, data is not a numeric array but directly the one object
  if (res.data.id)
    res.data = [res.data];
  
  //set dataLength for counting number of values on multi-valued fields
  for (var i in res.data) {
    res.data[i].mv_lengths = {};
    for (var j in $scope.mv_cols) {
      res.data[i].mv_lengths[$scope.mv_cols[j].pos] = res.data[i][$scope.mv_cols[j].name].length;
    }
  }
  
  //copy subField in field and
  //find columns where foreign link is defined
  for (var i in $scope.matrix.dataStructure) {
    var col = $scope.matrix.dataStructure[i];
    if (col.multi_valued) {
      //go through subfields
      for (var sf in col.subFields) {
        if (col.subFields[sf].move_embed) {
          //create object in data
          //res.data[col.name]
          
          //move the fields
          for (var e in res.data) {
            for (var se in res.data[e][col.name]) {
              res.data[e][col.name][se][col.subFields[sf].name] = {};
              var moveFields = col.subFields[sf].move_embed.split(',');
              for (var ssf in moveFields) {
                if (res.data[e][col.name][se][moveFields[ssf]]) {
                  res.data[e][col.name][se][col.subFields[sf].name][moveFields[ssf]] = res.data[e][col.name][se][moveFields[ssf]];
                  delete res.data[e][col.name][se][moveFields[ssf]];
                }
              }
            }
          }
        }
        if (col.subFields[sf].name.indexOf('.') != -1)
          sub_field_replace(sf, col, res.data);
        
        if (col.subFields[sf].foreign)
          foreign_field_replace($http, col.name, col.subFields[sf], res.data);
      }
    }
    else { //mono valued
      if (col.name.indexOf('.') != -1) {
        var values = col.name.split('.');
        for (var e in res.data) {
          if (res.data[e][values[0]])
            res.data[e][values[1]] = res.data[e][values[0]][values[1]];
        }
      }
      
      if (col.name.indexOf('.') != -1)
        sub_field_replace(col.name, col, res.data);
      
      if (col.foreign)
        foreign_field_replace($http, col.name, col, res.data);
    }
  }
  
  callback();
};

/*
 * Create all data used for pagination in scope an rootScope
 */
var create_pagination = function($rootScope, $scope, $http, $location, base_req, page_size) {
  $rootScope.page = {};
  $rootScope.page.size = 50;
  $rootScope.page.num = $location.search().page ? $location.search().page : 1;
  $rootScope.page.offset = ($rootScope.page.num-1)*$rootScope.page.size;
  
  $http.get(base_req+'&count').success(function(res) {
    var total_items = res.data;
    var nb_page = parseInt(total_items/$rootScope.page.size)+1;
    
    $rootScope.page.max = nb_page; //move to scope ?
    
    $scope.page_goto = function(num) {
      if (num > 0 && num <= $rootScope.page.max) {
        $location.search('page',num);
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
      for (var i=start; i <= end; ++i)
        r.push(i);
      return r;
    };
  });
};

var parse_options = function($filter, create_options) {
  if (create_options.indexOf('NOW()') != -1)
    create_options = create_options.replace("NOW()", $filter('date')((new Date()), 'yyyy-MM-dd HH:mm:ss'));
  
  return create_options;
};

var make_drop_down = function($scope, $http, $filter, dataStructure, data) {
  var foreign_model = dataStructure.foreign ? dataStructure.foreign : dataStructure.drop_down;
  var req = foreign_model+'?isRemoved=False&limit=200';
  if (dataStructure.create_options)
    req += ('&'+parse_options($filter,dataStructure.create_options));
  
  $http.get('/api'+req).success(function(res) {
    if (res.data.id)
      res.data = [res.data];
      
    $scope.foreigns[dataStructure.name] = res.data;
    
    if (!data || data == -1) //do not search for id -1
      return;
    
    //check if selected data is in $scope.foreigns
    var found = false;
    for (var f in $scope.foreigns[dataStructure.name])
      if ($scope.foreigns[dataStructure.name][f].id == data)
        found = true;
    
    if (!found) {
      $http.get('/api'+foreign_model+'?id='+data).success(function(res) {
        if (res.data)
          $scope.foreigns[dataStructure.name].push(res.data);
      });
    }
  });
};

/*
 * Create in scope all data used for bootstrap-ui date fields
 */
var create_date_options = function($scope) {
  $scope.opened = {};
  $scope.dateOptions = {startingDay: 1};
  $scope.open = function($event,field) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.opened[field] = true;
  };
};
