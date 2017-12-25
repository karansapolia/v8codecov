"use strict";

function cssCov(input) {

	var url=input.toString();
	var name=url.split('//')[1].split(".")[0];

	var _fs = require("fs");

	var fs = _interopRequireWildcard(_fs);

	var _chromeDebuggingClient = require("chrome-debugging-client");

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	(0, _chromeDebuggingClient.createSession)(async function (session) {
	  let browser = await session.spawnBrowser('exact', {
	    executablePath: '/usr/bin/chromium' || '/usr/bin/google-chrome-stable' || '/usr/bin/google-chrome-unstable'
	  });
	  var api = await session.createAPIClient("localhost", browser.remoteDebuggingPort);
	  var tabs = await api.listTabs();
	  var tab = tabs[0];
	  var client = await session.openDebuggingProtocol(tab.webSocketDebuggerUrl);
	  
	  await client.send("DOM.enable");
	  await client.send("CSS.enable");
	  await client.send("Page.enable");
	  await client.send("CSS.startRuleUsageTracking");
	  await client.send("Page.navigate", {
	    url: url
	  });
	  
	  await new Promise(function (resolve) {
	    return client.on("Page.loadEventFired", resolve);
	  });

	  await new Promise(function (resolve) {
	    return setTimeout(resolve, 1000);
	  });
	  var coverage = await client.send("CSS.takeCoverageDelta");

	  //var obj = coverage.coverage;
	  //console.log(obj);

	  console.log(coverage);
	  var css=[];

	  //console.log("Coverage len: ", coverage.length);
	  for ( var x in coverage ) {
	    //console.log(coverage[x].styleSheetId);
	    css.push(await client.send("CSS.getStyleSheetText", {
	          styleSheetId: coverage[x].styleSheetId
	        }));
	  }

	  for (var x in css) {
	  	console.log(x+" :"+css[x]);
	  }
	  
	 var cssText = [];
	  for (var x in css ) {
	     cssText[x] = new Object();
	     cssText[x].index = x;
	     cssText[x].styleSheetId = coverage[x].styleSheetId;
	     cssText[x].used = (true | false) ? "Yes" : "No";
	     cssText[x].css = css[x].text.substring(coverage[x].startOffset, coverage[x].endOffset);
	  }
	  fs.writeFileSync(`${name}-CSSCov.json`, JSON.stringify(cssText, null, 2));
	}).catch(function (err) {
	  console.error(err);
	});
}

module.exports = cssCov;