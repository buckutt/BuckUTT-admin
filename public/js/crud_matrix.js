
/* Crud Matrix functions used by controllers */


/*
 * Create a crud_matrix table structure with no data (the "matrix" variable in HTML view)
 */
var create_crud_matrix = function($rootScope, $scope, $http, callback) {
  $http.get('crud_matrix/'+$rootScope.pageName+'.json').success(function(data) {
    //set dataLength for counting sub fields on multi-valued fields
    //also create a sub-dataStructure in mv_cols with the sub-fields instead of parent field (eg : for article, price/period/group instead of prices)
    var mv_cols = [], mv_count = 0;//mv = multi-valued
    for(var i in data.dataStructure){
      var col = data.dataStructure[i];
      if(col.multi_valued){
        col['dataLength'] = angular.isArray(col.subFields) ? col.subFields.length : 0;
        mv_cols.push({"pos" : i, "name" : col.name});
        ++mv_count;
        
        //creating the sub structure
        col.subStructure = [];
        
        for(var j in data.dataStructure){
          if(data.dataStructure[j].name == col.name && angular.isArray(col.subFields)){ //here are the sub-fields
            for(var k in data.dataStructure[j].subFields){
              col.subStructure.push(data.dataStructure[j].subFields[k]);
            }
          }
          else{
            col.subStructure.push(data.dataStructure[j]);
          }
        }
      }//end if col.multi_valued
    }
    
    $scope.matrix = data;
    $scope.mv_count = mv_count;
    $scope.mv_cols = mv_cols;
    $scope.mv_selected = mv_count == 0 ? 0 : mv_cols[0].pos;
    
    callback();
  });
};

var foreign_field_replace = function($http, colName, subField, data) {
  var uniq_list = [];

  //make a uniq list of ids
  for(var e in data){
    if(colName == subField.name) {//not in a sub-field
      var value = data[e][colName];
        if(uniq_list.indexOf(value) == -1)
          uniq_list.push(value);
    }
    else {//replace have to be done in a sub-field
      for(var se in data[e][colName]){
        var value = data[e][colName][se][subField.name];
        if(uniq_list.indexOf(value) == -1)
          uniq_list.push(value);
      }
    }
  }
  
  //get the text that belongs to those ids
  var req = '/api'+subField.foreign+'/'+uniq_list.join();
  var subFieldsName = subField.name;
  
  
  $http.get(req).success(function(foreign_data) {
    //fetch assoc using id as key for object
    var foreign_assoc = {};
    
    // check if result is array of objects
    if(angular.isArray(foreign_data.data)) {
      for(var f in foreign_data.data)
        foreign_assoc[foreign_data.data[f].id.toString()] = foreign_data.data[f];
    }
    else {// case if we get just one result
      foreign_assoc[foreign_data.data.id] = foreign_data.data;
    }
    
    // go through data and make replacement
    for(var e in data){
      if(colName == subField.name) {//not in a sub-field
        var old_value = data[e][colName];
        data[e][colName] = foreign_assoc[old_value.toString()];
      }
      else {//replace have to be done in a sub-field
        for(var se in data[e][colName]){
          var old_value = data[e][colName][se][subFieldsName];
          data[e][colName][se][subFieldsName] = foreign_assoc[old_value.toString()];
        }
      }
    }

  });
};