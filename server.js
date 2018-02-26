#!/bin/env node
 //  OpenShift sample Node application
var express = require('express');
var fs = require('fs');
var mongoose = require('mongoose');
var database = require('./config/database'); // load the database config
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var Todo = require('./app/models/todo');

/**
 *  Define the sample application.
 */
var SampleApp = function() {

  //  Scope.
  var self = this;
  var router;

  function getTodos(res) {
    Todo.find(function(err, todos) {

      // if there is an error retrieving, send the error. nothing after res.send(err) will execute
      if (err)
        res.send(err)

      res.json(todos); // return all todos in JSON format
    });
  };


  /*  ================================================================  */
  /*  Helper functions.                                                 */
  /*  ================================================================  */

  /**
   *  Set up server IP address and port # using env variables/defaults.
   */
  self.setupVariables = function() {
    //  Set the environment variables we need.
    self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
    self.port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

    console.log(process.env);

    if (typeof self.ipaddress === "undefined") {
      //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
      //  allows us to run/test the app locally.
      console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
      self.ipaddress = "0.0.0.0";
    };

    if (typeof self.port === "undefined") {
      console.warn('No OPENSHIFT_NODEJS_PORT var, using 8080');
    };
  };


  /**
   *  Populate the cache.
   */
  self.populateCache = function() {
    if (typeof self.zcache === "undefined") {
      self.zcache = {
        'index.html': ''
      };
    }

    //  Local cache for static content.
    self.zcache['index.html'] = fs.readFileSync('public/index.html');
  };


  /**
   *  Retrieve entry (content) from cache.
   *  @param {string} key  Key identifying content to retrieve from cache.
   */
  self.cache_get = function(key) {
    return self.zcache[key];
  };


  /**
   *  terminator === the termination handler
   *  Terminate server on receipt of the specified signal.
   *  @param {string} sig  Signal to terminate on.
   */
  self.terminator = function(sig) {
    if (typeof sig === "string") {
      console.log('%s: Received %s - terminating sample app ...',
        Date(Date.now()), sig);
      process.exit(1);
    }
    console.log('%s: Node server stopped.', Date(Date.now()));
  };


  /**
   *  Setup termination handlers (for exit and a list of signals).
   */
  self.setupTerminationHandlers = function() {
    //  Process on exit and signals.
    process.on('exit', function() {
      self.terminator();
    });

    // Removed 'SIGPIPE' from the list - bugz 852598.
    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
      'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
    ].forEach(function(element, index, array) {
      process.on(element, function() {
        self.terminator(element);
      });
    });
  };


  /*  ================================================================  */
  /*  App server functions (main app logic here).                       */
  /*  ================================================================  */

  /**
   *  Create the routing table entries + handlers for the application.
   */
  self.createRoutes = function() {
    self.routes = {};
    //require('./app/routes.js')(self.router);

    // get all todos
    self.app.get('/api/todos', function(req, res) {

      // use mongoose to get all todos in the database
      getTodos(res);
    });

    // create todo and send back all todos after creation
    self.app.post('/api/todos', function(req, res) {

      // create a todo, information comes from AJAX request from Angular
      Todo.create({
        text: req.body.text,
        done: false
      }, function(err, todo) {
        if (err)
          res.send(err);

        // get and return all the todos after you create another
        getTodos(res);
      });

    });

    // delete a todo
    self.app.delete('/api/todos/:todo_id', function(req, res) {
      Todo.remove({
        _id: req.params.todo_id
      }, function(err, todo) {
        if (err)
          res.send(err);

        getTodos(res);
      });
    });

    // application -------------------------------------------------------------
    self.app.get('*', function(req, res) {
      res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });

  };

  self.configure = function() {
    // configuration ===============================================================
    console.log(database.url);
    mongoose.connect(database.url); // connect to mongoDB database on modulus.io
    self.app = express();
    self.app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users
    self.app.use(morgan('dev')); // log every request to the console
    self.app.use(bodyParser.urlencoded({
      'extended': 'true'
    })); // parse application/x-www-form-urlencoded
    self.app.use(bodyParser.json()); // parse application/json
    self.app.use(bodyParser.json({
      type: 'application/vnd.api+json'
    })); // parse application/vnd.api+json as json
    self.app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request

  };


  /**
   *  Initialize the server (express) and create the routes and register
   *  the handlers.
   */
  self.initializeServer = function() {
    self.configure();
    self.createRoutes();
    //self.app = express.createServer();

    //  Add handlers for the app (from the routes).
    for (var r in self.routes) {
      self.app.get(r, self.routes[r]);
    }
  };


  /**
   *  Initializes the sample application.
   */
  self.initialize = function() {
    self.setupVariables();
    self.populateCache();
    self.setupTerminationHandlers();

    // Create the express server and routes.
    self.initializeServer();
  };


  /**
   *  Start the server (starts up the sample application).
   */
  self.start = function() {
    //  Start the app on the specific interface (and port).
    self.app.listen(self.port, self.ipaddress, function() {
      console.log('%s: Node server started on %s:%d ...',
        Date(Date.now()), self.ipaddress, self.port);
    });
  };

}; /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();
