#! /usr/bin/env node

// Copyright 2004-present Facebook. All Rights Reserved.

// Licensed under the Apache License, Version 2.0 (the "License"); you may
// not use this file except in compliance with the License. You may obtain
// a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

fs = require('fs');
http = require('http');
path = require('path');
url = require('url');
Comm = require('../lib/comm');
Child = require('child_process');


var fb_app_info={id:0,secret:0};
if (process.argv.length < 3) {
  console.log('Usage: tohtml <user agent>');
} else {

  var user_agent = process.argv[2];
  var req = {headers: {} };
  req.headers['user-agent'] = user_agent;
  var options = {echo_only: true, fb_app_info: fb_app_info};
  
	Child.exec('find . -name "*.shtml" -print', function(err, stdout, stderr) {
	  if (!err && stdout) {
	    var list = stdout.split('\n');
	    for(var i in list) {
	      var shtml = list[i];
	      if (shtml.length) {
          var html = shtml.substr(0,shtml.lastIndexOf('.')) + '.html';
          var file = fs.readFileSync(shtml, 'binary');
          var txt = Comm.expandSHTML(req, file, shtml, options);
          txt = '<!--- this file was autogenerated from a .shtml file for target: '+user_agent+'. its for hacking on if you dont want to run nodejs ---->\n' + txt;
          fs.writeFileSync(html, txt, 'binary');
          console.log('convert ' + list[i] + ' to ' + html);
        }
      }
    }
  });
}

