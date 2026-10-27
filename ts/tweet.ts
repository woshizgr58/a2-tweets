class Tweet {
	private text:string;
	time:Date;

	constructor(tweet_text:string, tweet_time:string) {
        this.text = tweet_text;
		this.time = new Date(tweet_time);//, "ddd MMM D HH:mm:ss Z YYYY"
	}

	//returns either 'live_event', 'achievement', 'completed_event', or 'miscellaneous'
    get source():string {
        const text = this.text.trim();
        // Match the app's templates rather than individual distances or activities.
        if (/^Watch my .+ right now with @?Runkeeper Live\b/i.test(text)) {
            return "live_event";
        }
        if (/^(Achieved a new personal record|I just set a goal)\b/i.test(text)) {
            return "achievement";
        }
        if (/^(Just (completed|posted) an?\b|I just (completed|ran)\b|Completed an?\b)/i.test(text)) {
            return "completed_event";
        }
        return "miscellaneous";
    }

    //returns a boolean, whether the text includes any content written by the person tweeting.
    get written():boolean {
        return this.writtenText.length > 0;
    }

    get writtenText():string {
        // Remove links and app hashtags before looking for a personal message.
        let text = this.text
            .replace(/https?:\/\/\S+/gi, "")
            .replace(/#(Runkeeper|RKLive|FitnessAlerts)\b/gi, "")
            .trim();

        // Activity descriptions precede either a comment separator or the default suffix.
        text = text.replace(/^Just (?:completed|posted) an?\s+[\s\S]*?(?:\s+-\s*|\s+with @?Runkeeper\.\s*Check it out!)/i, "");
        text = text.replace(/^I just (?:completed an activity|ran) with\s*(?:@?Runkeeper)?/i, "");
        text = text.replace(/^Watch my .+? right now with @?Runkeeper Live\b/i, "");
        text = text.replace(/^Achieved a new personal record with\s*:\s*[^.!\n]+(?:\.{3}|…)?/i, "");
        text = text.replace(/^I just set a goal on\s*!\s*I want to .+?\d+(?:\.\d+)?\s*(?:km|mi)\b/i, "");
        text = text.replace(/^Just linked .+? to the Health Graph:\s*/i, "");

        // This repeated device-generated caption is not a personal comment.
        text = text.replace(/^TomTom MySports Watch\b[.!]?\s*/i, "");
        return text.trim();
    }

    get activityType():string {
        if (this.source != 'completed_event') {
            return "unknown";
        }
        if (/^I just ran\b/i.test(this.text.trim())) return "run";

        // Keep multi-word names, stopping before duration, commentary, or app text.
        const match = this.text.trim().match(/^(?:I\s+)?(?:Just\s+)?(?:completed|posted)\s+an?\s+(?:\d+(?:\.\d+)?\s*(?:km|mi)\s+)?(.+?)(?=\s+in\s+\d|\s+with\b|\s+-|\s+@|\s+https?:|\s+#|$)/i);
        return match ? match[1].trim().toLowerCase() : "unknown";
    }

    get distance():number {
        if(this.source != 'completed_event') {
            return 0;
        }
        // Anchor at the activity header so distances in personal comments are ignored.
        const match = this.text.trim().match(/^(?:I\s+)?(?:Just\s+)?(?:completed|posted)\s+an?\s+(\d+(?:\.\d+)?)\s*(km|mi)\b/i);
        // Missing distances (including duration-only workouts) must not lower averages.
        if (!match) return NaN;
        const distance = Number(match[1]);
        return match[2].toLowerCase() === "km" ? distance / 1.609344 : distance;
    }

    getHTMLTableRow(rowNumber:number):string {
        // Escape tweet content before inserting it into HTML; only HTTP(S) links become anchors.
        function escapeHTML(value:string):string {
            return value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
                .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        }
        // Twitter encodes characters such as ampersands in its saved text.
        const text = this.text.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&");
        let tweetHTML = "";
        let position = 0;
        for (const match of text.matchAll(/https?:\/\/[^\s<>"']+/gi)) {
            const index = match.index;
            // Sentence punctuation following a link should remain outside the anchor.
            const url = match[0].replace(/[.,!?;:)\]}]+$/, "");
            tweetHTML += escapeHTML(text.slice(position, index));
            tweetHTML += `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(url)}</a>`;
            position = index + url.length;
        }
        tweetHTML += escapeHTML(text.slice(position));
        return `<tr><td>${escapeHTML(String(rowNumber))}</td><td>${escapeHTML(this.activityType)}</td><td>${tweetHTML.replace(/\r?\n/g, "<br>")}</td></tr>`;
    }
}
