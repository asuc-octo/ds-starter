angular.module('ReportsCtrl', ['AuthSvc', 'I18n', 'Flash', 'Report', 'User', 'AttachmentLibrarySvc'])
  .controller('ReportsCtrl', [
    '$scope', '$state', 'AuthSvc', 'I18n', 'Flash', 'Report', 'User', 'AttachmentLibrarySvc',
    'initialData',
    function ($scope, $state, AuthSvc, I18n, Flash, Report, User, AttachmentLibrarySvc,
              initialData) {

      /**
       * The 'index' action.
       */
      $scope.actionIndex = function () {
        var reportsQuery = null;
        var userQuery = null;

         var fetchData = function () {
            json_query = User.query();
            console.log(json_query);
            json_query.$promise.then(function (response) {
                $scope.users = response.users;
                $scope.users = _.sortBy($scope.users, "id");
                $scope.roles = response.roles;
                $scope.roles = _.sortBy($scope.roles, "name");
            });
            console.log($scope.users);
            console.log($scope.dates);
          };

          fetchData();

        // Debounce the reports retrieval.
        // This code is merely illustrative. In the case of this particular
        // action, no debouncing is required.
        var fetchReports = _.debounce(function () {
          $scope.pleaseWaitSvc.request();

          reportsQuery = Report.query();


          reportsQuery.$promise.then(function (response) {
            $scope.reports = response;
            console.log($scope.reports);
            $scope.reports = _.groupBy(_.sortBy($scope.reports, "role"), "role");

            for (var key in $scope.reports) {
              $scope.reports[key] = _.groupBy(_.sortBy($scope.reports[key], "name"), "name");
              for (var k in $scope.reports[key]) {
                $scope.reports[key][k] = _.sortBy($scope.reports[key][k], "due_date");
              }
            }
            
            $scope.dateReports = response;
            $scope.dateReports = _.groupBy(_.sortBy($scope.dateReports, "role"), "role");

            for (var key in $scope.dateReports) {
              $scope.dateReports[key] = _.groupBy($scope.dateReports[key], "due_date");
              for (var k in $scope.dateReports[key]) {
                $scope.dateReports[key][k] = _.sortBy($scope.dateReports[key][k], "name");
              }
            }

          }, function (failureResponse) {
            // Do something on failure
          }).finally(function () {
            $scope.pleaseWaitSvc.release();
          });
        }, 400);

        // Cancel old request if pending.
        // This code is merely illustrative. In the case of this particular
        // action, no cancelling is required.
        if (reportsQuery) {
          reportsQuery.$cancelRequest();
          reportsQuery = null;
        }

        fetchReports();

        $scope.close = function(id) {
            window.location.href = '/reports/' + id + '/edit';
        };

      };

      /**
       * The 'show' action.
       */
      $scope.actionShow = function () {
        $scope.report = initialData;
      };

      /**
       * The 'new' action.
       * Builds an empty report for the form.
       */
      $scope.actionNew = function () {
        $scope.report = initialData;
        datesQuery = Report.new();
        datesQuery.$promise.then(function (response) {
          $scope.due_date_options = response;
          console.log($scope.due_date_options);
        });

        dateOptions = {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        };

        $scope.formatDate = function(date) {
            return (new Date(date)).toLocaleDateString("en-us", dateOptions);
        }
      };

      /**
       * The 'create' action.
       * If there are validation errors on the server side, then populates the
       * `reportErrors` scope variable with these errors.
       */
      $scope.actionCreate = function () {
        $scope.pleaseWaitSvc.request();
        console.log($scope.report);
        $scope.report.$save(function (response) {
          $scope.pleaseWaitSvc.release();
          Flash.push('success', 'Report created.', 'report_created');

          $scope.navConfirmationSvc.setConfirmNav(false);
          $state.go('app.reports.index');
        }, function (failureResponse) {
          $scope.pleaseWaitSvc.release();
          $scope.reportErrors = failureResponse.data.errors;
        });
      };

      /**
       * The 'edit' action.
       */
      $scope.actionEdit = function () {
        AttachmentLibrarySvc.setVisible(true);

        $scope.report = initialData;

        dateOptions = {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        };

        $scope.formatDate = function(date) {
            return (new Date(date)).toLocaleDateString("en-us", dateOptions);
        }
      };

      /**
       * The 'update' action.
       * If there are validation errors on the server side, then populates the
       * `reportErrors` scope variable with these errors.
       */
      $scope.actionUpdate = function () {

        $scope.pleaseWaitSvc.request();

        $scope.report.$update(function (response) {
          $scope.pleaseWaitSvc.release();
          Flash.push('success', 'Report updated.', 'report_updated');

          $scope.navConfirmationSvc.setConfirmNav(false);
          $state.go('app.reports.index');
        }, function (failureResponse) {
          $scope.pleaseWaitSvc.release();
          $scope.reportErrors = failureResponse.data.errors;
        });
      };

      /**
       * The 'destroy' action.
       */
      $scope.actionDestroy = function () {
        I18n.confirm('Really delete report?',
          'really_delete_report').then(function () {

          $scope.pleaseWaitSvc.request();

          $scope.report.$delete(function (response) {
            $scope.pleaseWaitSvc.release();
            Flash.push('success', 'Report deleted.', 'report_deleted');

            $scope.navConfirmationSvc.setConfirmNav(false);
            $state.go('app.reports.index');
          }, function (failureResponse) {
            $scope.pleaseWaitSvc.release();
            if (failureResponse.data.error) {
              // We assume messages from the server are localized, so we don't
              // need to provide a translation id.
              Flash.push('danger', failureResponse.data.error);
            } else {
              Flash.push('danger', 'Error deleting report.',
                'error_deleting_report');
            }
          });
        });
      };
    }]);
