let writtenTweets = [];

function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	// Cache searchable personal text once, retaining each tweet's original dataset number.
	writtenTweets = runkeeper_tweets.map(function (data, index) {
		const tweet = new Tweet(data.text, data.created_at);
		return { tweet, number: index + 1, searchText: tweet.writtenText.toLowerCase() };
	}).filter(entry => entry.searchText.length > 0);
	// Also handles a query entered before the asynchronous data load finishes.
	updateSearchResults();
}

function addEventHandlerForSearch() {
	const input = document.getElementById('textFilter');
	input.setAttribute('aria-label', 'Search user-written tweet text');
	input.oninput = updateSearchResults;
	document.getElementById('searchCount').setAttribute('aria-live', 'polite');
	updateSearchResults();
}

function updateSearchResults() {
	const text = document.getElementById('textFilter').value;
	const query = text.trim().toLowerCase();
	const matches = query === '' ? [] : writtenTweets.filter(entry => entry.searchText.includes(query));
	document.getElementById('searchText').textContent = text;
	document.getElementById('searchCount').textContent = matches.length;
	// Replace all rows together, avoiding repeated DOM writes as the table grows.
	document.getElementById('tweetTable').innerHTML = matches
		.map(entry => entry.tweet.getHTMLTableRow(entry.number)).join('');
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	addEventHandlerForSearch();
	loadSavedRunkeeperTweets().then(parseTweets);
});
