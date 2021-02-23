import React from "react";
import { getModule, getModuleByDisplayName } from "@vizality/webpack";
import { patch, unpatch } from "@vizality/patcher";
import { Plugin } from "@vizality/entities";
import { get } from "@vizality/http";
import { findInReactTree, forceUpdateElement, getOwnerInstance, waitForElement } from '@vizality/util/react';

export default class VzPronouns extends Plugin {
    patches = [];


	start() {
        InjectScript("https://code.jquery.com/jquery-3.5.1.slim.min.js", "jquery");

		this.injectStyles("stylesheet.scss");

        this.EndPointUrl = "https://pronoundb.org/api/v1/lookup";

        this._patchUserPopout();
	}

	stop() {
		unpatch("user-popout-pronouns");
        unpatch("pronouns-get-user-popout");

        RemoveScript("jquery");
	}

	async _patchUserPopout() {
        this.patches.push(() => unpatch("user-popout-pronouns"));
        const UserPopout = await this.getUserPopout();

        patch("user-popout-pronouns", UserPopout.prototype, "renderHeader", (_, res) => {
            const id = res.props.children[1].props.user.id;

            const pronouns = this._queryUserFriendly(id);

            pronouns.then(function(result) {
                if (result === undefined || result === null)
                    console.log("No pronouns available for user " + id);
                else
                    console.log("Pronouns for user " + id + ": " + result);
                
                if (result === null) return result;

                $(".popout-pronouns").remove(); // stop it making tons of pronoun elements

                if (result === undefined) result = "Not registered with PronounDB";

                let container = $(".bodyInnerWrapper-Z8WDxe");

                let newElement = $(`<div class=\"popout-pronouns\">${result}</div>`);

                newElement.prependTo(container);

                return result;
            });
            return res;
        });
    }

    // Strencher's code from https://github.com/shitcord-plugins/user-details/blob/4e4cb4cc85a72c344814dd6052b72649ddb1ec82/index.jsx#L37-L46
    getUserPopout() {
		return new Promise(resolve => {
			patch("pronouns-get-user-popout", getModule(m => m.default?.displayName == "ConnectedUserPopout"), "default", (_, ret) => {
				resolve(ret.type);
				unpatch("pronouns-get-user-popout");
				return ret;
			});
         this.patches.push(() => unpatch("pronouns-get-user-popout"));
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
        }
        catch {
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
    document.getElementsByTagName("head")[0].childNodes.forEach(element => {
        if (element.id === "pronouns-injected-" + name) element.remove();
    });
}