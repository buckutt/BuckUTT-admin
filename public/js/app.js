'use strict';

/* App Module */

var buckuttAdminApp = angular.module('buckuttAdminApp', [
  'ngRoute',
  'buckuttControllers'
]);

buckuttAdminApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider
      .when('/general/treasury', {
        templateUrl: 'partials/treasury.html',
        controller: 'TreasuryCtrl'
      })
      .when('/general/:pageName/create', {
        templateUrl: 'partials/crud_matrix_create_update.html',
        controller: 'CrudMatrixCreateUpdateCtrl'
      })
      .when('/general/:pageName/update/:entry', {
        templateUrl: 'partials/crud_matrix_create_update.html',
        controller: 'CrudMatrixCreateUpdateCtrl'
      })
      .when('/general/:pageName', {
        templateUrl: 'partials/crud_matrix_read.html',
        controller: 'CrudMatrixReadCtrl'
      })
      .when('/fundation/:funId/treasury', {
        templateUrl: 'partials/treasury.html',
        controller: 'TreasuryCtrl'
      })
      .when('/fundation/:funId/:pageName/create', {
        templateUrl: 'partials/crud_matrix_create_update.html',
        controller: 'CrudMatrixCreateUpdateCtrl'
      })
      .when('/fundation/:funId/:pageName/update/:entry', {
        templateUrl: 'partials/crud_matrix_create_update.html',
        controller: 'CrudMatrixCreateUpdateCtrl'
      })
      .when('/fundation/:funId/:pageName', {
        templateUrl: 'partials/crud_matrix_read.html',
        controller: 'CrudMatrixReadCtrl'
      })
      .when('/login', {
        templateUrl: 'partials/login.html',
        controller: 'LoginCtrl'
      })
      .when('/home', {
        templateUrl: 'partials/home.html'
      })
      .otherwise({
        redirectTo: '/home'
      });
  }]);
