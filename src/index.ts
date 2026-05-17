import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { React as EnmityReact } from 'enmity/metro/common';
import { getByProps } from 'enmity/metro';
import { create } from 'enmity/patcher';
import manifest from '../manifest.json';
import Settings from './components/Settings';

const Patcher = create(manifest.name);

interface Mapping { original: string; fake: string; }

interface PluginSettings {
  textMappings: Mapping[];
  dateMappings: Mapping[];
  imageMappings: Mapping[];
  badgeTextMappings: Mapping[];
  emailMappings: Mapping[];
  originalBadges: any[];
  fakeBadges: any[];
}

class DiscordOrbVideoBypass extends Plugin {
  private settings: PluginSettings;
  private originalBadges: any[] = [];
  private fakeBadges: any[] = [];
  private githubRepo = "mezotv/discord-badges";
  private githubBranch = "main";
  private githubAssetPath = "assets";
  private scrapeInterval: any | null = null;
  private replaceInterval: any | null = null;
  private observer: MutationObserver | null = null;

  private knownOriginalBadgeNames = [
    "Discord Staff", "Partnered Server Owner", "HypeSquad Events", "Bug Hunter",
    "Early Supporter", "HypeSquad Bravery House", "HypeSquad Brilliance House",
    "HypeSquad Balance House", "Early Verified Bot Developer", "Active Developer",
    "Nitro Subscriber", "Server Booster", "Quest Completer", "Orb Collector",
    "Legacy Username", "Moderator Programs Alumni"
  ];

  private badgeNameMap: { [key: string]: string } = {
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

  get defaultSettings(): PluginSettings {
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

  onStart(): void {
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

  onStop(): void {
    Patcher.unpatchAll();
    if (this.observer) this.observer.disconnect();
    if (this.scrapeInterval) clearInterval(this.scrapeInterval);
    if (this.replaceInterval) clearInterval(this.replaceInterval);
  }

  getSettingsPanel({ settings }: { settings: any }): any {
    return EnmityReact.createElement(Settings, { settings: settings, plugin: this });
  }

  // Helper functions (adapted from original plugin)
  private async fetchBadgeLists() {
    try {
      const badges = await this.fetchBadgeAssets();
      if (!badges.length) throw new Error("No badge assets were found in the repo.");

      const uniqueBadges = badges.filter((b: any) => !this.fakeBadges.some((fb: any) => fb.url === b.url));
      this.fakeBadges = [...this.fakeBadges, ...uniqueBadges];
      this.settings.fakeBadges = this.fakeBadges;
      this.internalSettings.raw = this.settings;
      // Enmity doesn't have a direct showToast, might need to implement a custom one or use console.log
      this.showToast(`Scraped ${uniqueBadges.length} new fake badges from GitHub! Total: ${this.fakeBadges.length}`, { type: "success" });
    } catch (err: any) {
      console.error("Error in fetchBadgeLists:", err);
      this.showToast("Error scraping badges: " + err.message + ". No changes made.", { type: "warning" });
    }
  }

  private async fetchJson(url: string) {
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

  private async fetchBadgeAssets() {
    const errors: string[] = [];
    const sources = [
      () => this.fetchBadgesFromJsDelivr(),
      () => this.fetchBadgesFromGitTree(),
      () => this.fetchBadgesFromGitContents()
    ];

    for (const source of sources) {
      try {
        const badges = await source();
        if (badges.length) return badges;
      } catch (err: any) {
        errors.push(err.message);
        console.error("Badge source failed:", err);
      }
    }

    throw new Error(errors.join(" | ") || "All badge sources failed");
  }

  private async fetchBadgesFromJsDelivr() {
    const data = await this.fetchJson(`https://data.jsdelivr.com/v1/package/gh/${this.githubRepo}@${this.githubBranch}/flat`);
    return (data.files || [])
      .map((file: any) => String(file.name || "").replace(/^\//, ""))
      .filter((path: string) => path.startsWith(`${this.githubAssetPath}/`) && this.isBadgeAsset(path))
      .map((path: string) => ({
        url: `https://cdn.jsdelivr.net/gh/${this.githubRepo}@${this.githubBranch}/${path}`,
        name: this.getBadgeNameFromFilename(this.getFilenameFromPath(path))
      }));
  }

  private async fetchBadgesFromGitTree() {
    const data = await this.fetchJson(`https://api.github.com/repos/${this.githubRepo}/git/trees/${this.githubBranch}?recursive=1`);
    return (data.tree || [])
      .filter((file: any) => file.type === "blob" && file.path?.startsWith(`${this.githubAssetPath}/`) && this.isBadgeAsset(file.path))
      .map((file: any) => ({
        url: `https://raw.githubusercontent.com/${this.githubRepo}/${this.githubBranch}/${file.path}`,
        name: this.getBadgeNameFromFilename(this.getFilenameFromPath(file.path))
      }));
  }

  private async fetchBadgesFromGitContents() {
    const badges: any[] = [];

    const scrapePath = async (path = "") => {
      const encodedPath = path.split("/").map(part => encodeURIComponent(part)).join("/");
      const files = await this.fetchJson(`https://api.github.com/repos/${this.githubRepo}/contents/${encodedPath}?ref=${this.githubBranch}`);

      for (const file of files) {
        if (file.type === "dir") {
          await scrapePath(file.path);
        } else if (file.type === "file" && this.isBadgeAsset(file.name)) {
          const rawUrl = file.download_url || `https://raw.githubusercontent.com/${this.githubRepo}/${this.githubBranch}/${file.path}`;
          const name = this.getBadgeNameFromFilename(file.name);
          badges.push({ url: rawUrl, name });
        }
      }
    };
    await scrapePath(this.githubAssetPath);
    return badges;
  }

  private isBadgeAsset(filename: string) {
    return /\.(png|svg|webp|gif)$/i.test(filename);
  }

  private getFilenameFromPath(path: string) {
    return path.split('/').pop() || '';
  }

  private getBadgeNameFromUrl(url: string) {
    const filename = this.getFilenameFromUrl(url);
    const baseName = filename.replace(/\.(png|svg|webp|gif)$/i, "").replace(/-|_/g, " ");
    const words = baseName.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    return this.badgeNameMap[filename] || words.join(" ") || "Unknown Badge";
  }

  private getFilenameFromUrl(url: string) {
    return url.split('/').pop()?.split('?')[0] || '';
  }

  private getBadgeNameFromFilename(filename: string) {
    const baseName = filename.replace(/\.(png|svg|webp|gif)$/i, '').replace(/-|_/g, ' ');
    const words = baseName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    return this.badgeNameMap[filename] || words.join(' ') || 'Unknown Badge';
  }

  private isIgnoredBadgeLabel(label: string | null | undefined) {
    if (!label) return true;
    const lowerLabel = label.toLowerCase();
    return lowerLabel.includes("discord") || lowerLabel.includes("badge");
  }

  private isOwnProfileElement(elem: Element) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    const userId = currentUser.id;
    return elem.closest(`[data-user-id="${userId}"]`) !== null;
  }

  private getCurrentUser() {
    const UserStore = getByProps('getCurrentUser');
    return UserStore?.getCurrentUser?.() || null;
  }

  private badgeUrlsMatch(url1: string, url2: string) {
    const normalize = (url: string) => url.split('?')[0].replace(/\/$/, '');
    return normalize(url1) === normalize(url2);
  }

  private getMappingBadgeName(url: string, badgeList: any[]) {
    const badge = badgeList.find(b => this.badgeUrlsMatch(b.url, url));
    return badge ? badge.name : this.getBadgeNameFromUrl(url);
  }

  private createLabelBadgeUrl(label: string) {
    const encodedLabel = encodeURIComponent(label.replace(/\s/g, '_'));
    return `https://discord.com/assets/badges/${encodedLabel}.png`; // Placeholder URL
  }

  private getFallbackOriginalBadges() {
    return this.knownOriginalBadgeNames.map(name => ({
      url: this.createLabelBadgeUrl(name),
      name: name
    }));
  }

  private getElementBadgeLabel(elem: Element) {
    const labels = [
      elem.getAttribute?.("aria-label"),
      elem.getAttribute?.("title"),
      elem.getAttribute?.("alt"),
      elem.closest?.("[aria-label]")?.getAttribute("aria-label"),
      elem.closest?.("[title]")?.getAttribute("title")
    ].filter(label => !this.isIgnoredBadgeLabel(label));

    return labels[0] || "";
  }

  private getElementImageUrls(elem: Element) {
    const urls: string[] = [];

    if (elem.tagName === "IMG") {
      urls.push((elem as HTMLImageElement).currentSrc, (elem as HTMLImageElement).src, elem.getAttribute("src") || "");
      urls.push(...this.extractSrcsetUrls(elem.getAttribute("srcset")));
    }

    const style = window.getComputedStyle(elem);
    ["backgroundImage", "maskImage", "webkitMaskImage"].forEach(prop => {
      urls.push(...this.extractCssUrls((style as any)[prop]));
    });

    return urls.filter(Boolean);
  }

  private extractSrcsetUrls(value: string | null) {
    return String(value || "")
      .split(",")
      .map(candidate => candidate.trim().split(/\s+/)[0])
      .filter(Boolean);
  }

  private extractCssUrls(value: string | null) {
    const urls: string[] = [];
    String(value || "").replace(/url\(["']?(.*?)["']?\)/g, (_, url) => {
      if (url) urls.push(url);
      return "";
    });
    return urls;
  }

  private isDefinitelyNotBadge(elem: Element) {
    // Based on original plugin's usage, these are elements that should not be considered badges
    return elem.tagName === "BR" || elem.tagName === "HR" || elem.tagName === "SPAN" && !elem.hasAttribute("aria-label");
  }

  private hasBadgeLikeClass(elem: Element) {
    // Check for common Discord badge-related class names
    return elem.className.includes("badge") || elem.className.includes("Badge");
  }

  private isInsideBadgeContainer(elem: Element) {
    // Check if the element is within a container typically holding badges
    return elem.closest("div[aria-label='User Badges'], div[class*='profileBadges'], div[class*='ProfileBadges'], [class*='badgeList'], [class*='BadgeList']") !== null;
  }

  private isVisibleBadgeCandidate(elem: Element) {
    if (!elem) return false;
    if (this.isDefinitelyNotBadge(elem)) return false;
    if (!this.hasBadgeLikeClass(elem) && !this.isInsideBadgeContainer(elem)) return false;

    const style = window.getComputedStyle(elem);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;

    const rect = elem.getBoundingClientRect?.();
    if (!rect) return false;

    const width = rect.width || parseFloat(style.width) || 0;
    const height = rect.height || parseFloat(style.height) || 0;
    if (width < 8 || height < 8 || width > 40 || height > 40) return false;

    const ratio = width / height;
    if (ratio < 0.5 || ratio > 2) return false;

    return true;
  }

  private getProfileBadgeCandidates() {
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

  private getProfileBadgeContainer(candidates: Element[] = []) {
    const explicitContainer = [...document.querySelectorAll('div[aria-label="User Badges"], div[class*="profileBadges"], div[class*="ProfileBadges"], [class*="badgeList"], [class*="BadgeList"]')]
      .find(container => this.isOwnProfileElement(container));
    if (explicitContainer) return explicitContainer;

    const firstCandidate = candidates[0];
    const container = firstCandidate?.closest?.('div[aria-label="User Badges"], [class*="profileBadges"], [class*="ProfileBadges"], [class*="badgeList"], [class*="BadgeList"]') || firstCandidate?.parentElement || null;
    return container && this.isOwnProfileElement(container) ? container : null;
  }

  private getExtraBadgeSize(candidates: Element[] = []) {
    const sizes = candidates
      .map(candidate => {
        const rect = candidate.getBoundingClientRect?.();
        const style = window.getComputedStyle(candidate);
        const width = rect?.width || parseFloat(style.width) || 0;
        const height = rect?.height || parseFloat(style.height) || 0;
        return Math.max(width, height);
      })
      .filter(size => size >= 10 && size <= 40);

    if (!sizes.length) return 20;

    return Math.round(Math.max(18, sizes.reduce((sum, size) => sum + size, 0) / sizes.length));
  }

  private syncExtraBadges(extraMappings: Mapping[], candidates: Element[] = []) {
    const container = this.getProfileBadgeContainer(candidates);
    if (!container) return;

    const existing = [...container.querySelectorAll('[data-discord-orb-extra-badge="true"]')];
    const needed = extraMappings.length;
    const badgeSize = this.getExtraBadgeSize(candidates);

    for (let i = needed; i < existing.length; i++) {
      existing[i].remove();
    }

    extraMappings.forEach(({ fake }, index) => {
      let badge = existing[index] as HTMLImageElement;
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

  private applyBadgeSpoofToElement(elem: Element, fake: string) {
    if (!elem || !fake) return;

    const tagName = String(elem.tagName || "").toUpperCase();
    if (tagName === "IMG") {
      (elem as HTMLImageElement).src = fake;
      elem.setAttribute("src", fake);
      elem.removeAttribute("srcset");
      elem.setAttribute("data-discord-orb-badge-spoofed", "true");
      return;
    }

    if (tagName === "SVG") {
      try {
        elem.querySelectorAll("*").forEach(child => {
          (child as HTMLElement).style.opacity = "0";
        });
        (elem as HTMLElement).style.backgroundImage = `url(${fake})`;
        (elem as HTMLElement).style.backgroundRepeat = "no-repeat";
        (elem as HTMLElement).style.backgroundPosition = "center";
        (elem as HTMLElement).style.backgroundSize = "contain";
        elem.setAttribute("data-discord-orb-badge-spoofed", "true");
        return;
      } catch (err) {
        console.error("Error replacing SVG badge:", err);
      }
    }

    const style = window.getComputedStyle(elem);
    const rect = elem.getBoundingClientRect?.();
    const width = rect?.width || parseFloat(style.width) || 16;
    const height = rect?.height || parseFloat(style.height) || 16;

    if (style.display === "inline") (elem as HTMLElement).style.display = "inline-block";
    if (!rect?.width || rect.width < 4) (elem as HTMLElement).style.width = `${width}px`;
    if (!rect?.height || rect.height < 4) (elem as HTMLElement).style.height = `${height}px`;

    (elem as HTMLElement).style.backgroundImage = `url(${fake})`;
    (elem as HTMLElement).style.backgroundRepeat = "no-repeat";
    (elem as HTMLElement).style.backgroundPosition = "center";
    (elem as HTMLElement).style.backgroundSize = "contain";
    elem.setAttribute("data-discord-orb-badge-spoofed", "true");

    elem.querySelectorAll?.("img, svg").forEach(child => {
      (child as HTMLElement).style.opacity = "0";
    });
  }

  private mappingMatchesElement(elem: Element, original: string) {
    if (this.getElementImageUrls(elem).some(url => this.badgeUrlsMatch(url, original))) return true;

    const originalBadgeName = this.getMappingBadgeName(original, this.originalBadges);
    const elementBadgeLabel = this.getElementBadgeLabel(elem);
    return this.badgeNamesMatch(elementBadgeLabel, originalBadgeName);
  }

  private badgeNamesMatch(name1: string, name2: string) {
    return name1.toLowerCase() === name2.toLowerCase();
  }

  private detectBadges() {
    try {
      const detected: any[] = [];
      const addDetectedBadge = (url: string, fallbackName?: string) => {
        if (!url) return;
        const hasBadgeIconPath = url.includes("/badge-icons/");
        const hasUsefulLabel = !this.isIgnoredBadgeLabel(fallbackName);
        if (!hasBadgeIconPath && (!hasUsefulLabel || !this.isBadgeAsset(this.getFilenameFromUrl(url)))) return;
        const normalizedUrl = this.normalizeUrl(url);
        const name = fallbackName || this.getBadgeNameFromUrl(normalizedUrl);
        if (name && !detected.some(b => this.badgeUrlsMatch(b.url, normalizedUrl))) {
          detected.push({ url: normalizedUrl, name });
        }
      };

      const addDetectedBadgeLabel = (label: string) => {
        if (this.isIgnoredBadgeLabel(label)) return;
        const url = this.createLabelBadgeUrl(label);
        if (!detected.some(b => this.badgeUrlsMatch(b.url, url))) {
          detected.push({ url, name: label.trim() });
        }
      };

      document.querySelectorAll('img[src*="/badge-icons/"], img[srcset*="/badge-icons/"], div[aria-label="User Badges"] img, div[class*="userProfileInner"] [class*="badge"] img, div[class*="profileBadges"] img').forEach(img => {
        addDetectedBadge((img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src, img.getAttribute("aria-label") || (img as HTMLImageElement).alt || (img as HTMLImageElement).title);
        this.extractSrcsetUrls(img.getAttribute("srcset")).forEach(url => addDetectedBadge(url));
      });

      document.querySelectorAll('div[aria-label="User Badges"] [aria-label], div[class*="userProfileInner"] [class*="badge"][aria-label], div[class*="profileBadges"] [aria-label]').forEach(elem => {
        const fallbackName = elem.getAttribute("aria-label");
        if (fallbackName) addDetectedBadgeLabel(fallbackName);
        elem.querySelectorAll?.('img').forEach(img => {
          addDetectedBadge((img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src, fallbackName || (img as HTMLImageElement).alt || (img as HTMLImageElement).title);
        });
      });

      document.querySelectorAll('div[aria-label="User Badges"] *, div[class*="userProfileInner"] [class*="badge"], div[class*="userProfileInner"] [class*="badge"] *, div[class*="profileBadges"] *').forEach(elem => {
        const label = elem.getAttribute("aria-label") || (elem as HTMLElement).title;
        if (label) addDetectedBadgeLabel(label);
        const style = window.getComputedStyle(elem);
        ["backgroundImage", "maskImage", "webkitMaskImage"].forEach(prop => {
          this.extractCssUrls((style as any)[prop]).forEach(url => addDetectedBadge(url, label));
        });
      });

      let fallbackUsed = false;
      if (detected.length > 0) {
        this.originalBadges = [...this.originalBadges, ...detected].filter((badge, index, badges) => {
          return index === badges.findIndex(other => this.badgeUrlsMatch(other.url, badge.url));
        });
        this.settings.originalBadges = this.originalBadges;
        this.internalSettings.raw = this.settings;
      } else if (this.originalBadges.length === 0) {
        this.originalBadges = this.getFallbackOriginalBadges();
        this.settings.originalBadges = this.originalBadges;
        this.internalSettings.raw = this.settings;
        fallbackUsed = true;
      }
      console.log(fallbackUsed ? `Detected 0 real badges. Loaded ${this.originalBadges.length} common badge options.` : `Detected ${detected.length} real badges!`);
      console.log("Detected badges:", detected);
    } catch (err) {
      console.error("Error in detectBadges:", err);
    }
  }

    private showToast(content: string, options: { type?: "success" | "error" | "warning" | "info" } = {}) {
    console.log(`[Toast ${options.type || "info"}]: ${content}`);
  }

  private normalizeUrl(url: string) {
    return url.split('?')[0].replace(/\/$/, '');
  }

  private replaceContent() {
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

      const directlyMatchedElements = new Set<Element>();
      const placedMappingIndexes = new Set<number>();
      document.querySelectorAll('img[src*="/badge-icons/"], img[srcset*="/badge-icons/"], div[aria-label="User Badges"] img, div[aria-label="User Badges"] svg, div[aria-label="User Badges"] [aria-label], div[class*="profileBadges"] img, div[class*="profileBadges"] svg, div[class*="profileBadges"] [aria-label], div[class*="ProfileBadges"] img, div[class*="ProfileBadges"] svg, div[class*="ProfileBadges"] [aria-label], [class*="badge"] img, [class*="badge"] svg, [class*="badge"][aria-label], [class*="Badge"] img, [class*="Badge"] svg, [class*="Badge"][aria-label]').forEach(elem => {
        if (this.isDefinitelyNotBadge(elem)) return;
        if (!this.isOwnProfileElement(elem)) return;
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
        if (placedMappingIndexes.has(index)) return;
        const candidate = profileBadgeCandidates[fallbackCandidateIndex++];
        if (candidate) {
          this.applyBadgeSpoofToElement(candidate, fake);
          placedMappingIndexes.add(index);
        }
      });
      this.syncExtraBadges(imageMappings.filter((_, index) => !placedMappingIndexes.has(index)), allProfileBadgeCandidates);

      document.querySelectorAll('div[aria-label="User Badges"] *, div[class*="profileBadges"] *, div[class*="ProfileBadges"] *, [class*="badge"], [class*="Badge"], [data-discord-orb-badge-spoofed]').forEach(elem => {
        if (this.isDefinitelyNotBadge(elem)) return;
        if (!this.isOwnProfileElement(elem)) return;
        const style = window.getComputedStyle(elem);
        imageMappings.forEach(({ original, fake }) => {
          const matchesMapping = this.mappingMatchesElement(elem, original);
          if (matchesMapping && (this.extractCssUrls(style.backgroundImage).length || elem.getAttribute("aria-label"))) {
            (elem as HTMLElement).style.backgroundImage = `url(${fake})`;
          }
          if (matchesMapping && this.extractCssUrls(style.maskImage).length) {
            (elem as HTMLElement).style.maskImage = `url(${fake})`;
          }
          if (matchesMapping && this.extractCssUrls(style.webkitMaskImage).length) {
            (elem as HTMLElement).style.webkitMaskImage = `url(${fake})`;
          }
        });
      });
    } catch (err) {
      console.error("Error in replaceContent:", err);
    }
  }

  private observeMutations() {
    try {
      this.observer = new MutationObserver(() => this.replaceContent());
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'srcset', 'style']
      });

      this.replaceInterval = setInterval(() => this.replaceContent(), 500);
    } catch (err) {
      console.error("Error in observeMutations:", err);
    }
  }
}

registerPlugin(new DiscordOrbVideoBypass());
