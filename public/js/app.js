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
      .when('/general/:page/create', {
        templateUrl: 'partials/crud_matrix_create_update.html',
        controller: 'CrudMatrixCreateUpdateCtrl'
      })
      .when('/general/:page/update/:entry', {
        templateUrl: 'partials/crud_matrix_create_update.html',
        controller: 'CrudMatrixCreateUpdateCtrl'
      })
      .when('/general/:page', {
        templateUrl: 'partials/crud_matrix_read.html',
        controller: 'CrudMatrixReadCtrl'
      })
      .when('/fundation/:funId/treasury', {
        templateUrl: 'partials/treasury.html',
        controller: 'TreasuryCtrl'
      })
      .when('/fundation/:funId/:page/create', {
        templateUrl: 'partials/crud_matrix_create_update.html',
        controller: 'CrudMatrixCreateUpdateCtrl'
      })
      .when('/fundation/:funId/:page/update/:entry', {
        templateUrl: 'partials/crud_matrix_create_update.html',
        controller: 'CrudMatrixCreateUpdateCtrl'
      })
      .when('/fundation/:funId/:page', {
        templateUrl: 'partials/crud_matrix_read.html',
        controller: 'CrudMatrixReadCtrl'
      })
      .when('/login', {
        templateUrl: 'partials/login.html',
        controller: 'LoginCtrl'
      })
      .otherwise({
        redirectTo: '/fundation/3/articles'
      });
  }]);
