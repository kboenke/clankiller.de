/* JavaScript for clankiller.de
 * (c) 2015 by Kai Boenke [code@boenke.info]
 */


/* 'Abstract' class for players
 */
var playerData = [];
function PlayerData(playerNickname){
	this.nickname =		playerNickname;
	this.blog =		{
		'active':		false,
		'rssfeed':		""
	}
	this.xbox =			{
		'active':		false,
		'gamerId':		"",
		'XUID':			"",
		'authKey':		""
	};
}

/* 'Abstract' class for feeds
 */
var feedData = [];
function FeedData(feedId, feedName){
	this.id =			feedId;
	this.name =			feedName;
	this.url =			"";
}


/* Called: During Initialization
 * Populates playerData[] with available players
 */
function populatePlayers(){
	playerData = [];
	
	gandalf = new PlayerData("gandalf");
	gandalf.blog['active'] =		true;
	gandalf.blog['rssfeed'] =		"http://blog.boenke.info/rss/";
	gandalf.xbox['active'] =		true;
	gandalf.xbox['gamerId'] =		"Player kbo";
	gandalf.xbox['XUID'] =			"2533274970392898";
	playerData.push(gandalf);
	
	razor = new PlayerData("RaZoR");
	razor.blog['active'] =		true;
	razor.blog['rssfeed'] =		"http://lightyears.twoday.net/rss";
	playerData.push(razor);
}


/* Called: During Initialization
 * Populates feedData[] with supporter feeds
 */
function populateFeeds(){
	feedData = [];
	feedData.push(new FeedData("blogs", "Blogroll"));
	feedData.push(new FeedData("xbox", "Xbox Live"));
	/* feedData.push(new FeedData("psn", "Playstation Network")); */
}
