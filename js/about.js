function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
	if(runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	const tweet_array = runkeeper_tweets.map(function(tweet) {
		return new Tweet(tweet.text, tweet.created_at);
	});
	
	const counts = { completed_event: 0, live_event: 0, achievement: 0, miscellaneous: 0 };
	let writtenCompleted = 0;
	let firstDate = null;
	let lastDate = null;
	for (const tweet of tweet_array) {
		const source = tweet.source;
		counts[source]++;
		if (source === 'completed_event' && tweet.written) {
			writtenCompleted++;
		}
		// Find actual extrema so the result does not depend on dataset order.
		if (!Number.isNaN(tweet.time.getTime())) {
			if (firstDate === null || tweet.time < firstDate) firstDate = tweet.time;
			if (lastDate === null || tweet.time > lastDate) lastDate = tweet.time;
		}
	}

	const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
	document.getElementById('numberTweets').textContent = tweet_array.length;
	document.getElementById('firstDate').textContent = firstDate ? firstDate.toLocaleDateString('en-US', dateOptions) : 'N/A';
	document.getElementById('lastDate').textContent = lastDate ? lastDate.toLocaleDateString('en-US', dateOptions) : 'N/A';

	// Some classes occur more than once, so update every matching span.
	function updateSpans(className, value) {
		document.querySelectorAll('.' + className).forEach(function(span) {
			span.textContent = value;
		});
	}
	function percentage(count, total) {
		return (total === 0 ? 0 : count / total * 100).toFixed(2) + '%';
	}
	const categories = {
		completedEvents: 'completed_event',
		liveEvents: 'live_event',
		achievements: 'achievement',
		miscellaneous: 'miscellaneous'
	};
	for (const [className, source] of Object.entries(categories)) {
		updateSpans(className, counts[source]);
		updateSpans(className + 'Pct', percentage(counts[source], tweet_array.length));
	}
	updateSpans('written', writtenCompleted);
	updateSpans('writtenPct', percentage(writtenCompleted, counts.completed_event));
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function (event) {
	loadSavedRunkeeperTweets().then(parseTweets);
});
