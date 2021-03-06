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

var Publish = (function() {
  var fb_logged_in;
  var player = {savedRequests: {}, active_req: 0};
  
  function clearOpponent() {
    player.active_req = 0;
  }
  
  function hasOpponent() {
    return player.active_req;
  }
  
  function isLoggedIn() {
    return fb_logged_in;
  }
  
  function fbInit() {
    if (!fb_app_id) {
      return;
    } else {
      if (document.getElementById('fb-root')) {
        FB.init({
            appId  : fb_app_id,
              status : true, // check login status
              cookie : true, // enable cookies to allow the server to access the session
              xfbml  : false  // parse XFBML
              });
        FB.getLoginStatus(function(response) {
          fb_logged_in = response.session;
          if (response.session) {
            console.log('logged in');
            getInfo();
          } else {
            console.log('not logged in');
          }
        });
      }
    }
  }

  function fbLogin() {
    if (fb_logged_in) {
      return getInfo();
    } else {
      FB.login(function(response) {
        fb_logged_in = response.session;
        if (fb_logged_in) {
          getInfo();
        }
      }, {perms:''} ); // read_stream,publish_stream
    }
  }

  function onReqClick(req) {
    UI.del('req'+req.id);
    if (player.savedRequests[req.id]) {
      return;
    }
    player.active_req = req;
    var data = req.data && FB.JSON.parse(req.data);
    req.concede = data.concede;
    Gob.delAll();
    Board.init();
    Chess.newGameState('playing');
    Board.loadState(data.board);
    Chess.startPlayback();
    console.log('playing against: ' + req.from.id);
   }

  function getInfo() {
    FB.api('me', {
      fields: 'name, picture'
    }, function (result) {
      player.name = result.name;
      player.picture = result.picture;
    });
    getRequests();
  }
  
  function addUserTag(name,user_id,x,y) {
    markup = FB.String.format(
      '<img src="http://graph.facebook.com/{0}/picture" />{1}</p>',
      user_id,
      FB.String.escapeHTML(name));
    UI.addButton('buttons', 'name_'+name,
      {pos: [x,y], width: 400, height: 60, fontsize: '200%', text: markup } );
  }

  function addName(name,uid,pos,size) {
    markup = '<img src="http://graph.facebook.com/'+uid+'/picture" /> '+FB.String.escapeHTML(name);
    UI.addButton('buttons', 'name_'+uid, { pos: pos, width: size[0], height: size[1], fontsize: '200%',text: markup });
  }

  function addMyName(pos,size) {
    addName(player.name,fb_logged_in.uid,pos,size);
  }
  
  function addReqName(req,pos,size) {
    addName(req.from.name,req.from.id,pos,size);
  }
  
  function addRequestButton(req,x,y) {
    markup = FB.String.format(
      '<img src="http://graph.facebook.com/{0}/picture" />{1}: {2}</p>',
      req.from.id,
      FB.String.escapeHTML(req.from.name),
      FB.String.escapeHTML(req.message));
    UI.addButton('buttons', 'req'+req.id,
    {pos: [x,y], width: 400, height: 60, fontsize: '200%',
    text: markup, command: {cmd: 'onReqClick', args: [req] }, req: req});
  }
  
  function getRequests() {
    FB.api('me/apprequests', function(result) {
      var reqs = result.data;
      if (!reqs) {
        return;
      }
      ClientCmd.install('onReqClick',onReqClick);
      player.savedRequests = player.savedRequests || {};
      for(var i=0;i<reqs.length;i++) {
        var req = reqs[i];
        if (player.savedRequests[req.id]) {
          continue;
        }
        addRequestButton(req,60, 70 + 65*i);
      }
    });
  }

  function removeRequest(req) {
    if (req) {
      player.savedRequests[req.id] = true;
      FB.api(req.id, 'delete', function(response) {
      });
      Chess.newGameState('menu');
    }
  }

  function sendRequest(msg,payload) {
    var req = player.active_req;
    player.active_req = 0;
    var cmd = {
      method: 'apprequests',
      message: msg,
      data: payload
    };

    if (req) {
      cmd.to = req.from.id;
      console.log('send to: ['+cmd.to+']');
    }
    FB.ui(cmd, function(response) {
      if (response && !response.error) {
        removeRequest(req);
      }
    });
  }

  function publishStory() {
    var loc = window.location;
    var url = loc.protocol + '//' + loc.host + '/chess/show/' +
      encodeURIComponent(FB.JSON.stringify({
        player: {
          id: 0,
          name: 'name',
        }
      }));
    FB.ui({
      method: 'stream.publish',
      attachment: {
        name: 'Watch Replay',
        caption: 'Checkmate!',
        description: (
          'Check out my awesome game of pirate chess i played with a friend'
        ),
        href: url
      }
    });
  }

  return {
    publishStory: publishStory,
    sendRequest: sendRequest,
    fbInit: fbInit,
    fbLogin: fbLogin,
    isLoggedIn: isLoggedIn,
    clearOpponent: clearOpponent,
    getRequests: getRequests,
    hasOpponent: hasOpponent,
    addRequestButton: addRequestButton,
    removeRequest: removeRequest,
    addUserTag : addUserTag,
    addReqName : addReqName,
    addMyName : addMyName
  };
})();
