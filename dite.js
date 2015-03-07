#!/usr/bin/env node

require('console.table');
var program = require('commander');
var path = require('path');

var fs = require('fs');
var inquirer = require("inquirer");
var sh = require("shelljs");
var _ = require("lodash");
var nodegit = require("nodegit");
var colors = require('colors');
var tungus = require('tungus');
var mongoose = require('mongoose');
var Q = require('q');
var app = require('./server');
var CWD = sh.pwd();
var model = require('./model/model');
var Repository = model.Repository;

mongoose.connect('tingodb://' + __dirname + '/database');
var PKG;
try {
    PKG = require(path.join(CWD, 'package.json'));
} catch (e) {
    PKG = {
        name: "project"
    };
}

program.version('1.0.0');

program.command('list')
    .description('list of watching repository')
    .action(function() {

        Repository.find(function(err, repos) {
            var table = [];
            for (var i = 0; i < repos.length; i++) {
                var status = repos[i].status;
                status = (status == "Initiated") ? status.cyan : (status == "Live") ? status.green : status.red;
                table.push({
                    "ID": repos[i]._id,
                    "Project Name": repos[i].pname,
                    "Branch": repos[i].branch,
                    "Remote Url": repos[i].url,
                    "Local path": repos[i].path,
                    "Status": status
                });
            }
            console.table(table);
        });

    });

program.command('remove [ID...]')
    .description('remove repository from dite server')
    .action(function(IDs) {

        var ids = _.map(IDs, function(id) {
            return parseInt(id);
        });

        for (var i = 0; i < ids.length; i++) {
            Repository.remove({
                _id: ids[i]
            }, function(id) {
                return function(err, item) {
                    if (err) {
                        console.log("Repository [" + id + "] cannot be removed");
                    } else {
                        console.log("Repository [" + id + "] has been removed");
                    }
                }
            }(ids[i]));
        }
    });

program.command('start')
    .description('start dite server')
    .option('-p, --port', 'port number of dite server')
    .action(function(data, options) {
        app.set('port', process.env.PORT || 3000);
        var server = app.listen(app.get('port'), function() {
            console.log('Express server listening on port ' + server.address().port);
        });
    });

program.command('stop')
    .description('stop dite server')
    .action(function() {

    });

program.command('restart')
    .description('stop dite server')
    .action(function() {

    });

program.command('watch')
    .description('put current repository to dite')
    .action(function() {
        function makeRepositoryList(repo) {
            return repo.getRemotes().then(function(repos) {
                var promises = [];
                for (var i = 0; i < repos.length; i++) {
                    promises.push(getRepositoryMapper(repo, repos[i]));
                }
                return Q.all(promises);
            });
        }

        function getRepositoryMapper(repo, name) {
            var deferred = Q.defer();
            repo.getRemote(name).then(function(r) {
                deferred.resolve({
                    name: name,
                    url: r.url()
                });
            });
            return deferred.promise;
        }

        nodegit.Repository.open(path.resolve(__dirname, "../.git"))
            .then(function(repo) {
                return makeRepositoryList(repo);
            }).done(function(remoteRepos) {

                var questions = [{
                    type: "input",
                    name: "pname",
                    message: "Project Name :",
                    default: PKG.name
                }, {
                    type: "list",
                    name: "remote",
                    message: "Repository Remote?",
                    choices: _.map(remoteRepos, function(item) {
                        return item.name;
                    })
                }, {
                    type: "list",
                    name: "gitservice",
                    message: "Git Remote Repository Service?",
                    choices: ["bitbucket", "github", "other"],
                    when: function(answers) {
                        return answers.comments !== "Nope, all good!";
                    }
                }, {
                    type: "input",
                    name: "branch",
                    message: "Branch :",
                    default: "master"
                }];

                inquirer.prompt(questions, function(answers) {
                    Repository.create({
                        pname: answers.pname,
                        branch: answers.branch,
                        url: _.result(_.find(remoteRepos, {
                            name: answers.remote
                        }), 'url'),
                        path: CWD,
                        status: 'Initiated',
                        released: new Date()
                    }, function(err) {
                        if (err) {
                            console.log('There is something wrong');
                            return;
                        } else {
                            console.log('\nThe repository has been added to dite server\n');
                        }
                    });
                });
            });
    });

program.parse(process.argv);