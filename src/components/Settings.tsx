import { React } from 'enmity/metro/common';
import { Switch, Text, Button, TextInput, ScrollView } from 'enmity/components';

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

interface SettingsProps {
  settings: PluginSettings;
  plugin: any; // Reference to the main plugin class
}

const Settings = ({ settings, plugin }: SettingsProps) => {
  const [currentSettings, setCurrentSettings] = React.useState(settings);

  const updateSetting = (key: keyof PluginSettings, value: any) => {
    setCurrentSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
    plugin.internalSettings.raw = { ...plugin.internalSettings.raw, [key]: value };
  };

  const updateMapping = (type: keyof PluginSettings, index: number, field: keyof Mapping, value: string) => {
    const newMappings = [...currentSettings[type]];
    newMappings[index][field] = value;
    updateSetting(type, newMappings);
  };

  const addMapping = (type: keyof PluginSettings) => {
    updateSetting(type, [...currentSettings[type], { original: "", fake: "" }]);
  };

  const removeMapping = (type: keyof PluginSettings, index: number) => {
    const newMappings = currentSettings[type].filter((_: any, i: number) => i !== index);
    updateSetting(type, newMappings);
  };

  const renderMappingSection = (title: string, type: keyof PluginSettings) => (
    React.createElement(React.Fragment, null,
      React.createElement(Text, { style: { marginBottom: 10, marginTop: 20 }, variant: "text-md/semibold" }, title),
      currentSettings[type].map((mapping: Mapping, index: number) => (
        React.createElement(React.Fragment, { key: index },
          React.createElement(TextInput, {
            style: { marginBottom: 5 },
            placeholder: "Original",
            value: mapping.original,
            onChange: (value: string) => updateMapping(type, index, "original", value)
          }),
          React.createElement(TextInput, {
            style: { marginBottom: 10 },
            placeholder: "Fake",
            value: mapping.fake,
            onChange: (value: string) => updateMapping(type, index, "fake", value)
          }),
          React.createElement(Button, {
            text: "Remove",
            onPress: () => removeMapping(type, index),
            color: Button.Colors.RED,
            style: { marginBottom: 10 }
          })
        ))
      ),
      React.createElement(Button, {
        text: `Add ${title.replace(" Mappings", "").toLowerCase()} mapping`,
        onPress: () => addMapping(type),
        color: Button.Colors.BRAND,
        style: { marginBottom: 20 }
      })
    )
  );

  return (
    React.createElement(ScrollView, { style: { padding: 16 } },
      React.createElement(Text, { style: { marginBottom: 20 }, variant: "text-lg/bold" }, "DiscordOrbVideoBypass Settings"),

      renderMappingSection("Text Mappings", "textMappings"),
      renderMappingSection("Date Mappings", "dateMappings"),
      renderMappingSection("Image Mappings", "imageMappings"),
      renderMappingSection("Badge Text Mappings", "badgeTextMappings"),
      renderMappingSection("Email Mappings", "emailMappings"),

      React.createElement(Text, { style: { marginBottom: 10, marginTop: 20 }, variant: "text-md/semibold" }, "Badge Management"),
      React.createElement(Button, {
        text: "Scrape Badges from GitHub",
        onPress: () => plugin.fetchBadgeLists(),
        color: Button.Colors.GREEN,
        style: { marginBottom: 10 }
      }),
      React.createElement(Button, {
        text: "Detect Real Badges",
        onPress: () => plugin.detectBadges(),
        color: Button.Colors.BRAND,
        style: { marginBottom: 10 }
      }),
      React.createElement(Button, {
        text: "Clear Original Badges",
        onPress: () => {
          plugin.originalBadges = [];
          plugin.internalSettings.raw = { ...plugin.internalSettings.raw, originalBadges: [] };
          plugin.showToast("Real badges cleared!", { type: "success" }); // Assuming showToast is implemented or removed
          setCurrentSettings((prev: any) => ({ ...prev, originalBadges: [] }));
        },
        color: Button.Colors.RED,
        style: { marginBottom: 20 }
      }),

      React.createElement(Button, {
        text: "Save Settings and Apply Spoofs",
        onPress: () => {
          // Filter out empty mappings before saving
          const filteredSettings = {
            ...currentSettings,
            textMappings: currentSettings.textMappings.filter((m: Mapping) => m.original && m.fake),
            dateMappings: currentSettings.dateMappings.filter((m: Mapping) => m.original && m.fake),
            imageMappings: currentSettings.imageMappings.filter((m: Mapping) => m.original && m.fake),
            badgeTextMappings: currentSettings.badgeTextMappings.filter((m: Mapping) => m.original && m.fake),
            emailMappings: currentSettings.emailMappings.filter((m: Mapping) => m.original && m.fake),
          };
          plugin.internalSettings.raw = filteredSettings;
          plugin.replaceContent();
          console.log("Settings saved and spoofs applied!"); // Replace with Enmity toast if available
        },
        color: Button.Colors.PRIMARY,
        style: { marginBottom: 20 }
      })
    )
  );
};

export default Settings;
