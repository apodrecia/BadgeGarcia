'use strict';

var plugins = require('enmity/managers/plugins');
var common = require('enmity/metro/common');
var metro = require('enmity/metro');
var patcher = require('enmity/patcher');
var components = require('enmity/components');

var name = "DiscordOrbVideoBypass";
var manifest = {
	name: name};

const Settings = ({ settings, plugin }) => {
    const [currentSettings, setCurrentSettings] = common.React.useState(settings);
    const updateSetting = (key, value) => {
        setCurrentSettings((prev) => ({
            ...prev,
            [key]: value
        }));
        plugin.internalSettings.raw = { ...plugin.internalSettings.raw, [key]: value };
    };
    const updateMapping = (type, index, field, value) => {
        const newMappings = [...currentSettings[type]];
        newMappings[index][field] = value;
        updateSetting(type, newMappings);
    };
    const addMapping = (type) => {
        updateSetting(type, [...currentSettings[type], { original: "", fake: "" }]);
    };
    const removeMapping = (type, index) => {
        const newMappings = currentSettings[type].filter((_, i) => i !== index);
        updateSetting(type, newMappings);
    };
    const renderMappingSection = (title, type) => (common.React.createElement(common.React.Fragment, null, common.React.createElement(components.Text, { style: { marginBottom: 10, marginTop: 20 }, variant: "text-md/semibold" }, title), currentSettings[type].map((mapping, index) => (common.React.createElement(common.React.Fragment, { key: index }, common.React.createElement(components.TextInput, {
        style: { marginBottom: 5 },
        placeholder: "Original",
        value: mapping.original,
        onChange: (value) => updateMapping(type, index, "original", value)
    }), common.React.createElement(components.TextInput, {
        style: { marginBottom: 10 },
        placeholder: "Fake",
        value: mapping.fake,
        onChange: (value) => updateMapping(type, index, "fake", value)
    }), common.React.createElement(components.Button, {
        text: "Remove",
        onPress: () => removeMapping(type, index),
        color: components.Button.Colors.RED,
        style: { marginBottom: 10 }
    })))), common.React.createElement(components.Button, {
        text: `Add ${title.replace(" Mappings", "").toLowerCase()} mapping`,
        onPress: () => addMapping(type),
        color: components.Button.Colors.BRAND,
        style: { marginBottom: 20 }
    })));
    return (common.React.createElement(components.ScrollView, { style: { padding: 16 } }, common.React.createElement(components.Text, { style: { marginBottom: 20 }, variant: "text-lg/bold" }, "DiscordOrbVideoBypass Settings"), renderMappingSection("Text Mappings", "textMappings"), renderMappingSection("Date Mappings", "dateMappings"), renderMappingSection("Image Mappings", "imageMappings"), renderMappingSection("Badge Text Mappings", "badgeTextMappings"), renderMappingSection("Email Mappings", "emailMappings"), common.React.createElement(components.Text, { style: { marginBottom: 10, marginTop: 20 }, variant: "text-md/semibold" }, "Badge Management"), common.React.createElement(components.Button, {
        text: "Scrape Badges from GitHub",
        onPress: () => plugin.fetchBadgeLists(),
        color: components.Button.Colors.GREEN,
        style: { marginBottom: 10 }
    }), common.React.createElement(components.Button, {
        text: "Detect Real Badges",
        onPress: () => plugin.detectBadges(),
        color: components.Button.Colors.BRAND,
        style: { marginBottom: 10 }
    }), common.React.createElement(components.Button, {
        text: "Clear Original Badges",
        onPress: () => {
            plugin.originalBadges = [];
            plugin.internalSettings.raw = { ...plugin.internalSettings.raw, originalBadges: [] };
            plugin.showToast("Real badges cleared!", { type: "success" }); // Assuming showToast is implemented or removed
            setCurrentSettings((prev) => ({ ...prev, originalBadges: [] }));
        },
        color: components.Button.Colors.RED,
        style: { marginBottom: 20 }
    }), common.React.createElement(components.Button, {
        text: "Save Settings and Apply Spoofs",
        onPress: () => {
            // Filter out empty mappings before saving
            const filteredSettings = {
                ...currentSettings,
                textMappings: currentSettings.textMappings.filter((m) => m.original && m.fake),
                dateMappings: currentSettings.dateMappings.filter((m) => m.original && m.fake),
                imageMappings: currentSettings.imageMappings.filter((m) => m.original && m.fake),
                badgeTextMappings: currentSettings.badgeTextMappings.filter((m) => m.original && m.fake),
                emailMappings: currentSettings.emailMappings.filter((m) => m.original && m.fake),
            };
            plugin.internalSettings.raw = filteredSettings;
            plugin.replaceContent();
            console.log("Settings saved and spoofs applied!"); // Replace with Enmity toast if available
        },
        color: components.Button.Colors.PRIMARY,
        style: { marginBottom: 20 }
    })));
};

const Patcher = patcher.create(manifest.name);
class DiscordOrbVideoBypass extends plugins.Plugin {
    settings;
    originalBadges = [];
    fakeBadges = [];
    githubRepo = "mezotv/discord-badges";
    githubBranch = "main";
    githubAssetPath = "assets";
    scrapeInterval = null;
    replaceInterval = null;
    observer = null;
    knownOriginalBadgeNames = [
        "Discord Staff", "Partnered Server Owner", "HypeSquad Events", "Bug Hunter",
        "Early Supporter", "HypeSquad Bravery House", "HypeSquad Brilliance House",
        "HypeSquad Balance House", "Early Verified Bot Developer", "Active Developer",
        "Nitro Subscriber", "Server Booster", "Quest Completer", "Orb Collector",
        "Legacy Username", "Moderator Programs Alumni"
    ];
    badgeNameMap = {
        '2895086c18d5531d499862e41d1155a6.png': 'Nitro Subscriber',
        'df199d2050d3ed4ebf84d64ae83989f8.png': 'Server Booster',
        '7d9ae358c8c5e118768335dbe68b4fb8.png': 'Quest Completer',
        '83d8a1eb09a8d64e59233eec5d4d5c2d.png': 'Orb Collector',
        'discordmod.png': 'Moderator Programs Alumni',
        'staff.png': 'Discord Staff',
        'partner.png': 'Partnered Server Owner',
        'hypesquad_events.png': 'HypeSquad Events',
        'bug_hunter_level_1.png': 'Bug Hunter',
        'bug_hunter_level_2.png': 'Bug Hunter',
        'early_supporter.png': 'Early Supporter',
        'hypesquad_bravery.png': 'HypeSquad Bravery House',
        'hypesquad_brilliance.png': 'HypeSquad Brilliance House',
        'hypesquad_balance.png': 'HypeSquad Balance House',
        'early_verified_bot_developer.png': 'Early Verified Bot Developer',
        'verified_bot_developer.png': 'Verified Bot Developer',
        'active_developer.png': 'Active Developer',
        'certified_moderator.png': 'Moderator Programs Alumni',
        'new_member.png': 'New Server Member',
        'boost_month_1.png': 'Server Booster (1 Month)',
        'boost_month_2.png': 'Server Booster (2 Months)',
        'boost_month_3.png': 'Server Booster (3 Months)',
        'boost_month_6.png': 'Server Booster (6 Months)',
        'boost_month_9.png': 'Server Booster (9 Months)',
        'boost_month_12.png': 'Server Booster (12 Months)',
        'boost_month_18.png': 'Server Booster (18 Months)',
        'boost_month_24.png': 'Server Booster (24 Months)',
        'nitro_bronze.png': 'Nitro Subscriber (Bronze)',
        'nitro_silver.png': 'Nitro Subscriber (Silver)',
        'nitro_gold.png': 'Nitro Subscriber (Gold)',
        'nitro_platinum.png': 'Nitro Subscriber (Platinum)',
        'nitro_diamond.png': 'Nitro Subscriber (Diamond)',
        'nitro_emerald.png': 'Nitro Subscriber (Emerald)',
        'nitro_ruby.png': 'Nitro Subscriber (Ruby)',
        'nitro_opal.png': 'Nitro Subscriber (Opal)',
        'quest_badge.png': 'Quest Badge',
        'orbs_apprentice.png': 'Orbs Apprentice',
        'legacy_username.png': 'Legacy Username',
        'clown_badge.png': 'Clown Badge',
        'supports_commands.png': 'Supports Commands',
        'premium_app.png': 'Premium App',
        'uses_automod.png': 'Uses AutoMod',
        'server_booster_badge.png': 'Server Booster (Member List)',
        'owner_crown.png': 'Owner Crown',
        'activedeveloper.svg': 'Active Developer',
        'automod.svg': 'Uses AutoMod',
        'discordbotdev.svg': 'Early Verified Bot Developer',
        'discordbughunter1.svg': 'Bug Hunter',
        'discordbughunter2.svg': 'Bug Hunter',
        'discordearlysupporter.svg': 'Early Supporter',
        'discordmod.svg': 'Moderator Programs Alumni',
        'discordnitro.svg': 'Nitro Subscriber',
        'discordpartner.svg': 'Partnered Server Owner',
        'discordstaff.svg': 'Discord Staff',
        'hypesquadbalance.svg': 'HypeSquad Balance House',
        'hypesquadbravery.svg': 'HypeSquad Bravery House',
        'hypesquadbrilliance.svg': 'HypeSquad Brilliance House',
        'hypesquadevents.svg': 'HypeSquad Events',
        'olddiscordmod.svg': 'Discord Certified Moderator',
        'olddiscordpartner.png': 'Discord Partner',
        'orb.svg': 'Orbs Apprentice',
        'premiumbot.png': 'Premium App',
        'quest.png': 'Quest Completer',
        'supportscommands.svg': 'Supports Commands',
        'username.png': 'Legacy Username'
    };
    constructor() {
        super();
        this.settings = this.defaultSettings;
    }
    get defaultSettings() {
        return {
            textMappings: [{ original: "", fake: "" }],
            dateMappings: [
                { original: "", fake: "" },
                { original: "Mar 11, 2025", fake: "Jan 6, 2017" }
            ],
            imageMappings: [{ original: "", fake: "" }],
            badgeTextMappings: [
                { original: "", fake: "" },
                { original: "Server boosting since Nov 17, 2024", fake: "Early Verified Bot Developer" },
                { original: "Server boosting since Mar 8, 2025", fake: "Early Supporter" }
            ],
            emailMappings: [
                { original: "", fake: "" },
                { original: "@proton.me", fake: "@cia.gov" }
            ],
            originalBadges: [],
            fakeBadges: []
        };
    }
    onStart() {
        this.settings = { ...this.defaultSettings, ...this.internalSettings.raw };
        this.originalBadges = this.settings.originalBadges || [];
        this.fakeBadges = this.settings.fakeBadges || [];
        this.internalSettings.raw = this.settings; // Ensure internalSettings is updated with defaults if missing
        this.replaceContent();
        this.observeMutations();
        this.fetchBadgeLists();
        if (this.originalBadges.length === 0) {
            this.detectBadges();
        }
        this.scrapeInterval = setInterval(() => this.fetchBadgeLists(), 24 * 60 * 60 * 1000);
    }
    onStop() {
        Patcher.unpatchAll();
        if (this.observer)
            this.observer.disconnect();
        if (this.scrapeInterval)
            clearInterval(this.scrapeInterval);
        if (this.replaceInterval)
            clearInterval(this.replaceInterval);
    }
    getSettingsPanel({ settings }) {
        return common.React.createElement(Settings, { settings: settings, plugin: this });
    }
    // Helper functions (adapted from original plugin)
    async fetchBadgeLists() {
        try {
            const badges = await this.fetchBadgeAssets();
            if (!badges.length)
                throw new Error("No badge assets were found in the repo.");
            const uniqueBadges = badges.filter((b) => !this.fakeBadges.some((fb) => fb.url === b.url));
            this.fakeBadges = [...this.fakeBadges, ...uniqueBadges];
            this.settings.fakeBadges = this.fakeBadges;
            this.internalSettings.raw = this.settings;
            // Enmity doesn't have a direct showToast, might need to implement a custom one or use console.log
            this.showToast(`Scraped ${uniqueBadges.length} new fake badges from GitHub! Total: ${this.fakeBadges.length}`, { type: "success" });
        }
        catch (err) {
            console.error("Error in fetchBadgeLists:", err);
            this.showToast("Error scraping badges: " + err.message + ". No changes made.", { type: "warning" });
        }
    }
    async fetchJson(url) {
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText || "fetch failed"} from ${url}`);
        }
        return response.json();
    }
    async fetchBadgeAssets() {
        const errors = [];
        const sources = [
            () => this.fetchBadgesFromJsDelivr(),
            () => this.fetchBadgesFromGitTree(),
            () => this.fetchBadgesFromGitContents()
        ];
        for (const source of sources) {
            try {
                const badges = await source();
                if (badges.length)
                    return badges;
            }
            catch (err) {
                errors.push(err.message);
                console.error("Badge source failed:", err);
            }
        }
        throw new Error(errors.join(" | ") || "All badge sources failed");
    }
    async fetchBadgesFromJsDelivr() {
        const data = await this.fetchJson(`https://data.jsdelivr.com/v1/package/gh/${this.githubRepo}@${this.githubBranch}/flat`);
        return (data.files || [])
            .map((file) => String(file.name || "").replace(/^\//, ""))
            .filter((path) => path.startsWith(`${this.githubAssetPath}/`) && this.isBadgeAsset(path))
            .map((path) => ({
            url: `https://cdn.jsdelivr.net/gh/${this.githubRepo}@${this.githubBranch}/${path}`,
            name: this.getBadgeNameFromFilename(this.getFilenameFromPath(path))
        }));
    }
    async fetchBadgesFromGitTree() {
        const data = await this.fetchJson(`https://api.github.com/repos/${this.githubRepo}/git/trees/${this.githubBranch}?recursive=1`);
        return (data.tree || [])
            .filter((file) => file.type === "blob" && file.path?.startsWith(`${this.githubAssetPath}/`) && this.isBadgeAsset(file.path))
            .map((file) => ({
            url: `https://raw.githubusercontent.com/${this.githubRepo}/${this.githubBranch}/${file.path}`,
            name: this.getBadgeNameFromFilename(this.getFilenameFromPath(file.path))
        }));
    }
    async fetchBadgesFromGitContents() {
        const badges = [];
        const scrapePath = async (path = "") => {
            const encodedPath = path.split("/").map(part => encodeURIComponent(part)).join("/");
            const files = await this.fetchJson(`https://api.github.com/repos/${this.githubRepo}/contents/${encodedPath}?ref=${this.githubBranch}`);
            for (const file of files) {
                if (file.type === "dir") {
                    await scrapePath(file.path);
                }
                else if (file.type === "file" && this.isBadgeAsset(file.name)) {
                    const rawUrl = file.download_url || `https://raw.githubusercontent.com/${this.githubRepo}/${this.githubBranch}/${file.path}`;
                    const name = this.getBadgeNameFromFilename(file.name);
                    badges.push({ url: rawUrl, name });
                }
            }
        };
        await scrapePath(this.githubAssetPath);
        return badges;
    }
    isBadgeAsset(filename) {
        return /\.(png|svg|webp|gif)$/i.test(filename);
    }
    getFilenameFromPath(path) {
        return path.split('/').pop() || '';
    }
    getBadgeNameFromUrl(url) {
        const filename = this.getFilenameFromUrl(url);
        const baseName = filename.replace(/\.(png|svg|webp|gif)$/i, "").replace(/-|_/g, " ");
        const words = baseName.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
        return this.badgeNameMap[filename] || words.join(" ") || "Unknown Badge";
    }
    getFilenameFromUrl(url) {
        return url.split('/').pop()?.split('?')[0] || '';
    }
    getBadgeNameFromFilename(filename) {
        const baseName = filename.replace(/\.(png|svg|webp|gif)$/i, '').replace(/-|_/g, ' ');
        const words = baseName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
        return this.badgeNameMap[filename] || words.join(' ') || 'Unknown Badge';
    }
    isIgnoredBadgeLabel(label) {
        if (!label)
            return true;
        const lowerLabel = label.toLowerCase();
        return lowerLabel.includes("discord") || lowerLabel.includes("badge");
    }
    isOwnProfileElement(elem) {
        const currentUser = this.getCurrentUser();
        if (!currentUser)
            return false;
        const userId = currentUser.id;
        return elem.closest(`[data-user-id="${userId}"]`) !== null;
    }
    getCurrentUser() {
        const UserStore = metro.getByProps('getCurrentUser');
        return UserStore?.getCurrentUser?.() || null;
    }
    badgeUrlsMatch(url1, url2) {
        const normalize = (url) => url.split('?')[0].replace(/\/$/, '');
        return normalize(url1) === normalize(url2);
    }
    getMappingBadgeName(url, badgeList) {
        const badge = badgeList.find(b => this.badgeUrlsMatch(b.url, url));
        return badge ? badge.name : this.getBadgeNameFromUrl(url);
    }
    createLabelBadgeUrl(label) {
        const encodedLabel = encodeURIComponent(label.replace(/\s/g, '_'));
        return `https://discord.com/assets/badges/${encodedLabel}.png`; // Placeholder URL
    }
    getFallbackOriginalBadges() {
        return this.knownOriginalBadgeNames.map(name => ({
            url: this.createLabelBadgeUrl(name),
            name: name
        }));
    }
    getElementBadgeLabel(elem) {
        const labels = [
            elem.getAttribute?.("aria-label"),
            elem.getAttribute?.("title"),
            elem.getAttribute?.("alt"),
            elem.closest?.("[aria-label]")?.getAttribute("aria-label"),
            elem.closest?.("[title]")?.getAttribute("title")
        ].filter(label => !this.isIgnoredBadgeLabel(label));
        return labels[0] || "";
    }
    getElementImageUrls(elem) {
        const urls = [];
        if (elem.tagName === "IMG") {
            urls.push(elem.currentSrc, elem.src, elem.getAttribute("src") || "");
            urls.push(...this.extractSrcsetUrls(elem.getAttribute("srcset")));
        }
        const style = window.getComputedStyle(elem);
        ["backgroundImage", "maskImage", "webkitMaskImage"].forEach(prop => {
            urls.push(...this.extractCssUrls(style[prop]));
        });
        return urls.filter(Boolean);
    }
    extractSrcsetUrls(value) {
        return String(value || "")
            .split(",")
            .map(candidate => candidate.trim().split(/\s+/)[0])
            .filter(Boolean);
    }
    extractCssUrls(value) {
        const urls = [];
        String(value || "").replace(/url\(["']?(.*?)["']?\)/g, (_, url) => {
            if (url)
                urls.push(url);
            return "";
        });
        return urls;
    }
    isDefinitelyNotBadge(elem) {
        // Based on original plugin's usage, these are elements that should not be considered badges
        return elem.tagName === "BR" || elem.tagName === "HR" || elem.tagName === "SPAN" && !elem.hasAttribute("aria-label");
    }
    hasBadgeLikeClass(elem) {
        // Check for common Discord badge-related class names
        return elem.className.includes("badge") || elem.className.includes("Badge");
    }
    isInsideBadgeContainer(elem) {
        // Check if the element is within a container typically holding badges
        return elem.closest("div[aria-label='User Badges'], div[class*='profileBadges'], div[class*='ProfileBadges'], [class*='badgeList'], [class*='BadgeList']") !== null;
    }
    isVisibleBadgeCandidate(elem) {
        if (!elem)
            return false;
        if (this.isDefinitelyNotBadge(elem))
            return false;
        if (!this.hasBadgeLikeClass(elem) && !this.isInsideBadgeContainer(elem))
            return false;
        const style = window.getComputedStyle(elem);
        if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0)
            return false;
        const rect = elem.getBoundingClientRect?.();
        if (!rect)
            return false;
        const width = rect.width || parseFloat(style.width) || 0;
        const height = rect.height || parseFloat(style.height) || 0;
        if (width < 8 || height < 8 || width > 40 || height > 40)
            return false;
        const ratio = width / height;
        if (ratio < 0.5 || ratio > 2)
            return false;
        return true;
    }
    getProfileBadgeCandidates() {
        const selectors = [
            'div[aria-label="User Badges"] img',
            'div[aria-label="User Badges"] svg',
            'div[aria-label="User Badges"] [aria-label]',
            'div[class*="profileBadges"] img',
            'div[class*="profileBadges"] svg',
            'div[class*="profileBadges"] [aria-label]',
            'div[class*="ProfileBadges"] img',
            'div[class*="ProfileBadges"] svg',
            'div[class*="ProfileBadges"] [aria-label]',
            '[class*="badge"] img',
            '[class*="badge"] svg',
            '[class*="badge"][aria-label]',
            '[class*="Badge"] img',
            '[class*="Badge"] svg',
            '[class*="Badge"][aria-label]'
        ];
        return [...document.querySelectorAll(selectors.join(","))]
            .filter(elem => !elem.hasAttribute?.("data-discord-orb-extra-badge"))
            .filter(elem => !elem.closest?.("[data-discord-orb-extra-badge]"))
            .filter(elem => !this.isIgnoredBadgeLabel(elem.getAttribute?.("aria-label")))
            .filter(elem => this.isOwnProfileElement(elem))
            .filter(elem => this.isVisibleBadgeCandidate(elem))
            .filter((elem, index, elems) => elems.indexOf(elem) === index);
    }
    getProfileBadgeContainer(candidates = []) {
        const explicitContainer = [...document.querySelectorAll('div[aria-label="User Badges"], div[class*="profileBadges"], div[class*="ProfileBadges"], [class*="badgeList"], [class*="BadgeList"]')]
            .find(container => this.isOwnProfileElement(container));
        if (explicitContainer)
            return explicitContainer;
        const firstCandidate = candidates[0];
        const container = firstCandidate?.closest?.('div[aria-label="User Badges"], [class*="profileBadges"], [class*="ProfileBadges"], [class*="badgeList"], [class*="BadgeList"]') || firstCandidate?.parentElement || null;
        return container && this.isOwnProfileElement(container) ? container : null;
    }
    getExtraBadgeSize(candidates = []) {
        const sizes = candidates
            .map(candidate => {
            const rect = candidate.getBoundingClientRect?.();
            const style = window.getComputedStyle(candidate);
            const width = rect?.width || parseFloat(style.width) || 0;
            const height = rect?.height || parseFloat(style.height) || 0;
            return Math.max(width, height);
        })
            .filter(size => size >= 10 && size <= 40);
        if (!sizes.length)
            return 20;
        return Math.round(Math.max(18, sizes.reduce((sum, size) => sum + size, 0) / sizes.length));
    }
    syncExtraBadges(extraMappings, candidates = []) {
        const container = this.getProfileBadgeContainer(candidates);
        if (!container)
            return;
        const existing = [...container.querySelectorAll('[data-discord-orb-extra-badge="true"]')];
        const needed = extraMappings.length;
        const badgeSize = this.getExtraBadgeSize(candidates);
        for (let i = needed; i < existing.length; i++) {
            existing[i].remove();
        }
        extraMappings.forEach(({ fake }, index) => {
            let badge = existing[index];
            if (!badge) {
                badge = document.createElement("img");
                badge.setAttribute("data-discord-orb-extra-badge", "true");
                badge.setAttribute("aria-label", "Spoofed Badge");
                badge.alt = "Spoofed Badge";
                badge.draggable = false;
                badge.style.objectFit = "contain";
                badge.style.display = "inline-block";
                badge.style.flex = "0 0 auto";
                badge.style.marginLeft = "2px";
                badge.style.verticalAlign = "middle";
                container.appendChild(badge);
            }
            badge.style.width = `${badgeSize}px`;
            badge.style.height = `${badgeSize}px`;
            if (badge.getAttribute("src") !== fake) {
                badge.src = fake;
                badge.setAttribute("src", fake);
            }
        });
    }
    applyBadgeSpoofToElement(elem, fake) {
        if (!elem || !fake)
            return;
        const tagName = String(elem.tagName || "").toUpperCase();
        if (tagName === "IMG") {
            elem.src = fake;
            elem.setAttribute("src", fake);
            elem.removeAttribute("srcset");
            elem.setAttribute("data-discord-orb-badge-spoofed", "true");
            return;
        }
        if (tagName === "SVG") {
            try {
                elem.querySelectorAll("*").forEach(child => {
                    child.style.opacity = "0";
                });
                elem.style.backgroundImage = `url(${fake})`;
                elem.style.backgroundRepeat = "no-repeat";
                elem.style.backgroundPosition = "center";
                elem.style.backgroundSize = "contain";
                elem.setAttribute("data-discord-orb-badge-spoofed", "true");
                return;
            }
            catch (err) {
                console.error("Error replacing SVG badge:", err);
            }
        }
        const style = window.getComputedStyle(elem);
        const rect = elem.getBoundingClientRect?.();
        const width = rect?.width || parseFloat(style.width) || 16;
        const height = rect?.height || parseFloat(style.height) || 16;
        if (style.display === "inline")
            elem.style.display = "inline-block";
        if (!rect?.width || rect.width < 4)
            elem.style.width = `${width}px`;
        if (!rect?.height || rect.height < 4)
            elem.style.height = `${height}px`;
        elem.style.backgroundImage = `url(${fake})`;
        elem.style.backgroundRepeat = "no-repeat";
        elem.style.backgroundPosition = "center";
        elem.style.backgroundSize = "contain";
        elem.setAttribute("data-discord-orb-badge-spoofed", "true");
        elem.querySelectorAll?.("img, svg").forEach(child => {
            child.style.opacity = "0";
        });
    }
    mappingMatchesElement(elem, original) {
        if (this.getElementImageUrls(elem).some(url => this.badgeUrlsMatch(url, original)))
            return true;
        const originalBadgeName = this.getMappingBadgeName(original, this.originalBadges);
        const elementBadgeLabel = this.getElementBadgeLabel(elem);
        return this.badgeNamesMatch(elementBadgeLabel, originalBadgeName);
    }
    badgeNamesMatch(name1, name2) {
        return name1.toLowerCase() === name2.toLowerCase();
    }
    detectBadges() {
        try {
            const detected = [];
            const addDetectedBadge = (url, fallbackName) => {
                if (!url)
                    return;
                const hasBadgeIconPath = url.includes("/badge-icons/");
                const hasUsefulLabel = !this.isIgnoredBadgeLabel(fallbackName);
                if (!hasBadgeIconPath && (!hasUsefulLabel || !this.isBadgeAsset(this.getFilenameFromUrl(url))))
                    return;
                const normalizedUrl = this.normalizeUrl(url);
                const name = fallbackName || this.getBadgeNameFromUrl(normalizedUrl);
                if (name && !detected.some(b => this.badgeUrlsMatch(b.url, normalizedUrl))) {
                    detected.push({ url: normalizedUrl, name });
                }
            };
            const addDetectedBadgeLabel = (label) => {
                if (this.isIgnoredBadgeLabel(label))
                    return;
                const url = this.createLabelBadgeUrl(label);
                if (!detected.some(b => this.badgeUrlsMatch(b.url, url))) {
                    detected.push({ url, name: label.trim() });
                }
            };
            document.querySelectorAll('img[src*="/badge-icons/"], img[srcset*="/badge-icons/"], div[aria-label="User Badges"] img, div[class*="userProfileInner"] [class*="badge"] img, div[class*="profileBadges"] img').forEach(img => {
                addDetectedBadge(img.currentSrc || img.src, img.getAttribute("aria-label") || img.alt || img.title);
                this.extractSrcsetUrls(img.getAttribute("srcset")).forEach(url => addDetectedBadge(url));
            });
            document.querySelectorAll('div[aria-label="User Badges"] [aria-label], div[class*="userProfileInner"] [class*="badge"][aria-label], div[class*="profileBadges"] [aria-label]').forEach(elem => {
                const fallbackName = elem.getAttribute("aria-label");
                if (fallbackName)
                    addDetectedBadgeLabel(fallbackName);
                elem.querySelectorAll?.('img').forEach(img => {
                    addDetectedBadge(img.currentSrc || img.src, fallbackName || img.alt || img.title);
                });
            });
            document.querySelectorAll('div[aria-label="User Badges"] *, div[class*="userProfileInner"] [class*="badge"], div[class*="userProfileInner"] [class*="badge"] *, div[class*="profileBadges"] *').forEach(elem => {
                const label = elem.getAttribute("aria-label") || elem.title;
                if (label)
                    addDetectedBadgeLabel(label);
                const style = window.getComputedStyle(elem);
                ["backgroundImage", "maskImage", "webkitMaskImage"].forEach(prop => {
                    this.extractCssUrls(style[prop]).forEach(url => addDetectedBadge(url, label));
                });
            });
            let fallbackUsed = false;
            if (detected.length > 0) {
                this.originalBadges = [...this.originalBadges, ...detected].filter((badge, index, badges) => {
                    return index === badges.findIndex(other => this.badgeUrlsMatch(other.url, badge.url));
                });
                this.settings.originalBadges = this.originalBadges;
                this.internalSettings.raw = this.settings;
            }
            else if (this.originalBadges.length === 0) {
                this.originalBadges = this.getFallbackOriginalBadges();
                this.settings.originalBadges = this.originalBadges;
                this.internalSettings.raw = this.settings;
                fallbackUsed = true;
            }
            console.log(fallbackUsed ? `Detected 0 real badges. Loaded ${this.originalBadges.length} common badge options.` : `Detected ${detected.length} real badges!`);
            console.log("Detected badges:", detected);
        }
        catch (err) {
            console.error("Error in detectBadges:", err);
        }
    }
    showToast(content, options = {}) {
        console.log(`[Toast ${options.type || "info"}]: ${content}`);
    }
    normalizeUrl(url) {
        return url.split('?')[0].replace(/\/$/, '');
    }
    replaceContent() {
        try {
            const textMappings = this.settings.textMappings.filter(m => m.original && m.fake);
            const dateMappings = this.settings.dateMappings.filter(m => m.original && m.fake);
            const imageMappings = this.settings.imageMappings.filter(m => m.original && m.fake);
            const badgeTextMappings = this.settings.badgeTextMappings.filter(m => m.original && m.fake);
            const emailMappings = this.settings.emailMappings.filter(m => m.original && m.fake);
            document.querySelectorAll('*:not(script):not(style)').forEach(element => {
                if (element.childNodes.length) {
                    element.childNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
                            let text = node.nodeValue;
                            let changed = false;
                            for (const { original, fake } of textMappings) {
                                if (text.includes(original)) {
                                    text = text.replace(new RegExp(original, 'g'), fake);
                                    changed = true;
                                }
                            }
                            for (const { original, fake } of emailMappings) {
                                if (text.includes(original)) {
                                    text = text.replace(new RegExp(original.replace('.', '\\.'), 'g'), fake);
                                    changed = true;
                                }
                            }
                            for (const { original, fake } of dateMappings) {
                                if (text.includes(original)) {
                                    text = text.replace(new RegExp(`\\b${original}\\b`, 'g'), fake);
                                    changed = true;
                                }
                            }
                            for (const { original, fake } of badgeTextMappings) {
                                if (text.includes(original)) {
                                    text = text.replace(new RegExp(original, 'g'), fake);
                                    changed = true;
                                }
                            }
                            if (changed) {
                                node.nodeValue = text;
                            }
                        }
                    });
                }
            });
            const directlyMatchedElements = new Set();
            const placedMappingIndexes = new Set();
            document.querySelectorAll('img[src*="/badge-icons/"], img[srcset*="/badge-icons/"], div[aria-label="User Badges"] img, div[aria-label="User Badges"] svg, div[aria-label="User Badges"] [aria-label], div[class*="profileBadges"] img, div[class*="profileBadges"] svg, div[class*="profileBadges"] [aria-label], div[class*="ProfileBadges"] img, div[class*="ProfileBadges"] svg, div[class*="ProfileBadges"] [aria-label], [class*="badge"] img, [class*="badge"] svg, [class*="badge"][aria-label], [class*="Badge"] img, [class*="Badge"] svg, [class*="Badge"][aria-label]').forEach(elem => {
                if (this.isDefinitelyNotBadge(elem))
                    return;
                if (!this.isOwnProfileElement(elem))
                    return;
                for (let mappingIndex = 0; mappingIndex < imageMappings.length; mappingIndex++) {
                    const { original, fake } = imageMappings[mappingIndex];
                    if (this.mappingMatchesElement(elem, original)) {
                        this.applyBadgeSpoofToElement(elem, fake);
                        directlyMatchedElements.add(elem);
                        placedMappingIndexes.add(mappingIndex);
                    }
                }
            });
            const allProfileBadgeCandidates = this.getProfileBadgeCandidates();
            const profileBadgeCandidates = allProfileBadgeCandidates.filter(elem => !directlyMatchedElements.has(elem));
            let fallbackCandidateIndex = 0;
            imageMappings.forEach(({ fake }, index) => {
                if (placedMappingIndexes.has(index))
                    return;
                const candidate = profileBadgeCandidates[fallbackCandidateIndex++];
                if (candidate) {
                    this.applyBadgeSpoofToElement(candidate, fake);
                    placedMappingIndexes.add(index);
                }
            });
            this.syncExtraBadges(imageMappings.filter((_, index) => !placedMappingIndexes.has(index)), allProfileBadgeCandidates);
            document.querySelectorAll('div[aria-label="User Badges"] *, div[class*="profileBadges"] *, div[class*="ProfileBadges"] *, [class*="badge"], [class*="Badge"], [data-discord-orb-badge-spoofed]').forEach(elem => {
                if (this.isDefinitelyNotBadge(elem))
                    return;
                if (!this.isOwnProfileElement(elem))
                    return;
                const style = window.getComputedStyle(elem);
                imageMappings.forEach(({ original, fake }) => {
                    const matchesMapping = this.mappingMatchesElement(elem, original);
                    if (matchesMapping && (this.extractCssUrls(style.backgroundImage).length || elem.getAttribute("aria-label"))) {
                        elem.style.backgroundImage = `url(${fake})`;
                    }
                    if (matchesMapping && this.extractCssUrls(style.maskImage).length) {
                        elem.style.maskImage = `url(${fake})`;
                    }
                    if (matchesMapping && this.extractCssUrls(style.webkitMaskImage).length) {
                        elem.style.webkitMaskImage = `url(${fake})`;
                    }
                });
            });
        }
        catch (err) {
            console.error("Error in replaceContent:", err);
        }
    }
    observeMutations() {
        try {
            this.observer = new MutationObserver(() => this.replaceContent());
            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['src', 'srcset', 'style']
            });
            this.replaceInterval = setInterval(() => this.replaceContent(), 500);
        }
        catch (err) {
            console.error("Error in observeMutations:", err);
        }
    }
}
plugins.registerPlugin(new DiscordOrbVideoBypass());
