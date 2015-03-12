'use strict';

/* Filters */

/*
 * Makes apple in Apple
 * Makes APPLE in Apple
 */
buckuttAdminApp.filter('capitalize', function() {
  return function(input) {
    if (input == null || !input)
      return input;
    
    input = input.toLowerCase();
    return input.substring(0,1).toUpperCase()+input.substring(1);
  }
});

/*
 * Takes 12507 and turns it into 12 507
 */
buckuttAdminApp.filter('numeric', ['numberFilter', function(numberFilter) {
  return function(input, digits) {
    if (input == null || !input)
      return input;
    
    if (digits == null || !digits)
      digits = 0;
    
    return numberFilter(input,digits).replace(',', ' ').replace('.', ',');
  }
}]);

/*
 * Takes 1250 and turns it into 12.50€
 * (using the currency sign in the currency argument)
 * currency filter already exists in angularjs but did not satisfy me :)
 */
buckuttAdminApp.filter('currency2', ['numericFilter', function(numericFilter) {
  return function(input, currency) {
    if (input == null || !input)
      return input;
    
    input = numericFilter(parseFloat(input)/100,2);
    return input+' '+currency;
  }
}]);

/*
 * takes an object and a fieldname string in entry
 * returns the value of this field in the object
 * "foreign:firstname" with the entry {'firstname':'John', 'lastname':'Doe'}
 * will send you back "John"
 * "foreign:firstname, lastname" with the entry {'firstname':'John', 'lastname':'Doe'}
 * will send you back "John Doe"
 * (multiple arguments make concat with a space)
 */
buckuttAdminApp.filter('foreign', function() {
  return function(input,fieldnames) {
    if (input == null || !input || !fieldnames)
      return input;

    if(typeof fieldnames == 'string' && typeof input == 'object'){
      var str = '', fields = fieldnames.split(',');
      
      for(var f in fields){
        str += input[fields[f].trim()]+' ';
      }
      return str.trim();
    }
    
    return input;
  }
});

/*
 * Translate using list in argument : a->b, x->y
 * "a" will be translated in "b" but "awesome" won't be translated in "bwesome"
 * the string has to be exactly equal
 * because of the structure of the argument list, a string cannot contain "," or "->"
 */
buckuttAdminApp.filter('translator', function() {
  return function(input,translateArray) {
    if (input == null || (!input && typeof input != 'boolean') || !translateArray)
      return input;
    
    if(typeof translateArray == 'string'){
      var paire = [], translates = translateArray.split(',');

      for(var key in translates){
        paire = translates[key].split('->');
        
        if(paire.length != 2)
          continue; // skip strange pairs
        
        if(input == paire[0].trim())
          return paire[1].trim();
      }
    }
    
    return input;
  }
});

/*
 * Does the presentation filtering for crud_matrix cells 
 * calls the right filter specified in the matrix page description
 * call to existing filter has to be added in dependency injection
 * each filter has to be named here in the switch(filter)
 * Must be defined after all other filters it uses
 */
buckuttAdminApp.filter('tableFilter', ['capitalizeFilter','currency2Filter', 'foreignFilter', 'translatorFilter', 'dateFilter',
  function(capitalizeFilter,currency2Filter,foreignFilter,translatorFilter,dateFilter) {
    return function(input, filterInfos) {
      if (input == null || (!input && typeof input != 'boolean') || !filterInfos)
        return input;
      
      var f = filterInfos.split('>>');
      var filter = f[0];
      var arg = f[1] ? f[1] : '';
      
      switch(filter){
        /* didn't make generic code because with dependency injection you have 
         * to edit this function any way when you want to add a filter
         */
        case 'currency':
          return currency2Filter(input,arg);
        case 'foreign':
          return foreignFilter(input,arg);
        case 'translator':
          return translatorFilter(input,arg);
        case 'date':
          return dateFilter(input,arg);
        default: //case: nofilter
          return input;
      }
    }
  }]);

/*
 * Transform array to string separated with '|' and use tableFilter on each 
 * Make ( {'100', '2014/2015', 'Non Cotisants BDE'} ) to ( 1.00 € | 2014/2015 | Non Cotisants BDE )
 * Call stake : mvLabel calls tableFilter who calls if necessary a third filter
 * Must be defined after tableFilter because it uses it
 */
buckuttAdminApp.filter('mvLabel', ['tableFilterFilter', function(tableFilterFilter) {
  return function(input,filters) {
    if (input == null || !input)
      return input;
    
    if(typeof input != 'string'){
      var str = '', f = '', i = 0;

      for(var key in input){
        if(key.substring(0,1) == '$')
          continue; // skip private attributes
        
        if(filters[i])
          f = filters[i++].filter;
        
        str += tableFilterFilter(input[key], f) + ' | ';
      }
      return str.substring(0,str.length-3);
    }
    else
      return tableFilterFilter(input, filters);
  }
}]);


/*
 * Don't define any filters here if you want them to be used in tableFilter
 */
