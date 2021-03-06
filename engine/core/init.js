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

var Init = (function() {
    var initFunc = null;
    var setupFunc = null;
    var appFunc = null;
    var uiFunc = null;
    var drawFunc = null;
    var teardownFunc = null;
    var quitFunc = null;
    var resizeFunc = null;
    var maxFPS = 1000;
    var spritesLoaded = false;

    function setFunctions(args) {
      initFunc = args.init || function() {};
      setupFunc = args.setup || function() {};
      appFunc = args.app || function() {};
      uiFunc = args.ui || function() {};
      drawFunc = args.draw || function() {};
      teardownFunc = args.teardown || function() {};
      resizeFunc = args.resize || function() {};
      quitFunc = args.quit || function() {};
      postLoad = args.postLoad || function() {};
      maxFPS = args.fps || undefined;
    }

     function quit() {
      quitFunc();
    }

    function delatedStart() {
    }

    function timer_kick_off() {
      JSGlobal.TIMERS_LAUNCHED = true;
      Render.setupBrowserSpecific();
      setInterval('Init.tick();', parseInt(1000/maxFPS));
      initFunc();
      winresize();
      reset();
    }

    function tick() {
      if (Sprites.fullyLoaded()) {
        if (!spritesLoaded) {
          postLoad();
          spritesLoaded = true;
        }
        Tick.tick();
        appFunc();
        drawFunc();
      }
      uiFunc();
    }

    function reset() {
      teardownFunc();

      var gbel = document.getElementById('gamebody');
      gbel.innerHTML = '';

      var path = window.location.pathname;

      setupFunc();

      GameFrame.setXbyY();
    }

    function hideBar() {
      window.scrollTo(0,1);
      Clientutils.getWindowSize();
      GameFrame.setXbyY();
      resizeFunc();
      var hidediv = document.getElementById('hidebardiv');
      document.body.removeChild(hidediv);
    }

    function winresize() {
      var last_width = JSGlobal.winsize[0];
      var last_height = JSGlobal.winsize[1];

      Clientutils.getWindowSize();

      var width = JSGlobal.winsize[0];
      var height = JSGlobal.winsize[1];

      if (last_height == height && last_width == width) {
        return;
      }

      JSGlobal.winpos[0] = 0;
      JSGlobal.winpos[1] = 0;
      if (JSGlobal.mobile) {
        var hidediv = document.createElement('div');
        hidediv.id = 'hidebardiv';
        hidediv.style.cssText = 'position:absolute;z-index:10000;left:0px;top:-1000px;width:5000px;height:5000px;background:#000';
        document.body.appendChild(hidediv);
        setTimeout("Init.hideBar();", 10);
      } else {
        GameFrame.setXbyY();
        resizeFunc();
      }
    }

    function init() {
      // in case we left in some debugging by accident
      // we might want to add the ability to hook this and send it to a server for mobile
      if (typeof(console) == 'undefined') {
        console = {};
      }
      console.log = console.log || function() {};

      if (!drawFunc) {
        alert("No draw function set. You need to call Init.setFunctions from your code prior to the page's onload event firing.");
        return;
      }
      Render.setupBrowserSpecific();

      var meta_viewport = document.querySelector("meta[name=viewport]");
      if (meta_viewport && window.devicePixelRatio >= 2 ) {
        JSGlobal.lowres = false;
        meta_viewport.setAttribute('content', 'user-scalable=no, width=device-width, height=device-height, initial-scale=0.5, maximum-scale=0.5');
      } else if (JSGlobal.mobile) {
        JSGlobal.lowres = true;
      }


      if (JSGlobal.mobile) {
        var hidediv = document.createElement('div');
        hidediv.id = 'hidebardiv';
        hidediv.style.cssText = 'position:absolute;z-index:10000;left:0px;top:-1000px;width:5000px;height:5000px;background:#000';
        document.body.appendChild(hidediv);
        setTimeout("Init.hideBar();", 10);
      }
      timer_kick_off();
    }

    var Init = {};
    Init.init = init;
    Init.winresize = winresize;
    Init.quit = quit;
    Init.tick = tick;
    Init.reset = reset;
    Init.hideBar = hideBar;
    Init.setFunctions = setFunctions;
    return Init;
  })();
