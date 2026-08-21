export interface TokenSwatch {
  name: string;
  cssVar: string;
  hex: string;
}

export const greyScale: TokenSwatch[] = [
  { name: "151621", cssVar: "--grey-151621", hex: "#151621" },
  { name: "272832", cssVar: "--grey-272832", hex: "#272832" },
  { name: "313248", cssVar: "--grey-313248", hex: "#313248" },
  { name: "444556", cssVar: "--grey-444556", hex: "#444556" },
  { name: "858699", cssVar: "--grey-858699", hex: "#858699" },
  { name: "ffffff", cssVar: "--grey-ffffff", hex: "#ffffff" },
  { name: "eeeffc", cssVar: "--grey-eeeffc", hex: "#eeeffc" },
  { name: "e0e1ec", cssVar: "--grey-e0e1ec", hex: "#e0e1ec" },
  { name: "d2d3e0", cssVar: "--grey-d2d3e0", hex: "#d2d3e0" },
  { name: "b0b5c0", cssVar: "--grey-b0b5c0", hex: "#b0b5c0" },
  { name: "6b6f76", cssVar: "--grey-6b6f76", hex: "#6b6f76" },
  { name: "8d8ba3", cssVar: "--grey-8d8ba3", hex: "#8d8ba3" },
  { name: "4d4f69", cssVar: "--grey-4d4f69", hex: "#4d4f69" },
  { name: "3c3d53", cssVar: "--grey-3c3d53", hex: "#3c3d53" },
  { name: "393a4b", cssVar: "--grey-393a4b", hex: "#393a4b" },
  { name: "26273b", cssVar: "--grey-26273b", hex: "#26273b" },
  { name: "292a35", cssVar: "--grey-292a35", hex: "#292a35" },
  { name: "1d1e2b", cssVar: "--grey-1d1e2b", hex: "#1d1e2b" },
  { name: "191a23", cssVar: "--grey-191a23", hex: "#191a23" },
  { name: "26293e", cssVar: "--grey-26293e", hex: "#26293e" },
  { name: "292b41", cssVar: "--grey-292b41", hex: "#292b41" },
  { name: "2c2d42", cssVar: "--grey-2c2d42", hex: "#2c2d42" },
  { name: "21232e", cssVar: "--grey-21232e", hex: "#21232e" },
  { name: "4c4f6b", cssVar: "--grey-4c4f6b", hex: "#4c4f6b" },
  { name: "2c2d3c", cssVar: "--grey-2c2d3c", hex: "#2c2d3c" },
  { name: "1c1d2a", cssVar: "--grey-1c1d2a", hex: "#1c1d2a" },
  { name: "1f2130", cssVar: "--grey-1f2130", hex: "#1f2130" },
];

export const primaryScale: TokenSwatch[] = [
  { name: "212234", cssVar: "--primary-212234", hex: "#212234" },
  { name: "222342", cssVar: "--primary-222342", hex: "#222342" },
  { name: "242546", cssVar: "--primary-242546", hex: "#242546" },
  { name: "6c79ff", cssVar: "--primary-6c79ff", hex: "#6c79ff" },
  { name: "6e79d6", cssVar: "--primary-6e79d6", hex: "#6e79d6" },
  { name: "666be2", cssVar: "--primary-666be2", hex: "#666be2" },
  { name: "5c67c7", cssVar: "--primary-5c67c7", hex: "#5c67c7" },
  { name: "575bc7", cssVar: "--primary-575bc7", hex: "#575bc7" },
  { name: "7477f0", cssVar: "--primary-7477f0", hex: "#7477f0" },
  { name: "37466c", cssVar: "--primary-37466c", hex: "#37466c" },
  { name: "2a2b51", cssVar: "--primary-2a2b51", hex: "#2a2b51" },
  { name: "5e6ad2 (brand)", cssVar: "--primary-5e6ad2", hex: "#5e6ad2" },
];

export const decorationColors: TokenSwatch[] = [
  { name: "teal", cssVar: "--decoration-teal", hex: "#00b2bf" },
  { name: "red", cssVar: "--decoration-red", hex: "#eb5757" },
  { name: "red-light", cssVar: "--decoration-red-light", hex: "#fa6563" },
  { name: "mustard", cssVar: "--decoration-mustard", hex: "#978200" },
  { name: "yellow", cssVar: "--decoration-yellow", hex: "#f2c94c" },
  { name: "orange", cssVar: "--decoration-orange", hex: "#f2994a" },
  { name: "purple", cssVar: "--decoration-purple", hex: "#bb87fc" },
  { name: "blue", cssVar: "--decoration-blue", hex: "#4ea7fc" },
  { name: "grey", cssVar: "--decoration-grey", hex: "#95a2b3" },
  { name: "green", cssVar: "--decoration-green", hex: "#4cb782" },
];

export const semanticUiColors: TokenSwatch[] = [
  { name: "bg-app", cssVar: "--color-bg-app", hex: "#181921" },
  { name: "bg-surface", cssVar: "--color-bg-surface", hex: "#1d1e2b" },
  { name: "bg-popover", cssVar: "--color-bg-popover", hex: "#202128" },
  { name: "bg-subtle", cssVar: "--color-bg-subtle", hex: "#7c7ca421" },
  { name: "bg-muted", cssVar: "--color-bg-muted", hex: "#85869833" },
  { name: "border-default", cssVar: "--color-border-default", hex: "#52526f40" },
  { name: "border-strong", cssVar: "--color-border-strong", hex: "#444556" },
  { name: "text-primary", cssVar: "--color-text-primary", hex: "#eeeffc" },
  { name: "text-secondary", cssVar: "--color-text-secondary", hex: "#b0b5c0" },
  { name: "text-tertiary", cssVar: "--color-text-tertiary", hex: "#858699" },
  { name: "text-disabled", cssVar: "--color-text-disabled", hex: "#4d4f69" },
  { name: "accent", cssVar: "--color-accent", hex: "#5e6ad2" },
  { name: "focus-ring", cssVar: "--color-focus-ring", hex: "#6e5ed2" },
  { name: "destructive", cssVar: "--color-destructive", hex: "#eb5757" },
];

export interface TypographyStep {
  name: string;
  className: string;
  fontSize: number;
  lineHeight: number;
}

export const typographyScale: TypographyStep[] = [
  { name: "micro", className: "text-micro", fontSize: 11, lineHeight: 12.1 },
  { name: "mini", className: "text-mini", fontSize: 12, lineHeight: 14.4 },
  { name: "small", className: "text-small", fontSize: 13, lineHeight: 15.6 },
  { name: "normal", className: "text-normal", fontSize: 15, lineHeight: 22 },
  { name: "large", className: "text-large", fontSize: 18, lineHeight: 28.8 },
  { name: "title3", className: "text-title3", fontSize: 20, lineHeight: 24 },
  { name: "title2", className: "text-title2", fontSize: 24, lineHeight: 28.8 },
  { name: "title1", className: "text-title1", fontSize: 36, lineHeight: 43.2 },
  { name: "issue title", className: "text-issue-title", fontSize: 22, lineHeight: 26.4 },
];

export interface ShadowStep {
  name: string;
  className: string;
  description: string;
}

export const shadowScale: ShadowStep[] = [
  { name: "button", className: "shadow-button", description: "0 1px 2px #00000017" },
  { name: "button-2", className: "shadow-button-2", description: "0 1px 1px #00000026" },
  {
    name: "button-destructive",
    className: "shadow-button-destructive",
    description: "renkli glow — 0 0 12px -1px #eb5757",
  },
  { name: "tooltip", className: "shadow-tooltip", description: "0 2px 4px #0000001a" },
  { name: "dropdown-2", className: "shadow-dropdown-2", description: "0 4px 24px #00000033" },
  { name: "dropdown", className: "shadow-dropdown", description: "0 7px 32px #00000059" },
  {
    name: "dropdown-blur",
    className: "shadow-dropdown-blur",
    description: "0 4px 24px #00000033",
  },
  {
    name: "command-bar",
    className: "shadow-command-bar",
    description: "0 16px 70px #00000080",
  },
];

export const badgeColors = [
  "teal",
  "red",
  "mustard",
  "yellow",
  "orange",
  "purple",
  "blue",
  "grey",
  "green",
] as const;

export const priorityLevels = ["no-priority", "urgent", "high", "medium", "low"] as const;

export const priorityLabels: Record<(typeof priorityLevels)[number], string> = {
  "no-priority": "No priority",
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const statusStates = ["backlog", "todo", "in-progress", "done", "canceled"] as const;

export const statusLabels: Record<(typeof statusStates)[number], string> = {
  backlog: "Backlog",
  todo: "Todo",
  "in-progress": "In Progress",
  done: "Done",
  canceled: "Canceled",
};
