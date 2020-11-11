/* JavaScript for clankiller.de
 * (c) 2015 by Kai Boenke [code@boenke.info]
 * Requires jQuery 2
 */


/* Global declarations
 */
var contentData; // Holds loaded content
var subscribedMembers =	[]; // Determines which Memberfeeds to load
var subscribedFeeds =	[]; // Determines which feeds to load


/* Trigger script after page is loaded.
 */
$(document).ready(function(){
	// Adjust elements according to media
	mediaAdjustments(window.matchMedia('(min-width: 601px)')); // Must match media-query in style.css
	
	// Initialize data
	contentData = [];
	populateData();
	
	// Load content
	loadContent();
});


/* Called: During initialization
 * Add static data (Players, Feeds) to navigation
 */
function populateData(){
	// Players / members
	populatePlayers();
	memberContent = "";
	$.each(playerData, function(index, player){
		memberContent += '<li><input type="checkbox" id="player_'+ index +'" onClick="loadContent();" checked />'+ player.nickname +'</li>';
	});
	document.getElementById('members').innerHTML = memberContent;
	
	// Feeds
	populateFeeds(); // see data.js
	feedContent = "";
	$.each(feedData, function(index, feed){
		feedContent += '<li><input type="checkbox" id="feed_'+ feed.id +'" onClick="loadContent();" checked />'+ feed.name +'</li>';
	});
	document.getElementById('feeds').innerHTML = feedContent;
}


/* Called: After initialization / After subscription-changes
 * Reads subscriptions and triggers data-loading.
 */
function loadContent(){
	showLoadScreen();
	loadBlogData();
	loadXboxLiveData();
	//loadPlaystionNetworkData();
}


/* Called: By loadContent() function prior to calling data-providers
 * Remove current content and shows loading screen.
 */
function showLoadScreen(){
	content = '<div class="loading"><img src="loading.gif" alt="Loading" /></div><div style="height: 20px;" />';
	document.getElementById('content').innerHTML = content;
}


/* Called: By data-providers after new dataset has been loaded.
 * Populates page with content-data.
 */
function updateContent(){
	// Copy content to prevent race-conditions
	cd = contentData;
	
	// Sort entries
	do{
		var swapped = false;
		for(i=0; i<cd.length-1; i++){
			if(cd[i]['timestamp'] < cd[i+1]['timestamp']){
				var swap = cd[i];
				cd[i] = cd[i+1];
				cd[i+1] = swap;
				swapped = true;
			}
		}
	}while(swapped != false);
	
	// Build content
	contentCount = 0;
	content = '<ul>';
	$.each(cd, function(i, item){
		//Check if player is active
		if(!document.getElementById('player_'+item.player).checked)
			return 'non-false';
		//Check if feed is active
		if(!document.getElementById('feed_'+item.feed).checked)
			return 'non-false';
		//Build content
		title = safeOutputString(item.title);
		if(item['link'] != "")
			title = '<a href="'+ item['link'] +'">'+ title +'</a>';
		content += '<li><div class="headline">'+
			'<div class="title">'+ title +'</div>'+
			'<div class="timestamp">'+ formatTime(new Date(item.timestamp)) +'</div>'+
			'</div>'+
			'<div class="content">'+ safeOutputString(item.content) +'</div>'+
			'</li>';
		contentCount++;
	});
	content += '</ul>';
	
	// Publish content
	if(contentCount == 0)
		content = '<div class="loading">No data found. :(</div>';
	document.getElementById('content').innerHTML = content;
}


/* Called: After initialization
 * Adjusts page-elements depending on viewport.
 */
function mediaAdjustments(MediaQueryList){
	if(MediaQueryList.matches){
		// Desktop Mode
		$.each(document.getElementsByTagName('details'), function(index, tag){
			tag.open = true;
		});
	}else{
		// Mobile Mode
	}
}


/* Called: by loadContent()
 * Load feeds from Twitter
 */
function loadBlogData(){
	// Get Players
	$.each(playerData, function(index, player){
		// Check if player has a Blog feed
		if(!player.blog['active'])
			return;
		
		// Load feed for player
		parseRSS(player.blog['rssfeed'], function(postings){
			$.each(postings.entries, function(i, post){
				contentData.push({
					player:		index,
					feed:		'blogs',
					title:		post.title,
					timestamp:	(new Date(post.publishedDate)).getTime(),
					content:	post.content,
					link:		post.link
				});
			});
			
			// Refresh page
			console.log('Loading: Blog ('+ postings.entries.length +') - '+player.nickname);
			updateContent();
		});
	});
}

/* Called: by loadContent()
 * Load data from Xbox Live
 */
function loadXboxLiveData(){
	// Check if feed is selected
	if(!document.getElementById('feed_xbox').checked)
		return;
	
	// Get Players
	$.each(playerData, function(index, player){
		// Check if player is selected
		if(!document.getElementById('player_'+ index).checked)
			return;
		
		// Check if player has Xbox-Feed
		if(!player.xbox['active'])
			return;
		
		// Load feed for player
		$.ajax({
			url:			"https://xboxapi.com/v2/"+ player.xbox['XUID'] +"/activity",
			type:			"GET",
			datatype:		"json",
			headers: {
				'X-Auth':		"113b1126e26bf688a710f6c6badc47bf28c7105b"
			}
		}).done(function(achievements){
			$.each(achievements.activityItems, function(i, activity){
				if(activity.hasOwnProperty('achievementId')){	// Filter 'played' events
					contentData.push({
						player:		index,
						feed:		'xbox',
						title:		activity.achievementDescription,
						timestamp:	(new Date(activity.date)).getTime(),
						content:	'<img src="'+ activity.achievementIcon +'" style="max-width: 50vw;" />'
					});
				}
			});
			
			// Refresh page
			console.log('Loading: Xbox ('+ achievements.activityItems.length +') - '+player.nickname);
			updateContent();
		});
	});
}



/*
 * Helper Functions
 */

/* Retrieve RSS as JSON
 */
function parseRSS(url, callback) {
	$.ajax({
		url: 'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&callback=?&num=20&q=' + encodeURIComponent(url),
//		url: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20rss%20where%20url%20in%20(select%20title%20from%20atom%20where%20url%3D'"+ encodeURIComponent(url) +"')&format=json&callback=",
		dataType: 'json',
		success: function(data) {
			callback(data.responseData.feed);
		}
	});
}

/* Remove/Replace unsupported characters
 */
function safeOutputString(str){
	str = str.replace(/<p>/g, '');
	str = str.replace(/<\/p>/g, '');
	str = str.replace(/&Auml;/g, 'Ae');
	str = str.replace(/&auml;/g, 'ae');
	str = str.replace(/&Ouml;/g, 'Oe');
	str = str.replace(/&ouml;/g, 'Oe');
	str = str.replace(/&Uuml;/g, 'Ue');
	str = str.replace(/&uuml;/g, 'ue');
	str = str.replace(/Ä/g, 'Ae');
	str = str.replace(/ä/g, 'ae');
	str = str.replace(/Ö/g, 'Oe');
	str = str.replace(/ö/g, 'Oe');
	str = str.replace(/Ü/g, 'Ue');
	str = str.replace(/ü/g, 'ue');
	return str;
}

/* Generate proper timeformat
 */
function formatTime(timestamp) {
	// Hour:Minute
	ckTime = addLeadingZero(timestamp.getUTCHours()) +':'+ addLeadingZero(timestamp.getUTCMinutes());
	
	ckTime += ' // ';
	
	// Year-Month-Day
	ckTime += timestamp.getFullYear() +'-'+ addLeadingZero(timestamp.getMonth()) +'-'+ addLeadingZero(timestamp.getDate());
	
	return ckTime;
}
function addLeadingZero(number){
	if(number < 10)
		return '0'+number;
	return number;
}
