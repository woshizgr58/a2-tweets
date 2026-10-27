async function parseTweets(runkeeper_tweets) {
	if (runkeeper_tweets === undefined) {
		window.alert('No tweets returned');
		return;
	}

	const completed = runkeeper_tweets
		.map(tweet => new Tweet(tweet.text, tweet.created_at))
		.filter(tweet => tweet.source === 'completed_event');
	const counts = new Map();
	for (const tweet of completed) {
		const type = tweet.activityType;
		if (type !== 'unknown') counts.set(type, (counts.get(type) || 0) + 1);
	}
	const activityCounts = Array.from(counts, ([activityType, count]) => ({ activityType, count }))
		.sort((a, b) => b.count - a.count || a.activityType.localeCompare(b.activityType));
	const topTypes = activityCounts.slice(0, 3).map(activity => activity.activityType);
	document.getElementById('numberActivities').textContent = activityCounts.length;
	['firstMost', 'secondMost', 'thirdMost'].forEach((id, index) => {
		document.getElementById(id).textContent = topTypes[index] || 'N/A';
	});

	// Use UTC consistently with the About page and the source timestamps.
	const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const distances = completed.filter(tweet => topTypes.includes(tweet.activityType))
		.map(tweet => ({ activityType: tweet.activityType, distance: tweet.distance, day: days[tweet.time.getUTCDay()], dayIndex: tweet.time.getUTCDay() }))
		.filter(activity => Number.isFinite(activity.distance) && activity.day !== undefined);
	function mean(rows) {
		return rows.length ? rows.reduce((sum, row) => sum + row.distance, 0) / rows.length : null;
	}
	const typeMeans = topTypes.map(activityType => ({
		activityType,
		mean: mean(distances.filter(activity => activity.activityType === activityType))
	})).filter(activity => activity.mean !== null).sort((a, b) => b.mean - a.mean);
	document.getElementById('longestActivityType').textContent = typeMeans[0]?.activityType || 'N/A';
	document.getElementById('shortestActivityType').textContent = typeMeans[typeMeans.length - 1]?.activityType || 'N/A';
	const weekend = activity => activity.day === 'Saturday' || activity.day === 'Sunday';
	const weekendMean = mean(distances.filter(weekend));
	const weekdayMean = mean(distances.filter(activity => !weekend(activity)));
	document.getElementById('weekdayOrWeekendLonger').textContent =
		weekendMean === null || weekdayMean === null ? 'N/A' :
		weekendMean === weekdayMean ? 'weekdays and weekends equally' :
		weekendMean > weekdayMean ? 'weekends' : 'weekdays';

	const activitySpec = {
		$schema: 'https://vega.github.io/schema/vega-lite/v5.json',
		title: 'Completed activities by type',
		width: 600,
		height: { step: 22 },
		data: { values: activityCounts },
		mark: 'bar',
		encoding: {
			x: { field: 'count', type: 'quantitative', title: 'Number of tweets', axis: { tickMinStep: 1 } },
			y: { field: 'activityType', type: 'nominal', sort: '-x', title: 'Activity type' },
			tooltip: [
				{ field: 'activityType', type: 'nominal', title: 'Activity' },
				{ field: 'count', type: 'quantitative', title: 'Tweets' }
			]
		}
	};
	const distanceSpec = {
		$schema: 'https://vega.github.io/schema/vega-lite/v5.json',
		title: 'Individual activity distances by day (UTC)',
		width: 600,
		height: 350,
		data: { values: distances },
		mark: { type: 'circle', opacity: 0.35, size: 35 },
		encoding: {
			x: { field: 'day', type: 'ordinal', sort: days, title: 'Day of week (UTC)', axis: { labelAngle: 0 } },
			y: { field: 'distance', type: 'quantitative', title: 'Distance (miles)', scale: { zero: true } },
			color: { field: 'activityType', type: 'nominal', title: 'Activity', scale: { domain: topTypes } },
			tooltip: [
				{ field: 'activityType', type: 'nominal', title: 'Activity' },
				{ field: 'day', type: 'ordinal', title: 'Day' },
				{ field: 'distance', type: 'quantitative', title: 'Miles', format: '.2f' }
			]
		}
	};
	// Vega-Lite groups the mean by the unaggregated day and activity encodings.
	const meanSpec = {
		...distanceSpec,
		title: 'Mean activity distances by day (UTC)',
		mark: { type: 'line', point: true },
		encoding: {
			...distanceSpec.encoding,
			order: { field: 'dayIndex', type: 'quantitative', aggregate: 'min' },
			y: { ...distanceSpec.encoding.y, aggregate: 'mean', title: 'Mean distance (miles)' },
			tooltip: [
				{ field: 'activityType', type: 'nominal', title: 'Activity' },
				{ field: 'day', type: 'ordinal', title: 'Day' },
				{ field: 'distance', type: 'quantitative', aggregate: 'mean', title: 'Mean miles', format: '.2f' },
				{ aggregate: 'count', type: 'quantitative', title: 'Activities' }
			]
		}
	};

	const individualChart = document.getElementById('distanceVis');
	const meanChart = document.getElementById('distanceVisAggregated');
	const button = document.getElementById('aggregate');
	button.style.display = 'block';
	individualChart.hidden = false;
	meanChart.hidden = true;
	button.textContent = 'Show means';
	button.setAttribute('aria-pressed', 'false');
	button.onclick = function () {
		const showMeans = meanChart.hidden;
		meanChart.hidden = !showMeans;
		individualChart.hidden = showMeans;
		button.textContent = showMeans ? 'Show individual activities' : 'Show means';
		button.setAttribute('aria-pressed', String(showMeans));
	};

	await Promise.all([
		vegaEmbed('#activityVis', activitySpec, { actions: false }),
		vegaEmbed('#distanceVis', distanceSpec, { actions: false }),
		vegaEmbed('#distanceVisAggregated', meanSpec, { actions: false })
	]);
}

document.addEventListener('DOMContentLoaded', function () {
	loadSavedRunkeeperTweets().then(parseTweets).catch(error => {
		console.error('Unable to load activity charts:', error);
		window.alert('Unable to load the activity charts. Check your internet connection and reload.');
	});
});
