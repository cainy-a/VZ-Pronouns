import React from "react";
import { getModule, getModuleByDisplayName } from "@vizality/webpack";
import { patch, unpatch } from "@vizality/patcher";
import { Plugin } from "@vizality/entities";
import { get } from "@vizality/http";
import { userProfile } from "./fluxhack";

const Settings = require("./settings");

export default class VzPronouns extends Plugin {
	patches = [];

	cachedPronouns = [];

	start() {
		this.EndPointUrl = "https://pronoundb.org/api/v1/lookup";

		InjectScript(
			"https://code.jquery.com/jquery-3.5.1.slim.min.js",
			"jquery"
		);
		this.log("Injected jQuery");

		this.registerSettings(Settings);

		this.injectStyles("stylesheet.scss");

		this._patchUserPopout();
		this._patchProfile();

		console.log("This is an easy way to get to the file in the debugger");
	}

	stop() {
		RemoveScript("jquery");
		this.log("Removed injected jQuery");

		unpatch("user-popout-pronouns");
		unpatch("pronouns-get-user-popout");
		unpatch("user-profile-pronouns")
		unpatch("pronouns-get-user-profile");
		this.log("Plugin unloading complete");
	}

	async _patchProfile() {
		this.patches.push(() => unpatch("user-profile-pronouns"));
		const UserProfile = //await this.getUserProfile();
			userProfile();

		console.log(UserProfile);

		patch("user-profile-pronouns", UserProfile.prototype, "render", (_, res) => {
			console.log("patched profile! :)");
			return res;
		});
	}

	async _patchUserPopout() {
		this.patches.push(() => unpatch("user-popout-pronouns"));
		const UserPopout = await this.getUserPopout();

		patch(
			"user-popout-pronouns",
			UserPopout.prototype,
			"renderHeader",
			(_, res) => {
				const parent = this;

				const id = res.props.children[1].props.user.id;

				let cached = false;

				this.cachedPronouns.forEach((element) => {
					if (element.user === id) //cached = element.pronouns;
						parent.injectPronounsIntoPopout(parent._getFriendlyPronounString(element.pronouns));
				});

				if (cached) return res;

				this._queryUser(id).then(function (result) {
					let friendlyResult = parent._getFriendlyPronounString(
						result
					);

					if (friendlyResult === undefined || friendlyResult === null)
						parent.log(
							"No pronouns available for user " + id
						);
					else
						parent.log(
							"Pronouns for user " + id + ": " + friendlyResult
						);

					if (friendlyResult === undefined || friendlyResult === null)
						friendlyResult = "Not registered with PronounDB"; // User friendliness

					parent.injectPronounsIntoPopout(friendlyResult);

					if (result === undefined || result === null) return res;
					parent.cachedPronouns.push({
						user: id,
						pronouns: result,
					});

					// stop the cache getting huge by removing after 10 mins
					// and yes, this is my bad attempt at preventing a memory leak.
					// 10 minutes => 600 seconds => 600,000 milliseconds
					setTimeout(function () {
						parent.removeCachedPronoun(parent.id);
					}, 10 * 60 * 1000);

					return res;
				});
				return res;
			}
		);
	}

	injectPronounsIntoPopout(pronouns) {
		// stop it making tons of pronoun elements
		$(".popout-pronouns").remove();
		$(".popout-pronouns-pc").remove();
		$(".popout-pronouns-pc-header").remove();

		// insert pronouns into popout
		let container = $(".header-2BwW8b > :first-child");
		let newElement = null;
		if (this.settings.get("popoutHover"))
			newElement = $(`<div class="popout-pronouns hover">💬<div class="text">${pronouns}</div></div>`);
		else
			newElement = $(`<div class="popout-pronouns">${pronouns}</div>`);

		if (this.settings.get("pcMode")) {
			let pcContainer = $(".bodyInnerWrapper-Z8WDxe");
			$("<div class=\"bodyTitle-Y0qMQz marginBottom8-AtZOdT size12-3R0845 popout-pronouns-pc-header\">Pronouns</div>").appendTo(pcContainer);
			$(`<div class="marginBottom8-AtZOdT size14-e6ZScH popout-pronouns-pc">${pronouns}</div>`).appendTo(pcContainer);
		}
		else
			newElement.appendTo(container);

		// fix popout going slightly off the bottom of the screen
		const popoutRoot = $(".layer-v9HyYc");
		let verticalPos = popoutRoot.css("top"); // get Discord's assigned top value
		verticalPos = parseInt(verticalPos); // remove the "px" and convert to int
		verticalPos -= 57; // Remove height used by pronouns info
		verticalPos += "px"; // Add "px" back
		popoutRoot.css("top", verticalPos); // insert back into style=""
	}

	removeCachedPronoun(id) {
		this.cachedPronouns.forEach((pronoun) => {
			if (pronoun.user === id) {
				try {
					this.cachedPronouns.splice(
						this.cachedPronouns.indexOf(pronoun),
						1
					);
				} catch {
					/* Can't be bothered with error handling tbh */
				}
			}
		});
	}

	// Strencher's code from https://github.com/shitcord-plugins/user-details/blob/4e4cb4cc85a72c344814dd6052b72649ddb1ec82/index.jsx#L37-L46
	getUserPopout() {
		return new Promise((resolve) => {
			patch(
				"pronouns-get-user-popout",
				getModule(
					(m) => m.default?.displayName == "ConnectedUserPopout"
				),
				"default",
				(_, ret) => {
					resolve(ret.type);
					unpatch("pronouns-get-user-popout");
					return ret;
				}
			);
			this.patches.push(() => unpatch("pronouns-get-user-popout"));
		});
	}

	getUserProfile() {
		return new Promise((resolve) => {
			patch(
				"pronouns-get-user-profile",
				getModule(
					(m) => m.default?.displayName == "UserProfile"
				),
				"default",
				(_, ret) => {
					resolve(ret.type);
					unpatch("pronouns-get-user-profile");
					return ret;
				}
			);
			this.patches.push(() => unpatch("pronouns-get-user-profile"));
		});
	}

	async _queryUserFriendly(id) {
		return this._getFriendlyPronounString(await this._queryUser(id));
	}

	async _queryUser(id) {
		try {
			let request = get(this.EndPointUrl);
			request.query("platform", "discord");
			request.query("id", id);
			let result = await request.execute();

			return result.body.pronouns;
		} catch {
			return null;
		}
	}

	_getFriendlyPronounString(shortString) {
		switch (shortString) {
			case "unspecified":
				return null;
			case "hh":
				return "he/him";
			case "hi":
				return "he/it";
			case "hs":
				return "he/she";
			case "ht":
				return "he/they";
			case "ih":
				return "it/him";
			case "ii":
				return "it/its";
			case "is":
				return "it/she";
			case "it":
				return "it/they";
			case "shh":
				return "she/he";
			case "sh":
				return "she/her";
			case "si":
				return "she/it";
			case "st":
				return "she/they";
			case "th":
				return "they/he";
			case "ti":
				return "they/it";
			case "ts":
				return "they/she";
			case "tt":
				return "they/them";
			case "any":
				return "Any";
			case "other":
				return "Other";
			case "ask":
				return "Ask me";
			case "avoid":
				return "Avoid, use my name";
		}
	}
}

/* function PopoutPronouns (props) {
	return <div className="popout-pronouns">{props.pronouns}</div>;
} */

function InjectScript(url, name) {
	var newScript = document.createElement("script");
	newScript.type = "text/javascript";
	newScript.src = url;
	newScript.id = "pronouns-injected-" + name;
	document.getElementsByTagName("head")[0].appendChild(newScript);
}

function RemoveScript(name) {
	document.getElementsByTagName("head")[0].childNodes.forEach((element) => {
		if (element.id === "pronouns-injected-" + name) element.remove();
	});
}

function getDiskaiPluginHook(hookName) {
	return getComputedStyle(document.getElementById("app-mount")) // get :root {}
		.getPropertyValue(`--diskai-hook-${hookName}`) // get the hook
		.trim(); // remove leading whitespace
}
