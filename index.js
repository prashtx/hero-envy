#!/usr/bin/env node
/*jslint node: true */
'use strict';

var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

var optimist = require('optimist');
var request = require('request');
var async = require('async');

var argv = optimist
.demand(1)
.usage('Configure environment variables for a Heroku app from a file.\nUsage: $0 app-name.env\nConfigures app-name.herokuapp.com by default.')
.describe('app', 'Specify a different app.')
.describe('account', 'Specify the account to use.')
.argv;

function getEnv(filename) {
  if (!fs.existsSync(filename)) {
    console.log('Could not find environment file: ' + filename);
    process.exit(1);
  }
  var file = fs.readFileSync(filename, 'utf8');

  var env = {};

  var lines = file.split('\n');
  var re = /^[ ]*([a-zA-Z][a-zA-Z0-9_]*)=(".*"|'.*'|[^# ]*)/;
  lines.forEach(function (line) {
    var match = re.exec(line);
    if (match === null) {
      return;
    }
    var key = match[1];
    var value = match[2];

    // If there are quotation marks, make sure they match and remove them.
    var removeQuotes = false;
    if (value[0] === '"') {
      if (value[value.length - 1] !== '"') {
        return;
      }
      removeQuotes = true;
    } else if (value[0] === '\'') {
      if (value[value.length - 1] !== '\'') {
        return;
      }
      removeQuotes = true;
    }

    if (removeQuotes) {
      value = value.slice(1,-1);
    }

    env[key] = value;
  });

  return env;
}

function getToken(done) {
  var cmdPieces = ['heroku auth:token'];
  var cmd;
  if (argv.account) {
    cmdPieces.push('--account');
    cmdPieces.push(argv.account);
  }
  cmdPieces.push('| tail -1');
  cmd = cmdPieces.join(' ');

  exec(cmd, function (error, stdout, stderr) {
    if (error) {
      console.log('exec error: ', error);
      console.log(stderr);
      done(error);
      return;
    }
    done(null, stdout.trim());
  });
}

function getEmail(done) {
  var cmdPieces = ['heroku auth:whoami'];
  var cmd;
  if (argv.account) {
    cmdPieces.push('--account');
    cmdPieces.push(argv.account);
  }
  cmdPieces.push('| tail -1');
  cmd = cmdPieces.join(' ');

  exec(cmd, function (error, stdout, stderr) {
    if (error) {
      console.log('exec error: ', error);
      console.log(stderr);
      done(error);
      return;
    }
    done(null, stdout.trim());
  });
}

async.parallel([getEmail, getToken], function (error, results) {
  if (error) {
    console.log(error);
    return;
  }

  var email = results[0];
  var token = results[1];

  var filename = argv._[0];
  var env = getEnv(filename);

  var appName = argv.app;
  if (appName === undefined) {
    appName = filename.split('.')[0];
  }

  request({
    url: 'https://api.heroku.com/apps/' + appName + '/config-vars',
    method: 'PATCH',
    headers: {
      Accept: 'application/vnd.heroku+json; version=3',
      'User-Agent': 'request'
    },
    auth: {
      user: email,
      pass: token
    },
    json: env
  }, function (error, response, body) {
    if (error) {
      console.log(error);
      return;
    }
    if (response.statusCode !== 200) {
      console.log('Got an error from the Heroku API. Status code ' + response.statusCode);
    }
    console.log(body);
  });
});
